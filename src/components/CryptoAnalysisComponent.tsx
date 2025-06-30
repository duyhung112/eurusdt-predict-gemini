import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, AlertTriangle, Brain, Database } from 'lucide-react';
import { fetchBinanceKlines, fetch24hrStats, CryptoPriceData } from '@/utils/binanceAPI';
import { analyzeCryptoTechnicals } from '@/utils/cryptoTechnicalAnalysis';
import { generateCryptoComprehensiveAnalysis, ComprehensiveAnalysis } from '@/utils/comprehensiveAnalysis';
import { createBinanceWebSocketClient } from '@/utils/binanceWebSocket';

export const CryptoAnalysisComponent = () => {
  const [priceData, setPriceData] = useState<CryptoPriceData[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const symbol = 'ARBUSDT';

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching initial data for', symbol);
        
        // Fetch historical data
        const historicalData = await fetchBinanceKlines(symbol, '1h', 100);
        console.log('Historical data loaded:', historicalData.length, 'candles');
        setPriceData(historicalData);
        
        // Fetch current stats
        const stats = await fetch24hrStats(symbol);
        console.log('24hr stats loaded:', stats);
        setCurrentStats(stats);
        setLivePrice(stats.price);
        
        // Perform technical analysis
        if (historicalData.length > 0) {
          const techAnalysis = analyzeCryptoTechnicals(historicalData);
          console.log('Technical analysis completed:', techAnalysis.overallSignal);
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
      console.log('Live price update:', newData.close);
      setPriceData(prev => [...prev.slice(-99), newData]);
      setLivePrice(newData.close);
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

  const handleAIAnalysis = async () => {
    if (!geminiApiKey.trim()) {
      alert('Vui lòng nhập Gemini API key');
      return;
    }

    if (priceData.length < 20) {
      alert('Cần thêm dữ liệu để phân tích AI');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting AI analysis with live Binance data:', priceData.length, 'candles');
      const comprehensiveAnalysis = await generateCryptoComprehensiveAnalysis(priceData, geminiApiKey);
      console.log('AI analysis completed:', comprehensiveAnalysis);
      setAiAnalysis(comprehensiveAnalysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI phân tích thất bại. Kiểm tra API key.');
    } finally {
      setIsAnalyzing(false);
    }
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

  const getSignalIcon = (signal: string) => {
    if (signal.includes('BUY')) return <TrendingUp className="h-4 w-4" />;
    if (signal.includes('SELL')) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-slate-400">Đang tải dữ liệu ARB/USDT từ Binance...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Data Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-400">Dữ liệu thực từ Binance API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Candles: {priceData.length} | Live Price: ${livePrice?.toFixed(4)} | Last Update: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span className="text-white">AI Analysis (Gemini)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="Nhập Gemini API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button 
                onClick={handleAIAnalysis} 
                disabled={isAnalyzing || !geminiApiKey.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}
              </Button>
            </div>
            
            {aiAnalysis && (
              <div className="space-y-4 mt-4 p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getSignalColor(aiAnalysis.overallSignal)} text-white`}>
                      {getSignalIcon(aiAnalysis.overallSignal)}
                      <span className="ml-1">{aiAnalysis.overallSignal}</span>
                    </Badge>
                    {aiAnalysis.liveDataUsed && (
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        <Database className="h-3 w-3 mr-1" />
                        Live Data
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">Tin cậy: {aiAnalysis.confidenceScore}%</div>
                    <div className="text-sm text-slate-300">Độ chính xác: {aiAnalysis.accuracyScore}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Technical Score</div>
                    <div className="text-lg font-bold text-white">{aiAnalysis.technicalScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Sentiment Score</div>
                    <div className="text-lg font-bold text-white">{aiAnalysis.sentimentScore}/100</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-slate-400">Reasoning (từ dữ liệu thực):</div>
                  {aiAnalysis.reasoning.map((reason, i) => (
                    <div key={i} className="text-sm text-slate-300">• {reason}</div>
                  ))}
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <div className="flex items-center text-blue-400 mb-2">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="font-medium">AI Recommendation</span>
                  </div>
                  <div className="text-white text-sm">{aiAnalysis.recommendation}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    Risk: {aiAnalysis.riskLevel} | Strategy: {aiAnalysis.entryStrategy}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  ${(livePrice || currentStats.price).toFixed(4)}
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

      {/* Technical Analysis */}
      {analysis && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="text-white">Technical Analysis (Live Data)</span>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
