
import { CryptoPriceData } from './binanceAPI';

interface CryptoTechnicalIndicator {
  name: string;
  value: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  strength: number;
  description: string;
}

interface CryptoAnalysis {
  indicators: CryptoTechnicalIndicator[];
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  priceTarget: {
    bullish: number;
    bearish: number;
  };
  supportResistance: {
    support: number[];
    resistance: number[];
  };
}

const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1];
  const slice = data.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / slice.length;
};

const calculateEMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
};

const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (data: number[]): { macd: number; signal: number; histogram: number } => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd = ema12 - ema26;
  
  // Simplified signal line calculation
  const macdData = [macd]; // In real implementation, you'd have historical MACD values
  const signal = calculateEMA(macdData, 9);
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

const findSupportResistance = (priceData: CryptoPriceData[]): { support: number[]; resistance: number[] } => {
  const highs = priceData.map(d => d.high).slice(-20);
  const lows = priceData.map(d => d.low).slice(-20);
  
  const support: number[] = [];
  const resistance: number[] = [];
  
  // Find local minima for support
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
        lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      support.push(lows[i]);
    }
  }
  
  // Find local maxima for resistance
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
        highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      resistance.push(highs[i]);
    }
  }
  
  return {
    support: support.slice(-3).sort((a, b) => b - a),
    resistance: resistance.slice(-3).sort((a, b) => a - b)
  };
};

export const analyzeCryptoTechnicals = (priceData: CryptoPriceData[]): CryptoAnalysis => {
  const closes = priceData.map(d => d.close);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const rsi = calculateRSI(closes);
  const macdData = calculateMACD(closes);
  
  // Volume analysis
  const volumes = priceData.map(d => d.volume);
  const avgVolume = calculateSMA(volumes, 20);
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;
  
  const indicators: CryptoTechnicalIndicator[] = [
    {
      name: 'SMA Crossover',
      value: sma20,
      signal: currentPrice > sma20 && sma20 > sma50 ? 'BUY' : 
              currentPrice < sma20 && sma20 < sma50 ? 'SELL' : 'NEUTRAL',
      strength: Math.abs(((currentPrice - sma20) / sma20) * 1000),
      description: `Price ${currentPrice > sma20 ? 'above' : 'below'} SMA20`
    },
    {
      name: 'EMA Trend',
      value: ema12,
      signal: ema12 > ema26 ? 'BUY' : ema12 < ema26 ? 'SELL' : 'NEUTRAL',
      strength: Math.abs(((ema12 - ema26) / ema26) * 1000),
      description: `EMA12 ${ema12 > ema26 ? 'above' : 'below'} EMA26`
    },
    {
      name: 'RSI',
      value: rsi,
      signal: rsi < 25 ? 'STRONG_BUY' : rsi < 35 ? 'BUY' : 
              rsi > 75 ? 'STRONG_SELL' : rsi > 65 ? 'SELL' : 'NEUTRAL',
      strength: rsi < 30 || rsi > 70 ? 85 : rsi < 40 || rsi > 60 ? 65 : 40,
      description: `RSI at ${rsi.toFixed(1)} - ${rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral'}`
    },
    {
      name: 'MACD',
      value: macdData.macd,
      signal: macdData.macd > macdData.signal ? 'BUY' : 'SELL',
      strength: Math.abs(macdData.histogram) * 1000,
      description: `MACD ${macdData.macd > macdData.signal ? 'bullish' : 'bearish'} crossover`
    },
    {
      name: 'Volume',
      value: volumeRatio,
      signal: volumeRatio > 1.5 ? 'BUY' : volumeRatio < 0.7 ? 'SELL' : 'NEUTRAL',
      strength: Math.abs(volumeRatio - 1) * 100,
      description: `Volume ${volumeRatio > 1.2 ? 'above' : volumeRatio < 0.8 ? 'below' : 'near'} average`
    }
  ];
  
  // Calculate overall signal
  const signalScores = indicators.map(ind => {
    switch (ind.signal) {
      case 'STRONG_BUY': return 100;
      case 'BUY': return 75;
      case 'NEUTRAL': return 50;
      case 'SELL': return 25;
      case 'STRONG_SELL': return 0;
      default: return 50;
    }
  });
  
  const weightedScore = signalScores.reduce((sum, score, i) => 
    sum + (score * indicators[i].strength), 0) / 
    indicators.reduce((sum, ind) => sum + ind.strength, 0);
  
  let overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  if (weightedScore >= 85) overallSignal = 'STRONG_BUY';
  else if (weightedScore >= 65) overallSignal = 'BUY';
  else if (weightedScore <= 15) overallSignal = 'STRONG_SELL';
  else if (weightedScore <= 35) overallSignal = 'SELL';
  else overallSignal = 'NEUTRAL';
  
  const confidence = Math.min(95, Math.max(50, 
    indicators.reduce((sum, ind) => sum + ind.strength, 0) / indicators.length));
  
  const supportResistance = findSupportResistance(priceData);
  
  // Calculate price targets
  const volatility = Math.sqrt(
    closes.slice(-20).reduce((sum, price, i, arr) => {
      if (i === 0) return 0;
      const change = (price - arr[i-1]) / arr[i-1];
      return sum + Math.pow(change, 2);
    }, 0) / 20
  );
  
  const priceTarget = {
    bullish: currentPrice * (1 + volatility * 2),
    bearish: currentPrice * (1 - volatility * 2)
  };
  
  return {
    indicators,
    overallSignal,
    confidence,
    priceTarget,
    supportResistance
  };
};
