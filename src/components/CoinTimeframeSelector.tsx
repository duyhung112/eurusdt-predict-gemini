import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock } from 'lucide-react';

interface CoinTimeframeSelectorProps {
  selectedSymbol: string;
  selectedTimeframe: string;
  onSymbolChange: (symbol: string) => void;
  onTimeframeChange: (timeframe: string) => void;
}

const SUPPORTED_COINS = [
  { symbol: 'ARBUSDT', name: 'Arbitrum', icon: '🔵' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: '🐕' },
  { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BNBUSDT', name: 'BNB', icon: '🟡' },
];

const TIMEFRAMES = [
  { value: '1m', label: '1 phút', interval: '1' },
  { value: '5m', label: '5 phút', interval: '5' },
  { value: '15m', label: '15 phút', interval: '15' },
  { value: '30m', label: '30 phút', interval: '30' },
  { value: '1h', label: '1 giờ', interval: '60' },
  { value: '4h', label: '4 giờ', interval: '240' },
  { value: '1d', label: '1 ngày', interval: '1D' },
];

export const CoinTimeframeSelector = ({
  selectedSymbol,
  selectedTimeframe,
  onSymbolChange,
  onTimeframeChange
}: CoinTimeframeSelectorProps) => {
  const currentCoin = SUPPORTED_COINS.find(coin => coin.symbol === selectedSymbol);
  const currentTimeframe = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center space-x-2">
          <Coins className="h-5 w-5 text-purple-400" />
          <span>Coin & Timeframe</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Coin Selection */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Chọn Coin</span>
          </div>
          
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <span>{currentCoin?.icon}</span>
                  <span>{currentCoin?.name}</span>
                  <Badge variant="outline" className="text-xs border-slate-500">
                    {selectedSymbol}
                  </Badge>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {SUPPORTED_COINS.map((coin) => (
                <SelectItem 
                  key={coin.symbol} 
                  value={coin.symbol}
                  className="text-white hover:bg-slate-600"
                >
                  <div className="flex items-center space-x-2">
                    <span>{coin.icon}</span>
                    <span>{coin.name}</span>
                    <Badge variant="outline" className="text-xs border-slate-500">
                      {coin.symbol}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeframe Selection */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Khung Thời Gian</span>
          </div>
          
          <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentTimeframe?.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {TIMEFRAMES.map((timeframe) => (
                <SelectItem 
                  key={timeframe.value} 
                  value={timeframe.value}
                  className="text-white hover:bg-slate-600"
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{timeframe.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Selection Display */}
        <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-300">Đang phân tích:</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">
                {currentCoin?.icon} {currentCoin?.name}
              </span>
              <span className="text-purple-400">•</span>
              <span className="text-white font-medium">
                {currentTimeframe?.label}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { SUPPORTED_COINS, TIMEFRAMES };