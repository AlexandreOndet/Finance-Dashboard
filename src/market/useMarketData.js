// useMarketData — the single source of resolved prices for the app.
//
// On load it builds an `assets` map from the catalog (seed prices),
// overlays any cached quotes, renders immediately, then — if a Google Sheet
// CSV URL is configured — fetches the published sheet in the background and
// overlays the live values + FX. Everything is cached ~24h so reloads and
// re-renders don't re-hit the network. No URL → silently use seed/cache.
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FX, seedAssets, MARKET_TICKERS } from '../data/catalog.js';
import * as cache from './cache.js';
import { fetchSheet } from './googleSheets.js';

const URL_LS = 'allocator-sheet-url';
// Cash tickers are excluded here (MARKET_TICKERS), so they are never requested
// or cached — this is the single point where live data enters the app.
const ALL_TICKERS = MARKET_TICKERS;

export const loadSheetUrl = () => {
  try { return localStorage.getItem(URL_LS) || ''; } catch { return ''; }
};
const saveSheetUrl = (url) => {
  try { url ? localStorage.setItem(URL_LS, url) : localStorage.removeItem(URL_LS); } catch { /* noop */ }
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
  const [sheetUrl, setSheetUrlState] = useState(loadSheetUrl);
  const [assets, setAssets] = useState(resolveAssets);
  const [fx, setFx] = useState(resolveFx);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cache.lastUpdatedTs);

  const load = useCallback(async (force = false) => {
    const url = loadSheetUrl();
    if (!url) { // not configured → seed/cache only
      setAssets(resolveAssets());
      setFx(resolveFx());
      setLastUpdated(cache.lastUpdatedTs());
      return;
    }
    // One published sheet holds every quote + FX, so we fetch the whole
    // document if anything is stale (or on a forced refresh).
    const quotesStale = force || cache.staleTickers(ALL_TICKERS).length > 0;
    const fxStale = force || !cache.isFresh(cache.readFx());
    if (!quotesStale && !fxStale) { setLastUpdated(cache.lastUpdatedTs()); return; }

    setLoading(true);
    setError(null);
    try {
      const { quotes, fx: fxRate, errors } = await fetchSheet(url);
      if (Object.keys(quotes).length) cache.writeQuotes(quotes);
      if (Number.isFinite(fxRate)) cache.writeFx(fxRate);

      setAssets(resolveAssets());
      setFx(resolveFx());
      setLastUpdated(cache.lastUpdatedTs());

      const gotNothing = !Object.keys(quotes).length && !Number.isFinite(fxRate);
      const errs = Object.values(errors);
      if (gotNothing && errs.length) setError(errs[0]);
    } catch (e) {
      setError(e.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + whenever the sheet URL changes.
  useEffect(() => { load(false); }, [load, sheetUrl]);

  const setSheetUrl = useCallback((url) => {
    const trimmed = (url || '').trim();
    saveSheetUrl(trimmed);
    setSheetUrlState(trimmed);
  }, []);
  const refresh = useCallback(() => load(true), [load]);

  return { assets, fx, loading, error, lastUpdated, sheetUrl, configured: !!sheetUrl, setSheetUrl, refresh };
}
