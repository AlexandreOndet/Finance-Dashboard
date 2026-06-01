// localStorage cache for market data. Quotes and FX are stored with a
// timestamp; entries older than TTL_MS are considered stale. The user
// said ~1-day-old data is fine, so the default TTL is 24h — this keeps
// us well under the free-tier rate limit by avoiding repeat requests.

export const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const QUOTES_KEY = 'allocator-quotes-v1';
const FX_KEY = 'allocator-fx-v1';

const readJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
};
const writeJSON = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota / disabled */ }
};

export const isFresh = (entry, now = Date.now(), ttl = TTL_MS) =>
  !!entry && Number.isFinite(entry.ts) && (now - entry.ts) < ttl;

// ── quotes: { [ticker]: { price, cur, chg, ts } } ──
export const readQuotes = () => readJSON(QUOTES_KEY);

export const writeQuotes = (quotes, now = Date.now()) => {
  const store = readQuotes();
  for (const [ticker, q] of Object.entries(quotes)) {
    store[ticker] = { ...q, ts: now };
  }
  writeJSON(QUOTES_KEY, store);
  return store;
};

// Which of `tickers` need a refresh (missing or stale)?
export const staleTickers = (tickers, now = Date.now(), ttl = TTL_MS) => {
  const store = readQuotes();
  return tickers.filter((t) => !isFresh(store[t], now, ttl));
};

// ── fx: { CADperUSD, ts } ──
export const readFx = () => {
  const v = readJSON(FX_KEY);
  return Number.isFinite(v.CADperUSD) ? v : null;
};
export const writeFx = (CADperUSD, now = Date.now()) => {
  writeJSON(FX_KEY, { CADperUSD, ts: now });
};

// Newest timestamp across all cached quotes + fx (for "last updated").
export const lastUpdatedTs = () => {
  let max = 0;
  for (const q of Object.values(readQuotes())) if (Number.isFinite(q.ts)) max = Math.max(max, q.ts);
  const fx = readJSON(FX_KEY);
  if (Number.isFinite(fx.ts)) max = Math.max(max, fx.ts);
  return max || null;
};

export const clearCache = () => {
  try { localStorage.removeItem(QUOTES_KEY); localStorage.removeItem(FX_KEY); } catch { /* noop */ }
};
