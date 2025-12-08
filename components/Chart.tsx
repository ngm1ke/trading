"use client";

import useAppDispatch from "@/hooks/useAppDispatch";
import useAppSelector from "@/hooks/useAppSelector";
import { fetchHistoricalKlines } from "@/services/binance";
import { KlineInterval } from "@/types";
import { formatPair } from "@/utils/formatter";
import {
  CandlestickData,
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TIMEFRAMES: { label: string; value: KlineInterval }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
  { label: "1M", value: "1M" },
];

export function Chart() {
  const [loading, setLoading] = useState(true);
  const symbol = useAppSelector((state) => state.ui.symbol);
  const [interval, setInterval] = useState<KlineInterval>("1m");
  const chartRef = useRef<IChartApi | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastKline = useAppSelector((state) => state.chart.lastKline);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let isMounted = true;
    let chart: IChartApi | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const container = chartContainerRef.current;

    async function chartSetup() {
      try {
        setLoading(true);
        const history = await fetchHistoricalKlines(symbol, interval, 500);

        if (!isMounted || !container) return;

        chart = createChart(container, {
          width: container.clientWidth,
          height: 450,
          layout: {
            background: { color: "rgba(9, 13, 22, 1)" },
            textColor: "#94a3b8",
            fontSize: 11,
            fontFamily: "Inter, sans-serif",
          },
          grid: {
            vertLines: { color: "#1e293b" },
            horzLines: { color: "#1e293b" },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              width: 1,
              color: "#64748b",
              style: 3,
              labelBackgroundColor: "#0f172a",
            },
            horzLine: {
              width: 1,
              color: "#64748b",
              style: 3,
              labelBackgroundColor: "#0f172a",
            },
          },
          timeScale: {
            borderColor: "#334155",
            timeVisible: true,
            secondsVisible: false,
            fixLeftEdge: true,
            fixRightEdge: true,
          },
          rightPriceScale: {
            borderColor: "#334155",
            autoScale: true,
          },
        });

        chartRef.current = chart;
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          priceScaleId: "candles",
          upColor: "#10b981",
          downColor: "#f43f5e",
          borderUpColor: "#10b981",
          borderDownColor: "#f43f5e",
          wickUpColor: "#10b981",
          wickDownColor: "#f43f5e",
        });
        chart.priceScale("candles").applyOptions({
          scaleMargins: { top: 0, bottom: 0.3 },
        });

        candlestickSeriesRef.current = candlestickSeries;
        const seriesMarkersApi = createSeriesMarkers(candlestickSeries);
        chart.subscribeClick((param) => {
          if (!param.time) return;
          const t = param.time as Time;
          seriesMarkersApi.setMarkers([
            {
              time: t,
              position: "aboveBar",
              shape: "circle",
              color: "#fbbf24",
            },
          ]);
        });

        candlestickSeries.setData(
          history as unknown as CandlestickData<Time>[],
        );

        setLoading(false);
        chart.timeScale().fitContent();
        let resizeTimer: ReturnType<typeof setTimeout>;
        resizeObserver = new ResizeObserver((entries) => {
          if (entries.length === 0 || !entries[0].contentRect) return;
          const { width } = entries[0].contentRect;
          chart?.resize(width, 450);
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => chart?.timeScale().fitContent(), 100);
        });
        resizeObserver.observe(container);
      } catch (error) {
        console.error("chartSetup error", error);
        setLoading(false);
      }
    }

    chartSetup();

    return () => {
      isMounted = false;
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
      }
      if (chart) {
        chart.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [interval, symbol]);

  useEffect(() => {
    if (!lastKline) return;
    const k = lastKline;
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.update({
        time: k.time as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      });
    }
  }, [lastKline]);

  const handleIntervalChange = useCallback((value: KlineInterval) => {
    setInterval(value);
  }, []);
  return (
    <>
      <div className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {formatPair(symbol)}
          </h2>
        </div>

        <div className="mb-3 flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleIntervalChange(tf.value)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                interval === tf.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="relative w-full h-[450px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500"></div>
              <p className="mt-3 text-xs text-slate-400">
                Loading chart data...
              </p>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>
    </>
  );
}
