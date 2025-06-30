
interface MarketStructure {
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  strength: number;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  breakoutProbability: number;
  volumeProfile: {
    highVolumeNodes: number[];
    lowVolumeNodes: number[];
  };
  orderFlow: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  manipulation: {
    detected: boolean;
    type: string;
    confidence: number;
  };
}

const calculateMovingAverages = (prices: number[], periods: number[]) => {
  return periods.map(period => {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  });
};

const detectSupportResistance = (highs: number[], lows: number[]): { support: number[]; resistance: number[] } => {
  const support: number[] = [];
  const resistance: number[] = [];
  
  // Find pivot points
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      support.push(lows[i]);
    }
  }
  
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      resistance.push(highs[i]);
    }
  }
  
  // Remove duplicates and sort
  const uniqueSupport = [...new Set(support.map(s => Math.round(s * 10000) / 10000))].sort((a, b) => b - a).slice(0, 3);
  const uniqueResistance = [...new Set(resistance.map(r => Math.round(r * 10000) / 10000))].sort((a, b) => a - b).slice(0, 3);
  
  return { support: uniqueSupport, resistance: uniqueResistance };
};

const analyzeVolumeProfile = (prices: number[], volumes: number[]) => {
  const priceVolumeMap = new Map<number, number>();
  
  prices.forEach((price, index) => {
    const roundedPrice = Math.round(price * 1000) / 1000;
    const currentVolume = priceVolumeMap.get(roundedPrice) || 0;
    priceVolumeMap.set(roundedPrice, currentVolume + volumes[index]);
  });
  
  const sortedByVolume = Array.from(priceVolumeMap.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const highVolumeNodes = sortedByVolume.slice(0, 3).map(([price]) => price);
  const lowVolumeNodes = sortedByVolume.slice(-3).map(([price]) => price);
  
  return { highVolumeNodes, lowVolumeNodes };
};

const detectManipulation = (prices: number[], volumes: number[]) => {
  const recentPrices = prices.slice(-10);
  const recentVolumes = volumes.slice(-10);
  
  // Detect stop hunting
  const priceRange = Math.max(...recentPrices) - Math.min(...recentPrices);
  const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  
  // Look for sudden price spikes with low volume
  const lastPrice = recentPrices[recentPrices.length - 1];
  const prevPrice = recentPrices[recentPrices.length - 2];
  const lastVolume = recentVolumes[recentVolumes.length - 1];
  
  const priceMove = Math.abs(lastPrice - prevPrice);
  const volumeRatio = lastVolume / avgVolume;
  
  if (priceMove > priceRange * 0.3 && volumeRatio < 0.7) {
    return {
      detected: true,
      type: 'Stop Hunt',
      confidence: 75
    };
  }
  
  // Detect fake breakouts
  const breakoutCandidate = recentPrices.some((price, index) => {
    if (index === 0) return false;
    const prevPrice = recentPrices[index - 1];
    return Math.abs(price - prevPrice) > priceRange * 0.4;
  });
  
  if (breakoutCandidate && volumeRatio < 0.8) {
    return {
      detected: true,
      type: 'Fake Breakout',
      confidence: 65
    };
  }
  
  return {
    detected: false,
    type: 'None',
    confidence: 0
  };
};

export const analyzeMarketStructure = (priceData: any[]): MarketStructure => {
  const prices = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  const volumes = priceData.map(d => d.volume);
  
  // Analyze trend
  const [sma20, sma50, sma200] = calculateMovingAverages(prices, [20, 50, 200]);
  const currentPrice = prices[prices.length - 1];
  
  let trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  let strength: number;
  
  if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) {
    trend = 'UPTREND';
    strength = 85;
  } else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) {
    trend = 'DOWNTREND';
    strength = 85;
  } else if (currentPrice > sma20 && sma20 > sma50) {
    trend = 'UPTREND';
    strength = 65;
  } else if (currentPrice < sma20 && sma20 < sma50) {
    trend = 'DOWNTREND';
    strength = 65;
  } else {
    trend = 'SIDEWAYS';
    strength = 40;
  }
  
  // Detect key levels
  const keyLevels = detectSupportResistance(highs, lows);
  
  // Calculate breakout probability
  const recentRange = Math.max(...prices.slice(-10)) - Math.min(...prices.slice(-10));
  const avgRange = prices.slice(-20).reduce((sum, price, index) => {
    if (index === 0) return 0;
    return sum + Math.abs(price - prices[prices.length - 20 + index - 1]);
  }, 0) / 19;
  
  const breakoutProbability = Math.min(90, (recentRange / avgRange) * 50);
  
  // Analyze volume profile
  const volumeProfile = analyzeVolumeProfile(prices, volumes);
  
  // Determine order flow
  const recentPrices = prices.slice(-5);
  const priceMovement = recentPrices[recentPrices.length - 1] - recentPrices[0];
  const avgVolume = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5;
  const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  let orderFlow: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (priceMovement > 0 && avgVolume > totalVolume * 1.1) {
    orderFlow = 'BULLISH';
  } else if (priceMovement < 0 && avgVolume > totalVolume * 1.1) {
    orderFlow = 'BEARISH';
  } else {
    orderFlow = 'NEUTRAL';
  }
  
  // Detect manipulation
  const manipulation = detectManipulation(prices, volumes);
  
  return {
    trend,
    strength,
    keyLevels,
    breakoutProbability,
    volumeProfile,
    orderFlow,
    manipulation
  };
};
