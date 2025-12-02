"use client";

import React from "react";
import useAppSelector from "@/hooks/useAppSelector";
import { formatPercent, formatPrice, formatVolume } from "@/utils/formatter";

function formatPair(symbol: string) {
  const idx = symbol.indexOf("USDT");
  if (idx > 0) return symbol.slice(0, idx) + " / USDT";
  return symbol;
}

export function Header() {
  const symbol = useAppSelector((state) => state.ui.symbol);
  const connectionStatus = useAppSelector((state) => state.ui.connectionStatus);
  const ticker = useAppSelector((state) => state.ticker.data);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500 text-emerald-500";
      case "connecting":
      case "reconnecting":
        return "bg-amber-500 text-amber-500";
      case "disconnected":
      default:
        return "bg-rose-500 text-rose-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "reconnecting":
        return "Reconnecting";
      case "disconnected":
      default:
        return "Disconnected";
    }
  };

  const isChangePositive = ticker ? ticker.priceChange >= 0 : true;

  return (
    <header className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3 text-slate-200 shadow-md">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-emerald-500"></div>
          <span className="text-lg font-bold tracking-wider text-white">
            Let&apos;s TRADE
          </span>
        </div>

        {/* Symbol Indicator */}
        <div className="flex items-center space-x-2 border-l border-slate-800 pl-6">
          <span className="text-xl font-bold tracking-tight text-white">
            {formatPair(symbol)}
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
            SPOT
          </span>
        </div>
      </div>

      {/* Ticker values */}
      <div className="flex items-center space-x-8 text-xs font-medium text-slate-400">
        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            Last Price
          </span>
          <span
            className={`text-base font-bold ${isChangePositive ? "text-emerald-400" : "text-rose-400"}`}
          >
            {ticker ? formatPrice(ticker.price) : "0.00"}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            24h Change
          </span>
          <span
            className={`text-sm font-semibold ${isChangePositive ? "text-emerald-400" : "text-rose-400"}`}
          >
            {ticker ? formatPrice(ticker.priceChange) : "0.00"} (
            {ticker ? formatPercent(ticker.priceChangePercent) : "0.00%"})
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            24h High
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {ticker ? formatPrice(ticker.high) : "0.00"}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            24h Low
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {ticker ? formatPrice(ticker.low) : "0.00"}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            24h Volume (BTC)
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {ticker ? formatVolume(ticker.volume) : "0.00"}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase text-slate-500">
            24h Volume (USDT)
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {ticker ? formatVolume(ticker.quoteVolume) : "0.00"}
          </span>
        </div>
      </div>

      {/* Connection Monitor */}
      <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs">
        <span
          className={`h-2.5 w-2.5 rounded-full ${getStatusColor()} animate-pulse`}
        ></span>
        <span className="text-slate-300 font-semibold">{getStatusText()}</span>
      </div>
    </header>
  );
}
export default Header;
