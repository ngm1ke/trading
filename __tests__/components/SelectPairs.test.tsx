import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

import { SelectPairs } from "@/components/SelectPairs";
import useAppSelector from "@/hooks/useAppSelector";
import useAppDispatch from "@/hooks/useAppDispatch";
import { defaultStoreSlices } from "@/utils/consts";
import { wsService } from "@/services/ws";

import { clearOrderBook } from "@/store/orderBookSlice";
import { clearTrades } from "@/store/tradeSlice";
import { setSymbol } from "@/store/uiSlice";
import { resetBalancesForPair } from "@/store/portfolioSlice";

vi.mock("@/hooks/useAppSelector", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/useAppDispatch", () => ({
  default: vi.fn(),
}));

vi.mock("@/services/ws", () => ({
  wsService: {
    setSymbol: vi.fn(),
  },
}));

const mockedUseAppSelector = vi.mocked(useAppSelector);
const mockedUseAppDispatch = vi.mocked(useAppDispatch);
const mockedSetSymbol = vi.mocked(wsService.setSymbol);

describe("SelectPairs", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseAppSelector.mockImplementation((selector) => {
      return selector({
        ...defaultStoreSlices,
      });
    });

    mockedUseAppDispatch.mockReturnValue(mockDispatch);
  });

  it("renders BTCUSDT as the default pair", () => {
    render(<SelectPairs />);

    expect(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    ).toBeInTheDocument();
  });

  it("opens the pair dropdown", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    expect(screen.getByPlaceholderText("Search pair...")).toBeInTheDocument();

    const list = screen.getByRole("list");

    expect(
      within(list).getByRole("button", {
        name: "BTC / USDT",
      }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole("button", {
        name: "BNB / USDT",
      }),
    ).toBeInTheDocument();
  });

  it("filters pairs by search query", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const input = screen.getByPlaceholderText("Search pair...");

    fireEvent.change(input, {
      target: {
        value: "ETH",
      },
    });

    const list = screen.getByRole("list");

    expect(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    ).toBeInTheDocument();

    expect(
      within(list).queryByRole("button", {
        name: "BTC / USDT",
      }),
    ).not.toBeInTheDocument();

    expect(
      within(list).queryByRole("button", {
        name: "BNB / USDT",
      }),
    ).not.toBeInTheDocument();
  });

  it("search is case insensitive", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const input = screen.getByPlaceholderText("Search pair...");

    fireEvent.change(input, {
      target: {
        value: "eth",
      },
    });

    const list = screen.getByRole("list");

    expect(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    ).toBeInTheDocument();
  });

  it("shows no pairs found for an invalid search", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const input = screen.getByPlaceholderText("Search pair...");

    fireEvent.change(input, {
      target: {
        value: "INVALID",
      },
    });

    expect(screen.getByText("No pairs found")).toBeInTheDocument();
  });

  it("selects ETHUSDT", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const list = screen.getByRole("list");

    fireEvent.click(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    );

    expect(mockDispatch).toHaveBeenCalledTimes(4);

    expect(mockDispatch).toHaveBeenNthCalledWith(1, clearOrderBook());

    expect(mockDispatch).toHaveBeenNthCalledWith(2, clearTrades());

    expect(mockDispatch).toHaveBeenNthCalledWith(3, setSymbol("ETHUSDT"));

    expect(mockDispatch).toHaveBeenNthCalledWith(
      4,
      resetBalancesForPair({
        base: "ETH",
        quote: "USDT",
      }),
    );

    expect(mockedSetSymbol).toHaveBeenCalledTimes(1);

    expect(mockedSetSymbol).toHaveBeenCalledWith("ETHUSDT");
  });

  it("closes the dropdown after selecting a pair", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    expect(screen.getByPlaceholderText("Search pair...")).toBeInTheDocument();

    const list = screen.getByRole("list");

    fireEvent.click(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    );

    expect(
      screen.queryByPlaceholderText("Search pair..."),
    ).not.toBeInTheDocument();
  });

  it("does not dispatch when selecting the current pair", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const list = screen.getByRole("list");

    fireEvent.click(
      within(list).getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockedSetSymbol).not.toHaveBeenCalled();
  });

  it("closes the dropdown when clicking outside", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    expect(screen.getByPlaceholderText("Search pair...")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(
      screen.queryByPlaceholderText("Search pair..."),
    ).not.toBeInTheDocument();
  });

  it("clears search when selecting a pair", () => {
    render(<SelectPairs />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "BTC / USDT",
      }),
    );

    const input = screen.getByPlaceholderText("Search pair...");

    fireEvent.change(input, {
      target: {
        value: "ETH",
      },
    });

    const list = screen.getByRole("list");

    fireEvent.click(
      within(list).getByRole("button", {
        name: "ETH / USDT",
      }),
    );

    expect(
      screen.queryByPlaceholderText("Search pair..."),
    ).not.toBeInTheDocument();
  });
});
