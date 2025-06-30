
interface Trade {
  id: string;
  timestamp: Date;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  pnl: number;
  duration: number; // in minutes
  strategy: string;
  confidence: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
}

interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingTime: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

interface StrategyPerformance {
  strategyName: string;
  trades: Trade[];
  metrics: PerformanceMetrics;
  confidence: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' | 'AVOID';
}

interface BacktestResult {
  strategies: StrategyPerformance[];
  overallPerformance: PerformanceMetrics;
  bestStrategy: string;
  recommendations: string[];
  riskAssessment: string;
}

const generateMockTrades = (strategyName: string, count: number): Trade[] => {
  const trades: Trade[] = [];
  const basePrice = 1.0850;
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const entryPrice = basePrice + (Math.random() - 0.5) * 0.01;
    const priceMove = (Math.random() - 0.5) * 0.008;
    const exitPrice = entryPrice + priceMove;
    
    const stopLoss = type === 'BUY' ? entryPrice - 0.003 : entryPrice + 0.003;
    const takeProfit = type === 'BUY' ? entryPrice + 0.006 : entryPrice - 0.006;
    
    const volume = 10000 + Math.random() * 40000;
    
    let pnl: number;
    let result: 'WIN' | 'LOSS' | 'BREAKEVEN';
    
    if (type === 'BUY') {
      pnl = (exitPrice - entryPrice) * volume;
    } else {
      pnl = (entryPrice - exitPrice) * volume;
    }
    
    if (Math.abs(pnl) < volume * 0.0001) {
      result = 'BREAKEVEN';
    } else {
      result = pnl > 0 ? 'WIN' : 'LOSS';
    }
    
    trades.push({
      id: `${strategyName}_${i}`,
      timestamp: new Date(Date.now() - (count - i) * 3600000 * 24),
      type,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      volume,
      pnl,
      duration: 60 + Math.random() * 480, // 1-8 hours
      strategy: strategyName,
      confidence: 60 + Math.random() * 30,
      result
    });
  }
  
  return trades;
};

