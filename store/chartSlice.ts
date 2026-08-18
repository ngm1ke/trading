import { createSlice } from "@reduxjs/toolkit";
import { batchSocketUpdate } from ".";
import { defaultStoreSlices } from "@/utils/consts";

const chartSlice = createSlice({
  name: "chart",
  initialState: defaultStoreSlices.chart,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(batchSocketUpdate, (state, action) => {
      const klineMsg = action.payload.kline;
      if (klineMsg) {
        state.lastKline = {
          time: Math.floor(klineMsg.k.t / 1000),
          open: parseFloat(klineMsg.k.o),
          high: parseFloat(klineMsg.k.h),
          low: parseFloat(klineMsg.k.l),
          close: parseFloat(klineMsg.k.c),
          volume: parseFloat(klineMsg.k.v),
        };
      }
    });
  },
});

export const chartReducer = chartSlice.reducer;
