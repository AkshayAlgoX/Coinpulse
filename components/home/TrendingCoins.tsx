import { fetcher } from '@/lib/coingecko.server';
import TrendingCoinsList from '@/components/home/TrendingCoinsList';
import { TrendingCoinsFallback } from '@/components/home/fallback';
import type { TrendingCoin } from '@/types';

const TrendingCoins = async () => {
  let trendingCoins: { coins: TrendingCoin[] };

  try {
    trendingCoins = await fetcher<{ coins: TrendingCoin[] }>(
      '/search/trending',
      undefined,
      300,
    );
  } catch (error) {
    console.error('Failed to fetch trending coins:', error);
    return <TrendingCoinsFallback />;
  }

  return (
    <div id="trending-coins">
      <h4>Trending Coins</h4>

      <TrendingCoinsList coins={trendingCoins.coins.slice(0, 6) || []} />
    </div>
  );
};
export default TrendingCoins;
