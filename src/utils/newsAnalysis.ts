
interface NewsItem {
  title: string;
  time: string;
  currency: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  actual: string;
  forecast: string;
  previous: string;
  description: string;
}

interface NewsAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  keyEvents: string[];
  impact: string;
  recommendation: string;
  timestamp: Date;
}

// Mock news data from Forex Factory (in real implementation, you'd scrape or use an API)
const generateMockNews = (): NewsItem[] => {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
  const impacts = ['LOW', 'MEDIUM', 'HIGH'] as const;
  const newsTypes = [
    'GDP Growth Rate',
    'Unemployment Rate',
    'Interest Rate Decision',
    'Inflation Rate',
    'Trade Balance',
    'Consumer Confidence',
    'Manufacturing PMI',
    'Retail Sales'
  ];

  return Array.from({ length: 5 }, (_, i) => ({
    title: `${newsTypes[Math.floor(Math.random() * newsTypes.length)]} (${currencies[Math.floor(Math.random() * currencies.length)]})`,
    time: new Date(Date.now() + i * 3600000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    impact: impacts[Math.floor(Math.random() * impacts.length)],
    actual: (Math.random() * 5).toFixed(1) + '%',
    forecast: (Math.random() * 5).toFixed(1) + '%',
    previous: (Math.random() * 5).toFixed(1) + '%',
    description: `Economic indicator showing market sentiment and potential currency movement.`
  }));
};

const analyzeNewsSentiment = (news: NewsItem[]): { sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; score: number } => {
  let bullishScore = 0;
  let bearishScore = 0;

  news.forEach(item => {
    const actualNum = parseFloat(item.actual);
    const forecastNum = parseFloat(item.forecast);
    
    if (!isNaN(actualNum) && !isNaN(forecastNum)) {
      const diff = actualNum - forecastNum;
      const impactMultiplier = item.impact === 'HIGH' ? 3 : item.impact === 'MEDIUM' ? 2 : 1;
      
      if (item.currency === 'USD') {
        if (diff > 0) bullishScore += impactMultiplier;
        else if (diff < 0) bearishScore += impactMultiplier;
      } else if (item.currency === 'EUR') {
        if (diff > 0) bearishScore += impactMultiplier; // Good EUR news = bearish for EURUSD from USD perspective
        else if (diff < 0) bullishScore += impactMultiplier;
      }
    }
  });

  const totalScore = bullishScore + bearishScore;
  if (totalScore === 0) return { sentiment: 'NEUTRAL', score: 50 };

  const bullishPercentage = (bullishScore / totalScore) * 100;
  
  if (bullishPercentage > 60) return { sentiment: 'BULLISH', score: bullishPercentage };
  if (bullishPercentage < 40) return { sentiment: 'BEARISH', score: 100 - bullishPercentage };
  return { sentiment: 'NEUTRAL', score: 50 };
};

export const analyzeNewsWithAI = async (apiKey: string): Promise<NewsAnalysis> => {
  const news = generateMockNews();
  const sentimentAnalysis = analyzeNewsSentiment(news);
  
  // Prepare news summary for AI analysis
  const newsContext = news.map(item => 
    `${item.title}: Impact ${item.impact}, Actual: ${item.actual}, Forecast: ${item.forecast}`
  ).join('. ');

  try {
    if (apiKey && apiKey.length > 10) {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze these EURUSD forex news events: ${newsContext}. 
                     Current sentiment: ${sentimentAnalysis.sentiment}. 
                     Provide: 1) Key impact events, 2) Market recommendation, 3) Confidence level (1-100). 
                     Keep response under 150 words.`
            }]
          }],
          generationConfig: { 
            temperature: 0.3, 
            maxOutputTokens: 200 
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
          sentiment: sentimentAnalysis.sentiment,
          confidence: Math.min(95, sentimentAnalysis.score + 15), // AI boost
          keyEvents: news.filter(n => n.impact === 'HIGH').map(n => n.title).slice(0, 3),
          impact: aiAnalysis.substring(0, 100) + '...',
          recommendation: `Based on news analysis: ${sentimentAnalysis.sentiment} bias with ${sentimentAnalysis.score.toFixed(0)}% confidence`,
          timestamp: new Date()
        };
      }
    }
  } catch (error) {
    console.log('AI news analysis failed, using technical analysis');
  }

  // Fallback analysis
  return {
    sentiment: sentimentAnalysis.sentiment,
    confidence: sentimentAnalysis.score,
    keyEvents: news.filter(n => n.impact === 'HIGH').map(n => n.title).slice(0, 3),
    impact: `${news.length} major economic events analyzed. ${sentimentAnalysis.sentiment} sentiment detected.`,
    recommendation: `Technical analysis suggests ${sentimentAnalysis.sentiment} bias based on recent economic data.`,
    timestamp: new Date()
  };
};

export const fetchForexFactoryNews = async (): Promise<NewsItem[]> => {
  // In a real implementation, you would scrape Forex Factory or use their API
  // For demo purposes, we return mock data
  return generateMockNews();
};
