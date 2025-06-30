
const BINANCE_API_KEY = 'QVQKD8Yqyzje8nSF1tM4Qc2PiVMTwSUeNrIPl7HMseL5KZQhZwUl61ynYSTwYAtl';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface CryptoPriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const fetchBinanceKlines = async (
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<CryptoPriceData[]> => {
  try {
    const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data: BinanceKline[] = await response.json();
    
    return data.map((kline) => ({
      timestamp: kline[6], // closeTime
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));

  } catch (error) {
    console.error('Error fetching Binance data:', error);
    throw error;
  }
};

export const fetchCurrentPrice = async (symbol: string): Promise<number> => {
  try {
    const url = `${BINANCE_BASE_URL}/ticker/price?symbol=${symbol.toUpperCase()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);

  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
};

export const fetch24hrStats = async (symbol: string) => {
  try {
    const url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol.toUpperCase()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent) / 100,
      volume: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      quoteVolume: parseFloat(data.quoteVolume)
    };

  } catch (error) {
    console.error('Error fetching 24hr stats:', error);
    throw error;
  }
};
