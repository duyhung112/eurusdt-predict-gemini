
import { analyzeNewsWithAI } from './newsAnalysis';
import { calculateTechnicalIndicators } from './technicalIndicators';

export interface ComprehensiveAnalysis {
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;
  accuracyScore: number;
  recommendation: string;
  reasoning: string[];
  technicalScore: number;
  newsScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  shouldEnterTrade: boolean;
  entryStrategy: string;
  timestamp: Date;
}

interface AnalysisWeights {
  technical: number;
  news: number;
  volume: number;
  trend: number;
}

const defaultWeights: AnalysisWeights = {
  technical: 0.4,
  news: 0.3,
  volume: 0.15,
  trend: 0.15
};

export const generateComprehensiveAnalysis = async (
  apiKey: string,
  weights: AnalysisWeights = defaultWeights
): Promise<ComprehensiveAnalysis> => {
  try {
    // Get technical analysis
    const technicalData = calculateTechnicalIndicators();
    const technicalScore = technicalData.overallScore;

    // Get news analysis
    const newsAnalysis = await analyzeNewsWithAI(apiKey);
    const newsScore = calculateNewsScore(newsAnalysis.sentiment, newsAnalysis.confidence);

    // Calculate volume and trend scores
    const volumeScore = calculateVolumeScore();
    const trendScore = calculateTrendScore();

    // Calculate weighted overall score
    const weightedScore = 
      (technicalScore * weights.technical) +
      (newsScore * weights.news) +
      (volumeScore * weights.volume) +
      (trendScore * weights.trend);

    // Determine signal strength
    const signal = determineSignal(weightedScore);
    
    // Calculate confidence and accuracy
    const confidence = calculateConfidence(technicalScore, newsScore, volumeScore, trendScore);
    const accuracy = calculateAccuracyScore(signal, confidence, technicalData.indicators.length);

    // Generate reasoning
    const reasoning = generateReasoning(technicalData, newsAnalysis, signal, confidence);

    // Determine if should enter trade
    const shouldEnter = shouldEnterTrade(signal, confidence, accuracy);

    // Calculate risk level
    const riskLevel = calculateRiskLevel(signal, confidence, newsAnalysis.sentiment);

    return {
      overallSignal: signal,
      confidenceScore: Math.round(confidence),
      accuracyScore: Math.round(accuracy),
      recommendation: generateRecommendation(signal, confidence, shouldEnter),
      reasoning,
      technicalScore: Math.round(technicalScore),
      newsScore: Math.round(newsScore),
      riskLevel,
      shouldEnterTrade: shouldEnter,
      entryStrategy: generateEntryStrategy(signal, confidence, riskLevel),
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    
    // Fallback analysis
    const fallbackTechnical = calculateTechnicalIndicators();
    return {
      overallSignal: 'NEUTRAL',
      confidenceScore: 50,
      accuracyScore: 65,
      recommendation: 'Wait for clearer signals before entering any trades.',
      reasoning: ['Technical analysis only available', 'News analysis unavailable'],
      technicalScore: fallbackTechnical.overallScore,
      newsScore: 50,
      riskLevel: 'MEDIUM',
      shouldEnterTrade: false,
      entryStrategy: 'Wait for better market conditions',
      timestamp: new Date()
    };
  }
};

const calculateNewsScore = (sentiment: string, confidence: number): number => {
  const baseScore = 50;
  
  switch (sentiment) {
    case 'BULLISH':
      return Math.min(95, baseScore + (confidence * 0.4));
    case 'BEARISH':
      return Math.max(5, baseScore - (confidence * 0.4));
    default:
      return baseScore;
  }
};

const calculateVolumeScore = (): number => {
  // Mock volume analysis - in real implementation, use actual volume data
  const currentVolume = 1200000 + Math.random() * 800000;
  const avgVolume = 1200000;
  const volumeRatio = currentVolume / avgVolume;
  
  if (volumeRatio > 1.5) return 85; // High volume = strong signal
  if (volumeRatio > 1.2) return 70;
  if (volumeRatio < 0.8) return 40; // Low volume = weak signal
  return 60;
};

const calculateTrendScore = (): number => {
  // Mock trend analysis - in real implementation, use price action data
  const trendStrength = 60 + Math.random() * 30;
  return trendStrength;
};

const determineSignal = (score: number): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  if (score >= 85) return 'STRONG_BUY';
  if (score >= 70) return 'BUY';
  if (score <= 15) return 'STRONG_SELL';
  if (score <= 30) return 'SELL';
  return 'NEUTRAL';
};

