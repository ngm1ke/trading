import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { batchSocketUpdate, RootState } from "./index";

interface OrderBookSliceState {
  bids: Record<string, number>;
  asks: Record<string, number>;
  lastUpdateId: number;
}

const initialState: OrderBookSliceState = {
  bids: {},
  asks: {},
  lastUpdateId: 0,
};

const orderBookSlice = createSlice({
  name: "orderBook",
  initialState,
  reducers: {
    setSnapshot(
      state,
      action: PayloadAction<{
        bids: [string, string][];
        asks: [string, string][];
        lastUpdateId: number;
      }>,
    ) {
      const { bids, asks, lastUpdateId } = action.payload;
      state.lastUpdateId = lastUpdateId;
      state.bids = {};
      state.asks = {};

      for (const [price, qty] of bids) {
        state.bids[price] = parseFloat(qty);
      }
      for (const [price, qty] of asks) {
        state.asks[price] = parseFloat(qty);
      }
    },
    clearOrderBook(state) {
      state.bids = {};
      state.asks = {};
      state.lastUpdateId = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(batchSocketUpdate, (state, action) => {
      const depthMsgs = action.payload.depths;
      if (depthMsgs.length === 0) return;

      for (const msg of depthMsgs) {
        // bids
        for (const [price, qtyStr] of msg.b) {
          const qty = parseFloat(qtyStr);
          if (qty === 0) {
            delete state.bids[price];
          } else {
            state.bids[price] = qty;
          }
        }

        // asks
        for (const [price, qtyStr] of msg.a) {
          const qty = parseFloat(qtyStr);
          if (qty === 0) {
            delete state.asks[price];
          } else {
            state.asks[price] = qty;
          }
        }

        state.lastUpdateId = msg.u;
      }
    });
  },
});

export const { setSnapshot, clearOrderBook } = orderBookSlice.actions;
export const orderBookReducer = orderBookSlice.reducer;

const selectBidsRecord = (state: RootState) => state.orderBook.bids;
const selectAsksRecord = (state: RootState) => state.orderBook.asks;

export const selectSortedBids = createSelector([selectBidsRecord], (bids) => {
  const sorted = Object.keys(bids)
    .map((price) => ({ price, quantity: bids[price] }))
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, 100);

  let total = 0;
  const items = sorted.map((item) => {
    total += item.quantity;
    return {
      ...item,
      total,
    };
  });

  const maxTotal = total || 1;
  return items.map((item) => ({
    price: item.price,
    quantity: item.quantity.toFixed(5),
    total: item.total.toFixed(5),
    depthPercent: Math.min((item.total / maxTotal) * 100, 100), // TODO
  }));
});

export const selectSortedAsks = createSelector([selectAsksRecord], (asks) => {
  const sorted = Object.keys(asks)
    .map((price) => ({ price, quantity: asks[price] }))
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    .slice(0, 100);

  let total = 0;
  const items = sorted.map((item) => {
    total += item.quantity;
    return {
      ...item,
      total,
    };
  });

  const maxTotal = total || 1;
  return items.map((item) => ({
    price: item.price,
    quantity: item.quantity.toFixed(5),
    total: item.total.toFixed(5),
    depthPercent: Math.min((item.total / maxTotal) * 100, 100),
  }));
});

export const selectSpreadInfo = createSelector(
  [selectBidsRecord, selectAsksRecord],
  (bids, asks) => {
    const bidPrices = Object.keys(bids);
    const askPrices = Object.keys(asks);
    if (bidPrices.length === 0 || askPrices.length === 0) {
      return { spread: "0.00", spreadPercent: "0.0000", midPrice: "0.00" };
    }

    let maxBid = -Infinity;
    for (const p of bidPrices) {
      const val = parseFloat(p);
      if (val > maxBid) maxBid = val;
    }

    let minAsk = Infinity;
    for (const p of askPrices) {
      const val = parseFloat(p);
      if (val < minAsk) minAsk = val;
    }

    if (maxBid === -Infinity || minAsk === Infinity) {
      return { spread: "0.00", spreadPercent: "0.0000", midPrice: "0.00" };
    }

    const spread = minAsk - maxBid;
    // const spreadPercent = (spread / minAsk) * 100;
    // const midPrice = (minAsk + maxBid) / 2;

    return {
      spread: spread.toFixed(2),
    };
  },
);
