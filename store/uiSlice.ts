import { ConnectionStatus } from "@/types";
import { defaultStoreSlices } from "@/utils/consts";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: defaultStoreSlices.ui,
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
