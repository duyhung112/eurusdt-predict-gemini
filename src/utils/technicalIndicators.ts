
import { TrendingUp, TrendingDown, Activity, BarChart } from "lucide-react";

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  icon: any;
}

interface TechnicalAnalysis {
  indicators: TechnicalIndicator[];
  overallScore: number;
}

// Mock price data for calculation
const mockPriceData = [
  1.0820, 1.0825, 1.0830, 1.0835, 1.0840, 1.0845, 1.0850, 1.0855, 1.0860, 1.0850,
  1.0845, 1.0840, 1.0835, 1.0830, 1.0825, 1.0830, 1.0835, 1.0840, 1.0845, 1.0850
];

// Simple Moving Average calculation
const calculateSMA = (data: number[], period: number): number => {
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
};

// RSI calculation
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

// MACD calculation
const calculateMACD = (data: number[]): number => {
  const ema12 = calculateSMA(data.slice(-12), 12);
  const ema26 = calculateSMA(data.slice(-26), 26);
  return ema12 - ema26;
};

// Bollinger Bands calculation
const calculateBollingerBands = (data: number[], period: number = 20): { upper: number; lower: number; middle: number } => {
  const sma = calculateSMA(data, period);
  const slice = data.slice(-period);
  
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (2 * stdDev),
    lower: sma - (2 * stdDev),
    middle: sma
  };
};

// Stochastic Oscillator calculation
const calculateStochastic = (data: number[], period: number = 14): number => {
  const slice = data.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const current = data[data.length - 1];
  
  if (high === low) return 50;
  return ((current - low) / (high - low)) * 100;
};

export const calculateTechnicalIndicators = (): TechnicalAnalysis => {
  const currentPrice = mockPriceData[mockPriceData.length - 1];
  
  // Calculate indicators
  const rsi = calculateRSI(mockPriceData);
  const macd = calculateMACD(mockPriceData);
  const sma20 = calculateSMA(mockPriceData, 20);
  const sma50 = calculateSMA(mockPriceData, 50);
  const bb = calculateBollingerBands(mockPriceData);
  const stoch = calculateStochastic(mockPriceData);
  
  // Determine signals
  const getRSISignal = (rsi: number): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } => {
    if (rsi < 30) return { signal: 'BUY', strength: 85 };
    if (rsi > 70) return { signal: 'SELL', strength: 85 };
    return { signal: 'NEUTRAL', strength: 50 };
  };
  
  const getMACDSignal = (macd: number): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } => {
    if (macd > 0) return { signal: 'BUY', strength: 70 };
    if (macd < 0) return { signal: 'SELL', strength: 70 };
    return { signal: 'NEUTRAL', strength: 40 };
  };
  
  const getSMASignal = (current: number, sma20: number, sma50: number): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } => {
    if (current > sma20 && sma20 > sma50) return { signal: 'BUY', strength: 75 };
    if (current < sma20 && sma20 < sma50) return { signal: 'SELL', strength: 75 };
    return { signal: 'NEUTRAL', strength: 45 };
  };
  
  const getBBSignal = (current: number, bb: { upper: number; lower: number; middle: number }): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } => {
    if (current <= bb.lower) return { signal: 'BUY', strength: 80 };
    if (current >= bb.upper) return { signal: 'SELL', strength: 80 };
    return { signal: 'NEUTRAL', strength: 50 };
  };
  
  const rsiSignal = getRSISignal(rsi);
  const macdSignal = getMACDSignal(macd);
  const smaSignal = getSMASignal(currentPrice, sma20, sma50);
  const bbSignal = getBBSignal(currentPrice, bb);
  
  const indicators: TechnicalIndicator[] = [
    {
      name: 'RSI (14)',
      value: rsi,
      signal: rsiSignal.signal,
      strength: rsiSignal.strength,
      icon: Activity
    },
    {
      name: 'MACD',
      value: macd,
      signal: macdSignal.signal,
      strength: macdSignal.strength,
      icon: TrendingUp
    },
    {
      name: 'SMA Cross',
      value: sma20,
      signal: smaSignal.signal,
      strength: smaSignal.strength,
      icon: TrendingDown
    },
    {
      name: 'Bollinger Bands',
      value: bb.middle,
      signal: bbSignal.signal,
      strength: bbSignal.strength,
      icon: BarChart
    }
  ];
  
  // Calculate overall score
  const buySignals = indicators.filter(i => i.signal === 'BUY').length;
  const sellSignals = indicators.filter(i => i.signal === 'SELL').length;
  const avgStrength = indicators.reduce((sum, i) => sum + i.strength, 0) / indicators.length;
  
  let overallScore = avgStrength;
  if (buySignals > sellSignals) {
    overallScore += 10;
  } else if (sellSignals > buySignals) {
    overallScore -= 10;
  }
  
  overallScore = Math.max(0, Math.min(100, overallScore));
  
  return {
    indicators,
    overallScore: Math.round(overallScore)
  };
};

// Export additional utility functions
export const formatIndicatorValue = (value: number, decimals: number = 4): string => {
  return value.toFixed(decimals);
};

export const getSignalStrength = (signal: string, strength: number): string => {
  if (strength >= 80) return `STRONG ${signal}`;
  if (strength >= 60) return signal;
  return `WEAK ${signal}`;
};
