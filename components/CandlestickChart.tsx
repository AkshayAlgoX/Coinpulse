'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import {
  getCandlestickConfig,
  getChartConfig,
  PERIOD_BUTTONS,
  PERIOD_CONFIG,
  LIVE_INTERVAL_BUTTONS,
} from '@/constants';
import {
  CandlestickSeries,
  createChart,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { getCoinOHLC } from '@/lib/coingecko.actions';
import { convertOHLCData } from '@/lib/utils';
import { CandlestickChartProps, OHLCData, Period } from '@/types';

/**
 * A client-side component that renders a lightweight-charts candlestick visualization.
 * Manages chart lifecycle, responsive resizing, and period-based data fetching.
 */
const CandlestickChart = ({
  children,
  data,
  liveOhlcv,
  coinId,
  height = 360,
  initialPeriod = 'daily',
  mode = 'historical',
  liveInterval = '1s',
  setLiveInterval,
}: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const requestIdRef = useRef(0);

  const [period, setPeriod] = useState(initialPeriod);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Fetches OHLC data for a specific period and updates state if the request is current.
   * @param selectedPeriod - The time period to fetch (e.g., 'daily', 'weekly').
   */
  const fetchOHLCData = async (selectedPeriod: Period) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const newData = await getCoinOHLC(coinId, selectedPeriod);

      if (requestId === requestIdRef.current) {
        setOhlcData(newData ?? []);
      }
    } catch (e) {
      if (requestId === requestIdRef.current) {
        console.error('Failed to fetch OHLCData', e);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  /**
   * Handles user interaction to change the chart period.
   * @param newPeriod - The newly selected Period.
   */
  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;

    startTransition(async () => {
      setPeriod(newPeriod);
      await fetchOHLCData(newPeriod);
    });
  };

  // Update chart when live data comes in
  useEffect(() => {
    if (mode === 'live' && liveOhlcv && candleSeriesRef.current) {
      const formatted = convertOHLCData([liveOhlcv])[0];
      candleSeriesRef.current.update(formatted);
    }
  }, [liveOhlcv, mode]);

  // Logic for initial chart setup and cleanup...
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const showTime = ['daily', 'weekly', 'monthly'].includes(period);

    const chart = createChart(container, {
      ...getChartConfig(height, showTime),
      width: container.clientWidth,
    });
    const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());

    series.setData(convertOHLCData(ohlcData));
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Logic for updating data when ohlcData or period changes...
  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;

    // Optional: Update time scale visibility based on new period
    const showTime = ['daily', 'weekly', 'monthly'].includes(period);
    chartRef.current.applyOptions({
      timeScale: { timeVisible: showTime },
    });

    const converted = convertOHLCData(ohlcData);
    candleSeriesRef.current.setData(converted);
    chartRef.current.timeScale().fitContent();
  }, [ohlcData, period]);

  return (
    <div id="candlestick-chart">
      <div className="chart-header mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">{children}</div>

        <div className="flex items-center gap-4">
          {mode === 'live' && setLiveInterval && (
            <div className="flex rounded-lg bg-black/30 p-1">
              {LIVE_INTERVAL_BUTTONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`rounded px-3 py-1 text-xs transition-colors ${
                    liveInterval === value
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setLiveInterval(value as any)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="button-group flex rounded-lg bg-black/30 p-1">
            {PERIOD_BUTTONS.map(({ value, label }) => (
              <button
                key={value}
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  period === value
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => handlePeriodChange(value as Period)}
                disabled={loading || isPending}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="chart" style={{ height }} />
    </div>
  );
};

export default CandlestickChart;
