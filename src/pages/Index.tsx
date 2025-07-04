
import { useState, useEffect } from "react";
import { CryptoTradingViewWidget } from "@/components/CryptoTradingViewWidget";
import { CryptoAnalysisComponent } from "@/components/CryptoAnalysisComponent";
import { AIAnalysis } from "@/components/AIAnalysis";
import { AIPredictions } from "@/components/AIPredictions";
import { TradingSignals } from "@/components/TradingSignals";
import { AutoTradingMonitor } from "@/components/AutoTradingMonitor";
import { NewsAnalysis } from "@/components/NewsAnalysis";
import { ComprehensiveAnalysisComponent } from "@/components/ComprehensiveAnalysis";
import { MasterAnalysisComponent } from "@/components/MasterAnalysisComponent";
import { CoinTimeframeSelector, SUPPORTED_COINS, TIMEFRAMES } from "@/components/CoinTimeframeSelector";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Brain, Target, BarChart3, Newspaper, Zap, Crown, Bitcoin } from "lucide-react";
import { fetch24hrStats } from "@/utils/binanceAPI";

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('ARBUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [marketData, setMarketData] = useState({
    price: 0.8234,
    change24h: 0.0156,
    volume: 45230000,
    high24h: 0.8456,
    low24h: 0.8123
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const stats = await fetch24hrStats(selectedSymbol);
        setMarketData({
          price: stats.price,
          change24h: stats.change24h,
          volume: stats.volume,
          high24h: stats.high24h,
          low24h: stats.low24h
        });
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    // Load saved API key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }

    fetchMarketData();
    
    // Update every 10 seconds for more real-time feel
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-2 rounded-lg">
                <Bitcoin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Crypto Hub</h1>
                <p className="text-sm text-purple-300">{selectedSymbol} Analysis System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  ${marketData.price.toFixed(4)}
                </div>
                <div className={`text-sm flex items-center ${
                  marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {marketData.change24h >= 0 ? '+' : ''}{(marketData.change24h * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="xl:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">{selectedSymbol} Live Chart</h2>
                </div>
                <div className="flex space-x-2 text-sm text-slate-400">
                  <span>H: ${marketData.high24h.toFixed(4)}</span>
                  <span>L: ${marketData.low24h.toFixed(4)}</span>
                  <span>Vol: {(marketData.volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <CryptoTradingViewWidget 
                symbol={`BINANCE:${selectedSymbol}`}
                interval={TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.interval || '15'}
              />
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <CoinTimeframeSelector
              selectedSymbol={selectedSymbol}
              selectedTimeframe={selectedTimeframe}
              onSymbolChange={setSelectedSymbol}
              onTimeframeChange={setSelectedTimeframe}
            />
            
            <TradingSignals 
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
            />
            
            {geminiApiKey && (
              <AutoTradingMonitor 
                apiKey={geminiApiKey} 
                isEnabled={false}
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
              />
            )}
            
            <Tabs defaultValue="crypto" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
                <TabsTrigger value="crypto" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600">
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Crypto AI
                </TabsTrigger>
                <TabsTrigger value="master" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600">
                  <Crown className="h-4 w-4 mr-2" />
                  Master
                </TabsTrigger>
                <TabsTrigger value="comprehensive" className="data-[state=active]:bg-purple-600">
                  <Zap className="h-4 w-4 mr-2" />
                  Tổng Hợp
                </TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600">
                  <Brain className="h-4 w-4 mr-2" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="predictions" className="data-[state=active]:bg-blue-600">
                  <Target className="h-4 w-4 mr-2" />
                  Predictions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="crypto" className="mt-4">
                <CryptoAnalysisComponent 
                  selectedSymbol={selectedSymbol}
                  selectedTimeframe={selectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="master" className="mt-4">
                <MasterAnalysisComponent 
                  selectedSymbol={selectedSymbol}
                  selectedTimeframe={selectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="comprehensive" className="mt-4">
                <ComprehensiveAnalysisComponent 
                  selectedSymbol={selectedSymbol}
                  selectedTimeframe={selectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-4">
                <AIAnalysis 
                  selectedSymbol={selectedSymbol}
                  selectedTimeframe={selectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="predictions" className="mt-4">
                <AIPredictions 
                  selectedSymbol={selectedSymbol}
                  selectedTimeframe={selectedTimeframe}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
