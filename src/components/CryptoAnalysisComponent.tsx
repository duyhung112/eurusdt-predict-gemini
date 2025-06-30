
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { fetchBinanceKlines, fetch24hrStats, CryptoPriceData } from '@/utils/binanceAPI';
import { analyzeCryptoTechnicals } from '@/utils/cryptoTechnicalAnalysis';
import { createBinanceWebSocketClient } from '@/utils/binanceWebSocket';

export const CryptoAnalysisComponent = () => {
  const [priceData, setPriceData] = useState<CryptoPriceData[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const symbol = 'ARBUSDT';

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch historical data
        const historicalData = await fetchBinanceKlines(symbol, '1h', 100);
        setPriceData(historicalData);
        
        // Fetch current stats
        const stats = await fetch24hrStats(symbol);
        setCurrentStats(stats);
        
        // Perform analysis
        if (historicalData.length > 0) {
          const techAnalysis = analyzeCryptoTechnicals(historicalData);
          setAnalysis(techAnalysis);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing crypto data:', error);
        setIsLoading(false);
      }
    };

    initializeData();

    // Setup WebSocket for live updates
    const wsClient = createBinanceWebSocketClient(symbol, '1m', (newData) => {
      setPriceData(prev => [...prev.slice(-99), newData]);
      setLastUpdate(new Date());
    });

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Re-analyze when price data updates
  useEffect(() => {
    if (priceData.length > 20) {
      const techAnalysis = analyzeCryptoTechnicals(priceData);
      setAnalysis(techAnalysis);
    }
  }, [priceData]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'bg-green-600';
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      case 'STRONG_SELL': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getSignalIcon = (signal: string) => {
    if (signal.includes('BUY')) return <TrendingUp className="h-4 w-4" />;
    if (signal.includes('SELL')) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-slate-400">Đang tải dữ liệu ARB/USDT...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">ARB/USDT Live Analysis</CardTitle>
            <Badge variant="outline" className="text-xs">
              Cập nhật: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentStats && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  ${currentStats.price.toFixed(4)}
                </div>
                <div className={`text-sm flex items-center ${
                  currentStats.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentStats.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {(currentStats.change24h * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-right text-sm text-slate-400">
                <div>24h High: ${currentStats.high24h.toFixed(4)}</div>
                <div>24h Low: ${currentStats.low24h.toFixed(4)}</div>
                <div>Volume: {(currentStats.volume / 1000000).toFixed(1)}M</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {analysis && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="text-white">AI Technical Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overall Signal */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Tín hiệu tổng thể:</span>
                <Badge className={`${getSignalColor(analysis.overallSignal)} text-white`}>
                  {getSignalIcon(analysis.overallSignal)}
                  <span className="ml-1">{analysis.overallSignal}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Độ tin cậy:</span>
                <span className="text-white font-semibold">{analysis.confidence.toFixed(0)}%</span>
              </div>
            </div>

            {/* Indicators */}
            <div className="space-y-3 mb-6">
              {analysis.indicators.map((indicator: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{indicator.name}</div>
                    <div className="text-xs text-slate-400">{indicator.description}</div>
                  </div>
                  <Badge className={`${getSignalColor(indicator.signal)} text-white text-xs`}>
                    {indicator.signal}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Price Targets */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <div className="flex items-center text-green-400 mb-1">
                  <Target className="h-4 w-4 mr-1" />
                  <span className="text-sm">Mục tiêu tăng</span>
                </div>
                <div className="text-white font-bold">
                  ${analysis.priceTarget.bullish.toFixed(4)}
                </div>
              </div>
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                <div className="flex items-center text-red-400 mb-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Mục tiêu giảm</span>
                </div>
                <div className="text-white font-bold">
                  ${analysis.priceTarget.bearish.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Support/Resistance */}
            {(analysis.supportResistance.support.length > 0 || analysis.supportResistance.resistance.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-2">Support Levels</div>
                  {analysis.supportResistance.support.map((level: number, i: number) => (
                    <div key={i} className="text-green-400 text-sm">
                      ${level.toFixed(4)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-2">Resistance Levels</div>
                  {analysis.supportResistance.resistance.map((level: number, i: number) => (
                    <div key={i} className="text-red-400 text-sm">
                      ${level.toFixed(4)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Recommendation */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <div className="flex items-center text-blue-400 mb-2">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="font-medium">Khuyến nghị giao dịch</span>
              </div>
              <div className="text-white">
                {analysis.overallSignal === 'STRONG_BUY' && analysis.confidence > 75 
                  ? `Khuyến nghị MUA mạnh với độ tin cậy ${analysis.confidence.toFixed(0)}%. Đặt stop loss dưới ${analysis.supportResistance.support[0]?.toFixed(4) || 'support gần nhất'}.`
                  : analysis.overallSignal === 'BUY' && analysis.confidence > 65
                  ? `Khuyến nghị MUA với độ tin cậy ${analysis.confidence.toFixed(0)}%. Quản lý rủi ro cẩn thận.`
                  : analysis.overallSignal === 'STRONG_SELL' && analysis.confidence > 75
                  ? `Khuyến nghị BÁN mạnh với độ tin cậy ${analysis.confidence.toFixed(0)}%. Đặt stop loss trên ${analysis.supportResistance.resistance[0]?.toFixed(4) || 'resistance gần nhất'}.`
                  : analysis.overallSignal === 'SELL' && analysis.confidence > 65
                  ? `Khuyến nghị BÁN với độ tin cậy ${analysis.confidence.toFixed(0)}%. Quản lý rủi ro cẩn thận.`
                  : `Tín hiệu TRUNG TÍNH. Chờ đợi tín hiệu rõ ràng hơn trước khi vào lệnh. Độ tin cậy hiện tại: ${analysis.confidence.toFixed(0)}%.`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
