import React from 'react';
import { fetcher } from '@/lib/coingecko.server';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CoinOverviewFallback } from '@/components/home/fallback';
import CandlestickChart from '@/components/CandlestickChart'; // Ensure this path is correct
import type { CoinDetailsData, OHLCData } from '@/types';

const CoinOverview = async () => {
  let coin, coinOHCLData;
  try {
    [coin, coinOHCLData] = await Promise.all([
      fetcher<CoinDetailsData>('/coins/bitcoin', {
        dex_pair_format: 'symbol',
      }),
      fetcher<OHLCData[]>('/coins/bitcoin/ohlc', {
        vs_currency: 'usd',
        days: '1',
        precision: 'full',
      }),
    ]);
  } catch (error) {
    console.error('Failed to fetch coin overview:', error);
    return <CoinOverviewFallback />;
  }

  return (
    <div id="coin-overview">
      <CandlestickChart data={coinOHCLData} coinId="bitcoin">
        <div className="header pt-2">
          <Image
            src={coin.image.large}
            alt={coin.name}
            width={56}
            height={56}
          />

          <div className="info">
            <p>
              {coin.name} / {coin.symbol.toUpperCase()}
            </p>
            <h1>{formatCurrency(coin.market_data.current_price.usd)}</h1>
          </div>
        </div>
      </CandlestickChart>
    </div>
  );
};

export default CoinOverview;
