interface BinanceKlineData {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  k: {
    t: number;    // Kline start time
    T: number;    // Kline close time
    s: string;    // Symbol
    i: string;    // Interval
    f: number;    // First trade ID
    L: number;    // Last trade ID
    o: string;    // Open price
    c: string;    // Close price
    h: string;    // High price
    l: string;    // Low price
    v: string;    // Base asset volume
    n: number;    // Number of trades
    x: boolean;   // Is this kline closed?
    q: string;    // Quote asset volume
    V: string;    // Taker buy base asset volume
    Q: string;    // Taker buy quote asset volume
  };
}

interface BinancePriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private symbol: string;
  private interval: string;
  private onPriceUpdate: (data: BinancePriceData) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    symbol: string,
    interval: string = '1m',
    onPriceUpdate: (data: BinancePriceData) => void
  ) {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
    this.onPriceUpdate = onPriceUpdate;
  }

  connect() {
    const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`Connected to Binance WebSocket for ${this.symbol.toUpperCase()}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: BinanceKlineData = JSON.parse(event.data);
          const klineData = data.k;
          
          if (klineData && klineData.x) { // x indicates if kline is closed
            const priceData: BinancePriceData = {
              timestamp: klineData.T,
              open: parseFloat(klineData.o),
              high: parseFloat(klineData.h),
              low: parseFloat(klineData.l),
              close: parseFloat(klineData.c),
              volume: parseFloat(klineData.v)
            };
            
            this.onPriceUpdate(priceData);
          }
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Binance WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to Binance WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const createBinanceWebSocketClient = (
  symbol: string,
  interval: string = '1m',
  onPriceUpdate: (data: BinancePriceData) => void
) => {
  return new BinanceWebSocketClient(symbol, interval, onPriceUpdate);
};
