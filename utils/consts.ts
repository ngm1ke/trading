import {
  UiState,
  ChartState,
  OrderBookState,
  PortfolioState,
  TickerState,
  TradeState,
} from "@/types";

export const defaultStoreSlices = {
  ui: {
    symbol: "BTCUSDT",
    connectionStatus: "disconnected",
  } as UiState,
  chart: {
    lastKline: null,
  } as ChartState,
  orderBook: {
    bids: {},
    asks: {},
    lastUpdateId: 0,
  } as OrderBookState,
  portfolio: {
    balances: {
      BTC: { asset: "BTC", free: 0.5, locked: 0 },
      USDT: { asset: "USDT", free: 10000.0, locked: 0 },
    },
    openOrders: [],
    orderHistory: [],
  } as PortfolioState,
  ticker: {
    data: null,
  } as TickerState,
  trade: {
    trades: [],
  } as TradeState,
};

