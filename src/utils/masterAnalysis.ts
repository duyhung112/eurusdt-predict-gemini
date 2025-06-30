
import { generateComprehensiveAnalysis } from './comprehensiveAnalysis';
import { analyzePatterns } from './patternRecognition';
import { analyzeMarketStructure } from './marketStructure';
import { analyzeAdvancedSentiment } from './advancedSentiment';
import { analyzeSmartRisk } from './smartRiskManagement';
import { analyzeEconomicCalendar } from './economicCalendar';
import { runBacktest } from './backtesting';

export interface MasterAnalysis {
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  masterConfidence: number;
  accuracyScore: number;
  components: {
    comprehensive: any;
    patterns: any;
    marketStructure: any;
    sentiment: any;
    risk: any;
    calendar: any;
    backtest: any;
  };
  finalRecommendation: string;
  shouldTrade: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  entryStrategy: string;
  timestamp: Date;
}

// Mock price data for analysis
const generatePriceData = () => {
  const basePrice = 1.0850;
  return Array.from({ length: 50 }, (_, i) => ({
    open: basePrice + (Math.random() - 0.5) * 0.003,
    high: basePrice + Math.random() * 0.005,
    low: basePrice - Math.random() * 0.005,
    close: basePrice + (Math.random() - 0.5) * 0.003,
    volume: 1000000 + Math.random() * 500000,
    timestamp: new Date(Date.now() - (49 - i) * 3600000)
  }));
};

export const generateMasterAnalysis = async (apiKey: string): Promise<MasterAnalysis> => {
  try {
    const priceData = generatePriceData();
    
    // Run all analyses in parallel
    const [
      comprehensive,
      patterns,
      marketStructure,
      sentiment,
      risk,
      calendar,
      backtest
    ] = await Promise.all([
      generateComprehensiveAnalysis(apiKey),
      analyzePatterns(apiKey),
      Promise.resolve(analyzeMarketStructure(priceData)),
      analyzeAdvancedSentiment(apiKey),
      Promise.resolve(analyzeSmartRisk(priceData)),
      analyzeEconomicCalendar(apiKey),
      runBacktest(apiKey)
    ]);
    
    // Calculate weighted master signal
    const signals = [
      { signal: comprehensive.overallSignal, weight: 0.25, confidence: comprehensive.confidenceScore },
      { signal: patterns.overallSignal, weight: 0.15, confidence: patterns.confidence },
      { signal: getMarketStructureSignal(marketStructure), weight: 0.15, confidence: marketStructure.strength },
      { signal: sentiment.overallSentiment, weight: 0.20, confidence: sentiment.confidence },
      { signal: getBacktestSignal(backtest), weight: 0.15, confidence: backtest.overallPerformance.winRate },
      { signal: getRiskSignal(risk), weight: 0.10, confidence: 100 - risk.riskScore }
    ];
    
    const masterSignal = calculateMasterSignal(signals);
    const masterConfidence = calculateMasterConfidence(signals);
    const accuracyScore = calculateAccuracyScore(signals, calendar);
    
    // Determine if should trade
    const shouldTrade = determineShouldTrade(masterSignal, masterConfidence, risk, calendar);
    
    // Calculate final risk level
    const riskLevel = calculateFinalRiskLevel(risk, calendar, sentiment);
    
    return {
      overallSignal: masterSignal,
      masterConfidence,
      accuracyScore,
      components: {
        comprehensive,
        patterns,
        marketStructure,
        sentiment,
        risk,
        calendar,
        backtest
      },
      finalRecommendation: generateFinalRecommendation(masterSignal, masterConfidence, shouldTrade, riskLevel),
      shouldTrade,
      riskLevel,
      entryStrategy: generateMasterEntryStrategy(masterSignal, masterConfidence, riskLevel, risk),
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Master analysis error:', error);
    
    // Fallback analysis
    return {
      overallSignal: 'NEUTRAL',
      masterConfidence: 50,
      accuracyScore: 65,
      components: {} as any,
      finalRecommendation: 'Analysis unavailable. Wait for system recovery.',
      shouldTrade: false,
      riskLevel: 'HIGH',
      entryStrategy: 'Do not trade until analysis is restored',
      timestamp: new Date()
    };
  }
};

const getMarketStructureSignal = (structure: any): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  if (structure.trend === 'UPTREND' && structure.strength > 70) return 'STRONG_BUY';
  if (structure.trend === 'UPTREND') return 'BUY';
  if (structure.trend === 'DOWNTREND' && structure.strength > 70) return 'STRONG_SELL';
  if (structure.trend === 'DOWNTREND') return 'SELL';
  return 'NEUTRAL';
};

const getBacktestSignal = (backtest: any): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  const winRate = backtest.overallPerformance.winRate;
  const profitFactor = backtest.overallPerformance.profitFactor;
  
  if (winRate > 65 && profitFactor > 1.5) return 'STRONG_BUY';
  if (winRate > 55 && profitFactor > 1.2) return 'BUY';
  if (winRate < 35 || profitFactor < 0.8) return 'SELL';
  if (winRate < 25 || profitFactor < 0.6) return 'STRONG_SELL';
  return 'NEUTRAL';
};

const getRiskSignal = (risk: any): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  if (risk.riskLevel === 'LOW') return 'BUY';
  if (risk.riskLevel === 'MEDIUM') return 'NEUTRAL';
  if (risk.riskLevel === 'HIGH') return 'SELL';
  return 'STRONG_SELL';
};

