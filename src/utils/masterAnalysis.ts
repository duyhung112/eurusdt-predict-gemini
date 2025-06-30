import { generateCryptoComprehensiveAnalysis } from './comprehensiveAnalysis';
import { analyzePatterns } from './patternRecognition';
import { analyzeMarketStructure } from './marketStructure';
import { analyzeAdvancedSentiment } from './advancedSentiment';
import { analyzeSmartRisk } from './smartRiskManagement';
import { analyzeEconomicCalendar } from './economicCalendar';
import { runBacktest } from './backtesting';
import { fetchBinanceKlines, CryptoPriceData } from './binanceAPI';

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
  educationalAnalysis: {
    whyThisSignal: string;
    marketConditions: string;
    technicalExplanation: string;
    riskFactors: string[];
    learningPoints: string[];
  };
}

const analyzeRealMarketStructure = (priceData: CryptoPriceData[]) => {
  const closes = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  
  // Calculate trend using moving averages
  const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20;
  const sma50 = closes.slice(-50).reduce((a, b) => a + b) / 50;
  const currentPrice = closes[closes.length - 1];
  
  // Determine trend strength
  const trendStrength = Math.abs((sma20 - sma50) / sma50) * 100;
  
  let trend = 'SIDEWAYS';
  if (currentPrice > sma20 && sma20 > sma50) trend = 'UPTREND';
  else if (currentPrice < sma20 && sma20 < sma50) trend = 'DOWNTREND';
  
  // Calculate support and resistance levels from real data
  const recentLows = lows.slice(-20).sort((a, b) => a - b);
  const recentHighs = highs.slice(-20).sort((a, b) => b - a);
  
  return {
    trend,
    strength: Math.min(100, trendStrength * 10),
    support: recentLows[0],
    resistance: recentHighs[0],
    consolidating: trendStrength < 2
  };
};

const analyzeRealRisk = (priceData: CryptoPriceData[]) => {
  const closes = priceData.map(d => d.close);
  const volumes = priceData.map(d => d.volume);
  
  // Calculate volatility from real price data
  const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
  
  // Calculate volume consistency
  const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const volumeSpike = currentVolume / avgVolume;
  
  let riskLevel = 'MEDIUM';
  let riskScore = 50;
  
  if (volatility > 0.05) {
    riskLevel = 'HIGH';
    riskScore = 80;
  } else if (volatility > 0.03) {
    riskLevel = 'MEDIUM';
    riskScore = 60;
  } else if (volatility < 0.02) {
    riskLevel = 'LOW';
    riskScore = 30;
  }
  
  // Increase risk if volume is unusual
  if (volumeSpike > 3 || volumeSpike < 0.3) {
    riskScore += 20;
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    else if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
  }
  
  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    volatility: volatility * 100,
    volumeAnalysis: volumeSpike,
    positionSizing: {
      recommended: riskLevel === 'LOW' ? 0.05 : riskLevel === 'MEDIUM' ? 0.03 : 0.01,
      stopLoss: volatility * 2,
      takeProfit: volatility * 3
    }
  };
};

export const generateMasterAnalysis = async (apiKey: string): Promise<MasterAnalysis> => {
  try {
    console.log('Starting master analysis with real Binance data...');
    
    // Fetch real market data from Binance
    const priceData = await fetchBinanceKlines('ARBUSDT', '1h', 100);
    console.log('Fetched real price data:', priceData.length, 'candles');
    
    // Run analyses using real data only
    const [
      comprehensive,
      sentiment,
      patterns,
      calendar,
      backtest
    ] = await Promise.all([
      generateCryptoComprehensiveAnalysis(priceData, apiKey),
      analyzeAdvancedSentiment(priceData, apiKey),
      analyzePatterns(apiKey),
      analyzeEconomicCalendar(apiKey),
      runBacktest(apiKey)
    ]);
    
    // Analyze market structure using real data
    const marketStructure = analyzeRealMarketStructure(priceData);
    
    // Analyze risk using real data
    const risk = analyzeRealRisk(priceData);
    
    console.log('All analyses completed with real data');
    
    // Calculate weighted master signal based on real data
    const signals = [
      { signal: comprehensive.overallSignal, weight: 0.30, confidence: comprehensive.confidenceScore, source: 'AI Comprehensive' },
      { signal: sentiment.overallSentiment, weight: 0.25, confidence: sentiment.confidence, source: 'AI Sentiment' },
      { signal: getMarketStructureSignal(marketStructure), weight: 0.20, confidence: marketStructure.strength, source: 'Market Structure' },
      { signal: patterns.overallSignal, weight: 0.15, confidence: patterns.confidence, source: 'Pattern Recognition' },
      { signal: getBacktestSignal(backtest), weight: 0.10, confidence: backtest.overallPerformance.winRate, source: 'Backtest' }
    ];
    
    const masterSignal = calculateMasterSignal(signals);
    const masterConfidence = calculateMasterConfidence(signals);
    const accuracyScore = calculateAccuracyScore(signals, calendar, priceData.length);
    
    // Determine if should trade based on real data quality
    const shouldTrade = determineShouldTrade(masterSignal, masterConfidence, risk, calendar, priceData.length);
    
    // Calculate final risk level
    const riskLevel = calculateFinalRiskLevel(risk, calendar, sentiment);
    
    // Generate educational analysis
    const educationalAnalysis = generateEducationalAnalysis(
      masterSignal, 
      masterConfidence, 
      signals, 
      marketStructure, 
      risk, 
      priceData
    );
    
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
      timestamp: new Date(),
      educationalAnalysis
    };
    
  } catch (error) {
    console.error('Master analysis error:', error);
    
    // Return minimal fallback without simulated data
    return {
      overallSignal: 'NEUTRAL',
      masterConfidence: 0,
      accuracyScore: 0,
      components: {} as any,
      finalRecommendation: 'Không thể phân tích do lỗi kết nối. Vui lòng kiểm tra API key và thử lại.',
      shouldTrade: false,
      riskLevel: 'EXTREME',
      entryStrategy: 'Không vào lệnh cho đến khi có dữ liệu đáng tin cậy',
      timestamp: new Date(),
      educationalAnalysis: {
        whyThisSignal: 'Không có dữ liệu để phân tích',
        marketConditions: 'Không xác định',
        technicalExplanation: 'Cần dữ liệu thực để phân tích',
        riskFactors: ['Không có dữ liệu'],
        learningPoints: ['Kiểm tra kết nối API', 'Đảm bảo API key hợp lệ']
      }
    };
  }
};

