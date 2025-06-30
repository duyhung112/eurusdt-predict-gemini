
import { analyzeNewsWithAI } from './newsAnalysis';
import { calculateTechnicalIndicators } from './technicalIndicators';
import { CryptoPriceData } from './binanceAPI';
import { analyzeCryptoTechnicals } from './cryptoTechnicalAnalysis';
import { analyzeAdvancedSentiment } from './advancedSentiment';

export interface ComprehensiveAnalysis {
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;
  accuracyScore: number;
  recommendation: string;
  reasoning: string[];
  technicalScore: number;
  sentimentScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  shouldEnterTrade: boolean;
  entryStrategy: string;
  timestamp: Date;
  liveDataUsed: boolean;
}

export const generateCryptoComprehensiveAnalysis = async (
  priceData: CryptoPriceData[],
  apiKey: string
): Promise<ComprehensiveAnalysis> => {
  try {
    console.log('Generating comprehensive analysis with live Binance data:', priceData.length, 'candles');
    
    // Analyze using real Binance price data
    const technicalAnalysis = analyzeCryptoTechnicals(priceData);
    const sentimentAnalysis = await analyzeAdvancedSentiment(priceData, apiKey);
    
    // Calculate scores based on real data
    const technicalScore = calculateTechnicalScore(technicalAnalysis);
    const sentimentScore = calculateSentimentScore(sentimentAnalysis);
    
    // Weighted overall score using real data
    const weightedScore = (technicalScore * 0.6) + (sentimentScore * 0.4);
    
    // Determine signal strength
    const signal = determineSignalFromScore(weightedScore);
    
    // Calculate confidence based on data quality and consensus
    const confidence = calculateRealDataConfidence(technicalAnalysis, sentimentAnalysis, priceData.length);
    
    // Calculate accuracy based on real data quality
    const accuracy = calculateAccuracyFromRealData(signal, confidence, priceData.length);
    
    // Generate reasoning based on actual analysis
    const reasoning = generateReasoningFromRealData(technicalAnalysis, sentimentAnalysis);
    
    // Risk assessment based on real volatility and market conditions
    const riskLevel = calculateRealRiskLevel(priceData, technicalAnalysis.confidence);
    
    // Entry decision based on real data quality
    const shouldEnter = shouldEnterBasedOnRealData(signal, confidence, accuracy, riskLevel);
    
    console.log('Comprehensive analysis completed:', {
      signal,
      confidence,
      technicalScore,
      sentimentScore,
      liveDataUsed: true
    });
    
    return {
      overallSignal: signal,
      confidenceScore: Math.round(confidence),
      accuracyScore: Math.round(accuracy),
      recommendation: generateRecommendationFromRealData(signal, confidence, shouldEnter),
      reasoning,
      technicalScore: Math.round(technicalScore),
      sentimentScore: Math.round(sentimentScore),
      riskLevel,
      shouldEnterTrade: shouldEnter,
      entryStrategy: generateEntryStrategyFromRealData(signal, confidence, riskLevel),
      timestamp: new Date(),
      liveDataUsed: true
    };

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    
    // Fallback with technical analysis only
    const fallbackTechnical = priceData.length > 0 ? analyzeCryptoTechnicals(priceData) : null;
    
    return {
      overallSignal: 'NEUTRAL',
      confidenceScore: 40,
      accuracyScore: 50,
      recommendation: 'Không thể phân tích đầy đủ. Chờ đợi dữ liệu tốt hơn.',
      reasoning: ['Lỗi kết nối API', 'Chỉ sử dụng dữ liệu kỹ thuật cơ bản'],
      technicalScore: fallbackTechnical ? fallbackTechnical.confidence : 50,
      sentimentScore: 50,
      riskLevel: 'HIGH',
      shouldEnterTrade: false,
      entryStrategy: 'Chờ đợi tín hiệu rõ ràng hơn',
      timestamp: new Date(),
      liveDataUsed: priceData.length > 0
    };
  }
};

const calculateTechnicalScore = (analysis: any): number => {
  // Convert technical analysis to score
  switch (analysis.overallSignal) {
    case 'STRONG_BUY': return 90;
    case 'BUY': return 75;
    case 'SELL': return 25;
    case 'STRONG_SELL': return 10;
    default: return 50;
  }
};

const calculateSentimentScore = (sentiment: any): number => {
  const baseScore = sentiment.confidence;
  
  switch (sentiment.overallSentiment) {
    case 'BULLISH': return Math.min(95, baseScore + 20);
    case 'BEARISH': return Math.max(5, baseScore - 20);
    default: return baseScore;
  }
};

const determineSignalFromScore = (score: number): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  if (score >= 85) return 'STRONG_BUY';
  if (score >= 70) return 'BUY';
  if (score <= 15) return 'STRONG_SELL';
  if (score <= 30) return 'SELL';
  return 'NEUTRAL';
};

