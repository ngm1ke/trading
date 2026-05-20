"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useAppDispatch from "@/hooks/useAppDispatch";
import useAppSelector from "@/hooks/useAppSelector";
import { formatPrice, formatQuantity, parseSymbol } from "@/utils/formatter";
import { placeOrder } from "@/store/portfolioSlice";

const limitSchema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Price must be a positive number",
    )
    .refine((val) => {
      const parts = val.split(".");
      return parts.length < 2 || parts[1].length <= 2;
    }, "Price tick size is 0.01 (max 2 decimal places)"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0.00001,
      "Quantity must be at least 0.00001",
    )
    .refine((val) => parseFloat(val) <= 100, "Quantity cannot exceed 100")
    .refine((val) => {
      const parts = val.split(".");
      return parts.length < 2 || parts[1].length <= 5;
    }, "Quantity step size is 0.00001 (max 5 decimal places)"),
});

const marketSchema = z.object({
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0.00001,
      "Quantity must be at least 0.00001",
    )
    .refine((val) => parseFloat(val) <= 100, "Quantity cannot exceed 100")
    .refine((val) => {
      const parts = val.split(".");
      return parts.length < 2 || parts[1].length <= 5;
    }, "Quantity step size is 0.00001 (max 5 decimal places)"),
});

type LimitFormValues = z.infer<typeof limitSchema>;
type MarketFormValues = z.infer<typeof marketSchema>;

