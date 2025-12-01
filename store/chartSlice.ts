import { createSlice } from "@reduxjs/toolkit";
import { Candlestick } from "@/types";

interface ChartSliceState {
  lastKline: Candlestick | null;
}

const initialState: ChartSliceState = {
  lastKline: null,
};

const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export const chartReducer = chartSlice.reducer;
