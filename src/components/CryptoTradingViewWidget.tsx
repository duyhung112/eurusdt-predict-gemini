
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface CryptoTradingViewWidgetProps {
  symbol?: string;
  interval?: string;
}

export const CryptoTradingViewWidget = ({ 
  symbol = "BINANCE:ARBUSDT", 
  interval = "15" 
}: CryptoTradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": false,
        "symbol": "${symbol}",
        "interval": "${interval}",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(15, 23, 42, 0)",
        "gridColor": "rgba(71, 85, 105, 0.3)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "calendar": false,
        "hide_volume": false,
        "support_host": "https://www.tradingview.com",
        "studies": [
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies",
          "BB@tv-basicstudies",
          "Volume@tv-basicstudies"
        ],
        "drawings_access": {
          "type": "black",
          "tools": [
            {
              "name": "Regression Trend"
            }
          ]
        }
      }`;
    
    if (container.current) {
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  return (
    <div className="tradingview-widget-container h-[600px] md:h-[800px] lg:h-[1000px] xl:h-[1200px] 2xl:h-[1400px]" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};