export function TradingForm() {
  const dispatch = useAppDispatch();
  const balances = useAppSelector((state) => state.portfolio.balances);
  const ticker = useAppSelector((state) => state.ticker.data);
  const symbol = useAppSelector((state) => state.ui.symbol);

  // Derive base/quote from current pair
  const { base, quote } = parseSymbol(symbol);

  // States
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentPrice = ticker?.price || 0;

  // React Hook Form setups
  const limitForm = useForm<LimitFormValues>({
    resolver: zodResolver(limitSchema),
    defaultValues: { price: "", quantity: "" },
  });

  const marketForm = useForm<MarketFormValues>({
    resolver: zodResolver(marketSchema),
    defaultValues: { quantity: "" },
  });

  // Reset forms when pair changes
  useEffect(() => {
    limitForm.reset({ price: "", quantity: "" });
    marketForm.reset({ quantity: "" });
    setSuccessMsg(null);
  }, [symbol, limitForm, marketForm]);

  // Autofill limit price to current market price
  useEffect(() => {
    if (currentPrice && !limitForm.getValues("price")) {
      limitForm.setValue("price", currentPrice.toFixed(2));
    }
  }, [currentPrice, limitForm]);

  // Read watch values to calculate dynamic totals
  const watchLimitPrice = limitForm.watch("price");
  const watchLimitQty = limitForm.watch("quantity");
  const watchMarketQty = marketForm.watch("quantity");

  const limitTotal =
    parseFloat(watchLimitPrice) && parseFloat(watchLimitQty)
      ? parseFloat(watchLimitPrice) * parseFloat(watchLimitQty)
      : 0;

  const marketTotal =
    currentPrice && parseFloat(watchMarketQty)
      ? currentPrice * parseFloat(watchMarketQty)
      : 0;

  // Available balances (dynamic based on current pair)
  const quoteBalance = balances[quote]?.free || 0;
  const baseBalance = balances[base]?.free || 0;

  const onSubmitLimit = async (values: LimitFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    setSuccessMsg(null);

    const price = parseFloat(values.price);
    const quantity = parseFloat(values.quantity);
    const totalCost = price * quantity;

    // Local balance validation
    if (side === "BUY") {
      if (totalCost > quoteBalance) {
        limitForm.setError("quantity", {
          message: `Insufficient ${quote} balance`,
        });
        setSubmitting(false);
        return;
      }
    } else {
      if (quantity > baseBalance) {
        limitForm.setError("quantity", {
          message: `Insufficient ${base} balance`,
        });
        setSubmitting(false);
        return;
      }
    }

    // Place Limit Order
    dispatch(
      placeOrder({
        side,
        type: "LIMIT",
        price,
        quantity,
        currentTickerPrice: currentPrice,
      }),
    );

    // Mock successful submission delay
    setSuccessMsg(`Limit ${side} order placed successfully!`);
    limitForm.reset({ price: price.toFixed(2), quantity: "" });

    setTimeout(() => {
      setSuccessMsg(null);
      setSubmitting(false);
    }, 2000);
  };

  const onSubmitMarket = async (values: MarketFormValues) => {
    if (submitting) return;
    if (!currentPrice) {
      marketForm.setError("quantity", {
        message: "Waiting for ticker price...",
      });
      return;
    }
    setSubmitting(true);
    setSuccessMsg(null);

    const quantity = parseFloat(values.quantity);
    const totalCost = currentPrice * quantity;

    // Local balance validation
    if (side === "BUY") {
      if (totalCost > quoteBalance) {
        marketForm.setError("quantity", {
          message: `Insufficient ${quote} balance`,
        });
        setSubmitting(false);
        return;
      }
    } else {
      if (quantity > baseBalance) {
        marketForm.setError("quantity", {
          message: `Insufficient ${base} balance`,
        });
        setSubmitting(false);
        return;
      }
    }

    // Place Market Order (executes immediately)
    dispatch(
      placeOrder({
        side,
        type: "MARKET",
        price: currentPrice,
        quantity,
        currentTickerPrice: currentPrice,
      }),
    );

    setSuccessMsg(`Market ${side} order executed successfully!`);
    marketForm.reset({ quantity: "" });

    setTimeout(() => {
      setSuccessMsg(null);
      setSubmitting(false);
    }, 2000);
  };

  const handlePercentClick = (percent: number) => {
    if (orderType === "LIMIT") {
      const price = parseFloat(watchLimitPrice) || currentPrice;
      if (!price) return;
      if (side === "BUY") {
        const targetQuote = quoteBalance * percent;
        const qty = targetQuote / price;
        limitForm.setValue("quantity", qty.toFixed(5));
      } else {
        const qty = baseBalance * percent;
        limitForm.setValue("quantity", qty.toFixed(5));
      }
    } else {
      if (!currentPrice) return;
      if (side === "BUY") {
        const targetQuote = quoteBalance * percent;
        const qty = targetQuote / currentPrice;
        marketForm.setValue("quantity", qty.toFixed(5));
      } else {
        const qty = baseBalance * percent;
        marketForm.setValue("quantity", qty.toFixed(5));
      }
    }
  };

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-xs text-slate-300">
      {/* Side Tabs (Buy / Sell) */}
      <div className="mb-4 flex rounded-lg bg-slate-900 p-0.5 font-bold">
        <button
          type="button"
          onClick={() => {
            setSide("BUY");
            setSuccessMsg(null);
          }}
          className={`flex-1 rounded-md py-2 text-center transition-all ${
            side === "BUY"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => {
            setSide("SELL");
            setSuccessMsg(null);
          }}
          className={`flex-1 rounded-md py-2 text-center transition-all ${
            side === "SELL"
              ? "bg-rose-500 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          SELL
        </button>
      </div>

      {/* Order Type Selector */}
      <div className="mb-4 flex space-x-4 border-b border-slate-900 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setOrderType("LIMIT");
            setSuccessMsg(null);
          }}
          className={`pb-1 border-b-2 transition-colors ${
            orderType === "LIMIT"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Limit
        </button>
        <button
          type="button"
          onClick={() => {
            setOrderType("MARKET");
            setSuccessMsg(null);
          }}
          className={`pb-1 border-b-2 transition-colors ${
            orderType === "MARKET"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Market
        </button>
      </div>

      {/* Balances */}
      <div className="mb-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>Available</span>
        <span className="font-semibold text-slate-200">
          {side === "BUY"
            ? `${formatPrice(quoteBalance)} ${quote}`
            : `${formatQuantity(baseBalance)} ${base}`}
        </span>
      </div>

      {/* Form Fields */}
      {orderType === "LIMIT" ? (
        <form
          onSubmit={limitForm.handleSubmit(onSubmitLimit)}
          className="space-y-4"
        >
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Price ({quote})
            </label>
            <div className="relative rounded-lg border border-slate-800 bg-slate-900/60 focus-within:border-slate-700">
              <input
                {...limitForm.register("price")}
                type="text"
                placeholder="0.00"
                className="w-full bg-transparent px-3 py-2 text-slate-100 outline-none placeholder-slate-600"
              />
              <span className="absolute right-3 top-2.5 font-semibold text-slate-600">
                USDT
              </span>
            </div>
            {limitForm.formState.errors.price && (
              <p className="mt-1 text-[10px] text-rose-400">
                {limitForm.formState.errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Quantity ({base})
            </label>
            <div className="relative rounded-lg border border-slate-800 bg-slate-900/60 focus-within:border-slate-700">
              <input
                {...limitForm.register("quantity")}
                type="text"
                placeholder="0.00000"
                className="w-full bg-transparent px-3 py-2 text-slate-100 outline-none placeholder-slate-600"
              />
            </div>
            {limitForm.formState.errors.quantity && (
              <p className="mt-1 text-[10px] text-rose-400">
                {limitForm.formState.errors.quantity.message}
              </p>
            )}
          </div>

          {/* Quick Percent Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={`pct-${pct}`}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className="rounded border border-slate-800 bg-slate-900 py-1 text-center font-medium hover:bg-slate-800 hover:text-white"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {/* Order Details / Total */}
          <div className="border-t border-slate-900 pt-3 text-[11px] space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Order Cost</span>
              <span className="font-semibold text-slate-200">
                {formatPrice(limitTotal)} {quote}
              </span>
            </div>
          </div>

          {successMsg && (
            <div className="rounded bg-emerald-950/40 border border-emerald-800/40 p-2.5 text-emerald-400 text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg py-2.5 font-bold text-white shadow-md transition-all active:scale-[0.98] ${
              side === "BUY"
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-950/10"
                : "bg-rose-500 hover:bg-rose-600 shadow-rose-950/10"
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {submitting ? "Placing Order..." : `${side} ${base}`}
          </button>
        </form>
      ) : (
        <form
          onSubmit={marketForm.handleSubmit(onSubmitMarket)}
          className="space-y-4"
        >
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Price ({quote})
            </label>
            <div className="relative rounded-lg border border-slate-800 bg-slate-900/30 opacity-70">
              <input
                type="text"
                disabled
                value="Market Price"
                className="w-full bg-transparent px-3 py-2 font-semibold text-slate-400 outline-none"
              />
              <span className="absolute right-3 top-2.5 font-semibold text-slate-600">
                USDT
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Quantity ({base})
            </label>
            <div className="relative rounded-lg border border-slate-800 bg-slate-900/60 focus-within:border-slate-700">
              <input
                {...marketForm.register("quantity")}
                type="text"
                placeholder="0.00000"
                className="w-full bg-transparent px-3 py-2 text-slate-100 outline-none placeholder-slate-600"
              />
            </div>
            {marketForm.formState.errors.quantity && (
              <p className="mt-1 text-[10px] text-rose-400">
                {marketForm.formState.errors.quantity.message}
              </p>
            )}
          </div>

          {/* Quick Percent Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={`pct-${pct}`}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className="rounded border border-slate-800 bg-slate-900 py-1 text-center font-medium hover:bg-slate-800 hover:text-white"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {/* Order Details / Total */}
          <div className="border-t border-slate-900 pt-3 text-[11px] space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Estimated Cost</span>
              <span className="font-semibold text-slate-200">
                {formatPrice(marketTotal)} {quote}
              </span>
            </div>
          </div>

          {successMsg && (
            <div className="rounded bg-emerald-950/40 border border-emerald-800/40 p-2.5 text-emerald-400 text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg py-2.5 font-bold text-white shadow-md transition-all active:scale-[0.98] ${
              side === "BUY"
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-950/10"
                : "bg-rose-500 hover:bg-rose-600 shadow-rose-950/10"
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {submitting ? "Executing..." : `${side} ${base}`}
          </button>
        </form>
      )}
    </div>
  );
}
export default TradingForm;
