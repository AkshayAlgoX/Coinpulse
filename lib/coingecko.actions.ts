'use server';

import { fetcher } from '@/lib/coingecko.server';
import { PERIOD_CONFIG } from '@/constants';
import type { OHLCData, Period } from '@/types';

/*
 * Server actions callable from the browser. Each one validates its input
 * and requests one fixed CoinGecko endpoint; the generic fetcher is not
 * exposed (it would let any visitor spend the API key on any endpoint).
 */

const COIN_ID = /^[a-z0-9][a-z0-9-]{0,99}$/;

function assertCoinId(coinId: unknown): asserts coinId is string {
  if (typeof coinId !== 'string' || !COIN_ID.test(coinId)) {
    throw new Error('Invalid coin id');
  }
}

export async function getCoinOHLC(coinId: string, period: Period): Promise<OHLCData[]> {
  assertCoinId(coinId);
  if (!Object.prototype.hasOwnProperty.call(PERIOD_CONFIG, period)) {
    throw new Error('Invalid period');
  }
  const { days } = PERIOD_CONFIG[period];
  return fetcher<OHLCData[]>(`coins/${coinId}/ohlc`, {
    vs_currency: 'usd',
    days,
    precision: 'full',
  });
}

export async function getCoinPrice(coinId: string) {
  assertCoinId(coinId);
  return fetcher<Record<string, { usd: number; usd_24h_change: number; last_updated_at: number }>>(
    'simple/price',
    {
      ids: coinId,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_last_updated_at: 'true',
      precision: 'full',
    },
    // Live polling: do not serve cached prices.
    0,
  );
}

export async function searchCoins(query: string) {
  if (typeof query !== 'string') return [];
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2 || trimmedQuery.length > 64) return [];

  try {
    // 1. Search for coins (Get IDs)
    // Using fetcher to handle base URL, API key and common error handling
    const searchData = await fetcher<any>('search', { query: trimmedQuery }, 0);

    // Validate response payload
    if (!searchData || !searchData.coins) {
      return [];
    }

    // Take top 8 results
    const topCoins = searchData.coins.slice(0, 8);
    const ids = topCoins.map((c: any) => c.id).join(',');

    if (!ids) return [];

    // 2. Get Price Data for these coins (so we can show green/red change)
    const marketData = await fetcher<any[]>(
      'coins/markets',
      {
        vs_currency: 'usd',
        ids,
        price_change_percentage: '24h',
      },
      0,
    );

    if (!Array.isArray(marketData)) {
      return [];
    }

    return marketData;
  } catch (error) {
    console.error('Search Error:', error);
    return [];
  }
}
