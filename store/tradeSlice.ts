import { createSlice } from "@reduxjs/toolkit";
import { batchSocketUpdate } from "./index";
import { Trade } from "@/types";

interface TradeState {
  trades: Trade[];
}

const initialState: TradeState = {
  trades: [],
};

const tradeSlice = createSlice({
  name: "trade",
  initialState,
  reducers: {
    clearTrades(state) {
      state.trades = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(batchSocketUpdate, (state, action) => {
      const socketTrades = action.payload.trades;
      if (socketTrades.length > 0) {
        const formatted = socketTrades.map((t) => ({
          id: t.t.toString(),
          price: parseFloat(t.p),
          quantity: parseFloat(t.q),
          time: t.T,
          isBuyerMaker: t.m,
        }));

        state.trades = [...formatted.reverse(), ...state.trades].slice(0, 100);
      }
    });
  },
});

export const { clearTrades } = tradeSlice.actions;
export const tradeReducer = tradeSlice.reducer;
