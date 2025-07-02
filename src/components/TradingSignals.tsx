
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Activity, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchBinanceKlines, fetch24hrStats } from "@/utils/binanceAPI";
import { analyzeCryptoTechnicals } from "@/utils/cryptoTechnicalAnalysis";
import { validateGeminiApiKey } from "@/utils/apiKeyValidator";

interface LiveSignal {
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  confidence: number;
  timeframe: string;
  reason: string;
  price: number;
  timestamp: Date;
}

export const TradingSignals = () => {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked');
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
    loadLiveSignals();
  }, []);

  const validateApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast.error("Vui lòng nhập API key");
      return;
    }

    setIsValidatingKey(true);
    try {
      const validation = await validateGeminiApiKey(geminiApiKey);
      
      if (validation.isValid) {
        setApiKeyStatus('valid');
        localStorage.setItem('gemini_api_key', geminiApiKey);
        toast.success("✅ " + validation.message);
      } else {
        setApiKeyStatus('invalid');
        toast.error("❌ " + validation.message);
      }
    } catch (error) {
      setApiKeyStatus('invalid');
      toast.error("Lỗi kiểm tra API key");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const loadLiveSignals = async () => {
    setIsLoading(true);
    try {
      console.log('Loading live signals from Binance data...');
      
      // Fetch real market data
      const [priceData, marketStats] = await Promise.all([
        fetchBinanceKlines('ARBUSDT', '15m', 50),
        fetch24hrStats('ARBUSDT')
      ]);

      console.log('Real market data loaded:', priceData.length, 'candles');

      // Analyze with real data
      const technicalAnalysis = analyzeCryptoTechnicals(priceData);
      
      // Generate live signals from real data
      const liveSignals: LiveSignal[] = [
        {
          type: technicalAnalysis.overallSignal.includes('BUY') ? 'BUY' : 
                technicalAnalysis.overallSignal.includes('SELL') ? 'SELL' : 'NEUTRAL',
          strength: technicalAnalysis.overallSignal.includes('STRONG') ? 'STRONG' : 
                   technicalAnalysis.confidence > 70 ? 'MODERATE' : 'WEAK',
          confidence: Math.round(technicalAnalysis.confidence),
          timeframe: '15m',
          reason: `Phân tích kỹ thuật từ ${priceData.length} nến thực`,
          price: marketStats.price,
          timestamp: new Date()
        }
      ];

      // Add volume signal if significant
      const volumeIndicator = technicalAnalysis.indicators.find(i => i.name === 'Volume');
      if (volumeIndicator && volumeIndicator.signal !== 'NEUTRAL') {
        liveSignals.push({
          type: volumeIndicator.signal === 'BUY' ? 'BUY' : 'SELL',
          strength: 'MODERATE',
          confidence: 75,
          timeframe: '1h',
          reason: `Volume ${volumeIndicator.signal === 'BUY' ? 'tăng' : 'giảm'} bất thường`,
          price: marketStats.price,
          timestamp: new Date()
        });
      }

      // Add momentum signal
      const rsi = technicalAnalysis.indicators.find(i => i.name === 'RSI');
      if (rsi && rsi.signal !== 'NEUTRAL') {
        liveSignals.push({
          type: rsi.signal === 'BUY' ? 'BUY' : 'SELL',
          strength: 'WEAK',
          confidence: 60,
          timeframe: '4h',
          reason: `RSI ${rsi.value.toFixed(1)} - ${rsi.signal === 'BUY' ? 'Oversold' : 'Overbought'}`,
          price: marketStats.price,
          timestamp: new Date()
        });
      }

      setSignals(liveSignals);
      setLastUpdate(new Date());
      console.log('Live signals generated from real data:', liveSignals.length);
      
    } catch (error) {
      console.error('Error loading live signals:', error);
      toast.error("Không thể tải tín hiệu thực");
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalColor = (type: string, strength: string) => {
    if (type === 'BUY') {
      return strength === 'STRONG' ? 'bg-green-600' : 'bg-green-500';
    }
    if (type === 'SELL') {
      return strength === 'STRONG' ? 'bg-red-600' : 'bg-red-500';
    }
    return 'bg-gray-500';
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="h-3 w-3" />;
      case 'SELL': return <TrendingDown className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-400" />
            <span>Live Signals (Real Data)</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLiveSignals}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* API Key Validation */}
        <div className="space-y-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2">
            <Input
              type="password"
              placeholder="Nhập Gemini API Key để AI phân tích"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-sm"
            />
            <Button 
              onClick={validateApiKey}
              disabled={isValidatingKey || !geminiApiKey.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isValidatingKey ? 'Kiểm tra...' : 'Validate'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {apiKeyStatus === 'valid' && (
              <div className="flex items-center text-green-400 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                API key hợp lệ
              </div>
            )}
            {apiKeyStatus === 'invalid' && (
              <div className="flex items-center text-red-400 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                API key không hợp lệ
              </div>
            )}
            {apiKeyStatus === 'unchecked' && (
              <div className="text-slate-400 text-xs">
                🔒 Chưa kiểm tra API key
              </div>
            )}
          </div>
        </div>

        {/* Live Signals */}
        <div className="space-y-2">
          {signals.length > 0 ? (
            signals.map((signal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getSignalColor(signal.type, signal.strength)} text-white text-xs`}>
                    {getSignalIcon(signal.type)}
                    <span className="ml-1">{signal.strength} {signal.type}</span>
                  </Badge>
                  <div>
                    <div className="text-sm font-medium text-white">{signal.timeframe}</div>
                    <div className="text-xs text-slate-400">{signal.reason}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{signal.confidence}%</div>
                  <div className="text-xs text-slate-400">${signal.price.toFixed(4)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-4">
              {isLoading ? 'Đang tải tín hiệu thực...' : 'Không có tín hiệu'}
            </div>
          )}
        </div>

        {/* Data Source Info */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-2 rounded">
          <div className="flex items-center justify-between">
            <span>📡 Dữ liệu: Live Binance API</span>
            <span>🕒 {lastUpdate.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
