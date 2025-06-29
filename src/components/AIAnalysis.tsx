
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart } from "lucide-react";
import { calculateTechnicalIndicators } from "@/utils/technicalIndicators";

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  icon: any;
}

export const AIAnalysis = () => {
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      
      // Simulate API call to get market data and calculate indicators
      setTimeout(() => {
        const technicalData = calculateTechnicalIndicators();
        setIndicators(technicalData.indicators);
        setOverallScore(technicalData.overallScore);
        setIsLoading(false);
      }, 2000);
    };

    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getOverallSignal = () => {
    if (overallScore >= 70) return { text: 'STRONG BUY', color: 'text-green-400' };
    if (overallScore >= 60) return { text: 'BUY', color: 'text-green-300' };
    if (overallScore <= 30) return { text: 'STRONG SELL', color: 'text-red-400' };
    if (overallScore <= 40) return { text: 'SELL', color: 'text-red-300' };
    return { text: 'NEUTRAL', color: 'text-yellow-400' };
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      </Card>
    );
  }

  const overallSignal = getOverallSignal();

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold text-white">AI Analysis Score</h3>
          <div className="relative">
            <div className="text-4xl font-bold text-white">{overallScore}</div>
            <Badge className={`${overallSignal.color} bg-opacity-20 mt-2`}>
              {overallSignal.text}
            </Badge>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Technical Indicators */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-slate-300">Technical Indicators</h4>
          <div className="space-y-3">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <indicator.icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{indicator.name}</div>
                    <div className="text-xs text-slate-400">{indicator.value.toFixed(4)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSignalColor(indicator.signal)}`}
                      style={{ width: `${indicator.strength}%` }}
                    />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getSignalColor(indicator.signal)} border-current`}
                  >
                    {indicator.signal}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-300 mb-2">AI Insights</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Based on current technical analysis, the model suggests {overallSignal.text.toLowerCase()} momentum. 
            RSI indicates {indicators[0]?.signal.toLowerCase()} conditions while MACD shows convergence patterns. 
            Monitor for breakout signals above key resistance levels.
          </p>
        </div>
      </div>
    </Card>
  );
};
