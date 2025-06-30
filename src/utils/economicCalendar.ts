
interface EconomicEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: string;
  forecast: string;
  previous: string;
  deviation: number;
  marketImpact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface CalendarAnalysis {
  upcomingEvents: EconomicEvent[];
  impactScore: number;
  tradingRecommendation: string;
  riskPeriods: string[];
  strategyAdjustment: string;
  correlation: { [key: string]: number };
}

const generateUpcomingEvents = (): EconomicEvent[] => {
  const events = [
    { name: 'Non-Farm Payrolls', currency: 'USD', impact: 'HIGH' as const },
    { name: 'Interest Rate Decision', currency: 'EUR', impact: 'HIGH' as const },
    { name: 'GDP Growth Rate', currency: 'USD', impact: 'HIGH' as const },
    { name: 'Inflation Rate', currency: 'EUR', impact: 'MEDIUM' as const },
    { name: 'Unemployment Rate', currency: 'USD', impact: 'MEDIUM' as const },
    { name: 'Consumer Confidence', currency: 'EUR', impact: 'MEDIUM' as const },
    { name: 'Manufacturing PMI', currency: 'USD', impact: 'LOW' as const },
    { name: 'Retail Sales', currency: 'EUR', impact: 'LOW' as const }
  ];
  
  return events.map((event, index) => {
    const eventTime = new Date();
    eventTime.setHours(eventTime.getHours() + index * 4 + 2);
    
    const actual = (Math.random() * 5).toFixed(1);
    const forecast = (Math.random() * 5).toFixed(1);
    const previous = (Math.random() * 5).toFixed(1);
    
    const deviation = ((parseFloat(actual) - parseFloat(forecast)) / parseFloat(forecast)) * 100;
    
    let marketImpact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (Math.abs(deviation) > 10) {
      if (event.currency === 'USD') {
        marketImpact = deviation > 0 ? 'BULLISH' : 'BEARISH';
      } else {
        marketImpact = deviation > 0 ? 'BEARISH' : 'BULLISH'; // For EURUSD
      }
    } else {
      marketImpact = 'NEUTRAL';
    }
    
    return {
      time: eventTime.toLocaleString(),
      currency: event.currency,
      event: event.name,
      impact: event.impact,
      actual: actual + '%',
      forecast: forecast + '%',
      previous: previous + '%',
      deviation,
      marketImpact
    };
  });
};

const calculateEventImpact = (events: EconomicEvent[]): number => {
  return events.reduce((total, event) => {
    let weight = 0;
    switch (event.impact) {
      case 'HIGH': weight = 3; break;
      case 'MEDIUM': weight = 2; break;
      case 'LOW': weight = 1; break;
    }
    
    const deviationImpact = Math.abs(event.deviation) / 100;
    return total + (weight * (1 + deviationImpact));
  }, 0);
};

const identifyRiskPeriods = (events: EconomicEvent[]): string[] => {
  const riskPeriods: string[] = [];
  
  events.forEach(event => {
    if (event.impact === 'HIGH') {
      const eventDate = new Date(event.time);
      const riskStart = new Date(eventDate.getTime() - 30 * 60000); // 30 minutes before
      const riskEnd = new Date(eventDate.getTime() + 60 * 60000); // 1 hour after
      
      riskPeriods.push(`${riskStart.toLocaleTimeString()} - ${riskEnd.toLocaleTimeString()}`);
    }
  });
  
  return riskPeriods;
};

const calculateCorrelation = (events: EconomicEvent[]): { [key: string]: number } => {
  const correlation: { [key: string]: number } = {};
  
  events.forEach(event => {
    const eventKey = `${event.currency}_${event.event}`;
    
    // Mock correlation with EURUSD movement
    let correlationValue = 0;
    
    if (event.currency === 'USD') {
      correlationValue = event.impact === 'HIGH' ? 0.8 : event.impact === 'MEDIUM' ? 0.6 : 0.3;
    } else if (event.currency === 'EUR') {
      correlationValue = event.impact === 'HIGH' ? -0.7 : event.impact === 'MEDIUM' ? -0.5 : -0.2;
    }
    
    // Adjust for deviation
    correlationValue *= (1 + Math.abs(event.deviation) / 100);
    
    correlation[eventKey] = Math.max(-1, Math.min(1, correlationValue));
  });
  
  return correlation;
};

const generateStrategyAdjustment = (
  impactScore: number,
  highImpactEvents: number,
  riskPeriods: string[]
): string => {
  let strategy = '';
  
  if (impactScore > 15) {
    strategy += 'High impact day detected. ';
    if (highImpactEvents > 2) {
      strategy += 'Multiple major events - consider staying out of market or using very tight stops. ';
    } else {
      strategy += 'Reduce position sizes by 50% and use wider stops. ';
    }
  } else if (impactScore > 8) {
    strategy += 'Moderate impact expected. Use standard risk management with closer monitoring. ';
  } else {
    strategy += 'Low impact day. Normal trading conditions expected. ';
  }
  
  if (riskPeriods.length > 0) {
    strategy += `Avoid trading during: ${riskPeriods.join(', ')}. `;
  }
  
  return strategy;
};

export const analyzeEconomicCalendar = async (apiKey: string): Promise<CalendarAnalysis> => {
  const upcomingEvents = generateUpcomingEvents();
  const impactScore = calculateEventImpact(upcomingEvents);
  const riskPeriods = identifyRiskPeriods(upcomingEvents);
  const correlation = calculateCorrelation(upcomingEvents);
  
  const highImpactEvents = upcomingEvents.filter(e => e.impact === 'HIGH').length;
  const strategyAdjustment = generateStrategyAdjustment(impactScore, highImpactEvents, riskPeriods);
  
  let tradingRecommendation = 'Standard trading approach. ';
  
  if (impactScore > 20) {
    tradingRecommendation = 'High volatility expected. Consider reducing exposure or waiting for post-event clarity. ';
  } else if (impactScore > 10) {
    tradingRecommendation = 'Moderate volatility expected. Monitor events closely and adjust stops accordingly. ';
  }
  
  // Enhance with AI if available
  try {
    if (apiKey && apiKey.length > 10) {
      const eventSummary = upcomingEvents.slice(0, 3).map(e => `${e.event} (${e.currency})`).join(', ');
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze upcoming EURUSD events: ${eventSummary}. Impact score: ${impactScore.toFixed(1)}. Provide trading strategy adjustment.`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 150 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiAdvice = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (aiAdvice) {
          tradingRecommendation += `AI Insight: ${aiAdvice.substring(0, 100)}...`;
        }
      }
    }
  } catch (error) {
    console.log('AI economic analysis failed');
  }
  
  return {
    upcomingEvents,
    impactScore,
    tradingRecommendation,
    riskPeriods,
    strategyAdjustment,
    correlation
  };
};
