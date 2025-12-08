"use client";

import React from "react";
import useAppSelector from "@/hooks/useAppSelector";
import { formatPrice, formatQuantity, formatTime } from "@/utils/formatter";

export function TradeHistory() {
  const trades = useAppSelector((state) => state.trade.trades);

  const displayTrades = trades.slice(0, 50);

  return (
    <div className="flex h-[600px] w-full flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-xs text-slate-300">
      <div className="mb-3 flex items-center justify-between border-b border-slate-900 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Recent Trades
        </h2>
      </div>

      {/* Column Titles */}
      <div className="mb-1 flex w-full justify-between text-[10px] font-semibold text-slate-500 uppercase">
        <span className="w-1/3 text-left">Price (USDT)</span>
        <span className="w-1/3 text-right">Size (BTC)</span>
        <span className="w-1/3 text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {displayTrades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-[11px]">
            Waiting for trade events...
          </div>
        ) : (
          <div className="flex flex-col">
            {displayTrades.map((trade) => {
              // On Binance: msg.m (isBuyerMaker) indicates if the seller initiated or buyer initiated.
              // If buyer was the maker (isBuyerMaker: true), then taker was the seller -> SELL.
              // If buyer was the taker (isBuyerMaker: false), then taker was the buyer -> BUY.
              const isSell = trade.isBuyerMaker;

              return (
                <div
                  key={trade.id}
                  className="flex w-full items-center justify-between py-[3.5px] hover:bg-slate-900/30 transition-colors"
                >
                  <span
                    className={`w-1/3 text-left font-semibold ${isSell ? "text-rose-400" : "text-emerald-400"}`}
                  >
                    {formatPrice(trade.price)}
                  </span>
                  <span className="w-1/3 text-right font-medium text-slate-300">
                    {formatQuantity(trade.quantity)}
                  </span>
                  <span className="w-1/3 text-right font-medium text-slate-500">
                    {formatTime(trade.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
