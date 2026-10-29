import React from 'react';
import { fetcher } from '@/lib/coingecko.server';
import { notFound } from 'next/navigation';
import LiveDataWrapper from '@/components/LiveDataWrapper';

interface NextPageProps {
  params: Promise<{ coinId: string }>;
}

const Page = async ({ params }: NextPageProps) => {
  const resolvedParams = await params;
  const id = resolvedParams.coinId;

  // Fetch Static Data
  const [coinData, coinOHLCData] = await Promise.all([
    fetcher<any>(`/coins/${id}`, {
      localization: 'false',
      tickers: 'false',
      community_data: 'true',
      developer_data: 'true',
      sparkline: 'false',
    }),
    fetcher<any[]>(`/coins/${id}/ohlc`, {
      vs_currency: 'usd',
      days: '1',
    }),
  ]);

  if (!coinData) return notFound();

  return (
    <main className="min-h-screen bg-[#0B0E11] p-4 text-white md:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* We pass EVERYTHING to the wrapper so it can layout the grid properly */}
        <LiveDataWrapper
          coinId={id}
          poolId="simulated_pool_id"
          coin={coinData}
          coinOHLCData={coinOHLCData}
        />
      </div>
    </main>
  );
};
export default Page;
