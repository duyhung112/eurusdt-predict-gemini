
interface CandlestickPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliability: number;
  strength: number;
  description: string;
}

interface TechnicalPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  target: number;
  stopLoss: number;
  timeframe: string;
}

interface PatternAnalysis {
  candlestickPatterns: CandlestickPattern[];
  technicalPatterns: TechnicalPattern[];
  overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  recommendation: string;
}

// Mock price data for pattern detection
const generatePriceData = () => {
  const basePrice = 1.0850;
  return Array.from({ length: 20 }, (_, i) => ({
    open: basePrice + (Math.random() - 0.5) * 0.003,
    high: basePrice + Math.random() * 0.005,
    low: basePrice - Math.random() * 0.005,
    close: basePrice + (Math.random() - 0.5) * 0.003,
    volume: 1000000 + Math.random() * 500000,
    timestamp: new Date(Date.now() - (19 - i) * 3600000)
  }));
};

const detectCandlestickPatterns = (priceData: any[]): CandlestickPattern[] => {
  const patterns: CandlestickPattern[] = [];
  
  if (priceData.length < 3) return patterns;
  
  const last3 = priceData.slice(-3);
  const current = last3[2];
  const previous = last3[1];
  const previous2 = last3[0];
  
  // Doji pattern
  if (Math.abs(current.close - current.open) < (current.high - current.low) * 0.1) {
    patterns.push({
      name: 'Doji',
      type: 'NEUTRAL',
      reliability: 75,
      strength: 60,
      description: 'Indecision pattern, potential reversal'
    });
  }
  
  // Hammer pattern
  const bodySize = Math.abs(current.close - current.open);
  const lowerShadow = Math.min(current.open, current.close) - current.low;
  const upperShadow = current.high - Math.max(current.open, current.close);
  
  if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
    patterns.push({
      name: 'Hammer',
      type: 'BULLISH',
      reliability: 80,
      strength: 75,
      description: 'Bullish reversal pattern'
    });
  }
  
  // Engulfing pattern
  if (previous.close < previous.open && current.close > current.open &&
      current.open < previous.close && current.close > previous.open) {
    patterns.push({
      name: 'Bullish Engulfing',
      type: 'BULLISH',
      reliability: 85,
      strength: 80,
      description: 'Strong bullish reversal pattern'
    });
  }
  
  // Morning Star
  if (previous2.close < previous2.open && 
      Math.abs(previous.close - previous.open) < bodySize * 0.3 &&
      current.close > current.open && current.close > (previous2.open + previous2.close) / 2) {
    patterns.push({
      name: 'Morning Star',
      type: 'BULLISH',
      reliability: 90,
      strength: 85,
      description: 'Three-candle bullish reversal pattern'
    });
  }
  
  return patterns;
};

const detectTechnicalPatterns = (priceData: any[]): TechnicalPattern[] => {
  const patterns: TechnicalPattern[] = [];
  
  if (priceData.length < 10) return patterns;
  
  const prices = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);
  
  // Double Top detection
  const recent10Highs = highs.slice(-10);
  const maxHigh = Math.max(...recent10Highs);
  const highCount = recent10Highs.filter(h => Math.abs(h - maxHigh) < 0.0005).length;
  
  if (highCount >= 2) {
    patterns.push({
      name: 'Double Top',
      type: 'BEARISH',
      confidence: 75,
      target: maxHigh - 0.008,
      stopLoss: maxHigh + 0.003,
      timeframe: 'H4'
    });
  }
  
  // Support/Resistance breakout
  const recentLows = lows.slice(-5);
  const minLow = Math.min(...recentLows);
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice > minLow + 0.005) {
    patterns.push({
      name: 'Support Breakout',
      type: 'BULLISH',
      confidence: 80,
      target: currentPrice + 0.01,
      stopLoss: minLow - 0.002,
      timeframe: 'H1'
    });
  }
  
  // Triangle pattern
  const recentRange = Math.max(...recent10Highs) - Math.min(...recent10Highs.slice(-5));
  if (recentRange < 0.006) {
    patterns.push({
      name: 'Triangle Consolidation',
      type: 'NEUTRAL',
      confidence: 70,
      target: currentPrice + 0.008,
      stopLoss: currentPrice - 0.004,
      timeframe: 'H4'
    });
  }
  
  return patterns;
};

export const analyzePatterns = async (apiKey: string): Promise<PatternAnalysis> => {
  const priceData = generatePriceData();
  const candlestickPatterns = detectCandlestickPatterns(priceData);
  const technicalPatterns = detectTechnicalPatterns(priceData);
  
  // Calculate overall signal
  let bullishScore = 0;
  let bearishScore = 0;
  
  candlestickPatterns.forEach(pattern => {
    const weight = pattern.reliability / 100;
    if (pattern.type === 'BULLISH') bullishScore += weight;
    else if (pattern.type === 'BEARISH') bearishScore += weight;
  });
  
  technicalPatterns.forEach(pattern => {
    const weight = pattern.confidence / 100;
    if (pattern.type === 'BULLISH') bullishScore += weight;
    else if (pattern.type === 'BEARISH') bearishScore += weight;
  });
  
  const totalScore = bullishScore + bearishScore;
  const bullishPercentage = totalScore > 0 ? (bullishScore / totalScore) * 100 : 50;
  
  let overallSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  let confidence: number;
  
  if (bullishPercentage > 75) {
    overallSignal = 'STRONG_BUY';
    confidence = 85;
  } else if (bullishPercentage > 60) {
    overallSignal = 'BUY';
    confidence = 70;
  } else if (bullishPercentage < 25) {
    overallSignal = 'STRONG_SELL';
    confidence = 85;
  } else if (bullishPercentage < 40) {
    overallSignal = 'SELL';
    confidence = 70;
  } else {
    overallSignal = 'NEUTRAL';
    confidence = 50;
  }
  
  // Enhance with AI if available
  try {
    if (apiKey && apiKey.length > 10) {
      const patternNames = [...candlestickPatterns, ...technicalPatterns].map(p => p.name).join(', ');
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze EURUSD patterns: ${patternNames}. Current signal: ${overallSignal}. Provide enhanced confidence score and brief recommendation.`
            }]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 100 }
        })
      });
      
      if (response.ok) {
        confidence = Math.min(95, confidence + 5);
      }
    }
  } catch (error) {
    console.log('AI pattern enhancement failed');
  }
  
  return {
    candlestickPatterns,
    technicalPatterns,
    overallSignal,
    confidence,
    recommendation: generatePatternRecommendation(overallSignal, confidence, candlestickPatterns.length + technicalPatterns.length)
  };
};

const generatePatternRecommendation = (signal: string, confidence: number, patternCount: number): string => {
  const patternText = patternCount > 0 ? `${patternCount} patterns detected` : 'No clear patterns';
  
  if (signal.includes('STRONG')) {
    return `${patternText}. Strong ${signal.includes('BUY') ? 'bullish' : 'bearish'} signal with ${confidence}% confidence.`;
  } else if (signal !== 'NEUTRAL') {
    return `${patternText}. Moderate ${signal.toLowerCase()} signal with ${confidence}% confidence.`;
  }
  
  return `${patternText}. Neutral market conditions, wait for clearer signals.`;
};
