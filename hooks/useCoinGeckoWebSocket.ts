'use client';

import { useEffect, useState, useRef } from 'react';
import { getCoinPrice } from '@/lib/coingecko.actions';
import type { OHLCData } from '@/types';

interface Trade {
  price: number;
  amount: number;
  value: number;
  type: 'buy' | 'sell';
  time: number;
  timestamp: number;
}

interface ExtendedPriceData {
  usd: number;
  change24h?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
}

interface UseCoinGeckoWebSocketProps {
  coinId: string;
  poolId?: string;
  liveInterval?: string;
}

export const useCoinGeckoWebSocket = ({
  coinId,
}: UseCoinGeckoWebSocketProps) => {
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentPriceRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    setIsConnected(false);
    setTrades([]);

    // A. Fetch Real Price (Polling)
    const fetchRealData = async () => {
      try {
        const priceData = await getCoinPrice(coinId);

        if (!isMounted) return;

        if (priceData && priceData[coinId]) {
          const newPrice = priceData[coinId].usd;
          currentPriceRef.current = newPrice;

          setPrice({
            usd: newPrice,
            change24h: priceData[coinId].usd_24h_change,
            usd_24h_change: priceData[coinId].usd_24h_change,
            last_updated_at: priceData[coinId].last_updated_at,
          });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Polling Error:', error);
          setIsConnected(false);
        }
      }
    };

    // B. Simulate Live Trades (Visual Effect)
    const simulateLiveTrade = () => {
      if (currentPriceRef.current === 0 || !isMounted) return;

      setTrades((prevTrades) => {
        const type = Math.random() > 0.5 ? 'buy' : 'sell';
        const variation = Math.random() * 0.05 - 0.025;
        const tradePrice = currentPriceRef.current + variation;
        const amount = Math.random() * 1.5 + 0.1;

        const newTrade: Trade = {
          price: tradePrice,
          amount: amount,
          value: tradePrice * amount,
          type: type,
          time: Date.now(),
          timestamp: Date.now() / 1000,
        };
        // Keep last 7 trades
        return [newTrade, ...prevTrades].slice(0, 7);
      });
    };

    fetchRealData();
    const priceInterval = setInterval(fetchRealData, 30000); // 30s Polling
    const tradeInterval = setInterval(simulateLiveTrade, 4000); // 4s Fake Trade

    return () => {
      isMounted = false;
      clearInterval(priceInterval);
      clearInterval(tradeInterval);
    };
  }, [coinId]);

  return { price, trades, ohlcv, isConnected };
};
