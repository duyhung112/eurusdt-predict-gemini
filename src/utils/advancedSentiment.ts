
import { CryptoPriceData } from './binanceAPI';

interface SentimentData {
  source: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

interface AdvancedSentimentAnalysis {
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  sources: SentimentData[];
  recommendation: string;
  priceAnalysis: {
    trend: string;
    momentum: string;
    volatility: number;
  };
}

const analyzePriceAction = (priceData: CryptoPriceData[]): { trend: string; momentum: string; volatility: number } => {
  if (priceData.length < 10) {
    return { trend: 'INSUFFICIENT_DATA', momentum: 'NEUTRAL', volatility: 0 };
  }

  const closes = priceData.map(d => d.close);
  const recent = closes.slice(-10);
  const older = closes.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b) / older.length;
  
  const trendDirection = recentAvg > olderAvg ? 'BULLISH' : recentAvg < olderAvg ? 'BEARISH' : 'NEUTRAL';
  
  // Calculate momentum using rate of change
  const currentPrice = closes[closes.length - 1];
  const previousPrice = closes[closes.length - 5];
  const momentum = (currentPrice - previousPrice) / previousPrice;
  
  const momentumStr = momentum > 0.02 ? 'STRONG_BULLISH' : 
                     momentum > 0.005 ? 'BULLISH' :
                     momentum < -0.02 ? 'STRONG_BEARISH' :
                     momentum < -0.005 ? 'BEARISH' : 'NEUTRAL';
  
  // Calculate volatility
  const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
  
  return { trend: trendDirection, momentum: momentumStr, volatility };
};

const generateAIPriceSentiment = async (priceData: CryptoPriceData[], apiKey: string): Promise<SentimentData[]> => {
  const priceAnalysis = analyzePriceAction(priceData);
  
  try {
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key');
    }

    const currentPrice = priceData[priceData.length - 1]?.close || 0;
    const previousPrice = priceData[priceData.length - 24]?.close || currentPrice;
    const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    const volumes = priceData.slice(-10).map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    const prompt = `Analyze ARBUSDT crypto data:
Price: $${currentPrice.toFixed(4)}
24h Change: ${priceChange.toFixed(2)}%
Trend: ${priceAnalysis.trend}
Momentum: ${priceAnalysis.momentum}
Volatility: ${(priceAnalysis.volatility * 100).toFixed(2)}%
Volume Ratio: ${(currentVolume / avgVolume).toFixed(2)}x

Provide sentiment analysis (BULLISH/BEARISH/NEUTRAL) with confidence 0-100. Be concise.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: { 
          temperature: 0.3, 
          maxOutputTokens: 200 
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse AI response for sentiment
    let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 60;
    
    if (aiResponse.toUpperCase().includes('BULLISH')) {
      sentiment = 'BULLISH';
      confidence = 75;
    } else if (aiResponse.toUpperCase().includes('BEARISH')) {
      sentiment = 'BEARISH';
      confidence = 75;
    }
    
    return [{
      source: 'Gemini AI Analysis',
      sentiment,
      confidence,
      impact: 'HIGH',
      timestamp: new Date()
    }];

  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
    
    // Fallback to price action analysis
    let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    
    if (priceAnalysis.trend === 'BULLISH' && priceAnalysis.momentum.includes('BULLISH')) {
      sentiment = 'BULLISH';
      confidence = 70;
    } else if (priceAnalysis.trend === 'BEARISH' && priceAnalysis.momentum.includes('BEARISH')) {
      sentiment = 'BEARISH';
      confidence = 70;
    }
    
    return [{
      source: 'Price Action Analysis',
      sentiment,
      confidence,
      impact: 'MEDIUM',
      timestamp: new Date()
    }];
  }
};

export const analyzeAdvancedSentiment = async (priceData: CryptoPriceData[], apiKey: string): Promise<AdvancedSentimentAnalysis> => {
  const priceAnalysis = analyzePriceAction(priceData);
  const aiSentiment = await generateAIPriceSentiment(priceData, apiKey);
  
  // Combine technical and AI sentiment
  const sources: SentimentData[] = [
    ...aiSentiment,
    {
      source: 'Technical Analysis',
      sentiment: priceAnalysis.trend as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      confidence: priceAnalysis.volatility < 0.02 ? 80 : 60,
      impact: 'HIGH',
      timestamp: new Date()
    }
  ];
  
  // Calculate overall sentiment
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;
  
  sources.forEach(source => {
    const weight = source.impact === 'HIGH' ? 1.0 : 0.7;
    const confidenceWeight = source.confidence / 100;
    const finalWeight = weight * confidenceWeight;
    
    totalWeight += finalWeight;
    
    if (source.sentiment === 'BULLISH') {
      bullishScore += finalWeight;
    } else if (source.sentiment === 'BEARISH') {
      bearishScore += finalWeight;
    }
  });
  
  const totalScore = bullishScore + bearishScore;
  let overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 50;
  
  if (totalScore > 0) {
    const bullishPercentage = (bullishScore / totalScore) * 100;
    confidence = Math.round((totalWeight / sources.length) * 100);
    
    if (bullishPercentage > 65) {
      overallSentiment = 'BULLISH';
    } else if (bullishPercentage < 35) {
      overallSentiment = 'BEARISH';
    }
  }
  
  return {
    overallSentiment,
    confidence,
    sources,
    priceAnalysis,
    recommendation: generateRecommendation(overallSentiment, confidence, priceAnalysis)
  };
};

const generateRecommendation = (sentiment: string, confidence: number, priceAnalysis: any): string => {
  const volatilityText = priceAnalysis.volatility > 0.03 ? 'cao' : priceAnalysis.volatility > 0.015 ? 'trung bình' : 'thấp';
  
  if (sentiment === 'BULLISH' && confidence > 70) {
    return `Tín hiệu TĂNG mạnh với độ tin cậy ${confidence}%. Volatility ${volatilityText}. Khuyến nghị MUA.`;
  } else if (sentiment === 'BEARISH' && confidence > 70) {
    return `Tín hiệu GIẢM mạnh với độ tin cậy ${confidence}%. Volatility ${volatilityText}. Khuyến nghị BÁN.`;
  } else if (confidence > 60) {
    return `Tín hiệu ${sentiment} với độ tin cậy ${confidence}%. Volatility ${volatilityText}. Quan sát thêm.`;
  } else {
    return `Tín hiệu không rõ ràng (${confidence}% tin cậy). Chờ đợi tín hiệu mạnh hơn.`;
  }
};
