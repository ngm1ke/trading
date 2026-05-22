"use client";

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
  MouseEventParams,
  Time,
} from "lightweight-charts";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

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

interface HoverTooltip {
  x: number;
  y: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

export function Chart() {
  const [loading, setLoading] = useState(true);
  const symbol = useAppSelector((state) => state.ui.symbol);
  const [interval, setInterval] = useState<KlineInterval>("1m");
  const chartRef = useRef<IChartApi | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastKline = useAppSelector((state) => state.chart.lastKline);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip | null>(null);
  const markersApiRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(
    null,
  );
  const [containerWidth, setContainerWidth] = useState(0);

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
        const markersApi = createSeriesMarkers(candlestickSeries);
        markersApiRef.current = markersApi;

        chart.subscribeClick((param: MouseEventParams) => {
          if (!param.point || !param.time) return;
          const t = param.time as Time;
          markersApi.setMarkers([
            {
              time: t,
              position: "aboveBar",
              shape: "circle",
              color: "#fbbf24",
            },
          ]);
        });

        chart.subscribeCrosshairMove((param: MouseEventParams) => {
          if (
            !param.point ||
            !param.time ||
            param.point.x < 0 ||
            param.point.y < 0
          ) {
            setHoverTooltip(null);
            return;
          }
          const data = param.seriesData.get(candlestickSeries) as
            | CandlestickData<Time>
            | undefined;

          if (data) {
            const timeLabel =
              typeof param.time === "number"
                ? new Date(param.time * 1000).toLocaleString()
                : String(param.time);

            setHoverTooltip({
              x: param.point.x,
              y: param.point.y,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              time: timeLabel,
            });
          }
        });

        candlestickSeries.setData(
          history as unknown as CandlestickData<Time>[],
        );

        setLoading(false);
        chart.timeScale().fitContent();

        setContainerWidth(container.clientWidth);

        resizeObserver = new ResizeObserver((entries) => {
          if (entries.length === 0 || !entries[0].contentRect) return;
          const { width } = entries[0].contentRect;
          chart?.resize(width, 450);
          setContainerWidth(width);
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
      setHoverTooltip(null);
      if (resizeObserver && container) {
        resizeObserver.unobserve(container);
      }
      if (chart) {
        chart.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        markersApiRef.current = null;
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

  const tooltipStyle = useMemo(() => {
    if (!hoverTooltip || containerWidth === 0) return undefined;
    const tooltipWidth = 180;
    const padding = 12;

    let left = hoverTooltip.x + padding;
    if (left + tooltipWidth > containerWidth) {
      left = hoverTooltip.x - tooltipWidth - padding;
    }

    let top = hoverTooltip.y + padding;
    if (top + 120 > 450) {
      top = hoverTooltip.y - 120 - padding;
    }

    return { left, top };
  }, [hoverTooltip, containerWidth]);

  const isUp = hoverTooltip ? hoverTooltip.close >= hoverTooltip.open : true;

  return (
    <div className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl transition-shadow duration-200 hover:shadow-2xl hover:shadow-emerald-500/5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          {formatPair(symbol)}
        </h2>
      </div>

      <div className="mb-3 flex items-center gap-1 flex-wrap">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => handleIntervalChange(tf.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
              interval === tf.value
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-emerald-300 hover:-translate-y-0.5"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[450px] select-none">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500"></div>
            <p className="mt-3 text-xs text-slate-400">Loading chart data...</p>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />

        {hoverTooltip && tooltipStyle && (
          <div
            className="pointer-events-none absolute z-20 w-[180px] rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-[11px] shadow-lg backdrop-blur-sm transition-opacity duration-100"
            style={{ left: tooltipStyle.left, top: tooltipStyle.top }}
          >
            <p className="mb-1.5 text-slate-400">{hoverTooltip.time}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-slate-500">O</span>
              <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                {hoverTooltip.open.toFixed(2)}
              </span>
              <span className="text-slate-500">H</span>
              <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                {hoverTooltip.high.toFixed(2)}
              </span>
              <span className="text-slate-500">L</span>
              <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                {hoverTooltip.low.toFixed(2)}
              </span>
              <span className="text-slate-500">C</span>
              <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                {hoverTooltip.close.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}