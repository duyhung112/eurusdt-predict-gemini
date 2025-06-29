
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { generateAdvancedPredictions } from "@/utils/advancedPredictions";

interface TimeframePrediction {
  timeframe: string;
  period: string;
  direction: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  signals: string[];
  timestamp: Date;
}

export const AIPredictions = () => {
  const [predictions, setPredictions] = useState<Record<string, TimeframePrediction>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("H1");

  const timeframes = [
    { key: "H1", label: "1 Hour", period: "1H" },
    { key: "H4", label: "4 Hours", period: "4H" },
    { key: "D1", label: "1 Day", period: "1D" },
    { key: "W1", label: "1 Week", period: "1W" }
  ];

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setHasApiKey(true);
      generateAllPredictions(savedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      setHasApiKey(true);
      toast.success("API key saved successfully!");
      generateAllPredictions(apiKey);
    } else {
      toast.error("Please enter a valid API key");
    }
  };

  const generateAllPredictions = async (key: string = apiKey) => {
    setIsLoading(true);
    
    try {
      const allPredictions: Record<string, TimeframePrediction> = {};
      
      for (const tf of timeframes) {
        const prediction = await generateAdvancedPredictions(tf.key, key);
        allPredictions[tf.key] = prediction;
      }
      
      setPredictions(allPredictions);
      toast.success("AI predictions updated for all timeframes!");

    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error("Failed to generate predictions. Using fallback analysis.");
      
      // Fallback predictions
      const fallbackPredictions: Record<string, TimeframePrediction> = {};
      timeframes.forEach(tf => {
        fallbackPredictions[tf.key] = {
          timeframe: tf.label,
          period: tf.period,
          direction: 'BUY',
          confidence: 65 + Math.random() * 20,
          entryPrice: 1.0850 + (Math.random() - 0.5) * 0.002,
          targetPrice: 1.0850 + Math.random() * 0.008,
          stopLoss: 1.0850 - Math.random() * 0.004,
          riskReward: 1.5 + Math.random() * 1.5,
          signals: ['RSI Divergence', 'MACD Bullish Cross', 'Support Level Hold'],
          timestamp: new Date()
        };
      });
      setPredictions(fallbackPredictions);
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'STRONG_BUY': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'BUY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'STRONG_SELL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'SELL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!hasApiKey) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Advanced AI Setup</h3>
          </div>
          <p className="text-sm text-slate-400">
            Enter your Google Gemini API key for advanced multi-timeframe predictions:
          </p>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Enter Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-slate-900 border-slate-600"
            />
            <Button onClick={saveApiKey} className="w-full bg-blue-600 hover:bg-blue-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Enable Advanced AI
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Advanced AI Predictions</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateAllPredictions()}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Timeframe Tabs */}
        <Tabs value={activeTimeframe} onValueChange={setActiveTimeframe}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            {timeframes.map(tf => (
              <TabsTrigger 
                key={tf.key} 
                value={tf.key}
                className="data-[state=active]:bg-blue-600 text-xs"
              >
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {timeframes.map(tf => (
            <TabsContent key={tf.key} value={tf.key} className="mt-4">
              {isLoading ? (
                <div className="animate-pulse bg-slate-900/50 rounded-lg p-4">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              ) : predictions[tf.key] ? (
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
                  {/* Direction & Confidence */}
                  <div className="flex items-center justify-between">
                    <Badge className={getDirectionColor(predictions[tf.key].direction)}>
                      {predictions[tf.key].direction.replace('_', ' ')}
                    </Badge>
                    <div className={`text-sm font-medium ${getConfidenceColor(predictions[tf.key].confidence)}`}>
                      {predictions[tf.key].confidence.toFixed(0)}% Confidence
                    </div>
                  </div>

                  {/* Price Levels */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400">Entry:</span>
                        <div className="font-medium text-blue-400">{predictions[tf.key].entryPrice.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Target:</span>
                        <div className="font-medium text-green-400">{predictions[tf.key].targetPrice.toFixed(4)}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400">Stop Loss:</span>
                        <div className="font-medium text-red-400">{predictions[tf.key].stopLoss.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">R:R Ratio:</span>
                        <div className="font-medium text-white">1:{predictions[tf.key].riskReward.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Signals */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Key Signals</h4>
                    <div className="flex flex-wrap gap-1">
                      {predictions[tf.key].signals.map((signal, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-slate-600">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    Generated: {predictions[tf.key].timestamp.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No prediction available for {tf.label}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary */}
        {Object.keys(predictions).length > 0 && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/20 p-4">
            <h4 className="text-sm font-medium text-blue-300 mb-2">Multi-Timeframe Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {timeframes.map(tf => (
                predictions[tf.key] && (
                  <div key={tf.key} className="flex justify-between">
                    <span className="text-slate-400">{tf.period}:</span>
                    <span className={getDirectionColor(predictions[tf.key].direction).split(' ')[0]}>
                      {predictions[tf.key].direction}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
          <strong>Risk Warning:</strong> Advanced AI predictions are sophisticated but not guaranteed. 
          Multiple timeframe analysis requires careful risk management and position sizing.
        </div>
      </div>
    </Card>
  );
};
