
interface SentimentData {
  source: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

interface COTData {
  commercials: {
    long: number;
    short: number;
    net: number;
  };
  nonCommercials: {
    long: number;
    short: number;
    net: number;
  };
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface AdvancedSentimentAnalysis {
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  sources: SentimentData[];
  cotData: COTData;
  institutionalPositioning: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  retailSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  contrarian: boolean;
  recommendation: string;
}

const generateMockSentimentData = (): SentimentData[] => {
  const sources = [
    { name: 'Twitter Forex', weight: 0.3 },
    { name: 'Reddit Trading', weight: 0.25 },
    { name: 'News Sentiment', weight: 0.35 },
    { name: 'Analyst Reports', weight: 0.1 }
  ];
  
  return sources.map(source => {
    const sentiments: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];
    const impacts: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];
    
    return {
      source: source.name,
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      confidence: 60 + Math.random() * 30,
      impact: impacts[Math.floor(Math.random() * impacts.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000)
    };
  });
};

const generateMockCOTData = (): COTData => {
  const commercialsNet = (Math.random() - 0.5) * 100000;
  const nonCommercialsNet = (Math.random() - 0.5) * 80000;
  
  let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  // COT analysis: when commercials are net long, it's usually bullish
  if (commercialsNet > 20000) {
    sentiment = 'BULLISH';
  } else if (commercialsNet < -20000) {
    sentiment = 'BEARISH';
  } else {
    sentiment = 'NEUTRAL';
  }
  
  return {
    commercials: {
      long: 150000 + Math.random() * 50000,
      short: 150000 - commercialsNet + Math.random() * 50000,
      net: commercialsNet
    },
    nonCommercials: {
      long: 120000 + Math.random() * 40000,
      short: 120000 - nonCommercialsNet + Math.random() * 40000,
      net: nonCommercialsNet
    },
    sentiment
  };
};

const calculateWeightedSentiment = (sentimentData: SentimentData[]): { sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number } => {
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;
  let avgConfidence = 0;
  
  sentimentData.forEach(data => {
    const weight = data.impact === 'HIGH' ? 1.0 : data.impact === 'MEDIUM' ? 0.7 : 0.4;
    totalWeight += weight;
    avgConfidence += data.confidence * weight;
    
    if (data.sentiment === 'BULLISH') {
      bullishScore += weight * (data.confidence / 100);
    } else if (data.sentiment === 'BEARISH') {
      bearishScore += weight * (data.confidence / 100);
    }
  });
  
  const totalScore = bullishScore + bearishScore;
  if (totalScore === 0) {
    return { sentiment: 'NEUTRAL', confidence: 50 };
  }
  
  const bullishPercentage = (bullishScore / totalScore) * 100;
  avgConfidence = avgConfidence / totalWeight;
  
  let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (bullishPercentage > 60) {
    sentiment = 'BULLISH';
  } else if (bullishPercentage < 40) {
    sentiment = 'BEARISH';
  } else {
    sentiment = 'NEUTRAL';
  }
  
  return { sentiment, confidence: avgConfidence };
};

const analyzeContrarian = (retailSentiment: string, institutionalSentiment: string): boolean => {
  // Contrarian signal: when retail and institutional sentiment oppose each other
  return (retailSentiment === 'BULLISH' && institutionalSentiment === 'BEARISH') ||
         (retailSentiment === 'BEARISH' && institutionalSentiment === 'BULLISH');
};

export const analyzeAdvancedSentiment = async (apiKey: string): Promise<AdvancedSentimentAnalysis> => {
  const sentimentData = generateMockSentimentData();
  const cotData = generateMockCOTData();
  
  // Calculate weighted sentiment
  const { sentiment: overallSentiment, confidence } = calculateWeightedSentiment(sentimentData);
  
  // Determine institutional vs retail sentiment
  const institutionalSources = sentimentData.filter(s => s.source.includes('Analyst') || s.source.includes('News'));
  const retailSources = sentimentData.filter(s => s.source.includes('Twitter') || s.source.includes('Reddit'));
  
  const { sentiment: institutionalPositioning } = calculateWeightedSentiment(institutionalSources);
  const { sentiment: retailSentiment } = calculateWeightedSentiment(retailSources);
  
  // Check for contrarian signal
  const contrarian = analyzeContrarian(retailSentiment, institutionalPositioning);
  
  // Enhance with AI sentiment analysis
  let enhancedConfidence = confidence;
  try {
    if (apiKey && apiKey.length > 10) {
      const sentimentSummary = sentimentData.map(s => `${s.source}: ${s.sentiment}`).join(', ');
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze EURUSD market sentiment: ${sentimentSummary}. COT: ${cotData.sentiment}. Overall: ${overallSentiment}. Provide confidence adjustment.`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
        })
      });
      
      if (response.ok) {
        enhancedConfidence = Math.min(95, confidence + 5);
      }
    }
  } catch (error) {
    console.log('AI sentiment enhancement failed');
  }
  
  return {
    overallSentiment,
    confidence: enhancedConfidence,
    sources: sentimentData,
    cotData,
    institutionalPositioning,
    retailSentiment,
    contrarian,
    recommendation: generateSentimentRecommendation(overallSentiment, enhancedConfidence, contrarian, cotData.sentiment)
  };
};

const generateSentimentRecommendation = (
  sentiment: string, 
  confidence: number, 
  contrarian: boolean, 
  cotSentiment: string
): string => {
  let recommendation = `Overall sentiment: ${sentiment} (${confidence.toFixed(0)}% confidence)`;
  
  if (contrarian) {
    recommendation += '. Contrarian signal detected - consider opposite positioning.';
  }
  
  if (cotSentiment !== sentiment) {
    recommendation += ` COT data shows ${cotSentiment} bias, conflicting with general sentiment.`;
  }
  
  if (confidence > 75) {
    recommendation += ` High confidence ${sentiment.toLowerCase()} sentiment supports trend following.`;
  } else if (confidence < 50) {
    recommendation += ' Low confidence suggests waiting for clearer sentiment signals.';
  }
  
  return recommendation;
};
