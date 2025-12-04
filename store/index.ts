import { configureStore, createAction } from "@reduxjs/toolkit";

import { uiReducer } from "./uiSlice";

import { chartReducer } from "./chartSlice";
import { BinanceKlineMessage, BinanceTickerMessage } from "@/types";
import { tickerReducer } from "./tickerSlice";

export const batchSocketUpdate = createAction<{
  ticker: BinanceTickerMessage | null;
  kline: BinanceKlineMessage | null;
}>("trading/batchSocketUpdate");


export const store = configureStore({
  reducer: {
    ui: uiReducer,
    chart: chartReducer,
    ticker: tickerReducer,
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
