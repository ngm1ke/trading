"use client";

import React, { useState } from "react";

export function OpenOrders() {
  const [activeTab, setActiveTab] = useState<"OPEN" | "HISTORY">("OPEN");
  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-xs text-slate-300">
      <div className="mb-4 flex space-x-6 border-b border-slate-900 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("OPEN")}
          className={`pb-1.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "OPEN"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <span>Open Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`pb-1.5 border-b-2 transition-colors ${
            activeTab === "HISTORY"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Order History
        </button>
      </div>

      <div className="flex-1 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {activeTab === "OPEN" && (
          <div className="flex h-full min-h-[120px] items-center justify-center text-slate-500 text-[11px]">
            No active open orders. Place a Limit order above to start.
          </div>
        )}
        {activeTab === "HISTORY" && (
          <div className="flex h-full min-h-[120px] items-center justify-center text-slate-500 text-[11px]">
            No order history.
          </div>
        )}
      </div>
    </div>
  );
}
