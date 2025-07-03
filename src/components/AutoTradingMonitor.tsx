import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Brain, TrendingUp, TrendingDown, Zap, Clock, AlertTriangle, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBinanceKlines } from '@/utils/binanceAPI';
import { generateRealTimeAISignal, generateTradeRecommendation, AITradingSignal, TradeRecommendation } from '@/utils/realTimeAIAnalysis';

interface AutoTradingMonitorProps {
  apiKey: string;
  isEnabled?: boolean;
}

interface SignalHistory {
  signal: AITradingSignal;
  recommendation: TradeRecommendation;
  timestamp: Date;
}

export const AutoTradingMonitor = ({ apiKey, isEnabled = false }: AutoTradingMonitorProps) => {
  const [isActive, setIsActive] = useState(isEnabled);
  const [currentSignal, setCurrentSignal] = useState<AITradingSignal | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<TradeRecommendation | null>(null);
  const [signalHistory, setSignalHistory] = useState<SignalHistory[]>([]);
  const [nextUpdateIn, setNextUpdateIn] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const ANALYSIS_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const COUNTDOWN_INTERVAL = 1000; // 1 second

  useEffect(() => {
    if (isActive && apiKey) {
      startAutoAnalysis();
    } else {
      stopAutoAnalysis();
    }

    return () => {
      stopAutoAnalysis();
    };
  }, [isActive, apiKey]);

  const startAutoAnalysis = () => {
    console.log('🚀 Starting auto AI analysis...');
    
    // Run initial analysis
    runAnalysis();
    
    // Set up interval for recurring analysis
    intervalRef.current = setInterval(() => {
      runAnalysis();
    }, ANALYSIS_INTERVAL);

    // Start countdown
    startCountdown();
    
    toast.success('🚀 Auto AI Trading Monitor đã bắt đầu - phân tích mỗi 5 phút');
  };

  const stopAutoAnalysis = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    setNextUpdateIn(0);
    console.log('🛑 Auto analysis stopped');
  };

  const startCountdown = () => {
    setNextUpdateIn(ANALYSIS_INTERVAL / 1000);
    
    countdownRef.current = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1) {
          return ANALYSIS_INTERVAL / 1000; // Reset countdown
        }
        return prev - 1;
      });
    }, COUNTDOWN_INTERVAL);
  };

  const runAnalysis = async () => {
    if (!apiKey || apiKey.length < 10) {
      toast.error('Cần API key hợp lệ để chạy auto analysis');
      setIsActive(false);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisCount(prev => prev + 1);

    try {
      console.log(`🤖 Running auto analysis #${analysisCount + 1}...`);
      
      // Fetch fresh market data
      const priceData = await fetchBinanceKlines('ARBUSDT', '15m', 100);
      console.log('Fetched market data:', priceData.length, 'candles');
      
      // Generate AI signal
      const aiSignal = await generateRealTimeAISignal(priceData, apiKey);
      setCurrentSignal(aiSignal);
      
      // Generate recommendation
      const recommendation = generateTradeRecommendation(aiSignal);
      setCurrentRecommendation(recommendation);
      
      // Add to history
      const historyEntry: SignalHistory = {
        signal: aiSignal,
        recommendation,
        timestamp: new Date()
      };
      
      setSignalHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      
      // Notify if strong signal
      if (aiSignal.signal.includes('STRONG') && aiSignal.confidence > 80) {
        toast.success(`🚨 STRONG SIGNAL: ${aiSignal.signal} - Tin cậy ${aiSignal.confidence.toFixed(0)}%`, {
          duration: 10000
        });
      } else if (recommendation.shouldTrade && recommendation.urgency === 'HIGH') {
        toast.info(`⚡ HIGH URGENCY: ${recommendation.action} - ${recommendation.explanation}`, {
          duration: 8000
        });
      }
      
      console.log(`✅ Auto analysis #${analysisCount + 1} completed:`, aiSignal.signal);
      
    } catch (error) {
      console.error('Auto analysis failed:', error);
      toast.error(`❌ Auto analysis thất bại: ${error.message}`);
      
      // Don't stop on single failure, but log it
      const errorEntry: SignalHistory = {
        signal: {
          signal: 'NEUTRAL',
          confidence: 0,
          accuracy: 0,
          entryPrice: 0,
          stopLoss: 0,
          takeProfit: 0,
          riskReward: 0,
          positionSize: 0,
          reasoning: [`Lỗi phân tích: ${error.message}`],
          technicalAnalysis: {} as any,
          marketConditions: {} as any,
          timestamp: new Date(),
          validUntil: new Date(),
          liveDataSource: false
        },
        recommendation: {
          shouldTrade: false,
          action: 'WAIT',
          urgency: 'LOW',
          timeframe: '',
          explanation: `Lỗi: ${error.message}`,
          riskLevel: 'EXTREME',
          maxLoss: 0,
          expectedGain: 0
        },
        timestamp: new Date()
      };
      
      setSignalHistory(prev => [errorEntry, ...prev.slice(0, 9)]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAutoAnalysis = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'bg-green-600';
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      case 'STRONG_SELL': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>Auto AI Trading Monitor</span>
            {isActive && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">ACTIVE</span>
              </div>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Auto</span>
              <Switch
                checked={isActive}
                onCheckedChange={toggleAutoAnalysis}
                disabled={!apiKey || apiKey.length < 10}
              />
            </div>
            
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="border-slate-600 hover:bg-slate-700"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Countdown */}
        {isActive && (
          <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300 text-sm">Next Analysis In:</span>
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  {formatTime(nextUpdateIn)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Zap className="h-3 w-3" />
                <span>Analysis #{analysisCount}</span>
              </div>
            </div>
            
            <Progress 
              value={((ANALYSIS_INTERVAL / 1000) - nextUpdateIn) / (ANALYSIS_INTERVAL / 1000) * 100} 
              className="h-2"
            />
            
            {isAnalyzing && (
              <div className="flex items-center space-x-2 mt-2 text-xs text-yellow-400">
                <Brain className="h-3 w-3 animate-pulse" />
                <span>AI đang phân tích dữ liệu Binance...</span>
              </div>
            )}
          </div>
        )}

        {/* Current Signal */}
        {currentSignal && currentRecommendation && (
          <div className="space-y-3 p-4 bg-slate-900/30 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">Latest Signal:</span>
                <Badge className={`${getSignalColor(currentSignal.signal)} text-white text-xs`}>
                  {currentSignal.signal}
                </Badge>
                <Badge variant="outline" className={`text-xs ${
                  currentRecommendation.shouldTrade ? 'border-green-400 text-green-400' : 'border-red-400 text-red-400'
                }`}>
                  {currentRecommendation.shouldTrade ? '✅ TRADE' : '❌ NO TRADE'}
                </Badge>
              </div>
              
              <div className="text-xs text-slate-400">
                {currentSignal.timestamp.toLocaleTimeString('vi-VN')}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-slate-400 text-xs">Confidence</div>
                <div className="text-white font-semibold">{currentSignal.confidence.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Accuracy</div>
                <div className="text-white font-semibold">{currentSignal.accuracy.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">R:R</div>
                <div className="text-white font-semibold">{currentSignal.riskReward}:1</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Risk</div>
                <div className="text-white font-semibold">{currentRecommendation.riskLevel}</div>
              </div>
            </div>

            <div className="text-xs text-slate-300">
              {currentRecommendation.explanation}
            </div>
          </div>
        )}

        {/* Signal History */}
        {signalHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-slate-400 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Signal History</span>
            </div>
            
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {signalHistory.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-800/30 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getSignalColor(entry.signal.signal)} text-white text-xs`}>
                      {entry.signal.signal}
                    </Badge>
                    <span className="text-slate-400">
                      {entry.signal.confidence.toFixed(0)}% conf
                    </span>
                    {entry.recommendation.shouldTrade && (
                      <span className="text-green-400">✓ Trade</span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    {entry.timestamp.toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning when inactive */}
        {!isActive && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Auto monitoring is disabled. Enable to start real-time AI analysis.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};