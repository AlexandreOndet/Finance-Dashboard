# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server
npm run build        # production build → dist/
npm run preview      # serve the production build locally
npm test             # vitest, single run
npm run test:watch   # vitest, watch mode
```

Run one test file or one test:

```bash
npx vitest run src/data/compute.test.js
npx vitest run -t "conserves cash"
```

There is no linter configured; "lint" = a clean `npm run build` + `npm test`.

## What this is

"Allocator" — a **static, single-page** React + Vite ETF portfolio rebalancing
dashboard, deployed to GitHub Pages (no backend). It was ported from a Claude Design
HTML/JS prototype; the goal is to match that visual output. Three views: Overview,
Portfolio detail (with a Forecast/trade blotter), and Data (CSV import/edit/export).
EN/FR, CAD/USD, light/dark — all persisted in `localStorage`.

## Architecture — the big picture

**Styling is all inline style objects** (no CSS framework, no CSS modules). Colours,
spacing, and fonts come from theme tokens, not classes. `src/styles.css` only holds
global resets/scrollbar/fonts. When editing UI, read `src/theme.js` first and use
`tk.*` tokens — never hardcode colours.

**State lives in `App.jsx` and flows through one context.** `src/App.jsx` owns all
app state (mode, lang, disp, portfolios, route) plus the market-data hook, and
publishes everything via `AppCtx` (`src/context.jsx`). Every component reads state
with `useApp()`. There is **no router** — `route` is a plain `{ name, id }` object in
state, persisted to `localStorage` (`allocator-state-v1`). This is deliberate: it
avoids GitHub Pages SPA-404 issues. Don't add react-router without reason.

**The market-data seam is the most important thing to understand.** Prices are
dynamic but the pure math must stay testable, so:

- `src/data/catalog.js` — static asset metadata + **seed (fallback) prices** +
  `exchange` per ticker, plus the default portfolios, global targets, and
  `seedAssets()` (catalog → a resolved `assets` map using seed prices).
- `src/data/compute.js` — **pure** valuation/rebalance functions. Every
  price-dependent function takes a resolved `assets` map and an `fx` object as
  arguments (e.g. `rebalance(p, disp, assets, fx)`). It never reaches for globals.
- `src/market/useMarketData.js` — builds the resolved `assets` map by layering
  **catalog seed → 24h localStorage cache → live quotes**, and exposes
  `{ assets, fx, loading, lastUpdated, refresh, hasKey, setApiKey }`.
- `App.jsx` puts `market.assets` / `market.fx` into context; views call the
  `compute.js` helpers with those. **This single merge point is the only place live
  data enters** — views are otherwise pure presentation.

So: to change pricing behaviour, edit `market/`; to change math, edit `compute.js`
(and its test); to change the catalog/seed values, edit `catalog.js`. Don't thread
prices through views any other way.

**Market provider = Twelve Data** (`src/market/twelveData.js`), chosen because it's
free, CORS-friendly (works from the static site), and covers both TSX and US
listings. `fetchQuotes`/`fetchFx` take an injectable `fetchImpl` (last arg) so tests
mock the network. Parsing is tolerant: per-symbol failures are reported in `errors`
but never abort the batch. Tickers are mapped to exchanges in `src/market/symbols.js`
and **batched one request per exchange** to stay under the free-tier rate limit; if a
new ticker needs different routing, fix it there.

**API key handling:** the user pastes a free Twelve Data key in the Settings modal
(`src/views/Settings.jsx`, gear icon in the top bar). It's stored only in
`localStorage` (`allocator-apikey`) — never commit a key. With no key, the app
silently runs on seed prices; the Settings badge reflects live-vs-sample.

**Caching:** `src/market/cache.js` stores quotes + FX with timestamps under versioned
keys, `TTL_MS` = 24h (1-day-stale data is acceptable by design). `refresh()` ignores
the TTL; normal loads only fetch missing/stale tickers.

## CSV format

Intentionally simple and hand-writable — prices are NOT in the file (they come from
market data by ticker). See `sample-portfolio.csv`:

```
portfolio,ticker,shares,target_pct
```

`portfolio` is the account type (`TFSA`/`RRSP`/`FHSA`/`NONREG`). Import/export logic
is in `src/data/csv.js`; it's tolerant of header order and whitespace.

**Uninvested cash** is recorded as a holding with the synthetic ticker `CASH_CAD` or
`CASH_USD` (e.g. `NONREG,CASH_CAD,2000,0`). These are catalog assets priced at 1, so
the `shares` column is just the dollar amount in that currency. They carry
`exchange: 'NONE'` and are excluded from the market layer via `MARKET_TICKERS` /
`isCash()` in `catalog.js` — never sent to Twelve Data. Everything else (totals,
drift, rebalance, donut) treats cash as an ordinary holding.

## i18n

All user-facing strings go through `t(lang, key)` in `src/i18n.js` (EN + FR), which
also holds the money/number/percent formatters (`fmtMoney`, `fmtPct`, …). Add new
strings to **both** `en` and `fr`. Account-type labels differ per language
(TFSA→CELI, etc.) via `acctLabel`/`acctFull`.

## Deploy

Push to `main` → `.github/workflows/deploy.yml` runs tests + build and deploys to
GitHub Pages (Pages source must be set to "GitHub Actions"). `vite.config.js` uses
`base: './'` so the build works from any `/<repo>/` path. Note: the working dir may
not be a git repo yet — `git init` before the first push.