const calculateMetrics = (trades: Trade[]): PerformanceMetrics => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgWin: 0,
      avgLoss: 0,
      totalPnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgHoldingTime: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0
    };
  }
  
  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = (wins.length / trades.length) * 100;
  
  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
  
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  
  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(t => t.pnl / (t.volume * t.entryPrice));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  // Calculate max drawdown
  let runningPnL = 0;
  let peak = 0;
  let maxDrawdown = 0;
  
  trades.forEach(trade => {
    runningPnL += trade.pnl;
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  // Calculate consecutive wins/losses
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  trades.forEach(trade => {
    if (trade.result === 'WIN') {
      currentWinStreak++;
      currentLossStreak = 0;
      consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
    } else if (trade.result === 'LOSS') {
      currentLossStreak++;
      currentWinStreak = 0;
      consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
    }
  });
  
  const avgHoldingTime = trades.reduce((sum, t) => sum + t.duration, 0) / trades.length;
  const bestTrade = Math.max(...trades.map(t => t.pnl));
  const worstTrade = Math.min(...trades.map(t => t.pnl));
  
  return {
    totalTrades: trades.length,
    winRate,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    avgWin,
    avgLoss,
    totalPnL,
    bestTrade,
    worstTrade,
    avgHoldingTime,
    consecutiveWins,
    consecutiveLosses
  };
};

const evaluateStrategy = (metrics: PerformanceMetrics): { confidence: number; recommendation: any } => {
  let score = 0;
  
  // Win rate scoring
  if (metrics.winRate > 60) score += 25;
  else if (metrics.winRate > 50) score += 15;
  else if (metrics.winRate > 40) score += 5;
  
  // Profit factor scoring
  if (metrics.profitFactor > 2) score += 25;
  else if (metrics.profitFactor > 1.5) score += 15;
  else if (metrics.profitFactor > 1.2) score += 10;
  else if (metrics.profitFactor > 1) score += 5;
  
  // Sharpe ratio scoring
  if (metrics.sharpeRatio > 1.5) score += 20;
  else if (metrics.sharpeRatio > 1) score += 15;
  else if (metrics.sharpeRatio > 0.5) score += 10;
  else if (metrics.sharpeRatio > 0) score += 5;
  
  // Drawdown penalty
  if (metrics.maxDrawdown < 1000) score += 10;
  else if (metrics.maxDrawdown < 2000) score += 5;
  else if (metrics.maxDrawdown > 5000) score -= 10;
  
  const confidence = Math.max(0, Math.min(100, score));
  
  let recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' | 'AVOID';
  
  if (confidence > 80) recommendation = 'STRONG_BUY';
  else if (confidence > 65) recommendation = 'BUY';
  else if (confidence > 45) recommendation = 'NEUTRAL';
  else if (confidence > 25) recommendation = 'SELL';
  else if (confidence > 10) recommendation = 'STRONG_SELL';
  else recommendation = 'AVOID';
  
  return { confidence, recommendation };
};

export const runBacktest = async (apiKey: string): Promise<BacktestResult> => {
  const strategies = [
    'Technical Analysis',
    'News Trading',
    'Pattern Recognition',
    'Sentiment Analysis',
    'Multi-timeframe'
  ];
  
  const strategyPerformances: StrategyPerformance[] = strategies.map(strategyName => {
    const trades = generateMockTrades(strategyName, 30 + Math.floor(Math.random() * 20));
    const metrics = calculateMetrics(trades);
    const { confidence, recommendation } = evaluateStrategy(metrics);
    
    return {
      strategyName,
      trades,
      metrics,
      confidence,
      recommendation
    };
  });
  
  // Calculate overall performance
  const allTrades = strategyPerformances.flatMap(s => s.trades);
  const overallPerformance = calculateMetrics(allTrades);
  
  // Find best strategy
  const bestStrategy = strategyPerformances.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  ).strategyName;
  
  // Generate recommendations
  const recommendations = generateRecommendations(strategyPerformances, overallPerformance);
  const riskAssessment = generateRiskAssessment(overallPerformance);
  
  return {
    strategies: strategyPerformances,
    overallPerformance,
    bestStrategy,
    recommendations,
    riskAssessment
  };
};

const generateRecommendations = (strategies: StrategyPerformance[], overall: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];
  
  // Best performing strategy
  const bestStrategy = strategies.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  recommendations.push(`Best performing strategy: ${bestStrategy.strategyName} (${bestStrategy.confidence.toFixed(0)}% confidence)`);
  
  // Win rate analysis
  if (overall.winRate > 60) {
    recommendations.push(`Excellent win rate of ${overall.winRate.toFixed(1)}% - continue current approach`);
  } else if (overall.winRate < 45) {
    recommendations.push(`Low win rate of ${overall.winRate.toFixed(1)}% - review entry criteria`);
  }
  
  // Risk management
  if (overall.maxDrawdown > overall.totalPnL * 0.3) {
    recommendations.push('High drawdown detected - improve risk management');
  }
  
  // Profit factor
  if (overall.profitFactor < 1.2) {
    recommendations.push('Low profit factor - focus on better risk-reward ratios');
  }
  
  return recommendations;
};

const generateRiskAssessment = (metrics: PerformanceMetrics): string => {
  let assessment = '';
  
  if (metrics.maxDrawdown > 5000) {
    assessment = 'HIGH RISK: Significant drawdown detected. Consider reducing position sizes.';
  } else if (metrics.maxDrawdown > 2000) {
    assessment = 'MEDIUM RISK: Moderate drawdown levels. Monitor risk management closely.';
  } else {
    assessment = 'LOW RISK: Acceptable drawdown levels. Risk management appears effective.';
  }
  
  if (metrics.consecutiveLosses > 5) {
    assessment += ' Warning: Extended losing streaks detected.';
  }
  
  return assessment;
};

export const trackPerformance = (trades: Trade[]): PerformanceMetrics => {
  return calculateMetrics(trades);
};
