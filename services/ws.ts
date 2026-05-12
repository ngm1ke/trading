import {
  BinanceDepthMessage,
  BinanceKlineMessage,
  BinanceTickerMessage,
  BinanceTradeMessage,
  ConnectionStatus,
  KlineInterval,
} from "@/types";

interface StreamPayload {
  stream: string;
  data: unknown;
}

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private statusCallback: ((status: ConnectionStatus) => void) | null = null;
  private symbol: string = "BTCUSDT";
  private klineInterval: KlineInterval = "1m";
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;

  private tickerBuffer: BinanceTickerMessage | null = null;
  private klineBuffer: BinanceKlineMessage | null = null;
  private tradeBuffer: BinanceTradeMessage[] = [];
  private depthBuffer: BinanceDepthMessage[] = [];

  // Important
  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(symbol = "BTCUSDT", klineInterval: KlineInterval = "1m") {
    this.symbol = symbol.toLocaleLowerCase();

    this.cleanup();

    this.updateStatus("connecting");
    const streams = [
      `${this.symbol}@ticker`,
      `${this.symbol}@trade`,
      `${this.symbol}@kline_${klineInterval}`,
      `${this.symbol}@depth@100ms`,
    ].join("/");
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.updateStatus("connected");
        this.reconnectDelay = 1000; // Reset delay on success
      };

      this.socket.onmessage = (event) => {
        try {
          const payload: StreamPayload = JSON.parse(event.data);
          this.handleIncomingMessage(payload);
        } catch (e) {
          console.error("Error parsing WebSocket message", e);
        }
      };
      this.socket.onerror = (event) => {
        console.error("onerror", event);
      };
      this.socket.onclose = (event) => {
        console.warn(
          `WebSocket closed: code ${event.code}, reason: ${event.reason}`,
        );
        this.updateStatus("disconnected");
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error("connect socket error", error);
      this.updateStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  public flush() {
    const updates = {
      ticker: this.tickerBuffer,
      trades: [...this.tradeBuffer],
      depths: [...this.depthBuffer],
      kline: this.klineBuffer,
    };

    this.clearBuffers();
    return updates;
  }

  public disconnect() {
    this.cleanup();
    this.updateStatus("disconnected");
  }

  public setSymbol(symbol: string) {
    const lower = symbol.toLowerCase();
    if (this.symbol === lower) return;
    this.connect(lower, this.klineInterval);
  }

  public setKlineInterval(interval: KlineInterval) {
    if (this.klineInterval === interval) return;
    this.klineInterval = interval;
    if (this.socket) {
      this.connect(this.symbol, interval);
    }
  }

  public clearBuffers() {
    this.tickerBuffer = null;
    this.klineBuffer = null;
    this.tradeBuffer = [];
    this.depthBuffer = [];
  }

  public setStatusCallback(callback: (status: ConnectionStatus) => void) {
    this.statusCallback = callback;
    // Immediately emit current status to the new subscriber
    callback(this.status);
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    if (this.statusCallback) {
      this.statusCallback(newStatus);
    }
  }

  private handleIncomingMessage(payload: StreamPayload) {
    const { stream, data } = payload;

    if (stream.endsWith("@ticker")) {
      this.tickerBuffer = data as BinanceTickerMessage;
    } else if (stream.endsWith("@trade")) {
      this.tradeBuffer.push(data as BinanceTradeMessage);
      if (this.tradeBuffer.length > 500) {
        this.tradeBuffer.shift();
      }
    } else if (stream.endsWith("@depth@100ms")) {
      this.depthBuffer.push(data as BinanceDepthMessage);
      if (this.depthBuffer.length > 100) {
        this.depthBuffer.shift();
      }
    } else if (stream.includes("@kline_")) {
      this.klineBuffer = data as BinanceKlineMessage;
    }
  }

  public hasData(): boolean {
    return (
      this.tickerBuffer !== null ||
      this.klineBuffer !== null ||
      this.tradeBuffer.length > 0 ||
      this.depthBuffer.length > 0
    );
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      // Remove event listeners
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;

      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }
      this.socket = null;
    }

    this.clearBuffers();
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.updateStatus("reconnecting");
    console.log(`Scheduling reconnect in ${this.reconnectDelay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      // Exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay,
      );
      this.connect(this.symbol, this.klineInterval);
    }, this.reconnectDelay);
  }
}

export const wsService = WebSocketService.getInstance();
