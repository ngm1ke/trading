import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  LimitOrder,
  OrderSide,
  OrderType,
  OrderHistoryEntry,
  AssetBalance,
} from "@/types";

interface PortfolioSliceState {
  balances: Record<string, AssetBalance>;
  openOrders: LimitOrder[];
  orderHistory: OrderHistoryEntry[];
}

const initialState: PortfolioSliceState = {
  balances: {
    BTC: { asset: "BTC", free: 0.5, locked: 0 },
    USDT: { asset: "USDT", free: 10000.0, locked: 0 },
  },
  openOrders: [],
  orderHistory: [],
};

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    placeOrder(
      state,
      action: PayloadAction<{
        side: OrderSide;
        type: OrderType;
        price: number; // Required for LIMIT, execution price for MARKET
        quantity: number;
        currentTickerPrice: number; // Current ticker price for MARKET orders
      }>,
    ) {
      const { side, type, price, quantity, currentTickerPrice } =
        action.payload;
      const id = "ord_" + Math.random().toString(36).substr(2, 9);
      const timestamp = Date.now();

      if (type === "MARKET") {
        const execPrice = currentTickerPrice;
        if (side === "BUY") {
          const cost = quantity * execPrice;
          const usdtBalance = state.balances["USDT"]?.free || 0;
          if (usdtBalance >= cost) {
            // Deduct USDT
            state.balances["USDT"].free -= cost;
            // Add BTC
            if (!state.balances["BTC"]) {
              state.balances["BTC"] = { asset: "BTC", free: 0, locked: 0 };
            }
            state.balances["BTC"].free += quantity;

            state.orderHistory.unshift({
              id,
              symbol: "BTCUSDT",
              side,
              type,
              price: execPrice,
              quantity,
              timestamp,
              status: "FILLED",
              avgExecutionPrice: execPrice,
            });
          }
        } else {
          // SELL
          const btcBalance = state.balances["BTC"]?.free || 0;
          if (btcBalance >= quantity) {
            // Deduct BTC
            state.balances["BTC"].free -= quantity;
            // Add USDT
            state.balances["USDT"].free += quantity * execPrice;

            state.orderHistory.unshift({
              id,
              symbol: "BTCUSDT",
              side,
              type,
              price: execPrice,
              quantity,
              timestamp,
              status: "FILLED",
              avgExecutionPrice: execPrice,
            });
          }
        }
      } else {
        // LIMIT ORDER
        if (side === "BUY") {
          const cost = quantity * price;
          const usdtBalance = state.balances["USDT"]?.free || 0;
          if (usdtBalance >= cost) {
            // Lock USDT
            state.balances["USDT"].free -= cost;
            state.balances["USDT"].locked += cost;

            state.openOrders.push({
              id,
              symbol: "BTCUSDT",
              side,
              type: "LIMIT",
              price,
              quantity,
              timestamp,
              status: "NEW",
            });
          }
        } else {
          // SELL LIMIT
          const btcBalance = state.balances["BTC"]?.free || 0;
          if (btcBalance >= quantity) {
            // Lock BTC
            state.balances["BTC"].free -= quantity;
            state.balances["BTC"].locked += quantity;

            state.openOrders.push({
              id,
              symbol: "BTCUSDT",
              side,
              type: "LIMIT",
              price,
              quantity,
              timestamp,
              status: "NEW",
            });
          }
        }
      }
    },
    cancelOrder(state, action: PayloadAction<string>) {
      const orderId = action.payload;
      const index = state.openOrders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        const order = state.openOrders[index];

        // Release locked funds
        if (order.side === "BUY") {
          const cost = order.quantity * order.price;
          state.balances["USDT"].locked -= cost;
          state.balances["USDT"].free += cost;
        } else {
          // SELL
          state.balances["BTC"].locked -= order.quantity;
          state.balances["BTC"].free += order.quantity;
        }

        // Add to history as canceled
        state.orderHistory.unshift({
          ...order,
          status: "CANCELED",
        });

        // Remove from open orders
        state.openOrders.splice(index, 1);
      }
    },
    resetBalancesForPair(
      state,
      action: PayloadAction<{ base: string; quote: string }>,
    ) {
      const { base, quote } = action.payload;
      // Default starting balances for simulated trading
      const DEFAULT_QUOTE_BALANCE = 10000;
      const DEFAULT_BASE_BALANCE = 0.5;

      state.balances = {
        [quote]: { asset: quote, free: DEFAULT_QUOTE_BALANCE, locked: 0 },
        [base]: { asset: base, free: DEFAULT_BASE_BALANCE, locked: 0 },
      };
      // Clear open orders (they belong to the previous pair)
      state.openOrders = [];
    },
    fillLimitOrder(
      state,
      action: PayloadAction<{ orderId: string; executionPrice: number }>,
    ) {
      const { orderId, executionPrice } = action.payload;
      const index = state.openOrders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        const order = state.openOrders[index];

        if (order.side === "BUY") {
          const lockedCost = order.quantity * order.price;
          const actualCost = order.quantity * executionPrice;

          // Deduct from locked USDT
          state.balances["USDT"].locked -= lockedCost;
          // Credit BTC free
          if (!state.balances["BTC"]) {
            state.balances["BTC"] = { asset: "BTC", free: 0, locked: 0 };
          }
          state.balances["BTC"].free += order.quantity;

          // Refund any price improvement difference (since it's a limit order,
          // if it executes at a better price, we refund the difference.
          // For simplicity, we executionPrice is usually equal to or better than limit price).
          const refund = lockedCost - actualCost;
          if (refund > 0) {
            state.balances["USDT"].free += refund;
          }
        } else {
          // SELL
          // Deduct locked BTC
          state.balances["BTC"].locked -= order.quantity;
          // Credit USDT free
          state.balances["USDT"].free += order.quantity * executionPrice;
        }

        // Add to history as filled
        state.orderHistory.unshift({
          ...order,
          status: "FILLED",
          avgExecutionPrice: executionPrice,
        });

        // Remove from open orders
        state.openOrders.splice(index, 1);
      }
    },
  },
});

export const { placeOrder, cancelOrder, fillLimitOrder, resetBalancesForPair } =
  portfolioSlice.actions;
export const portfolioReducer = portfolioSlice.reducer;
