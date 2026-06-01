// Twelve Data provider. CORS-friendly free tier, so it runs directly from
// the static GitHub Pages app (no backend). We batch one /quote request
// per exchange (≤2 for this app's tickers — well under the 8 req/min free
// limit) plus one /exchange_rate for USD→CAD. Parsing is tolerant:
// per-symbol failures are reported but never abort the whole load.

import { groupByExchange, apiSymbolOf, exchangeParam } from './symbols.js';

const BASE = 'https://api.twelvedata.com';

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// Parse one Twelve Data quote object → { price, chg, currency } or null.
const parseQuote = (obj) => {
  if (!obj || obj.status === 'error' || obj.code >= 400) return null;
  const price = num(obj.close) ?? num(obj.price);
  if (price == null) return null;
  return { price, chg: num(obj.percent_change) ?? 0, currency: obj.currency || null };
};

// Fetch quotes for the given tickers. Returns { quotes, errors }.
//   quotes: { [ticker]: { price, chg, currency } }
//   errors: { [ticker]: message }
export async function fetchQuotes(tickers, apiKey, fetchImpl = fetch) {
  const quotes = {};
  const errors = {};
  if (!apiKey || tickers.length === 0) return { quotes, errors };

  const groups = groupByExchange(tickers);
  await Promise.all(Object.entries(groups).map(async ([exchangeCode, groupTickers]) => {
    const symbols = groupTickers.map(apiSymbolOf).join(',');
    const params = new URLSearchParams({ symbol: symbols, apikey: apiKey });
    const ex = exchangeParam(exchangeCode);
    if (ex) params.set('exchange', ex);

    try {
      const res = await fetchImpl(`${BASE}/quote?${params.toString()}`);
      const body = await res.json();
      // Whole-request error (bad key, rate limit, …)
      if (body && body.status === 'error') {
        groupTickers.forEach((t) => { errors[t] = body.message || 'request failed'; });
        return;
      }
      // Single symbol → object returned directly; multiple → keyed by symbol.
      const single = groupTickers.length === 1;
      groupTickers.forEach((ticker) => {
        const obj = single ? body : body[apiSymbolOf(ticker)];
        const parsed = parseQuote(obj);
        if (parsed) quotes[ticker] = parsed;
        else errors[ticker] = (obj && obj.message) || 'no quote';
      });
    } catch (e) {
      groupTickers.forEach((t) => { errors[t] = e.message || 'network error'; });
    }
  }));

  return { quotes, errors };
}

// Fetch USD→CAD rate. Returns a number (CAD per USD) or null on failure.
export async function fetchFx(apiKey, fetchImpl = fetch) {
  if (!apiKey) return null;
  const params = new URLSearchParams({ symbol: 'USD/CAD', apikey: apiKey });
  try {
    const res = await fetchImpl(`${BASE}/exchange_rate?${params.toString()}`);
    const body = await res.json();
    if (!body || body.status === 'error') return null;
    return num(body.rate);
  } catch {
    return null;
  }
}