const calculateRealDataConfidence = (technical: any, sentiment: any, dataPoints: number): number => {
  // Base confidence on data quality
  let confidence = Math.min(95, 40 + (dataPoints * 0.5));
  
  // Boost if technical and sentiment agree
  if ((technical.overallSignal.includes('BUY') && sentiment.overallSentiment === 'BULLISH') ||
      (technical.overallSignal.includes('SELL') && sentiment.overallSentiment === 'BEARISH')) {
    confidence += 15;
  }
  
  // Boost based on technical confidence
  confidence += (technical.confidence * 0.2);
  
  return Math.min(95, confidence);
};

const calculateAccuracyFromRealData = (signal: string, confidence: number, dataPoints: number): number => {
  let accuracy = 55;
  
  // More data points = higher accuracy
  if (dataPoints >= 50) accuracy += 15;
  else if (dataPoints >= 20) accuracy += 10;
  
  // Strong signals = higher accuracy
  if (signal.includes('STRONG')) accuracy += 10;
  else if (signal !== 'NEUTRAL') accuracy += 5;
  
  // High confidence = higher accuracy
  if (confidence > 80) accuracy += 10;
  else if (confidence > 60) accuracy += 5;
  
  return Math.min(95, accuracy);
};

const generateReasoningFromRealData = (technical: any, sentiment: any): string[] => {
  const reasons: string[] = [];
  
  // Technical reasoning
  reasons.push(`Phân tích kỹ thuật: ${technical.overallSignal} (${technical.confidence.toFixed(0)}% tin cậy)`);
  
  // Sentiment reasoning
  reasons.push(`AI sentiment: ${sentiment.overallSentiment} từ ${sentiment.sources.length} nguồn`);
  
  // Price action reasoning
  if (sentiment.priceAnalysis) {
    reasons.push(`Xu hướng giá: ${sentiment.priceAnalysis.trend}, Momentum: ${sentiment.priceAnalysis.momentum}`);
  }
  
  // Volume reasoning
  const volumeIndicator = technical.indicators.find((i: any) => i.name === 'Volume');
  if (volumeIndicator) {
    reasons.push(`Volume: ${volumeIndicator.signal} (${volumeIndicator.value.toFixed(2)}x trung bình)`);
  }
  
  return reasons.slice(0, 4);
};

const calculateRealRiskLevel = (priceData: CryptoPriceData[], technicalConfidence: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (priceData.length < 10) return 'HIGH';
  
  // Calculate real volatility from price data
  const closes = priceData.slice(-20).map(d => d.close);
  const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
  
  if (volatility > 0.05) return 'HIGH';
  if (volatility > 0.02) return 'MEDIUM';
  if (technicalConfidence > 75) return 'LOW';
  
  return 'MEDIUM';
};

const shouldEnterBasedOnRealData = (signal: string, confidence: number, accuracy: number, riskLevel: string): boolean => {
  if (signal === 'NEUTRAL') return false;
  if (confidence < 65) return false;
  if (accuracy < 70) return false;
  if (riskLevel === 'HIGH' && !signal.includes('STRONG')) return false;
  
  return true;
};

const generateRecommendationFromRealData = (signal: string, confidence: number, shouldEnter: boolean): string => {
  if (!shouldEnter) {
    return `Không nên vào lệnh. Tín hiệu ${signal} với ${confidence}% tin cậy chưa đủ mạnh.`;
  }
  
  if (signal.includes('BUY')) {
    const strength = signal.includes('STRONG') ? 'rất mạnh' : 'khá tốt';
    return `Khuyến nghị MUA - Tín hiệu ${strength}, tin cậy ${confidence}%.`;
  }
  
  if (signal.includes('SELL')) {
    const strength = signal.includes('STRONG') ? 'rất mạnh' : 'khá tốt';
    return `Khuyến nghị BÁN - Tín hiệu ${strength}, tin cậy ${confidence}%.`;
  }
  
  return `Tín hiệu ${signal} - Quan sát thêm với tin cậy ${confidence}%.`;
};

const generateEntryStrategyFromRealData = (signal: string, confidence: number, riskLevel: string): string => {
  if (signal === 'NEUTRAL' || confidence < 65) {
    return 'Chờ đợi tín hiệu rõ ràng hơn từ dữ liệu thực';
  }
  
  const riskText = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';
  
  if (signal.includes('STRONG') && confidence > 80) {
    return `Vào lệnh với volume chuẩn. Rủi ro ${riskText}. Dữ liệu Binance real-time.`;
  }
  
  return `Vào lệnh thử nghiệm với volume nhỏ. Rủi ro ${riskText}. Theo dõi live data.`;
};
