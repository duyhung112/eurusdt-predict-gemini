
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, RefreshCw, TrendingUp, TrendingDown, Target, 
  AlertTriangle, CheckCircle, XCircle, BarChart3, Activity,
  Clock, Zap, Award, Shield, Calendar, Newspaper
} from "lucide-react";
import { toast } from "sonner";
import { generateMasterAnalysis, MasterAnalysis } from "@/utils/masterAnalysis";

export const MasterAnalysisComponent = () => {
  const [analysis, setAnalysis] = useState<MasterAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadMasterAnalysis();
  }, []);

  const loadMasterAnalysis = async () => {
    setIsLoading(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const result = await generateMasterAnalysis(apiKey);
      setAnalysis(result);
      toast.success("Phân tích Master AI đã hoàn thành!");
    } catch (error) {
      console.error('Error loading master analysis:', error);
      toast.error("Không thể tải phân tích Master AI");
    } finally {
      setIsLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'BUY': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'STRONG_SELL': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'SELL': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400 bg-green-400/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
      case 'HIGH': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-red-400 bg-red-400/10';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="text-lg font-semibold text-white">Đang phân tích Master AI...</span>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="text-center text-slate-400">
          Không có dữ liệu phân tích Master AI
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
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Master AI Analysis</h3>
              <p className="text-sm text-purple-300">7 Hệ thống AI tích hợp</p>
            </div>
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

        {/* Main Dashboard */}
        <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-cyan-900/30 rounded-lg border border-purple-500/20 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {analysis.masterConfidence}%
              </div>
              <div className="text-sm text-slate-300">Master Confidence</div>
              <Progress value={analysis.masterConfidence} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                {analysis.accuracyScore}%
              </div>
              <div className="text-sm text-slate-300">Accuracy Score</div>
              <Progress value={analysis.accuracyScore} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <Badge className={getSignalColor(analysis.overallSignal)}>
                {analysis.overallSignal === 'STRONG_BUY' && <TrendingUp className="h-4 w-4 mr-1" />}
                {analysis.overallSignal === 'BUY' && <TrendingUp className="h-4 w-4 mr-1" />}
                {analysis.overallSignal === 'STRONG_SELL' && <TrendingDown className="h-4 w-4 mr-1" />}
                {analysis.overallSignal === 'SELL' && <TrendingDown className="h-4 w-4 mr-1" />}
                {analysis.overallSignal === 'NEUTRAL' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {analysis.overallSignal.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-center">
              <Badge className={getRiskColor(analysis.riskLevel)}>
                <Shield className="h-4 w-4 mr-1" />
                {analysis.riskLevel}
              </Badge>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {analysis.shouldTrade ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
                <h4 className="text-lg font-semibold text-white">
                  {analysis.shouldTrade ? 'KHUYẾN NGHỊ VÀO LỆNH' : 'KHÔNG VÀO LỆNH'}
                </h4>
              </div>
              <Award className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-slate-300 mb-2">{analysis.finalRecommendation}</p>
            <p className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
              <strong>Chiến lược:</strong> {analysis.entryStrategy}
            </p>
          </div>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-blue-600">
              <Activity className="h-4 w-4 mr-2" />
              Kỹ thuật
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="data-[state=active]:bg-green-600">
              <Brain className="h-4 w-4 mr-2" />
              Tâm lý
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-red-600">
              <Shield className="h-4 w-4 mr-2" />
              Rủi ro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Thành phần phân tích</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Comprehensive:</span>
                    <span className="text-blue-400">{analysis.components.comprehensive?.confidenceScore || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Patterns:</span>
                    <span className="text-green-400">{analysis.components.patterns?.confidence || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Market Structure:</span>
                    <span className="text-purple-400">{analysis.components.marketStructure?.strength || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sentiment:</span>
                    <span className="text-cyan-400">{analysis.components.sentiment?.confidence || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Performance Metrics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Win Rate:</span>
                    <span className="text-green-400">{analysis.components.backtest?.overallPerformance?.winRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Profit Factor:</span>
                    <span className="text-blue-400">{analysis.components.backtest?.overallPerformance?.profitFactor?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sharpe Ratio:</span>
                    <span className="text-purple-400">{analysis.components.backtest?.overallPerformance?.sharpeRatio?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Max Drawdown:</span>
                    <span className="text-red-400">${analysis.components.backtest?.overallPerformance?.maxDrawdown?.toFixed(0) || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            <div className="space-y-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Pattern Recognition</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.components.patterns?.candlestickPatterns?.map((pattern: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-slate-600">
                      {pattern.name} ({pattern.reliability}%)
                    </Badge>
                  )) || []}
                </div>
              </div>
              
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Market Structure</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Trend:</span>
                    <div className="font-medium text-white">{analysis.components.marketStructure?.trend || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Strength:</span>
                    <div className="font-medium text-blue-400">{analysis.components.marketStructure?.strength || 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="mt-4">
            <div className="space-y-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Advanced Sentiment</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Overall:</span>
                    <div className="font-medium text-white">{analysis.components.sentiment?.overallSentiment || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Contrarian Signal:</span>
                    <div className="font-medium text-cyan-400">{analysis.components.sentiment?.contrarian ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Economic Calendar</h5>
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Impact Score:</span>
                    <span className="font-medium text-orange-400">{analysis.components.calendar?.impactScore?.toFixed(1) || 0}</span>
                  </div>
                  <p className="text-slate-300">{analysis.components.calendar?.tradingRecommendation || 'No recommendation available'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-4">
            <div className="space-y-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Smart Risk Management</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Risk Level:</span>
                    <div className="font-medium text-white">{analysis.components.risk?.riskLevel || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Risk Score:</span>
                    <div className="font-medium text-red-400">{analysis.components.risk?.riskScore || 0}/100</div>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-slate-400">Recommended Size:</span>
                  <div className="font-medium text-green-400">{analysis.components.risk?.positionSizing?.recommendedSize?.toFixed(0) || 0} units</div>
                </div>
              </div>
              
              <div className="bg-slate-900/30 rounded-lg p-4">
                <h5 className="text-md font-semibold text-white mb-3">Risk Assessment</h5>
                <p className="text-sm text-slate-300">{analysis.components.backtest?.riskAssessment || 'No risk assessment available'}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Timestamp */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
          <Clock className="h-3 w-3 inline mr-1" />
          Cập nhật: {analysis.timestamp.toLocaleString('vi-VN')}
        </div>

        {/* Master Disclaimer */}
        <div className="text-xs text-slate-500 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-purple-500/20">
          <strong>Master AI System:</strong> Phân tích tích hợp từ 7 hệ thống AI khác nhau bao gồm: 
          Comprehensive Analysis, Pattern Recognition, Market Structure, Advanced Sentiment, 
          Smart Risk Management, Economic Calendar, và Backtesting. Đảm bảo tính toàn diện và chính xác cao nhất.
        </div>
      </div>
    </Card>
  );
};
