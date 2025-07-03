import { CryptoPriceData } from './binanceAPI';
import { analyzeCryptoTechnicals } from './cryptoTechnicalAnalysis';

export interface AITradingSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  accuracy: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  positionSize: number;
  reasoning: string[];
  technicalAnalysis: {
    rsi: { value: number; signal: string; reason: string };
    macd: { value: number; signal: string; reason: string };
    bollinger: { position: string; signal: string; reason: string };
    volume: { relative: number; signal: string; reason: string };
    trend: { direction: string; strength: number; reason: string };
  };
  marketConditions: {
    volatility: number;
    momentum: string;
    support: number;
    resistance: number;
    marketPhase: string;
  };
  timestamp: Date;
  validUntil: Date;
  liveDataSource: boolean;
}

export interface TradeRecommendation {
  shouldTrade: boolean;
  action: 'BUY' | 'SELL' | 'WAIT';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  timeframe: string;
  explanation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  maxLoss: number;
  expectedGain: number;
}

export const generateRealTimeAISignal = async (
  priceData: CryptoPriceData[],
  apiKey: string
): Promise<AITradingSignal> => {
  console.log('🤖 Generating real-time AI trading signal with live Binance data...');
  
  // Ensure we have sufficient data
  if (priceData.length < 20) {
    throw new Error('Cần ít nhất 20 nến để phân tích chính xác');
  }
  
  // Perform technical analysis on real data
  const technicalAnalysis = analyzeCryptoTechnicals(priceData);
  const currentPrice = priceData[priceData.length - 1].close;
  
  // Calculate advanced technical indicators from real data
  const indicators = calculateAdvancedIndicators(priceData);
  
  // Get AI analysis using Gemini
  const aiAnalysis = await getGeminiAnalysis(priceData, indicators, apiKey);
  
  // Calculate market conditions from real data
  const marketConditions = analyzeMarketConditions(priceData);
  
  // Generate trading signal
  const signal = determineOptimalSignal(indicators, aiAnalysis, technicalAnalysis);
  
  // Calculate trade levels
  const tradeLevels = calculateOptimalTradeLevels(
    currentPrice, 
    signal.signal, 
    marketConditions, 
    indicators
  );
  
  // Generate reasoning
  const reasoning = generateDetailedReasoning(
    indicators, 
    aiAnalysis, 
    marketConditions, 
    signal
  );
  
  return {
    signal: signal.signal,
    confidence: signal.confidence,
    accuracy: calculateAccuracy(signal, indicators, priceData.length),
    entryPrice: tradeLevels.entry,
    stopLoss: tradeLevels.stopLoss,
    takeProfit: tradeLevels.takeProfit,
    riskReward: tradeLevels.riskReward,
    positionSize: calculatePositionSize(marketConditions.volatility, signal.confidence),
    reasoning,
    technicalAnalysis: {
      rsi: indicators.rsi,
      macd: indicators.macd,
      bollinger: indicators.bollinger,
      volume: indicators.volume,
      trend: indicators.trend
    },
    marketConditions,
    timestamp: new Date(),
    validUntil: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes
    liveDataSource: true
  };
};

const calculateAdvancedIndicators = (priceData: CryptoPriceData[]) => {
  const closes = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  const volumes = priceData.map(d => d.volume);
  
  // RSI calculation
  const rsi = calculateRSI(closes, 14);
  
  // MACD calculation
  const macd = calculateMACD(closes);
  
  // Bollinger Bands
  const bollinger = calculateBollingerBands(closes, 20, 2);
  
  // Volume analysis
  const volume = analyzeVolume(volumes);
  
  // Trend analysis
  const trend = analyzeTrend(closes);
  
  return { rsi, macd, bollinger, volume, trend };
};

const calculateRSI = (closes: number[], period: number = 14) => {
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  let signal = 'NEUTRAL';
  let reason = '';
  
  if (rsi < 30) {
    signal = 'BUY';
    reason = 'RSI cho thấy vùng quá bán - cơ hội mua tốt';
  } else if (rsi > 70) {
    signal = 'SELL';
    reason = 'RSI cho thấy vùng quá mua - áp lực bán';
  } else if (rsi > 50) {
    signal = 'WEAK_BUY';
    reason = 'RSI trên 50 - xu hướng tăng nhẹ';
  } else {
    reason = 'RSI ở vùng trung tính';
  }
  
  return { value: rsi, signal, reason };
};

const calculateMACD = (closes: number[]) => {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  let signal = 'NEUTRAL';
  let reason = '';
  
  if (macdLine > 0) {
    signal = 'BUY';
    reason = 'MACD dương - momentum tăng';
  } else {
    signal = 'SELL';
    reason = 'MACD âm - momentum giảm';
  }
  
  return { value: macdLine, signal, reason };
};

