
import { useState } from "react";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { AIAnalysis } from "@/components/AIAnalysis";
import { AIPredictions } from "@/components/AIPredictions";
import { TradingSignals } from "@/components/TradingSignals";
import { NewsAnalysis } from "@/components/NewsAnalysis";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Brain, Target, BarChart3, Newspaper } from "lucide-react";

const Index = () => {
  const [marketData, setMarketData] = useState({
    price: 1.0850,
    change24h: 0.0023,
    volume: 1250000,
    high24h: 1.0875,
    low24h: 1.0820
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Trading Hub</h1>
                <p className="text-sm text-blue-300">Forex Analysis & Predictions</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {marketData.price.toFixed(4)}
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
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">EURUSD Chart</h2>
                </div>
                <div className="flex space-x-2 text-sm text-slate-400">
                  <span>H: {marketData.high24h}</span>
                  <span>L: {marketData.low24h}</span>
                  <span>Vol: {(marketData.volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <TradingViewWidget />
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <TradingSignals />
            
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
                <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="predictions" className="data-[state=active]:bg-blue-600">
                  <Target className="h-4 w-4 mr-2" />
                  Predictions
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-blue-600">
                  <Newspaper className="h-4 w-4 mr-2" />
                  News
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="mt-4">
                <AIAnalysis />
              </TabsContent>
              
              <TabsContent value="predictions" className="mt-4">
                <AIPredictions />
              </TabsContent>
              
              <TabsContent value="news" className="mt-4">
                <NewsAnalysis />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
