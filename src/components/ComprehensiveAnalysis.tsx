
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { generateComprehensiveAnalysis, ComprehensiveAnalysis } from "@/utils/comprehensiveAnalysis";

export const ComprehensiveAnalysisComponent = () => {
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const result = await generateComprehensiveAnalysis(apiKey);
      setAnalysis(result);
      toast.success("Phân tích tổng hợp đã được cập nhật!");
    } catch (error) {
      console.error('Error loading comprehensive analysis:', error);
      toast.error("Không thể tải phân tích tổng hợp");
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'BUY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'STRONG_SELL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'SELL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400 bg-green-400/10';
      case 'HIGH': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-400';
    if (accuracy >= 65) return 'text-yellow-400';
    return 'text-red-400';
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

  if (!analysis) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="text-center text-slate-400">
          Không có dữ liệu phân tích
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
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Phân Tích AI Tổng Hợp</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalysis}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Main Signal & Scores */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {analysis.confidenceScore}%
              </div>
              <div className="text-sm text-slate-400">Độ Tin Cậy</div>
              <Progress value={analysis.confidenceScore} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getAccuracyColor(analysis.accuracyScore)}`}>
                {analysis.accuracyScore}%
              </div>
              <div className="text-sm text-slate-400">Độ Chính Xác</div>
              <Progress value={analysis.accuracyScore} className="h-2 mt-2" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getSignalColor(analysis.overallSignal)}>
              {analysis.overallSignal === 'STRONG_BUY' && <TrendingUp className="h-4 w-4 mr-1" />}
              {analysis.overallSignal === 'BUY' && <TrendingUp className="h-4 w-4 mr-1" />}
              {analysis.overallSignal === 'STRONG_SELL' && <TrendingDown className="h-4 w-4 mr-1" />}
              {analysis.overallSignal === 'SELL' && <TrendingDown className="h-4 w-4 mr-1" />}
              {analysis.overallSignal === 'NEUTRAL' && <AlertTriangle className="h-4 w-4 mr-1" />}
              {analysis.overallSignal.replace('_', ' ')}
            </Badge>
            <Badge className={getRiskColor(analysis.riskLevel)}>
              Rủi Ro: {analysis.riskLevel}
            </Badge>
          </div>
        </div>

        {/* Trade Recommendation */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-2 mb-3">
            {analysis.shouldEnterTrade ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <h4 className="text-md font-medium text-white">
              {analysis.shouldEnterTrade ? 'NÊN VÀO LỆNH' : 'KHÔNG NÊN VÀO LỆNH'}
            </h4>
          </div>
          <p className="text-sm text-slate-300 mb-2">{analysis.recommendation}</p>
          <p className="text-xs text-slate-400">{analysis.entryStrategy}</p>
        </div>

        <Separator className="bg-slate-700" />

        {/* Analysis Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/30 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Kỹ Thuật</div>
            <div className="text-lg font-semibold text-blue-400">
              {analysis.technicalScore}%
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Tin Tức</div>
            <div className="text-lg font-semibold text-purple-400">
              {analysis.newsScore}%
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">Lý Do Phân Tích</h4>
          <div className="space-y-2">
            {analysis.reasoning.map((reason, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <span className="text-slate-300">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
          Cập nhật: {analysis.timestamp.toLocaleString('vi-VN')}
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
          <strong>Cảnh báo rủi ro:</strong> Phân tích AI không đảm bảo 100% chính xác. 
          Luôn quản lý rủi ro và không đầu tư quá khả năng tài chính của bạn.
        </div>
      </div>
    </Card>
  );
};
