// ───────────────────────────────────────────────────────────────
// Portfolio math. Pure functions — every price-dependent helper takes a
// resolved `assets` map (ticker → { price, cur, chg }) and an `fx`
// ({ CADperUSD }). This is the single seam where live market data flows
// in: App merges catalog + live quotes into `assets` and passes it down.
// ───────────────────────────────────────────────────────────────
import { GLOBAL_TARGETS } from './catalog.js';

// ─── currency helpers ───
export const toCAD = (v, cur, fx) => (cur === 'USD' ? v * fx.CADperUSD : v);
export const toUSD = (v, cur, fx) => (cur === 'USD' ? v : v / fx.CADperUSD);
export const toDisplay = (v, cur, disp, fx) => (disp === 'CAD' ? toCAD(v, cur, fx) : toUSD(v, cur, fx));
// value (display currency) → asset's native currency
export const toNative = (v, disp, cur, fx) => {
  if (cur === disp) return v;
  const cad = disp === 'CAD' ? v : v * fx.CADperUSD; // to CAD
  return cur === 'CAD' ? cad : cad / fx.CADperUSD;
};

export const priceOf = (ticker, assets) => (assets[ticker] ? assets[ticker].price : 0);
export const curOf = (ticker, assets) => (assets[ticker] ? assets[ticker].cur : 'CAD');

// native value of a holding = shares × price
export const holdingNative = (h, assets) => h.shares * priceOf(h.ticker, assets);
export const holdingValue = (h, disp, assets, fx) => toDisplay(holdingNative(h, assets), curOf(h.ticker, assets), disp, fx);

export const portfolioTotal = (p, disp, assets, fx) => p.holdings.reduce((s, h) => s + holdingValue(h, disp, assets, fx), 0);
export const grandTotal = (ps, disp, assets, fx) => ps.reduce((s, p) => s + portfolioTotal(p, disp, assets, fx), 0);

// Per-account display rows: current value + weight within the account.
// Targets are global (net-worth level), so a single account has no target
// of its own — this is purely informational (no delta/forecast).
export const holdingsBreakdown = (p, disp, assets, fx) => {
  const total = portfolioTotal(p, disp, assets, fx);
  return p.holdings.map((h) => {
    const cur = holdingValue(h, disp, assets, fx);
    return {
      ticker: h.ticker, shares: h.shares, price: priceOf(h.ticker, assets),
      cur, curPct: total ? (cur / total) * 100 : 0,
    };
  });
};

// Net-worth rebalance: aggregate every holding by ticker across all accounts
// and compare to the single global target map. Returns rows with current
// value/weight, target, delta (display $, + buy / − sell) and sharesDelta.
// When targets sum to 100, Σ delta ≈ 0 (cash is conserved).
export const globalRebalance = (ps, disp, assets, fx, targets = GLOBAL_TARGETS) => {
  const total = grandTotal(ps, disp, assets, fx);
  const byTicker = {}, sharesByTicker = {};
  ps.forEach((p) => p.holdings.forEach((h) => {
    byTicker[h.ticker] = (byTicker[h.ticker] || 0) + holdingValue(h, disp, assets, fx);
    sharesByTicker[h.ticker] = (sharesByTicker[h.ticker] || 0) + h.shares;
  }));
  const tickers = [...new Set([...Object.keys(byTicker), ...Object.keys(targets || {})])];
  return tickers.map((t) => {
    const cur = byTicker[t] || 0;
    const curPct = total ? (cur / total) * 100 : 0;
    const target = (targets && targets[t]) || 0;
    const targetVal = (target / 100) * total;
    const delta = targetVal - cur;
    const price = priceOf(t, assets);
    const deltaNative = toNative(delta, disp, curOf(t, assets), fx);
    return {
      ticker: t, shares: sharesByTicker[t] || 0, price,
      cur, curPct, target, targetVal, delta,
      driftPct: curPct - target,
      sharesDelta: price ? deltaNative / price : 0,
    };
  }).sort((a, b) => b.cur - a.cur);
};

export const dayChange = (p, disp, assets, fx) => {
  let base = 0, chg = 0;
  p.holdings.forEach((h) => {
    const v = holdingValue(h, disp, assets, fx);
    base += v;
    chg += v * (assets[h.ticker] ? assets[h.ticker].chg : 0) / 100;
  });
  return { abs: chg, pct: base ? (chg / base) * 100 : 0 };
};