const generateEducationalAnalysis = (
  signal: string,
  confidence: number,
  signals: any[],
  marketStructure: any,
  risk: any,
  priceData: CryptoPriceData[]
) => {
  const currentPrice = priceData[priceData.length - 1].close;
  const priceChange24h = ((currentPrice - priceData[priceData.length - 24].close) / priceData[priceData.length - 24].close) * 100;
  
  return {
    whyThisSignal: generateSignalExplanation(signal, confidence, signals),
    marketConditions: `Giá hiện tại: $${currentPrice.toFixed(4)} (${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}% trong 24h). 
    Xu hướng: ${marketStructure.trend} với độ mạnh ${marketStructure.strength.toFixed(0)}%. 
    Hỗ trợ: $${marketStructure.support.toFixed(4)}, Kháng cự: $${marketStructure.resistance.toFixed(4)}.`,
    
    technicalExplanation: generateTechnicalExplanation(marketStructure, risk),
    
    riskFactors: generateRiskFactors(risk, marketStructure),
    
    learningPoints: generateLearningPoints(signal, marketStructure, risk, signals)
  };
};

const generateSignalExplanation = (signal: string, confidence: number, signals: any[]) => {
  const strongSignals = signals.filter(s => s.signal.includes('STRONG') || s.confidence > 80);
  const consensus = signals.filter(s => s.signal.includes(signal.includes('BUY') ? 'BUY' : signal.includes('SELL') ? 'SELL' : 'NEUTRAL')).length;
  
  return `Tín hiệu ${signal} được tạo ra từ ${signals.length} nguồn phân tích khác nhau. 
  ${consensus}/${signals.length} nguồn đồng ý với hướng này. 
  Các tín hiệu mạnh nhất đến từ: ${strongSignals.map(s => s.source).join(', ')}. 
  Độ tin cậy tổng thể ${confidence.toFixed(0)}% dựa trên chất lượng dữ liệu thực từ Binance.`;
};

const generateTechnicalExplanation = (marketStructure: any, risk: any) => {
  return `Phân tích kỹ thuật từ dữ liệu thực:
  - Cấu trúc thị trường: ${marketStructure.trend} (${marketStructure.consolidating ? 'đang tích lũy' : 'có xu hướng rõ ràng'})
  - Độ biến động: ${risk.volatility.toFixed(2)}% (${risk.volatility > 5 ? 'cao' : risk.volatility > 2 ? 'trung bình' : 'thấp'})
  - Volume: ${risk.volumeAnalysis.toFixed(2)}x trung bình (${risk.volumeAnalysis > 1.5 ? 'tăng bất thường' : risk.volumeAnalysis < 0.7 ? 'yếu' : 'bình thường'})
  - Vùng hỗ trợ/kháng cự được tính từ 20 phiên gần nhất`;
};