const calculateEMA = (data: number[], period: number): number[] => {
  const ema = [data[0]];
  const multiplier = 2 / (period + 1);
  
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
};

const calculateBollingerBands = (closes: number[], period: number, stdDev: number) => {
  const sma = closes.slice(-period).reduce((a, b) => a + b) / period;
  const squaredDiffs = closes.slice(-period).map(close => Math.pow(close - sma, 2));
  const stdDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / period);
  
  const upper = sma + (stdDeviation * stdDev);
  const lower = sma - (stdDeviation * stdDev);
  const currentPrice = closes[closes.length - 1];
  
  let position = 'MIDDLE';
  let signal = 'NEUTRAL';
  let reason = '';
  
  if (currentPrice <= lower) {
    position = 'LOWER';
    signal = 'BUY';
    reason = 'Giá chạm Bollinger Lower - tín hiệu mua mạnh';
  } else if (currentPrice >= upper) {
    position = 'UPPER';
    signal = 'SELL';
    reason = 'Giá chạm Bollinger Upper - tín hiệu bán';
  } else if (currentPrice > sma) {
    position = 'UPPER_MIDDLE';
    reason = 'Giá trên trung bình - xu hướng tăng';
  } else {
    position = 'LOWER_MIDDLE';
    reason = 'Giá dưới trung bình - xu hướng giảm';
  }
  
  return { position, signal, reason };
};

const analyzeVolume = (volumes: number[]) => {
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
  const currentVolume = volumes[volumes.length - 1];
  const relative = currentVolume / avgVolume;
  
  let signal = 'NEUTRAL';
  let reason = '';
  
  if (relative > 2) {
    signal = 'STRONG';
    reason = 'Volume tăng mạnh - có sự kiện quan trọng';
  } else if (relative > 1.5) {
    signal = 'HIGH';
    reason = 'Volume cao - tăng sự quan tâm';
  } else if (relative < 0.5) {
    signal = 'LOW';
    reason = 'Volume thấp - thiếu quan tâm';
  } else {
    reason = 'Volume bình thường';
  }
  
  return { relative, signal, reason };
};

const analyzeTrend = (closes: number[]) => {
  const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20;
  const sma50 = closes.slice(-50).reduce((a, b) => a + b) / 50;
  const currentPrice = closes[closes.length - 1];
  
  let direction = 'SIDEWAYS';
  let strength = 0;
  let reason = '';
  
  if (currentPrice > sma20 && sma20 > sma50) {
    direction = 'UPTREND';
    strength = Math.min(100, ((currentPrice - sma50) / sma50) * 1000);
    reason = 'Giá trên SMA20 và SMA50 - xu hướng tăng rõ ràng';
  } else if (currentPrice < sma20 && sma20 < sma50) {
    direction = 'DOWNTREND';
    strength = Math.min(100, ((sma50 - currentPrice) / sma50) * 1000);
    reason = 'Giá dưới SMA20 và SMA50 - xu hướng giảm rõ ràng';
  } else {
    strength = 20;
    reason = 'Thị trường đang đi ngang';
  }
  
  return { direction, strength, reason };
};

const analyzeMarketConditions = (priceData: CryptoPriceData[]) => {
  const closes = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  
  // Calculate volatility
  const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * 100;
  
  // Determine momentum
  const recentPrices = closes.slice(-5);
  const momentum = recentPrices[recentPrices.length - 1] > recentPrices[0] ? 'BULLISH' : 'BEARISH';
  
  // Calculate support and resistance
  const recentLows = lows.slice(-20);
  const recentHighs = highs.slice(-20);
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);
  
  // Determine market phase
  let marketPhase = 'ACCUMULATION';
  if (volatility > 3) marketPhase = 'TRENDING';
  else if (volatility < 1) marketPhase = 'CONSOLIDATION';
  
  return { volatility, momentum, support, resistance, marketPhase };
};