const calculateMasterSignal = (signals: any[]): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' => {
  let weightedScore = 0;
  let totalWeight = 0;
  
  signals.forEach(({ signal, weight, confidence }) => {
    let signalScore = 0;
    switch (signal) {
      case 'STRONG_BUY': signalScore = 100; break;
      case 'BUY': signalScore = 75; break;
      case 'NEUTRAL': signalScore = 50; break;
      case 'SELL': signalScore = 25; break;
      case 'STRONG_SELL': signalScore = 0; break;
      case 'BULLISH': signalScore = 75; break;
      case 'BEARISH': signalScore = 25; break;
    }
    
    const adjustedWeight = weight * (confidence / 100);
    weightedScore += signalScore * adjustedWeight;
    totalWeight += adjustedWeight;
  });
  
  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 50;
  
  if (finalScore >= 85) return 'STRONG_BUY';
  if (finalScore >= 65) return 'BUY';
  if (finalScore <= 15) return 'STRONG_SELL';
  if (finalScore <= 35) return 'SELL';
  return 'NEUTRAL';
};

const calculateMasterConfidence = (signals: any[]): number => {
  const confidences = signals.map(s => s.confidence);
  const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  
  // Boost confidence if signals agree
  const signalConsensus = calculateSignalConsensus(signals);
  return Math.min(95, avgConfidence + signalConsensus * 10);
};

const calculateSignalConsensus = (signals: any[]): number => {
  const signalTypes = signals.map(s => s.signal);
  const bullishSignals = signalTypes.filter(s => s.includes('BUY') || s === 'BULLISH').length;
  const bearishSignals = signalTypes.filter(s => s.includes('SELL') || s === 'BEARISH').length;
  const neutralSignals = signalTypes.filter(s => s === 'NEUTRAL').length;
  
  const total = signals.length;
  const maxAgreement = Math.max(bullishSignals, bearishSignals, neutralSignals);
  
  return maxAgreement / total;
};

const calculateAccuracyScore = (signals: any[], calendar: any): number => {
  let baseAccuracy = 70;
  
  // Boost accuracy based on signal consensus
  const consensus = calculateSignalConsensus(signals);
  baseAccuracy += consensus * 15;
  
  // Adjust for economic events
  if (calendar.impactScore > 15) {
    baseAccuracy -= 10; // High impact events reduce accuracy
  } else if (calendar.impactScore < 5) {
    baseAccuracy += 5; // Low impact events increase accuracy
  }
  
  return Math.max(45, Math.min(95, baseAccuracy));
};

const determineShouldTrade = (signal: string, confidence: number, risk: any, calendar: any): boolean => {
  if (signal === 'NEUTRAL') return false;
  if (confidence < 60) return false;
  if (risk.riskLevel === 'EXTREME') return false;
  if (calendar.impactScore > 20) return false; // Avoid high impact events
  
  if (signal.includes('STRONG') && confidence > 75) return true;
  if (confidence > 70 && risk.riskLevel === 'LOW') return true;
  
  return false;
};

const calculateFinalRiskLevel = (risk: any, calendar: any, sentiment: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' => {
  let riskScore = 0;
  
  // Base risk from risk analysis
  switch (risk.riskLevel) {
    case 'LOW': riskScore += 10; break;
    case 'MEDIUM': riskScore += 30; break;
    case 'HIGH': riskScore += 60; break;
    case 'EXTREME': riskScore += 90; break;
  }
  
  // Economic calendar risk
  if (calendar.impactScore > 20) riskScore += 20;
  else if (calendar.impactScore > 10) riskScore += 10;
  
  // Sentiment risk
  if (sentiment.contrarian) riskScore += 15;
  if (sentiment.confidence < 50) riskScore += 10;
  
  if (riskScore >= 80) return 'EXTREME';
  if (riskScore >= 60) return 'HIGH';
  if (riskScore >= 30) return 'MEDIUM';
  return 'LOW';
};

const generateFinalRecommendation = (signal: string, confidence: number, shouldTrade: boolean, riskLevel: string): string => {
  if (!shouldTrade) {
    return `Không khuyến nghị vào lệnh. Tín hiệu ${signal} với độ tin cậy ${confidence.toFixed(0)}% và rủi ro ${riskLevel}.`;
  }
  
  const strength = signal.includes('STRONG') ? 'mạnh' : 'vừa phải';
  const direction = signal.includes('BUY') ? 'MUA' : 'BÁN';
  
  return `Khuyến nghị ${direction} với tín hiệu ${strength}. Độ tin cậy: ${confidence.toFixed(0)}%. Rủi ro: ${riskLevel}.`;
};

const generateMasterEntryStrategy = (signal: string, confidence: number, riskLevel: string, risk: any): string => {
  if (signal === 'NEUTRAL' || confidence < 60) {
    return 'Chờ đợi tín hiệu rõ ràng hơn';
  }
  
  const positionSize = riskLevel === 'LOW' ? 'chuẩn' : riskLevel === 'MEDIUM' ? 'giảm 30%' : 'giảm 50%';
  const stopDistance = risk.positionSizing ? (risk.positionSizing.stopLoss * 10000).toFixed(0) : '20';
  
  return `Vào lệnh với volume ${positionSize}. Stop loss: ${stopDistance} pips. Theo dõi sát trong 30 phút đầu.`;
};
