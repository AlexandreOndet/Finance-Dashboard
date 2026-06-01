# Allocator — ETF Portfolio Allocation Dashboard

A static, single-page dashboard for tracking and rebalancing multi-account ETF
portfolios. Built with **React + Vite**, deployable to **GitHub Pages**.

Implements the "Modern" design direction from the Claude Design handoff:

- **Overview** — net-worth hero with allocation donut, global allocation vs targets,
  and four clickable account tiles. An **Overview / Forecast** toggle flips tiles to
  trade suggestions.
- **Account detail** — per-account donut, stat chips (today / drift / to-invest /
  to-raise), and a holdings table (shares · price · value in both currencies ·
  weight vs target · drift). Forecast mode becomes a **BUY/SELL blotter** with units
  to trade and cash per trade.
- **Data** — editable holdings table with **CSV import** (drag-drop / paste +
  validation), **CSV export**, add/remove rows, reset to sample, and per-account
  target-sum checks. Edits flow live to every view.
- **CAD/USD**, **EN/FR**, and **light/dark** toggles. All settings + your edited
  data persist in the browser (`localStorage`).

## Market data

Prices and the USD→CAD FX rate come from **Google Finance**, via a Google Sheet you
publish — free, keyless, covers Canadian (TSX) **and** US listings, and works
directly from the static site (no backend). There's no official Google Finance API
and a static page can't scrape Google directly (CORS), so a published-CSV sheet is
the bridge.

- **One-time setup.** Open **Settings** (gear icon, top bar), copy the **sheet
  template** shown there into a new Google Sheet (it's rows of
  `=GOOGLEFINANCE("TSE:VFV")` etc.), then **File → Share → Publish to web →
  CSV** and paste that URL back into Settings. The URL is stored only in your browser
  (`localStorage`); it's a public published CSV, so nothing secret is involved.
- **Cached ~24h.** Quotes and FX are cached, so reloads and re-renders don't re-hit
  the network. Data up to a day old is fine; a **Refresh** button forces an update.
- **Seeded fallback.** Without a sheet URL (or if a ticker shows `#N/A` / you're
  offline), the app falls back to the sample prices in `src/data/catalog.js`, so it
  always renders. The Settings badge shows whether live prices are active.

Each asset's Google ticker (`EXCHANGE:TICKER`, e.g. `TSE:VFV`, `NYSEARCA:SPUS`) lives
in `src/data/catalog.js` as `gfSymbol`; if Google reports `#N/A` for a row, fix that
symbol in the sheet (or the catalog) — no other code changes needed.

## CSV format

Simple, hand-writable — which assets you hold and how many shares. Prices/currencies
come from market data by ticker, so they're **not** in the file. See
[`sample-portfolio.csv`](./sample-portfolio.csv):

```csv
portfolio,ticker,shares,target_pct
TFSA,VFV,120,60
TFSA,IBIT,85,40
```

`portfolio` is the account type (`TFSA`, `RRSP`, `FHSA`, `NONREG`); `target_pct` is
the desired weight of that holding within its account.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # vitest unit tests (math, CSV, cache, provider parsing)
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (default branch `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. The included workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml))
   runs tests, builds, and deploys on every push to `main`.

Vite is configured with `base: './'` (relative asset URLs), so the build works from
any `https://<user>.github.io/<repo>/` path without extra configuration.

## Project structure

```
src/
  App.jsx              app shell: sidebar, top bar, routing, persistence, market wiring
  context.jsx          AppCtx + useApp()
  theme.js             light/dark tokens + per-asset colour ramp + fonts
  i18n.js              EN/FR strings + number/money/percent formatters
  data/
    catalog.js         asset metadata + seed prices, default portfolios, global targets
    compute.js         pure rebalance / valuation math (takes resolved assets + fx)
    csv.js             CSV import/export
  market/
    cache.js           localStorage quote/FX cache with 24h TTL
    googleSheets.js    Google Finance provider: parse a published-sheet CSV → quotes + FX
    useMarketData.js   hook: merge catalog + cache + live → { assets, fx, refresh, … }
  components/          icons + presentational UI (Card, Donut, TargetBar, …)
  views/               Overview, Portfolio, Data, Settings
```
