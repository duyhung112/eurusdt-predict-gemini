
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Brain, BookOpen, Target, Shield } from "lucide-react";
import { toast } from "sonner";
import { generateMasterAnalysis, MasterAnalysis } from "@/utils/masterAnalysis";

interface MasterAnalysisProps {
  selectedSymbol?: string;
  selectedTimeframe?: string;
}

export const MasterAnalysisComponent = ({ selectedSymbol = 'ARBUSDT', selectedTimeframe = '15m' }: MasterAnalysisProps) => {
  const [analysis, setAnalysis] = useState<MasterAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  const loadMasterAnalysis = async () => {
    if (!geminiApiKey.trim()) {
      toast.error("Vui lòng nhập Gemini API key");
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('gemini_api_key', geminiApiKey);
      console.log(`Starting master analysis with real Binance data for ${selectedSymbol} (${selectedTimeframe})...`);
      
      const result = await generateMasterAnalysis(geminiApiKey, selectedSymbol, selectedTimeframe);
      setAnalysis(result);
      
      if (result.masterConfidence > 0) {
        toast.success("Master Analysis hoàn tất với dữ liệu thực!");
      } else {
        toast.error("Không thể lấy dữ liệu thực. Kiểm tra API key.");
      }
    } catch (error) {
      console.error('Error loading master analysis:', error);
      toast.error("Lỗi phân tích. Kiểm tra kết nối và API key.");
    } finally {
      setIsLoading(false);
    }
  };

  function getSignalColor(signal: string) {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'BUY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'STRONG_SELL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'SELL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  }

  function getRiskColor(risk: string) {
    switch (risk) {
      case 'LOW': return 'text-green-400 bg-green-400/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
      case 'HIGH': return 'text-red-400 bg-red-400/10';
      case 'EXTREME': return 'text-red-600 bg-red-600/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="text-center text-slate-400 mt-4">
            Đang phân tích dữ liệu thực từ Binance...
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
            <Crown className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Master {selectedSymbol} ({selectedTimeframe})</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMasterAnalysis}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* API Key Input */}
        {!analysis && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="Nhập Gemini API Key để phân tích dữ liệu thực"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button 
                onClick={loadMasterAnalysis} 
                disabled={isLoading || !geminiApiKey.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Phân Tích
              </Button>
            </div>
            <div className="text-xs text-slate-400">
              🔒 API key được lưu cục bộ và chỉ dùng để phân tích dữ liệu thực từ Binance
            </div>
          </div>
        )}

        {analysis && (
          <>
            {/* Main Signal Dashboard */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20 p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {analysis.masterConfidence}%
                  </div>
                  <div className="text-sm text-slate-400">Master Confidence</div>
                  <Progress value={analysis.masterConfidence} className="h-2 mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {analysis.accuracyScore}%
                  </div>
                  <div className="text-sm text-slate-400">Accuracy Score</div>
                  <Progress value={analysis.accuracyScore} className="h-2 mt-2" />
                </div>
                <div className="text-center flex flex-col items-center">
                  <Badge className={getRiskColor(analysis.riskLevel)}>
                    <Shield className="h-4 w-4 mr-1" />
                    {analysis.riskLevel}
                  </Badge>
                  <div className="text-sm text-slate-400 mt-1">Risk Level</div>
                </div>
              </div>

              <div className="flex items-center justify-center mb-4">
                <Badge className={`text-lg px-4 py-2 ${getSignalColor(analysis.overallSignal)}`}>
                  {analysis.overallSignal === 'STRONG_BUY' && <TrendingUp className="h-5 w-5 mr-2" />}
                  {analysis.overallSignal === 'BUY' && <TrendingUp className="h-5 w-5 mr-2" />}
                  {analysis.overallSignal === 'STRONG_SELL' && <TrendingDown className="h-5 w-5 mr-2" />}
                  {analysis.overallSignal === 'SELL' && <TrendingDown className="h-5 w-5 mr-2" />}
                  {analysis.overallSignal === 'NEUTRAL' && <AlertTriangle className="h-5 w-5 mr-2" />}
                  {analysis.overallSignal.replace('_', ' ')}
                </Badge>
              </div>

              <div className="text-center">
                {analysis.shouldTrade ? (
                  <div className="flex items-center justify-center text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">RECOMMENDED TO TRADE</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-red-400 mb-2">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">NOT RECOMMENDED</span>
                  </div>
                )}
                <p className="text-sm text-slate-300">{analysis.finalRecommendation}</p>
              </div>
            </div>

            {/* Educational Analysis Section */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20 p-4">
              <div className="flex items-center mb-4">
                <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
                <h4 className="text-lg font-medium text-white">Phân Tích Giáo Dục - Học Cách Đọc Thị Trường</h4>
              </div>

              <div className="space-y-4">
                {/* Why This Signal */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-300 mb-2">🎯 Tại Sao Có Tín Hiệu Này?</h5>
                  <p className="text-sm text-slate-300">{analysis.educationalAnalysis.whyThisSignal}</p>
                </div>

                {/* Market Conditions */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-300 mb-2">📊 Điều Kiện Thị Trường Hiện Tại</h5>
                  <p className="text-sm text-slate-300">{analysis.educationalAnalysis.marketConditions}</p>
                </div>

                {/* Technical Explanation */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-purple-300 mb-2">⚙️ Giải Thích Kỹ Thuật</h5>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {analysis.educationalAnalysis.technicalExplanation}
                  </pre>
                </div>

                {/* Risk Factors */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-300 mb-2">⚠️ Các Yếu Tố Rủi Ro</h5>
                  <ul className="space-y-1">
                    {analysis.educationalAnalysis.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Learning Points */}
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-yellow-300 mb-2">💡 Điểm Học Tập</h5>
                  <ul className="space-y-1">
                    {analysis.educationalAnalysis.learningPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start">
                        <span className="text-yellow-400 mr-2">📚</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Strategy Section */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="h-5 w-5 text-green-400" />
                <h4 className="text-md font-medium text-white">Chiến Lược Giao Dịch</h4>
              </div>
              <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded font-mono">
                {analysis.entryStrategy}
              </p>
            </div>

            <Separator className="bg-slate-700" />

            {/* Components Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-3">
                <div className="text-sm text-slate-400 mb-1">AI Technical</div>
                <div className="text-lg font-semibold text-blue-400">
                  {analysis.components.comprehensive?.technicalScore || 0}%
                </div>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-3">
                <div className="text-sm text-slate-400 mb-1">AI Sentiment</div>
                <div className="text-lg font-semibold text-purple-400">
                  {analysis.components.comprehensive?.sentimentScore || 0}%
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
              Phân tích: {analysis.timestamp.toLocaleString('vi-VN')} | 
              Dữ liệu: Live Binance API | 
              Confidence: {analysis.masterConfidence}%
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
              <strong>⚠️ Cảnh báo rủi ro:</strong> Đây là phân tích AI dựa trên dữ liệu thực từ Binance, 
              không phải lời khuyên đầu tư. Luôn DYOR (Do Your Own Research) và chỉ đầu tư số tiền bạn có thể mất được.
              Sử dụng stop loss và quản lý rủi ro hợp lý.
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