const generateRiskFactors = (risk: any, marketStructure: any) => {
  const factors = [];
  
  if (risk.volatility > 5) factors.push('Độ biến động cao - giá có thể thay đổi mạnh');
  if (risk.volumeAnalysis > 3) factors.push('Volume tăng bất thường - có thể báo hiệu sự kiện lớn');
  if (risk.volumeAnalysis < 0.3) factors.push('Volume thấp - thanh khoản kém, khó vào/ra lệnh');
  if (marketStructure.consolidating) factors.push('Thị trường đang tích lũy - khó dự đoán hướng đi');
  if (marketStructure.strength < 30) factors.push('Xu hướng yếu - có thể đảo chiều bất cứ lúc nào');
  
  return factors.length > 0 ? factors : ['Rủi ro ở mức chấp nhận được với dữ liệu hiện tại'];
};

const generateLearningPoints = (signal: string, marketStructure: any, risk: any, signals: any[]) => {
  const points = [
    `Học cách đọc tín hiệu: ${signal} được tạo khi ${signals.length} chỉ báo đồng thuận`,
    `Quản lý rủi ro: Chỉ dùng ${(risk.positionSizing.recommended * 100).toFixed(1)}% tài khoản cho lệnh này`,
    `Stop Loss: Đặt ở ${(risk.positionSizing.stopLoss * 100).toFixed(1)}% để bảo vệ vốn`,
    `Take Profit: Mục tiêu lãi ${(risk.positionSizing.takeProfit * 100).toFixed(1)}% dựa trên độ biến động`,
    `Xác nhận xu hướng: ${marketStructure.trend} với độ mạnh ${marketStructure.strength.toFixed(0)}%`
  ];
  
  return points;
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

const calculateAccuracyScore = (signals: any[], calendar: any, dataPoints: number): number => {
  let baseAccuracy = 60;
  
  // Boost accuracy based on data quality
  if (dataPoints >= 100) baseAccuracy += 20;
  else if (dataPoints >= 50) baseAccuracy += 10;
  
  // Signal consensus
  const consensus = calculateSignalConsensus(signals);
  baseAccuracy += consensus * 15;
  
  // Economic events impact
  if (calendar.impactScore > 15) {
    baseAccuracy -= 10;
  } else if (calendar.impactScore < 5) {
    baseAccuracy += 5;
  }
  
  return Math.max(45, Math.min(95, baseAccuracy));
};

const determineShouldTrade = (signal: string, confidence: number, risk: any, calendar: any, dataPoints: number): boolean => {
  if (signal === 'NEUTRAL') return false;
  if (confidence < 60) return false;
  if (dataPoints < 50) return false; // Need sufficient real data
  if (risk.riskLevel === 'EXTREME') return false;
  if (calendar.impactScore > 20) return false;
  
  if (signal.includes('STRONG') && confidence > 75) return true;
  if (confidence > 70 && risk.riskLevel === 'LOW') return true;
  
  return false;
};

const calculateFinalRiskLevel = (risk: any, calendar: any, sentiment: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' => {
  let riskScore = risk.riskScore;
  
  if (calendar.impactScore > 20) riskScore += 20;
  else if (calendar.impactScore > 10) riskScore += 10;
  
  if (sentiment.confidence < 50) riskScore += 15;
  
  if (riskScore >= 90) return 'EXTREME';
  if (riskScore >= 70) return 'HIGH';
  if (riskScore >= 40) return 'MEDIUM';
  return 'LOW';
};

const generateFinalRecommendation = (signal: string, confidence: number, shouldTrade: boolean, riskLevel: string): string => {
  if (!shouldTrade) {
    return `❌ KHÔNG NÊN VÀO LỆNH: Tín hiệu ${signal} với độ tin cậy ${confidence.toFixed(0)}% và rủi ro ${riskLevel} chưa đủ điều kiện an toàn.`;
  }
  
  const strength = signal.includes('STRONG') ? 'RẤT MẠNH' : 'VỪA PHẢI';
  const direction = signal.includes('BUY') ? 'MUA' : 'BÁN';
  
  return `✅ KHUYẾN NGHỊ ${direction}: Tín hiệu ${strength} với độ tin cậy ${confidence.toFixed(0)}%. Rủi ro: ${riskLevel}. Dựa trên dữ liệu thực từ Binance.`;
};

const generateMasterEntryStrategy = (signal: string, confidence: number, riskLevel: string, risk: any): string => {
  if (signal === 'NEUTRAL' || confidence < 60) {
    return '⏳ Chờ đợi tín hiệu rõ ràng hơn từ dữ liệu thực';
  }
  
  const positionSize = (risk.positionSizing.recommended * 100).toFixed(1);
  const stopLoss = (risk.positionSizing.stopLoss * 100).toFixed(1);
  const takeProfit = (risk.positionSizing.takeProfit * 100).toFixed(1);
  
  return `🎯 CHIẾN LƯỢC: Vào lệnh ${positionSize}% tài khoản. SL: ${stopLoss}%, TP: ${takeProfit}%. Theo dõi volume và price action trong 1h đầu.`;
};