const getGeminiAnalysis = async (
  priceData: CryptoPriceData[],
  indicators: any,
  apiKey: string
): Promise<any> => {
  if (!apiKey || apiKey.length < 10) {
    return { sentiment: 'NEUTRAL', confidence: 50, aiReasoning: 'Không có API key để phân tích AI' };
  }
  
  try {
    const currentPrice = priceData[priceData.length - 1].close;
    const priceChange = ((currentPrice - priceData[priceData.length - 2].close) / priceData[priceData.length - 2].close) * 100;
    
    const prompt = `Phân tích crypto ARB/USDT với dữ liệu thực:
    - Giá hiện tại: $${currentPrice.toFixed(4)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)
    - RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.signal})
    - MACD: ${indicators.macd.value.toFixed(6)} (${indicators.macd.signal})
    - Bollinger: ${indicators.bollinger.position}
    - Volume: ${indicators.volume.relative.toFixed(2)}x trung bình
    - Xu hướng: ${indicators.trend.direction} (độ mạnh: ${indicators.trend.strength.toFixed(0)}%)
    
    Đưa ra:
    1. Tín hiệu: BUY/SELL/NEUTRAL
    2. Độ tin cậy: 0-100%
    3. Lý do ngắn gọn (1-2 câu)
    4. Cảnh báo rủi ro nếu có`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse AI response
      let sentiment = 'NEUTRAL';
      let confidence = 60;
      
      if (aiText.includes('BUY') || aiText.includes('mua')) {
        sentiment = 'BULLISH';
        confidence = 75;
      } else if (aiText.includes('SELL') || aiText.includes('bán')) {
        sentiment = 'BEARISH';
        confidence = 75;
      }
      
      return {
        sentiment,
        confidence,
        aiReasoning: aiText.substring(0, 200)
      };
    }
  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
  }
  
  return { sentiment: 'NEUTRAL', confidence: 50, aiReasoning: 'AI phân tích không khả dụng' };
};

const determineOptimalSignal = (indicators: any, aiAnalysis: any, technicalAnalysis: any) => {
  let bullishPoints = 0;
  let bearishPoints = 0;
  let confidenceSum = 0;
  
  // RSI scoring
  if (indicators.rsi.signal === 'BUY') bullishPoints += 3;
  else if (indicators.rsi.signal === 'SELL') bearishPoints += 3;
  else if (indicators.rsi.signal === 'WEAK_BUY') bullishPoints += 1;
  
  // MACD scoring
  if (indicators.macd.signal === 'BUY') bullishPoints += 2;
  else if (indicators.macd.signal === 'SELL') bearishPoints += 2;
  
  // Bollinger scoring
  if (indicators.bollinger.signal === 'BUY') bullishPoints += 2;
  else if (indicators.bollinger.signal === 'SELL') bearishPoints += 2;
  
  // Volume scoring
  if (indicators.volume.signal === 'STRONG' || indicators.volume.signal === 'HIGH') {
    if (bullishPoints > bearishPoints) bullishPoints += 1;
    else if (bearishPoints > bullishPoints) bearishPoints += 1;
  }
  
  // Trend scoring
  if (indicators.trend.direction === 'UPTREND') bullishPoints += Math.floor(indicators.trend.strength / 25);
  else if (indicators.trend.direction === 'DOWNTREND') bearishPoints += Math.floor(indicators.trend.strength / 25);
  
  // AI analysis scoring
  if (aiAnalysis.sentiment === 'BULLISH') bullishPoints += 2;
  else if (aiAnalysis.sentiment === 'BEARISH') bearishPoints += 2;
  
  confidenceSum = aiAnalysis.confidence + indicators.trend.strength + (indicators.volume.relative * 10);
  
  const totalPoints = bullishPoints - bearishPoints;
  const confidence = Math.min(95, Math.max(40, confidenceSum / 3));
  
  let signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  
  if (totalPoints >= 6) signal = 'STRONG_BUY';
  else if (totalPoints >= 3) signal = 'BUY';
  else if (totalPoints <= -6) signal = 'STRONG_SELL';
  else if (totalPoints <= -3) signal = 'SELL';
  else signal = 'NEUTRAL';
  
  return { signal, confidence };
};

const calculateOptimalTradeLevels = (
  currentPrice: number,
  signal: string,
  marketConditions: any,
  indicators: any
) => {
  const volatility = marketConditions.volatility / 100;
  const atr = currentPrice * volatility;
  
  let entry = currentPrice;
  let stopLoss: number;
  let takeProfit: number;
  
  if (signal.includes('BUY')) {
    // For buy signals
    stopLoss = entry - (atr * 1.5);
    takeProfit = entry + (atr * 2.5);
    
    // Adjust based on support/resistance
    if (marketConditions.support && entry - marketConditions.support < atr) {
      stopLoss = marketConditions.support * 0.999; // Just below support
    }
  } else if (signal.includes('SELL')) {
    // For sell signals
    stopLoss = entry + (atr * 1.5);
    takeProfit = entry - (atr * 2.5);
    
    // Adjust based on resistance
    if (marketConditions.resistance && marketConditions.resistance - entry < atr) {
      stopLoss = marketConditions.resistance * 1.001; // Just above resistance
    }
  } else {
    // Neutral - no trade
    stopLoss = entry;
    takeProfit = entry;
  }
  
  const riskReward = Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss);
  
  return {
    entry: parseFloat(entry.toFixed(6)),
    stopLoss: parseFloat(stopLoss.toFixed(6)),
    takeProfit: parseFloat(takeProfit.toFixed(6)),
    riskReward: parseFloat(riskReward.toFixed(2))
  };
};

