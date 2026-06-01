// useMarketData — the single source of resolved prices for the app.
//
// On load it builds an `assets` map from the catalog (seed prices),
// overlays any cached quotes, renders immediately, then — if an API key
// is set — fetches stale/missing tickers + FX in the background and
// overlays the live values. Everything is cached ~24h so reloads and
// re-renders don't re-hit the network. No key → silently use seed/cache.
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FX, seedAssets, MARKET_TICKERS } from '../data/catalog.js';
import * as cache from './cache.js';
import { fetchQuotes, fetchFx } from './twelveData.js';

const KEY_LS = 'allocator-apikey';
// Cash tickers are excluded here (MARKET_TICKERS), so they are never batched,
// requested, or cached — this is the single point where data enters the fetch.
const ALL_TICKERS = MARKET_TICKERS;

export const loadApiKey = () => {
  try { return localStorage.getItem(KEY_LS) || ''; } catch { return ''; }
};
const saveApiKey = (key) => {
  try { key ? localStorage.setItem(KEY_LS, key) : localStorage.removeItem(KEY_LS); } catch { /* noop */ }
};

// Build the resolved assets map: catalog seed → overlay cached quotes.
function resolveAssets() {
  const assets = seedAssets();
  const quotes = cache.readQuotes();
  for (const [ticker, q] of Object.entries(quotes)) {
    if (assets[ticker] && Number.isFinite(q.price)) {
      assets[ticker] = { ...assets[ticker], price: q.price, chg: Number.isFinite(q.chg) ? q.chg : assets[ticker].chg, live: true };
    }
  }
  return assets;
}
const resolveFx = () => {
  const fx = cache.readFx();
  return fx ? { CADperUSD: fx.CADperUSD } : { ...DEFAULT_FX };
};

export function useMarketData() {
  const [apiKey, setApiKeyState] = useState(loadApiKey);
  const [assets, setAssets] = useState(resolveAssets);
  const [fx, setFx] = useState(resolveFx);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cache.lastUpdatedTs);

  const load = useCallback(async (force = false) => {
    const key = loadApiKey();
    if (!key) { // no key → seed/cache only
      setAssets(resolveAssets());
      setFx(resolveFx());
      setLastUpdated(cache.lastUpdatedTs());
      return;
    }
    const toFetch = force ? ALL_TICKERS : cache.staleTickers(ALL_TICKERS);
    const fxStale = force || !cache.isFresh(cache.readFx());
    if (toFetch.length === 0 && !fxStale) { setLastUpdated(cache.lastUpdatedTs()); return; }

    setLoading(true);
    setError(null);
    try {
      const [quoteRes, fxRate] = await Promise.all([
        toFetch.length ? fetchQuotes(toFetch, key) : Promise.resolve({ quotes: {}, errors: {} }),
        fxStale ? fetchFx(key) : Promise.resolve(null),
      ]);
      if (Object.keys(quoteRes.quotes).length) cache.writeQuotes(quoteRes.quotes);
      if (Number.isFinite(fxRate)) cache.writeFx(fxRate);

      setAssets(resolveAssets());
      setFx(resolveFx());
      setLastUpdated(cache.lastUpdatedTs());

      const gotNothing = !Object.keys(quoteRes.quotes).length && !Number.isFinite(fxRate);
      const errs = Object.values(quoteRes.errors);
      if (gotNothing && errs.length) setError(errs[0]);
    } catch (e) {
      setError(e.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + whenever the key changes.
  useEffect(() => { load(false); }, [load, apiKey]);

  const setApiKey = useCallback((key) => {
    const trimmed = (key || '').trim();
    saveApiKey(trimmed);
    setApiKeyState(trimmed);
  }, []);
  const refresh = useCallback(() => load(true), [load]);

  return { assets, fx, loading, error, lastUpdated, apiKey, hasKey: !!apiKey, setApiKey, refresh };
}
