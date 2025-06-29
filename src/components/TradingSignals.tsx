
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Circle } from "lucide-react";

interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  price: number;
  timestamp: Date;
  indicator: string;
  description: string;
}

export const TradingSignals = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [activeSignals, setActiveSignals] = useState(0);

  useEffect(() => {
    const generateSignals = () => {
      const newSignals: TradingSignal[] = [
        {
          id: '1',
          type: 'BUY',
          strength: 'STRONG',
          price: 1.0850,
          timestamp: new Date(Date.now() - 5 * 60000),
          indicator: 'RSI Oversold',
          description: 'RSI dropped below 30, potential reversal'
        },
        {
          id: '2',
          type: 'SELL',
          strength: 'MODERATE',
          price: 1.0875,
          timestamp: new Date(Date.now() - 15 * 60000),
          indicator: 'MACD Bearish',
          description: 'MACD line crossed below signal line'
        },
        {
          id: '3',
          type: 'HOLD',
          strength: 'WEAK',
          price: 1.0860,
          timestamp: new Date(Date.now() - 25 * 60000),
          indicator: 'Bollinger Squeeze',
          description: 'Low volatility, waiting for breakout'
        }
      ];
      
      setSignals(newSignals);
      setActiveSignals(newSignals.filter(s => s.type !== 'HOLD').length);
    };

    generateSignals();
    const interval = setInterval(generateSignals, 45000);

    return () => clearInterval(interval);
  }, []);

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'SELL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'text-green-400';
      case 'MODERATE': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Live Signals</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Circle className="h-2 w-2 text-green-400 fill-current animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeSignals} Active
            </Badge>
          </div>
        </div>

        {/* Signals List */}
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${getSignalColor(signal.type)}`}>
                    {getSignalIcon(signal.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">{signal.type}</span>
                      <span className={`text-xs ${getStrengthColor(signal.strength)}`}>
                        {signal.strength}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{signal.indicator}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {signal.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{signal.description}</span>
                <span className="text-sm font-mono text-white">{signal.price.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Signal Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-slate-900/50 to-blue-900/20 rounded-lg border border-blue-500/20">
          <div className="text-xs text-blue-300 mb-1">Signal Summary</div>
          <div className="text-xs text-slate-300">
            Market showing mixed signals with moderate volatility. 
            RSI approaching oversold territory while MACD remains bearish.
          </div>
        </div>
      </div>
    </Card>
  );
};