const calculatePositionSize = (volatility: number, confidence: number): number => {
  // Base position size on risk management
  let baseSize = 0.02; // 2% of account
  
  // Adjust based on volatility
  if (volatility > 3) baseSize *= 0.5; // High volatility = smaller position
  else if (volatility < 1) baseSize *= 1.5; // Low volatility = larger position
  
  // Adjust based on confidence
  if (confidence > 80) baseSize *= 1.2;
  else if (confidence < 60) baseSize *= 0.7;
  
  return Math.min(0.05, Math.max(0.005, baseSize)); // Between 0.5% and 5%
};

const calculateAccuracy = (signal: any, indicators: any, dataPoints: number): number => {
  let baseAccuracy = 65;
  
  // More data points = higher accuracy
  if (dataPoints >= 100) baseAccuracy += 15;
  else if (dataPoints >= 50) baseAccuracy += 10;
  
  // Strong signals = higher accuracy
  if (signal.signal.includes('STRONG')) baseAccuracy += 10;
  
  // Good volume = higher accuracy
  if (indicators.volume.relative > 1.5) baseAccuracy += 5;
  
  // Clear trend = higher accuracy
  if (indicators.trend.strength > 60) baseAccuracy += 8;
  
  return Math.min(95, Math.max(50, baseAccuracy));
};

const generateDetailedReasoning = (
  indicators: any,
  aiAnalysis: any,
  marketConditions: any,
  signal: any
): string[] => {
  const reasoning = [];
  
  // Technical indicators reasoning
  reasoning.push(`🔍 RSI ${indicators.rsi.value.toFixed(1)}: ${indicators.rsi.reason}`);
  reasoning.push(`📈 MACD: ${indicators.macd.reason}`);
  reasoning.push(`📊 Bollinger Bands: ${indicators.bollinger.reason}`);
  reasoning.push(`📈 Xu hướng: ${indicators.trend.reason}`);
  
  // Volume analysis
  reasoning.push(`🔊 Volume: ${indicators.volume.reason}`);
  
  // Market conditions
  reasoning.push(`🌊 Biến động: ${marketConditions.volatility.toFixed(2)}% (${
    marketConditions.volatility > 3 ? 'cao' : marketConditions.volatility > 1.5 ? 'trung bình' : 'thấp'
  })`);
  
  // AI analysis
  if (aiAnalysis.aiReasoning && aiAnalysis.aiReasoning.length > 10) {
    reasoning.push(`🤖 AI Gemini: ${aiAnalysis.aiReasoning.substring(0, 100)}...`);
  }
  
  // Final signal reasoning
  reasoning.push(`⚡ Tín hiệu ${signal.signal} với độ tin cậy ${signal.confidence.toFixed(0)}% từ dữ liệu Binance thời gian thực`);
  
  return reasoning;
};

export const generateTradeRecommendation = (signal: AITradingSignal): TradeRecommendation => {
  const shouldTrade = signal.signal !== 'NEUTRAL' && signal.confidence > 65 && signal.accuracy > 70;
  
  let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
  
  if (shouldTrade) {
    action = signal.signal.includes('BUY') ? 'BUY' : 'SELL';
    
    if (signal.signal.includes('STRONG') && signal.confidence > 80) {
      urgency = 'HIGH';
    } else if (signal.confidence > 70) {
      urgency = 'MEDIUM';
    }
    
    if (signal.marketConditions.volatility < 2 && signal.confidence > 75) {
      riskLevel = 'LOW';
    } else if (signal.marketConditions.volatility > 4 || signal.confidence < 65) {
      riskLevel = 'HIGH';
    }
  } else {
    riskLevel = 'EXTREME';
  }
  
  const maxLoss = Math.abs(signal.entryPrice - signal.stopLoss) / signal.entryPrice * 100;
  const expectedGain = Math.abs(signal.takeProfit - signal.entryPrice) / signal.entryPrice * 100;
  
  return {
    shouldTrade,
    action,
    urgency,
    timeframe: '15-30 phút',
    explanation: shouldTrade 
      ? `Tín hiệu ${signal.signal} mạnh với R:R ${signal.riskReward}:1. Vào lệnh ${signal.positionSize * 100}% tài khoản.`
      : `Tín hiệu ${signal.signal} chưa đủ mạnh hoặc rủi ro cao. Chờ cơ hội tốt hơn.`,
    riskLevel,
    maxLoss,
    expectedGain
  };
};