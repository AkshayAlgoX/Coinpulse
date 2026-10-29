import { fetcher } from '@/lib/coingecko.server';
import Link from 'next/link';
import CoinsList from '@/components/CoinsList';
import type { CoinMarketData } from '@/types';

interface CoinsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Coins = async (props: CoinsPageProps) => {
  const searchParams = await props.searchParams;

  const parsedPage = parseInt(searchParams?.page as string, 10);
  const currentPage = isNaN(parsedPage)
    ? 1
    : Math.max(1, Math.floor(parsedPage));

  const parsedPerPage = parseInt(searchParams?.per_page as string, 10);
  const perPage = isNaN(parsedPerPage)
    ? 100
    : Math.max(1, Math.floor(parsedPerPage));

  const coinsData = await fetcher<CoinMarketData[]>('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: perPage,
    page: currentPage,
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  // FIX: Gracefully handle the limit of the Free API
  if (!coinsData || coinsData.length === 0) {
    return (
      <main
        id="coins-page"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      >
        <h2 className="text-2xl font-bold text-gray-800">No coins found</h2>
        <p className="text-gray-500">
          The CoinGecko Free API limits how far you can scroll.
        </p>
        <Link
          href="/coins?page=1"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go back to Page 1
        </Link>
      </main>
    );
  }

  const hasMorePages = coinsData.length === perPage;
  const estimatedTotalPages = hasMorePages
    ? currentPage >= 100
      ? Math.ceil(currentPage / 100) * 100 + 100
      : 100
    : currentPage;

  return (
    <main id="coins-page">
      <CoinsList
        coinsData={coinsData}
        currentPage={currentPage}
        estimatedTotalPages={estimatedTotalPages}
        hasMorePages={hasMorePages}
      />
    </main>
  );
};

export default Coins;
