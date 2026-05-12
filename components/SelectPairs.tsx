import useAppDispatch from "@/hooks/useAppDispatch";
import useAppSelector from "@/hooks/useAppSelector";
import { wsService } from "@/services/ws";
import { clearOrderBook } from "@/store/orderBookSlice";
import { clearTrades } from "@/store/tradeSlice";
import { setSymbol } from "@/store/uiSlice";
import { formatPair } from "@/utils/formatter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "TRXUSDT",
  "LINKUSDT",
  "DOTUSDT",
  "MATICUSDT",
  "UNIUSDT",
  "SHIBUSDT",
  "LTCUSDT",
  "BCHUSDT",
  "ATOMUSDT",
  "ETCUSDT",
  "XLMUSDT",
  "APTUSDT",
  "FILUSDT",
  "NEARUSDT",
  "SUIUSDT",
  "OPUSDT",
  "ARBUSDT",
  "INJUSDT",
  "AAVEUSDT",
  "MKRUSDT",
  "RUNEUSDT",
  "FETUSDT",
  "ALGOUSDT",
  "FTMUSDT",
  "SANDUSDT",
  "MANAUSDT",
  "GALAUSDT",
  "AXSUSDT",
  "PEPEUSDT",
  "WIFUSDT",
  "SEIUSDT",
  "TIAUSDT",
  "ORDIUSDT",
];

export const SelectPairs = () => {
  const dispatch = useAppDispatch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const symbol = useAppSelector((state) => state.ui.symbol);
  const filteredPairs = useMemo(
    () =>
      searchQuery
        ? PAIRS.filter((p) => p.includes(searchQuery.toUpperCase()))
        : PAIRS,
    [searchQuery],
  );

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  const handlePairChange = useCallback(
    (pair: string) => {
      if (symbol === pair) {
        setSearchOpen(false);
        setSearchQuery("");
        return;
      }

      dispatch(clearOrderBook());
      dispatch(clearTrades());
      dispatch(setSymbol(pair));
      // TODO: this can be forgot. Need combine function

      wsService.setSymbol(pair);
      setSearchOpen(false);
      setSearchQuery("");
    },
    [dispatch, symbol],
  );

  return (
    <>
      <div className="relative mb-2" ref={searchRef}>
        <button
          onClick={() => setSearchOpen((o) => !o)}
          className="flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors"
        >
          <span>{formatPair(symbol)}</span>
          <svg
            className={`h-3.5 w-3.5 text-slate-500 transition-transform ${searchOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {searchOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-800 p-2">
              <input
                autoFocus
                placeholder="Search pair..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {filteredPairs.length === 0 && (
                <li className="px-3 py-2 text-xs text-slate-500">
                  No pairs found
                </li>
              )}
              {filteredPairs.map((pair) => (
                <li key={pair}>
                  <button
                    onClick={() => handlePairChange(pair)}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                      symbol === pair
                        ? "bg-sky-500/10 text-sky-400"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {formatPair(pair)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
