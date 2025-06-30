
interface RiskParameters {
  maxRiskPerTrade: number;
  maxDrawdown: number;
  correlation: number;
  volatility: number;
  sharpeRatio: number;
}

interface PositionSizing {
  recommendedSize: number;
  maxSize: number;
  riskAmount: number;
  stopLoss: number;
  takeProfits: number[];
  trailingStop: number;
}

interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  riskScore: number;
  positionSizing: PositionSizing;
  correlationWarning: boolean;
  volatilityAdjustment: number;
  recommendation: string;
}

const calculateATR = (priceData: any[], period: number = 14): number => {
  if (priceData.length < period) return 0.001;
  
  const trueRanges = priceData.slice(-period).map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    
    const prevClose = priceData[priceData.length - period + index - 1].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevClose),
      Math.abs(candle.low - prevClose)
    );
  });
  
  return trueRanges.reduce((sum, tr) => sum + tr, 0) / period;
};

const calculateVolatility = (priceData: any[], period: number = 20): number => {
  if (priceData.length < period) return 0.01;
  
  const returns = priceData.slice(-period).map((candle, index) => {
    if (index === 0) return 0;
    const prevClose = priceData[priceData.length - period + index - 1].close;
    return Math.log(candle.close / prevClose);
  }).filter(r => r !== 0);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance * 252); // Annualized volatility
};

const calculateCorrelation = (): number => {
  // Mock correlation with other major pairs
  // In real implementation, calculate correlation with portfolio positions
  return 0.3 + Math.random() * 0.4; // 0.3 to 0.7 correlation
};

const calculateDynamicPositionSize = (
  accountBalance: number,
  riskPerTrade: number,
  stopLossDistance: number,
  volatility: number,
  correlation: number
): PositionSizing => {
  const baseRiskAmount = accountBalance * (riskPerTrade / 100);
  
  // Adjust for volatility
  const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / volatility));
  
  // Adjust for correlation
  const correlationAdjustment = Math.max(0.7, 1 - correlation * 0.3);
  
  const adjustedRiskAmount = baseRiskAmount * volatilityAdjustment * correlationAdjustment;
  const recommendedSize = adjustedRiskAmount / stopLossDistance;
  
  // Maximum position size (never risk more than 5% on single trade)
  const maxSize = (accountBalance * 0.05) / stopLossDistance;
  
  const finalSize = Math.min(recommendedSize, maxSize);
  
  return {
    recommendedSize: finalSize,
    maxSize,
    riskAmount: adjustedRiskAmount,
    stopLoss: stopLossDistance,
    takeProfits: [stopLossDistance * 1.5, stopLossDistance * 2, stopLossDistance * 3],
    trailingStop: stopLossDistance * 0.7
  };
};

const calculateRiskScore = (
  volatility: number,
  correlation: number,
  atr: number,
  marketCondition: string
): number => {
  let riskScore = 50; // Base risk score
  
  // Volatility adjustment
  if (volatility > 0.15) riskScore += 20; // High volatility
  else if (volatility > 0.10) riskScore += 10; // Medium volatility
  else riskScore -= 5; // Low volatility
  
  // Correlation adjustment
  if (correlation > 0.7) riskScore += 15; // High correlation
  else if (correlation > 0.5) riskScore += 5; // Medium correlation
  
  // ATR adjustment
  const normalATR = 0.002; // Normal ATR for EURUSD
  if (atr > normalATR * 1.5) riskScore += 10;
  else if (atr < normalATR * 0.7) riskScore -= 5;
  
  // Market condition adjustment
  if (marketCondition === 'HIGH_VOLATILITY') riskScore += 15;
  else if (marketCondition === 'TRENDING') riskScore -= 5;
  
  return Math.max(0, Math.min(100, riskScore));
};

export const analyzeSmartRisk = (
  priceData: any[],
  accountBalance: number = 10000,
  riskPerTrade: number = 2,
  marketCondition: string = 'NORMAL'
): RiskAnalysis => {
  const atr = calculateATR(priceData);
  const volatility = calculateVolatility(priceData);
  const correlation = calculateCorrelation();
  
  const riskScore = calculateRiskScore(volatility, correlation, atr, marketCondition);
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  if (riskScore < 30) riskLevel = 'LOW';
  else if (riskScore < 60) riskLevel = 'MEDIUM';
  else if (riskScore < 80) riskLevel = 'HIGH';
  else riskLevel = 'EXTREME';
  
  // Calculate position sizing
  const stopLossDistance = atr * 2; // 2 ATR stop loss
  const positionSizing = calculateDynamicPositionSize(
    accountBalance,
    riskPerTrade,
    stopLossDistance,
    volatility,
    correlation
  );
  
  // Volatility adjustment
  const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / volatility));
  
  // Correlation warning
  const correlationWarning = correlation > 0.6;
  
  return {
    riskLevel,
    riskScore,
    positionSizing,
    correlationWarning,
    volatilityAdjustment,
    recommendation: generateRiskRecommendation(riskLevel, riskScore, correlationWarning, volatility)
  };
};

const generateRiskRecommendation = (
  riskLevel: string,
  riskScore: number,
  correlationWarning: boolean,
  volatility: number
): string => {
  let recommendation = `Risk Level: ${riskLevel} (Score: ${riskScore.toFixed(0)}/100). `;
  
  if (riskLevel === 'EXTREME') {
    recommendation += 'Avoid trading or use minimal position sizes. ';
  } else if (riskLevel === 'HIGH') {
    recommendation += 'Reduce position sizes by 50%. ';
  } else if (riskLevel === 'MEDIUM') {
    recommendation += 'Use standard position sizing with tight stops. ';
  } else {
    recommendation += 'Favorable conditions for normal position sizing. ';
  }
  
  if (correlationWarning) {
    recommendation += 'High correlation detected - avoid multiple EURUSD positions. ';
  }
  
  if (volatility > 0.15) {
    recommendation += 'High volatility - use wider stops and smaller positions.';
  } else if (volatility < 0.05) {
    recommendation += 'Low volatility - consider longer timeframes or wait for volatility expansion.';
  }
  
  return recommendation;
};
