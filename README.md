# Binance Real-Time Trading Dashboard

Real-time cryptocurrency trading dashboard built with **Next.js 16**, powered by **Binance WebSocket** and **REST API**. Displays live Order Book, Candlestick Chart, and Trade History with high-performance rendering optimizations.

## Features

| Feature | Data Source | Update Method |
|---|---|---|
| 📊 **Candlestick Chart** | REST API (`/api/v3/klines`) + WS `@kline_<interval>` | Historical load → real-time update |
| 📕 **Order Book** | REST API (`/api/v3/depth`) + WS `@depth@100ms` | Snapshot → diff updates |
| 📜 **Trade History** | WS `@trade` | Real-time stream |
| 📈 **Ticker** | WS `@ticker` | Real-time stream |

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **State Management:** Redux Toolkit (RTK) + React-Redux
- **Chart:** [Lightweight Charts](https://github.com/nickkxsper/lightweight-charts) v5 (TradingView)
- **Virtualization:** TanStack Virtual (order book rows)
- **Styling:** Tailwind CSS v4

### Binance API Integration

#### WebSocket — Real-time Streams

Connects to Binance Combined Stream via a single WebSocket connection:

```
wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/btcusdt@trade/btcusdt@kline_1m/btcusdt@depth@100ms
```

**4 streams** subscribed simultaneously:

| Stream | Description | Frequency |
|---|---|---|
| `<symbol>@ticker` | Price, volume, 24h change | ~1s |
| `<symbol>@trade` | Each matched trade | Continuous |
| `<symbol>@kline_<interval>` | Real-time candlestick (OHLCV) | ~2s |
| `<symbol>@depth@100ms` | Order book diff (bids/asks changes) | 100ms |

#### REST API — Initial Data

| Endpoint | Purpose | File |
|---|---|---|
| `GET /api/v3/depth` | Snapshot order book (100 levels) | `services/binance.ts` |
| `GET /api/v3/klines` | Historical candlesticks (500 bars) | `services/binance.ts` |

## Summary

| Technique | Purpose |
|---|---|
| WebSocket Combined Stream | Single connection for all data streams |
| `requestAnimationFrame` loop | Buffer messages, flush at frame rate |
| `batchSocketUpdate` action | Single dispatch for all data types |
| `createSelector` | Memoize sorted order book |
| `@tanstack/react-virtual` | Only render visible rows |
| Disable middleware checks | Reduce overhead for high-frequency updates |
| Exponential backoff reconnect | Auto-reconnect on WebSocket disconnect |
