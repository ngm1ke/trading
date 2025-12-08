"use client";

import React, { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useAppDispatch from "@/hooks/useAppDispatch";
import useAppSelector from "@/hooks/useAppSelector";
import { fetchOrderBookSnapshot } from "@/services/binance";
import { setSnapshot } from "@/store/orderBookSlice";
import {
  selectSortedBids,
  selectSortedAsks,
  selectSpreadInfo,
} from "@/store/orderBookSlice";
import { formatPrice } from "@/utils/formatter";

function formatPair(symbol: string) {
  const idx = symbol.indexOf("USDT");
  if (idx > 0) return symbol.slice(0, idx) + " / USDT";
  return symbol;
}

export function OrderBook() {
  const dispatch = useAppDispatch();
  const symbol = useAppSelector((state) => state.ui.symbol);
  const sortedBids = useAppSelector(selectSortedBids);
  const sortedAsks = useAppSelector(selectSortedAsks);
  const spreadInfo = useAppSelector(selectSpreadInfo);
  const ticker = useAppSelector((state) => state.ticker.data);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const snapshot = await fetchOrderBookSnapshot(symbol, 100);
        dispatch(setSnapshot(snapshot));
      } catch (err) {
        console.error("Failed to load order book snapshot:", err);
      }
    }
    loadSnapshot();
  }, [dispatch, symbol]);

  // Virtualization for Asks
  const asksParentRef = useRef<HTMLDivElement>(null);
  const asksVirtualizer = useVirtualizer({
    count: sortedAsks.length,
    getScrollElement: () => asksParentRef.current,
    estimateSize: () => 22,
    overscan: 10,
  });

  // Virtualization for Bids
  const bidsParentRef = useRef<HTMLDivElement>(null);
  const bidsVirtualizer = useVirtualizer({
    count: sortedBids.length,
    getScrollElement: () => bidsParentRef.current,
    estimateSize: () => 22,
    overscan: 10,
  });

  const reversedAsks = [...sortedAsks].reverse();

  return (
    <div className="flex h-[600px] w-full flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-xs text-slate-300">
      <div className="mb-3 flex items-center justify-between border-b border-slate-900 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Order Book
        </h2>
        <span className="text-[10px] text-slate-500">{formatPair(symbol)}</span>
      </div>

      <div className="mb-1 flex w-full justify-between text-[10px] font-semibold text-slate-500 uppercase">
        <span className="w-1/3 text-left">Price (USDT)</span>
        <span className="w-1/3 text-right">Size (BTC)</span>
        <span className="w-1/3 text-right">Total (BTC)</span>
      </div>

      <div
        ref={asksParentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden border-b border-slate-900/50 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        style={{ contentVisibility: "auto" }}
      >
        <div
          className="relative w-full"
          style={{ height: `${asksVirtualizer.getTotalSize()}px` }}
        >
          {asksVirtualizer.getVirtualItems().map((virtualRow) => {
            const entry = reversedAsks[virtualRow.index];
            if (!entry) return null;

            return (
              <div
                key={`ask-${entry.price}-${entry.quantity}`}
                className="absolute left-0 top-0 flex w-full items-center justify-between py-[2px] transition-all hover:bg-slate-900/40"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Horizontal Depth visual bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-950/40 transition-all duration-300 pointer-events-none"
                  style={{ width: `${entry.depthPercent}%` }}
                />

                <span className="w-1/3 text-left font-semibold text-rose-400 relative z-10">
                  {formatPrice(entry.price)}
                </span>
                <span className="w-1/3 text-right font-medium text-slate-300 relative z-10">
                  {entry.quantity}
                </span>
                <span className="w-1/3 text-right font-medium text-slate-400 relative z-10">
                  {entry.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="my-2 flex items-center justify-between border-y border-slate-900 bg-slate-900/20 px-2 py-1.5 font-bold">
        <div className="mx-auto flex items-center space-x-2">
          <span
            className={`text-sm ${ticker && ticker.priceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {ticker ? formatPrice(ticker.price) : "0.00"}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">
            Spread:{" "}
            <span className="text-slate-300 font-semibold">
              {spreadInfo.spread}
            </span>{" "}
          </span>
        </div>
      </div>

      <div
        ref={bidsParentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        style={{ contentVisibility: "auto" }}
      >
        <div
          className="relative w-full"
          style={{ height: `${bidsVirtualizer.getTotalSize()}px` }}
        >
          {bidsVirtualizer.getVirtualItems().map((virtualRow) => {
            const entry = sortedBids[virtualRow.index];
            if (!entry) return null;

            return (
              <div
                key={`bid-${entry.price}-${entry.quantity}`}
                className="absolute left-0 top-0 flex w-full items-center justify-between py-[2px] transition-all hover:bg-slate-900/40"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Horizontal Depth visual bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-950/60 transition-all duration-300 pointer-events-none"
                  style={{ width: `${entry.depthPercent}%` }}
                />

                <span className="w-1/3 text-left font-semibold text-emerald-400 relative z-10">
                  {formatPrice(entry.price)}
                </span>
                <span className="w-1/3 text-right font-medium text-slate-300 relative z-10">
                  {entry.quantity}
                </span>
                <span className="w-1/3 text-right font-medium text-slate-400 relative z-10">
                  {entry.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default OrderBook;