const calculateConfidence = (technical: number, news: number, volume: number, trend: number): number => {
  const scores = [technical, news, volume, trend];
  const average = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
  const consistency = Math.max(0, 100 - variance);
  
  return Math.min(95, (average + consistency) / 2);
};

const calculateAccuracyScore = (signal: string, confidence: number, indicatorCount: number): number => {
  let baseAccuracy = 65;
  
  // Boost accuracy based on signal strength
  if (signal.includes('STRONG')) baseAccuracy += 15;
  else if (signal !== 'NEUTRAL') baseAccuracy += 8;
  
  // Boost based on confidence
  if (confidence > 80) baseAccuracy += 10;
  else if (confidence > 60) baseAccuracy += 5;
  
  // Boost based on indicator consensus
  if (indicatorCount >= 4) baseAccuracy += 5;
  
  return Math.min(95, Math.max(45, baseAccuracy));
};

const generateReasoning = (technical: any, news: any, signal: string, confidence: number): string[] => {
  const reasons: string[] = [];
  
  // Technical reasoning
  const buySignals = technical.indicators.filter((i: any) => i.signal === 'BUY').length;
  const sellSignals = technical.indicators.filter((i: any) => i.signal === 'SELL').length;
  
  if (buySignals > sellSignals) {
    reasons.push(`${buySignals} technical indicators show BUY signals`);
  } else if (sellSignals > buySignals) {
    reasons.push(`${sellSignals} technical indicators show SELL signals`);
  }
  
  // News reasoning
  if (news.sentiment !== 'NEUTRAL') {
    reasons.push(`Economic news sentiment is ${news.sentiment.toLowerCase()}`);
  }
  
  // Confidence reasoning
  if (confidence > 75) {
    reasons.push('High confidence due to indicator consensus');
  } else if (confidence < 50) {
    reasons.push('Low confidence due to mixed signals');
  }
  
  // Signal reasoning
  if (signal.includes('STRONG')) {
    reasons.push('Strong signal suggests high probability move');
  }
  
  return reasons.slice(0, 4); // Limit to 4 most important reasons
};

const shouldEnterTrade = (signal: string, confidence: number, accuracy: number): boolean => {
  if (signal === 'NEUTRAL') return false;
  if (confidence < 60) return false;
  if (accuracy < 65) return false;
  if (signal.includes('STRONG') && confidence > 75 && accuracy > 75) return true;
  if (confidence > 70 && accuracy > 70) return true;
  return false;
};

const calculateRiskLevel = (signal: string, confidence: number, newsSentiment: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (signal === 'NEUTRAL' || confidence < 50) return 'HIGH';
  if (signal.includes('STRONG') && confidence > 80) return 'LOW';
  if (newsSentiment === 'NEUTRAL' && confidence < 70) return 'HIGH';
  return 'MEDIUM';
};

const generateRecommendation = (signal: string, confidence: number, shouldEnter: boolean): string => {
  if (!shouldEnter) {
    return 'Không nên vào lệnh lúc này. Chờ tín hiệu rõ ràng hơn.';
  }
  
  if (signal.includes('BUY')) {
    const strength = signal.includes('STRONG') ? 'mạnh' : 'vừa phải';
    return `Khuyến nghị MUA với tín hiệu ${strength}. Độ tin cậy ${confidence}%.`;
  } 
  
  if (signal.includes('SELL')) {
    const strength = signal.includes('STRONG') ? 'mạnh' : 'vừa phải';
    return `Khuyến nghị BÁN với tín hiệu ${strength}. Độ tin cậy ${confidence}%.`;
  }
  
  return 'Tín hiệu trung tính. Quan sát thêm trước khi quyết định.';
};

const generateEntryStrategy = (signal: string, confidence: number, riskLevel: string): string => {
  if (signal === 'NEUTRAL' || confidence < 60) {
    return 'Chờ đợi tín hiệu rõ ràng hơn';
  }
  
  const riskText = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';
  
  if (signal.includes('STRONG')) {
    return `Vào lệnh với volume tiêu chuẩn. Rủi ro ${riskText}.`;
  }
  
  return `Vào lệnh với volume nhỏ để test. Rủi ro ${riskText}.`;
};
