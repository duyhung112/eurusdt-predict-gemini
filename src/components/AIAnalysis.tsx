
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchBinanceKlines, fetch24hrStats } from "@/utils/binanceAPI";
import { validateGeminiApiKey } from "@/utils/apiKeyValidator";

interface AIAnalysisResult {
  overallScore: number;
  technicalScore: number;
  sentimentScore: number;
  volumeScore: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  summary: string;
  recommendations: string[];
  riskAnalysis: string;
  keyLevels: {
    support: number;
    resistance: number;
  };
  timestamp: Date;
  dataSource: 'REAL' | 'SIMULATED';
}

export const AIAnalysis = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked');
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
      setApiKeyStatus('valid');
    }
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

  const runAnalysis = async () => {
    if (!geminiApiKey.trim()) {
      toast.error("Vui lòng nhập và validate API key trước");
      return;
    }

    if (apiKeyStatus !== 'valid') {
      toast.error("API key chưa được validate hoặc không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Running AI Analysis with real Binance data...');

      // Fetch real market data
      const [priceData, marketStats] = await Promise.all([
        fetchBinanceKlines('ARBUSDT', '1h', 100), 
        fetch24hrStats('ARBUSDT')
      ]);

      console.log('Real market data for AI analysis:', priceData.length, 'candles');

      // Prepare comprehensive data for AI
      const recentCandles = priceData.slice(-50);
      const volumes = recentCandles.map(d => d.volume);
      const closes = recentCandles.map(d => d.close);
      const highs = recentCandles.map(d => d.high);
      const lows = recentCandles.map(d => d.low);

      // Calculate technical indicators
      const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20;
      const sma50 = closes.slice(-50).reduce((a, b) => a + b) / 50;
      const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
      const currentVolume = volumes[volumes.length - 1];
      const priceChange24h = ((marketStats.price - closes[closes.length - 24]) / closes[closes.length - 24]) * 100;

      // Calculate RSI
      const rsiPeriod = 14;
      const gains = [];
      const losses = [];
      for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i-1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
      const avgGain = gains.slice(-rsiPeriod).reduce((a, b) => a + b) / rsiPeriod;
      const avgLoss = losses.slice(-rsiPeriod).reduce((a, b) => a + b) / rsiPeriod;
      const rsi = 100 - (100 / (1 + (avgGain / avgLoss)));

      // AI analysis prompt
      const prompt = `Phân tích chuyên sâu ARBUSDT từ dữ liệu thực Binance:

MARKET DATA:
- Current Price: $${marketStats.price.toFixed(4)}
- 24h Change: ${priceChange24h.toFixed(2)}%  
- 24h High/Low: $${marketStats.high24h.toFixed(4)} / $${marketStats.low24h.toFixed(4)}
- Current Volume: ${(currentVolume/1000000).toFixed(2)}M vs Avg: ${(avgVolume/1000000).toFixed(2)}M

TECHNICAL INDICATORS:
- SMA20: $${sma20.toFixed(4)} | SMA50: $${sma50.toFixed(4)}
- RSI: ${rsi.toFixed(1)}
- Price vs SMA20: ${((marketStats.price - sma20)/sma20 * 100).toFixed(2)}%
- Volume Ratio: ${(currentVolume/avgVolume).toFixed(2)}x

Hãy đưa ra phân tích chấm điểm từ 0-100:
1. Technical Score (0-100)
2. Sentiment Score (0-100) 
3. Volume Score (0-100)
4. Overall Score (0-100)
5. Signal (STRONG_BUY/BUY/NEUTRAL/SELL/STRONG_SELL)
6. Confidence (0-100)
7. Summary (2-3 câu)
8. 3 recommendations
9. Risk analysis
10. Support/Resistance levels

Format JSON:
{
  "technicalScore": 75,
  "sentimentScore": 68,
  "volumeScore": 82,
  "overallScore": 75,
  "signal": "BUY",
  "confidence": 78,
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "riskAnalysis": "...",
  "support": 0.8123,
  "resistance": 0.8456
}`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.2, 
            maxOutputTokens: 1000 
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('AI analysis response:', aiResponse);

      // Parse AI response
      let aiAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response, using technical fallback');
        
        // Technical fallback analysis
        const technicalScore = Math.min(100, Math.max(0, 
          (marketStats.price > sma20 ? 20 : 0) +
          (marketStats.price > sma50 ? 20 : 0) +
          (rsi < 70 && rsi > 30 ? 20 : 0) +
          (currentVolume > avgVolume ? 20 : 0) +
          (priceChange24h > 0 ? 20 : 0)
        ));

        aiAnalysis = {
          technicalScore,
          sentimentScore: priceChange24h > 0 ? 70 : 30,
          volumeScore: Math.min(100, (currentVolume / avgVolume) * 50),
          overallScore: technicalScore,
          signal: technicalScore > 70 ? 'BUY' : technicalScore < 30 ? 'SELL' : 'NEUTRAL',
          confidence: 65,
          summary: `Phân tích kỹ thuật từ ${priceData.length} nến thực. Giá ${marketStats.price > sma20 ? 'trên' : 'dưới'} SMA20.`,
          recommendations: [
            'Theo dõi volume để xác nhận xu hướng',
            'Đặt stop loss dưới support gần nhất', 
            'Chờ xác nhận từ price action'
          ],
          riskAnalysis: `Volatility 24h: ${Math.abs(priceChange24h).toFixed(2)}%. ${Math.abs(priceChange24h) > 5 ? 'Rủi ro cao' : 'Rủi ro trung bình'}.`,
          support: Math.min(...lows.slice(-20)),
          resistance: Math.max(...highs.slice(-20))
        };
      }

      setAnalysis({
        overallScore: aiAnalysis.overallScore,
        technicalScore: aiAnalysis.technicalScore,
        sentimentScore: aiAnalysis.sentimentScore,
        volumeScore: aiAnalysis.volumeScore,
        signal: aiAnalysis.signal,
        confidence: aiAnalysis.confidence,
        summary: aiAnalysis.summary,
        recommendations: aiAnalysis.recommendations,
        riskAnalysis: aiAnalysis.riskAnalysis,
        keyLevels: {
          support: aiAnalysis.support,
          resistance: aiAnalysis.resistance
        },
        timestamp: new Date(),
        dataSource: 'REAL'
      });

      toast.success("✅ AI Analysis hoàn tất với dữ liệu thực!");
      console.log('AI analysis completed with real data');

    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast.error("Lỗi phân tích AI. Kiểm tra API key.");
    } finally {
      setIsLoading(false);
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
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>AI Analysis Score (Real Data)</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={isLoading || apiKeyStatus !== 'valid'}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API Key Section */}
        <div className="space-y-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2">
            <Input
              type="password"
              placeholder="Nhập Gemini API Key"
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
                API key hợp lệ - Sẵn sàng phân tích
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
                Vui lòng validate API key để sử dụng AI analysis
              </div>
            )}
          </div>
        </div>

        {analysis && (
          <div className="space-y-4">
            {/* Overall Score & Signal */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}
                  </div>
                  <div className="text-sm text-slate-400">Overall Score</div>
                </div>
                <div className="text-center">
                  <Badge className={`${getSignalColor(analysis.signal)} text-white`}>
                    {getSignalIcon(analysis.signal)}
                    <span className="ml-1">{analysis.signal}</span>
                  </Badge>
                  <div className="text-sm text-slate-400 mt-1">{analysis.confidence}% confident</div>
                </div>
              </div>
              <Progress value={analysis.overallScore} className="h-3" />
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/30 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.technicalScore)}`}>
                  {analysis.technicalScore}
                </div>
                <div className="text-xs text-slate-400">Technical</div>
                <Progress value={analysis.technicalScore} className="h-1 mt-1" />
              </div>
              <div className="bg-slate-900/30 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.sentimentScore)}`}>
                  {analysis.sentimentScore}
                </div>
                <div className="text-xs text-slate-400">Sentiment</div>
                <Progress value={analysis.sentimentScore} className="h-1 mt-1" />
              </div>
              <div className="bg-slate-900/30 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.volumeScore)}`}>
                  {analysis.volumeScore}
                </div>
                <div className="text-xs text-slate-400">Volume</div>
                <Progress value={analysis.volumeScore} className="h-1 mt-1" />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-900/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-2">📊 AI Analysis Summary</h4>
              <p className="text-sm text-slate-300">{analysis.summary}</p>
            </div>

            {/* Key Levels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                <div className="text-green-400 text-xs mb-1">Support</div>
                <div className="text-white font-bold">${analysis.keyLevels.support.toFixed(4)}</div>
              </div>
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                <div className="text-red-400 text-xs mb-1">Resistance</div>
                <div className="text-white font-bold">${analysis.keyLevels.resistance.toFixed(4)}</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-300 mb-2">💡 AI Recommendations</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Analysis */}
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3">
              <h4 className="text-sm font-medium text-orange-300 mb-1">⚠️ Risk Analysis</h4>
              <p className="text-sm text-slate-300">{analysis.riskAnalysis}</p>
            </div>

            {/* Data Source */}
            <div className="text-xs text-slate-500 bg-slate-900/30 p-2 rounded text-center">
              📡 Nguồn: {analysis.dataSource === 'REAL' ? 'Live Binance API + Gemini AI' : 'Simulated'} | 
              🕒 {analysis.timestamp.toLocaleString('vi-VN')}
            </div>
          </div>
        )}

        {!analysis && !isLoading && (
          <div className="text-center text-slate-400 py-8">
            {apiKeyStatus === 'valid' ? 
              'Nhấn nút refresh để chạy AI analysis từ dữ liệu thực' :
              'Validate API key để sử dụng AI analysis'
            }
          </div>
        )}

        {isLoading && (
          <div className="text-center text-slate-400 py-8">
            <div className="animate-pulse">
              Đang phân tích dữ liệu thực từ Binance với AI...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
