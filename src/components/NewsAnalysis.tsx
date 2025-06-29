
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { analyzeNewsWithAI, fetchForexFactoryNews } from "@/utils/newsAnalysis";

interface NewsAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  keyEvents: string[];
  impact: string;
  recommendation: string;
  timestamp: Date;
}

interface NewsItem {
  title: string;
  time: string;
  currency: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  actual: string;
  forecast: string;
  previous: string;
}

export const NewsAnalysis = () => {
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNewsAnalysis();
  }, []);

  const loadNewsAnalysis = async () => {
    setIsLoading(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const [newsData, analysisData] = await Promise.all([
        fetchForexFactoryNews(),
        analyzeNewsWithAI(apiKey)
      ]);
      
      setNews(newsData);
      setAnalysis(analysisData);
      toast.success("News analysis updated!");
    } catch (error) {
      console.error('Error loading news analysis:', error);
      toast.error("Failed to load news analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'BEARISH': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'text-red-400 bg-red-400/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return <TrendingUp className="h-4 w-4" />;
      case 'BEARISH': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Newspaper className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Forex Factory News Analysis</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadNewsAnalysis}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Badge className={getSentimentColor(analysis.sentiment)}>
                  {getSentimentIcon(analysis.sentiment)}
                  <span className="ml-1">{analysis.sentiment}</span>
                </Badge>
                <span className="text-sm text-slate-400">
                  {analysis.confidence.toFixed(0)}% Confidence
                </span>
              </div>
              <div className="text-xs text-slate-500">
                <Clock className="h-3 w-3 inline mr-1" />
                {analysis.timestamp.toLocaleTimeString()}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Market Impact</h4>
                <p className="text-sm text-slate-400">{analysis.impact}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">AI Recommendation</h4>
                <p className="text-sm text-slate-400">{analysis.recommendation}</p>
              </div>

              {analysis.keyEvents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Key Events</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keyEvents.map((event, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-slate-600">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator className="bg-slate-700" />

        {/* News Events */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Today's Economic Events</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {news.map((item, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                      {item.currency}
                    </Badge>
                    <Badge className={`text-xs ${getImpactColor(item.impact)}`}>
                      {item.impact}
                    </Badge>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                </div>
                
                <h5 className="text-sm font-medium text-white mb-2">{item.title}</h5>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Actual:</span>
                    <div className="font-medium text-white">{item.actual}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Forecast:</span>
                    <div className="font-medium text-slate-300">{item.forecast}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Previous:</span>
                    <div className="font-medium text-slate-500">{item.previous}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News Source Attribution */}
        <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
          <strong>Data Source:</strong> Economic events simulated from Forex Factory format. 
          In production, integrate with live news feeds for real-time analysis.
        </div>
      </div>
    </Card>
  );
};
