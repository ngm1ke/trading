export interface Candlestick {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface BinanceTickerMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Last price
  p: string; // Price change
  P: string; // Price change percent
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

export interface Ticker {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export type KlineInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export interface BinanceKlineMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
  };
}

export interface BinanceTradeMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
}
export interface BinanceDepthMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Last update ID in event
  b: [string, string][]; // Bids to be updated [price, quantity]
  a: [string, string][]; // Asks to be updated [price, quantity]
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean; // true = Sell, false = Buy
}

export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";

export interface LimitOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: "LIMIT";
  price: number;
  quantity: number;
  timestamp: number;
  status: "NEW" | "FILLED" | "CANCELED";
}

export interface OrderHistoryEntry {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  timestamp: number;
  status: "FILLED" | "CANCELED";
  avgExecutionPrice?: number;
}

export interface AssetBalance {
  asset: string;
  free: number;
  locked: number;
}

export interface PortfolioState {
  balances: Record<string, AssetBalance>;
  openOrders: LimitOrder[];
  orderHistory: OrderHistoryEntry[];
}