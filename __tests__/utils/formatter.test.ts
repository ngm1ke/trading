import {
  formatPair,
  parseSymbol,
  formatPrice,
  formatQuantity,
  formatVolume,
  formatTime,
  formatPercent,
} from "@/utils/formatter";

describe("formatPair", () => {
  it("formats a USDT trading pair", () => {
    expect(formatPair("BTCUSDT")).toBe("BTC / USDT");
    expect(formatPair("ETHUSDT")).toBe("ETH / USDT");
  });

  it("returns the original symbol when USDT is not found", () => {
    expect(formatPair("BTCUSD")).toBe("BTCUSD");
    expect(formatPair("BTC")).toBe("BTC");
  });

  it("returns the original symbol when USDT starts at index 0", () => {
    expect(formatPair("USDT")).toBe("USDT");
  });
});

describe("parseSymbol", () => {
  it("parses USDT pairs", () => {
    expect(parseSymbol("BTCUSDT")).toEqual({
      base: "BTC",
      quote: "USDT",
    });

    expect(parseSymbol("ETHUSDT")).toEqual({
      base: "ETH",
      quote: "USDT",
    });
  });

  it("parses non-USDT pairs using the last 4 characters as quote", () => {
    expect(parseSymbol("BTCUSD")).toEqual({
      base: "BT",
      quote: "CUSD",
    });

    expect(parseSymbol("ETHBTC")).toEqual({
      base: "ET",
      quote: "HBTC",
    });
  });
});

describe("formatPrice", () => {
  it("formats a number with 2 decimal places", () => {
    expect(formatPrice(1234.5)).toBe("1,234.50");
    expect(formatPrice(1234.567)).toBe("1,234.57");
    expect(formatPrice(10)).toBe("10.00");
  });

  it("formats numeric strings", () => {
    expect(formatPrice("1234.5")).toBe("1,234.50");
    expect(formatPrice("99.999")).toBe("100.00");
  });

  it("returns 0.00 for undefined", () => {
    expect(formatPrice(undefined)).toBe("0.00");
  });

  it("returns 0.00 for invalid values", () => {
    expect(formatPrice("invalid")).toBe("0.00");
  });
});

describe("formatQuantity", () => {
  it("formats quantity with 5 decimal places", () => {
    expect(formatQuantity(10)).toBe("10.00000");
    expect(formatQuantity(1.234567)).toBe("1.23457");
  });

  it("formats numeric strings", () => {
    expect(formatQuantity("1234.5")).toBe("1,234.50000");
  });

  it("returns 0.00000 for undefined", () => {
    expect(formatQuantity(undefined)).toBe("0.00000");
  });

  it("returns 0.00000 for invalid values", () => {
    expect(formatQuantity("invalid")).toBe("0.00000");
  });
});

describe("formatVolume", () => {
  it("formats normal volumes with 2 decimal places", () => {
    expect(formatVolume(100)).toBe("100.00");
    expect(formatVolume(999.456)).toBe("999.46");
  });

  it("formats thousands using K", () => {
    expect(formatVolume(1000)).toBe("1.00K");
    expect(formatVolume(12345)).toBe("12.35K");
  });

  it("formats millions using M", () => {
    expect(formatVolume(1_000_000)).toBe("1.00M");
    expect(formatVolume(12_345_678)).toBe("12.35M");
  });

  it("accepts numeric strings", () => {
    expect(formatVolume("12345")).toBe("12.35K");
  });

  it("returns 0.00 for undefined", () => {
    expect(formatVolume(undefined)).toBe("0.00");
  });

  it("returns 0.00 for invalid values", () => {
    expect(formatVolume("invalid")).toBe("0.00");
  });
});

describe("formatTime", () => {
  it("formats timestamp as HH:mm:ss", () => {
    const timestamp = new Date(2025, 0, 15, 9, 5, 7).getTime();

    expect(formatTime(timestamp)).toBe("09:05:07");
  });

  it("pads single digit hours, minutes and seconds", () => {
    const timestamp = new Date(2025, 0, 15, 1, 2, 3).getTime();

    expect(formatTime(timestamp)).toBe("01:02:03");
  });
});

describe("formatPercent", () => {
  it("formats positive percentages with + sign", () => {
    expect(formatPercent(12.345)).toBe("+12.35%");
    expect(formatPercent("5.5")).toBe("+5.50%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-12.345)).toBe("-12.35%");
  });

  it("formats zero without a + sign", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("returns 0.00% for undefined", () => {
    expect(formatPercent(undefined)).toBe("0.00%");
  });

  it("returns 0.00% for invalid values", () => {
    expect(formatPercent("invalid")).toBe("0.00%");
  });
});