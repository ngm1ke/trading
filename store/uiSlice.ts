import { ConnectionStatus } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  symbol: string;
  connectionStatus: ConnectionStatus;
}

const initialState: UiState = {
  symbol: "BTCUSDT",
  connectionStatus: "disconnected",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload.toUpperCase();
    },
    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
  },
});

export const { setSymbol, setConnectionStatus } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
