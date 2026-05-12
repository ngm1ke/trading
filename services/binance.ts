import { Candlestick } from "@/types";

const BASE_URL = "https://api.binance.com/api/v3";

export interface BinanceDepthResponse {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export async function fetchOrderBookSnapshot(
  symbol: string = "BTCUSDT",
  limit: number = 100,
  signal?: AbortSignal,
): Promise<BinanceDepthResponse> {
  const url = `${BASE_URL}/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch order book snapshot: ${response.statusText}`,
    );
  }
  return response.json();
}

export async function fetchHistoricalKlines(
  symbol: string = "BTCUSDT",
  interval: string = "1m",
  limit: number = 500,
): Promise<Candlestick[]> {
  const url = `${BASE_URL}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch historical klines: ${response.statusText}`,
    );
  }
  const data = (await response.json()) as Array<Array<string | number>>;

  // [
  //   [
  //     1499040000000,      // Kline open time
  //     "0.01634790",       // Open price
  //     "0.08000000",       // High price
  //     "0.01575800",       // Low price
  //     "0.01577100",       // Close price
  //     "148976.11427815",  // Volume
  //     1499644799999,      // Kline Close time
  //     "2434.19055334",    // Quote asset volume
  //     308,                // Number of trades
  //     "1756.87402397",    // Taker buy base asset volume
  //     "28.46694368",      // Taker buy quote asset volume
  //     "0"                 // Unused field
  //   ]
  // ]
  return data.map((item) => ({
    time: Math.floor((item[0] as number) / 1000), // convert to seconds
    open: parseFloat(item[1] as string),
    high: parseFloat(item[2] as string),
    low: parseFloat(item[3] as string),
    close: parseFloat(item[4] as string),
    volume: parseFloat(item[5] as string),
  }));
}
