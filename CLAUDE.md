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

- `src/data/catalog.js` — built-in asset **defaults / seed (fallback) prices**,
  the default portfolios, global targets, `seedAssets()` (catalog → a resolved
  `assets` map using seed prices), and `assetsFromQuotes(quotes)` — the **pure
  merge** that overlays sheet-derived metadata/prices onto the seed (overrides
  catalog when a field is present, synthesises records for tickers not in the
  catalog). The sheet is the source of truth for assets; the catalog is the
  offline/first-load fallback + starter template. Currency for sheet-only tickers
  is inferred from the `gfSymbol` exchange via `currencyFromGfSymbol()`.
- `src/data/compute.js` — **pure** valuation/rebalance functions. Every
  price-dependent function takes a resolved `assets` map and an `fx` object as
  arguments (e.g. `rebalance(p, disp, assets, fx)`). It never reaches for globals.
- `src/market/useMarketData.js` — builds the resolved `assets` map by layering
  **catalog seed → 24h localStorage cache → live sheet quotes** (via
  `assetsFromQuotes`), and exposes
  `{ assets, fx, loading, lastUpdated, refresh, configured, sheetUrl, setSheetUrl }`.
- `App.jsx` puts `market.assets` / `market.fx` into context; views call the
  `compute.js` helpers with those. **This single merge point is the only place live
  data enters** — views are otherwise pure presentation.

So: to change pricing behaviour, edit `market/`; to change math, edit `compute.js`
(and its test); to change the catalog/seed values, edit `catalog.js`. Don't thread
prices through views any other way.

**Market provider = Google Finance via a published Google Sheet**
(`src/market/googleSheets.js`). There is no official Google Finance REST API and
this is a static, client-side site, so we can't call Google directly (CORS). Instead
the user keeps one Google Sheet of `=GOOGLEFINANCE(...)` rows and **publishes it to
the web as CSV**; that published-CSV URL *is* CORS-friendly, free, keyless, and
covers TSX + US listings + USD/CAD FX. `parseSheetCsv(text)` and
`fetchSheet(sheetUrl, fetchImpl)` (injectable `fetchImpl` so tests mock the network)
return `{ quotes, fx, errors }`. Parsing is tolerant: a cell that won't resolve
(e.g. `#N/A` while Google recalculates) is reported in `errors` and that ticker
falls back to its seed price — it never throws. The whole sheet is one document, so
the layer makes **one fetch** when anything is stale.

**The sheet contract:** the sheet is the **asset registry** — columns
`ticker | name | gfSymbol | class | price` (`SHEET_COLUMNS`), one row per asset
(column A = the app's internal ticker), plus a reserved `__FX_USDCAD` row whose
`price` cell is `GOOGLEFINANCE("CURRENCY:USDCAD")`. `parseSheetCsv` is
**header-aware** (matches columns by name, order-independent; falls back to
positional `ticker,price` for a bare sheet). Add a row to add an asset with no
code change; `name`/`class` override the catalog when present (blank keeps the
catalog default), and currency is inferred from the `gfSymbol` exchange
(`TSE:`→CAD, `NASDAQ:`/`NYSEARCA:`→USD). The Google symbol per built-in asset
(`EXCHANGE:TICKER`, e.g. `TSE:VFV`) lives in `catalog.js` as `gfSymbol`;
`sheetTemplate()` renders the starter block (also shown in Settings). Only the
**single-argument** (default-price) form is emitted — `=GOOGLEFINANCE("TSE:VFV")`
— because a two-argument call like `…,"changepct")` breaks in locales that use
`;` as the formula argument separator; daily change is therefore not fetched
(holdings keep their catalog seed change).

The template is **pipe-separated** (`SHEET_SEP`), not comma — the `=GOOGLEFINANCE()`
cells contain commas, so the user pastes it then runs Data → Split text to columns on
`|`. Google then publishes plain CSV, which `parseSheetCsv` reads: it auto-detects
the comma/tab/pipe delimiter, and `parseNum` handles both US (`1,234.56`) and
locale (`185,61` comma-decimal) number formats Google emits. If a row shows `#N/A`,
fix that `gfSymbol` (or the sheet cell) — no other code changes needed.

**Sheet-URL handling:** the user pastes their published CSV URL in the Settings
modal (`src/views/Settings.jsx`, gear icon). It's stored only in `localStorage`
(`allocator-sheet-url`). The URL is a public published CSV (not a secret). With no
URL, the app silently runs on seed prices; the Settings badge reflects live-vs-sample.

**Caching:** `src/market/cache.js` stores quotes + FX with timestamps under versioned
keys, `TTL_MS` = 24h (1-day-stale data is acceptable by design). `refresh()` ignores
the TTL; normal loads only fetch when a ticker or FX is missing/stale.

## CSV format

Intentionally simple and hand-writable — prices are NOT in the file (they come from
market data by ticker). See `sample-portfolio.csv`:

```
portfolio,ticker,shares
```

`portfolio` is the account type (`TFSA`/`RRSP`/`FHSA`/`NONREG`). Import/export logic
is in `src/data/csv.js`; it's tolerant of header order and whitespace. Targets are NOT
in the CSV (see below); a legacy `target_pct` column is tolerated on import and ignored.

**Uninvested cash** is recorded as a holding with the synthetic ticker `CASH_CAD` or
`CASH_USD` (e.g. `NONREG,CASH_CAD,2000`). These are catalog assets priced at 1, so
the `shares` column is just the dollar amount in that currency. They carry
`exchange: 'NONE'` and are excluded from the market layer via `MARKET_TICKERS` /
`isCash()` in `catalog.js` — never quoted from the sheet. Everything else (totals,
drift, rebalance, donut) treats cash as an ordinary holding.

## Target allocation (global)

There is **one** target allocation — a single `{ ticker → % }` map summing to 100% across
**total net worth** (not per account). It lives in `App.jsx` state as `targets` (seeded from
`GLOBAL_TARGETS` in `catalog.js`, persisted in `allocator-state-v1`), is edited in the Data
view's "Global targets" section, and flows through context as `targets`/`setTargets`.

The rebalance/trade engine is `compute.globalRebalance(ps, disp, assets, fx, targets)` — it
aggregates every holding by ticker across all accounts and compares to `targets`; when targets
total 100% the buy/sell deltas net to ~0. The **Overview** owns the forecast (a single
net-worth trade blotter under its Forecast toggle) and the allocation-vs-target hero. The
per-account page (`Portfolio.jsx`) is **informational only** — `compute.holdingsBreakdown`
gives each position's value + weight within the account and its share of net worth; there are
no per-account targets, drift, or forecast (and no per-account "must = 100%" check).

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
