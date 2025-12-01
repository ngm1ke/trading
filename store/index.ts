import { configureStore, createAction } from "@reduxjs/toolkit";

import { uiReducer } from "./uiSlice";

import { chartReducer } from "./chartSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    chart: chartReducer,
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
