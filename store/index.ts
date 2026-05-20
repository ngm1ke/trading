import { configureStore, createAction } from "@reduxjs/toolkit";

import { uiReducer } from "./uiSlice";

import { chartReducer } from "./chartSlice";
import {
  BinanceDepthMessage,
  BinanceKlineMessage,
  BinanceTickerMessage,
  BinanceTradeMessage,
} from "@/types";
import { tickerReducer } from "./tickerSlice";
import { orderBookReducer } from "./orderBookSlice";
import { tradeReducer } from "./tradeSlice";
import { portfolioReducer } from "./portfolioSlice";

export const batchSocketUpdate = createAction<{
  ticker: BinanceTickerMessage | null;
  trades: BinanceTradeMessage[];
  depths: BinanceDepthMessage[];
  kline: BinanceKlineMessage | null;
}>("trading/batchSocketUpdate");


export const store = configureStore({
  reducer: {
    ui: uiReducer,
    chart: chartReducer,
    ticker: tickerReducer,
    trade: tradeReducer,
    orderBook: orderBookReducer,
    portfolio: portfolioReducer,
  },
  // Disable serializability check for high performance frames
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
