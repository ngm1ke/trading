import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";
import useAppSelector from "@/hooks/useAppSelector";
import type { RootState } from "@/store";
import type { ConnectionStatus } from "@/types";

vi.mock("@/hooks/useAppSelector", () => ({
  default: vi.fn(),
}));

vi.mock("@/components/SelectPairs", () => ({
  SelectPairs: () => <button>Select Pair</button>,
}));

const mockedUseAppSelector = vi.mocked(useAppSelector);

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const mockStoreState = (state: DeepPartial<RootState>) => {
  mockedUseAppSelector.mockImplementation(
    (selector: (state: RootState) => unknown) =>
      selector(state as unknown as RootState),
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the application name", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: null,
      },
    });

    render(<Header />);

    expect(screen.getByText("Binance Trading Dashboard")).toBeInTheDocument();
  });

  it("shows default ticker values when ticker is unavailable", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: null,
      },
    });

    render(<Header />);

    expect(screen.getByText("Last Price")).toBeInTheDocument();
    expect(screen.getByText("24h Change")).toBeInTheDocument();
    expect(screen.getByText("24h High")).toBeInTheDocument();
    expect(screen.getByText("24h Low")).toBeInTheDocument();

    const zeroValues = screen.getAllByText("0.00");
    // There are 5 instances of "0.00" (Last Price, 24h High, 24h Low, BTC volume, USDT volume)
    expect(zeroValues.length).toBe(5);

    // The 24h Change displays: "0.00 (0.00%)"
    expect(screen.getByText("0.00 (0.00%)")).toBeInTheDocument();
  });

  it("renders ticker data correctly", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: {
          price: 12345.67,
          priceChange: 123.45,
          priceChangePercent: 1.23,
          high: 13000,
          low: 12000,
          volume: 1234.56,
          quoteVolume: 15000000,
        },
      },
    });

    render(<Header />);

    expect(screen.getByText("12,345.67")).toBeInTheDocument();
    expect(
      screen.getByText(/123\.45\s*\(\s*\+1\.23%\s*\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("13,000.00")).toBeInTheDocument();
    expect(screen.getByText("12,000.00")).toBeInTheDocument();
    expect(screen.getByText("1.23K")).toBeInTheDocument();
    expect(screen.getByText("15.00M")).toBeInTheDocument();
  });

  it("shows positive styling when price change is positive", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: {
          price: 100,
          priceChange: 5,
          priceChangePercent: 5,
          high: 110,
          low: 90,
          volume: 1000,
          quoteVolume: 100000,
        },
      },
    });

    render(<Header />);

    const price = screen.getByText("100.00");
    const change = screen.getByText(/5\.00\s*\(\s*\+5\.00%\s*\)/);

    expect(price).toHaveClass("text-emerald-400");
    expect(change).toHaveClass("text-emerald-400");
  });

  it("shows negative styling when price change is negative", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: {
          price: 100,
          priceChange: -5,
          priceChangePercent: -5,
          high: 110,
          low: 90,
          volume: 1000,
          quoteVolume: 100000,
        },
      },
    });

    render(<Header />);

    const price = screen.getByText("100.00");
    const change = screen.getByText(/-5\.00\s*\(\s*-5\.00%\s*\)/);

    expect(price).toHaveClass("text-rose-400");
    expect(change).toHaveClass("text-rose-400");
  });

  it.each([
    ["connected", "Connected", "bg-emerald-500"],
    ["connecting", "Connecting", "bg-amber-500"],
    ["reconnecting", "Reconnecting", "bg-amber-500"],
    ["disconnected", "Disconnected", "bg-rose-500"],
  ])("renders %s connection status", (status, expectedText, expectedColor) => {
    mockStoreState({
      ui: {
        connectionStatus: status as ConnectionStatus,
      },
      ticker: {
        data: null,
      },
    });

    render(<Header />);

    expect(screen.getByText(expectedText)).toBeInTheDocument();

    const indicator = screen.getByText(expectedText).previousElementSibling;
    expect(indicator).toHaveClass(expectedColor);
  });

  it("treats unknown connection status as disconnected", () => {
    mockStoreState({
      ui: {
        connectionStatus: "unknown" as ConnectionStatus,
      },
      ticker: {
        data: null,
      },
    });

    render(<Header />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("treats zero price change as positive", () => {
    mockStoreState({
      ui: {
        connectionStatus: "connected",
      },
      ticker: {
        data: {
          price: 100,
          priceChange: 0,
          priceChangePercent: 0,
          high: 110,
          low: 90,
          volume: 1000,
          quoteVolume: 100000,
        },
      },
    });

    render(<Header />);

    const price = screen.getByText("100.00");
    const change = screen.getByText(/0\.00\s*\(\s*0\.00%\s*\)/);

    expect(price).toHaveClass("text-emerald-400");
    expect(change).toHaveClass("text-emerald-400");
  });
});
