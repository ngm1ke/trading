import { createSlice } from "@reduxjs/toolkit";
import { batchSocketUpdate } from "./index";
import { defaultStoreSlices } from "@/utils/consts";

const tickerSlice = createSlice({
  name: "ticker",
  initialState: defaultStoreSlices.ticker,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(batchSocketUpdate, (state, action) => {
      const tickerMsg = action.payload.ticker;
      if (tickerMsg) {
        state.data = {
          symbol: tickerMsg.s,
          price: parseFloat(tickerMsg.c),
          priceChange: parseFloat(tickerMsg.p),
          priceChangePercent: parseFloat(tickerMsg.P),
          high: parseFloat(tickerMsg.h),
          low: parseFloat(tickerMsg.l),
          volume: parseFloat(tickerMsg.v),
          quoteVolume: parseFloat(tickerMsg.q),
        };
      }
    });
  },
});

export const tickerReducer = tickerSlice.reducer;
