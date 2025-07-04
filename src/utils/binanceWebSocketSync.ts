interface BinanceWebSocketData {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  c: string;      // Close price
  o: string;      // Open price
  h: string;      // High price
  l: string;      // Low price
  v: string;      // Volume
  q: string;      // Quote volume
  P?: string;     // Price change percent
}

export class BinanceRealTimeSync {
  private ws: WebSocket | null = null;
  private symbol: string;
  private onPriceUpdate: (data: any) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(symbol: string, onPriceUpdate: (data: any) => void) {
    this.symbol = symbol.toLowerCase();
    this.onPriceUpdate = onPriceUpdate;
  }

  connect() {
    const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol}@ticker`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`🔗 Connected to Binance real-time feed for ${this.symbol.toUpperCase()}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: BinanceWebSocketData = JSON.parse(event.data);
          
          if (data.e === '24hrTicker') {
            const priceUpdate = {
              symbol: data.s,
              price: parseFloat(data.c),
              change24h: data.P ? parseFloat(data.P) / 100 : 0,
              volume: parseFloat(data.v),
              high24h: parseFloat(data.h),
              low24h: parseFloat(data.l),
              timestamp: data.E
            };
            
            this.onPriceUpdate(priceUpdate);
            console.log(`📈 Live price update: ${priceUpdate.price}`);
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
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
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

export const createBinanceRealTimeSync = (
  symbol: string,
  onPriceUpdate: (data: any) => void
) => {
  return new BinanceRealTimeSync(symbol, onPriceUpdate);
};