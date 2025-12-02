import { BinanceTickerMessage, ConnectionStatus } from "@/types";

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
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;

  private tickerBuffer: BinanceTickerMessage | null = null;

  // Important
  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(symbol = "BTCUSDT") {
    this.symbol = symbol.toLocaleLowerCase();

    this.cleanup();

    this.updateStatus("connecting");

    const streams = [`${this.symbol}@ticker`].join("/");
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    console.log(wsUrl);
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
    };

    this.clearBuffers();
    return updates;
  }

  public disconnect() {
    this.cleanup();
    this.updateStatus("disconnected");
  }

  public clearBuffers() {
    this.tickerBuffer = null;
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
    console.log(stream, data);
    this.tickerBuffer = data as BinanceTickerMessage;
  }

  public hasData(): boolean {
    return this.tickerBuffer !== null;
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
      this.connect(this.symbol);
    }, this.reconnectDelay);
  }
}

export const wsService = WebSocketService.getInstance();
