export function formatPair(symbol: string) {
  const idx = symbol.indexOf("USDT");
  if (idx > 0) return symbol.slice(0, idx) + " / USDT";
  return symbol;
}

export function formatPrice(price: number | string | undefined): string {
  if (price === undefined || price === null) return "0.00";
  const val = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(val)) return "0.00";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatQuantity(qty: number | string | undefined): string {
  if (qty === undefined || qty === null) return "0.00000";
  const val = typeof qty === "string" ? parseFloat(qty) : qty;
  if (isNaN(val)) return "0.00000";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

export function formatVolume(vol: number | string | undefined): string {
  if (vol === undefined || vol === null) return "0.00";
  const val = typeof vol === "string" ? parseFloat(vol) : vol;
  if (isNaN(val)) return "0.00";
  if (val >= 1e6) {
    return (val / 1e6).toFixed(2) + "M";
  }
  if (val >= 1e3) {
    return (val / 1e3).toFixed(2) + "K";
  }
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function formatPercent(percent: number | string | undefined): string {
  if (percent === undefined || percent === null) return "0.00%";
  const val = typeof percent === "string" ? parseFloat(percent) : percent;
  if (isNaN(val)) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}
