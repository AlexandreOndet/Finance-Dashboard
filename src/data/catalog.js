// ───────────────────────────────────────────────────────────────
// Asset catalog — static metadata per ticker. `seedPrice`/`seedChg`
// are the fallback values used when the market-data layer has no live
// quote (no API key / no coverage / offline). `cur` is the native
// trading currency; `exchange` tells the market layer where to query
// the ticker ('TSX' for Canadian listings, 'US' for US listings).
// All portfolio math runs in a holding's native currency, converted at
// display time. Targets are desired % of each portfolio. `gfSymbol` is the
// GOOGLEFINANCE ticker (EXCHANGE:TICKER, e.g. TSE:VFV) the user puts in their
// published Google Sheet — see sheetTemplate() and src/market/googleSheets.js.
// ───────────────────────────────────────────────────────────────

export const DEFAULT_FX = { CADperUSD: 1.37 }; // 1 USD = 1.37 CAD (fallback; market layer refreshes)

export const ASSETS = {
  VFV:   { name: 'Vanguard S&P 500 Index ETF',            cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:VFV',       seedPrice: 154.00, seedChg:  0.42, klass: 'US Equity' },
  IBIT:  { name: 'iShares Bitcoin Trust',                 cur: 'USD', exchange: 'US',  gfSymbol: 'NASDAQ:IBIT',   seedPrice:  61.50, seedChg: -1.83, klass: 'Crypto' },
  VOO:   { name: 'Vanguard S&P 500 ETF',                  cur: 'USD', exchange: 'US',  gfSymbol: 'NYSEARCA:VOO',  seedPrice: 545.00, seedChg:  0.39, klass: 'US Equity' },
  SPUS:  { name: 'SP Funds S&P 500 Sharia ETF',           cur: 'USD', exchange: 'US',  gfSymbol: 'NYSEARCA:SPUS', seedPrice:  49.20, seedChg:  0.51, klass: 'US Equity' },
  ETHXB: { name: 'Purpose Ether ETF',                     cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:ETHX.B',    seedPrice:  18.40, seedChg: -2.61, klass: 'Crypto' },
  ZJPN:  { name: 'BMO Japan Index ETF',                   cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:ZJPN',      seedPrice:  41.80, seedChg:  0.74, klass: 'Intl Equity' },
  CASH:  { name: 'Global X High Interest Savings ETF',    cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:CASH',      seedPrice:  50.00, seedChg:  0.00, klass: 'Cash' },
  CGLC:  { name: 'iShares Gold Bullion ETF',              cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:CGL.C',     seedPrice:  11.50, seedChg:  0.17, klass: 'Gold' },
  VEE:   { name: 'Vanguard FTSE Emerging Markets ETF',    cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:VEE',       seedPrice:  49.66, seedChg:  0.71, klass: 'Emerging Markets' },
  ZGQ:   { name: 'BMO MSCI All Country World High Quality Index Series Units ETF',      cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:ZGQ',       seedPrice:  28.20, seedChg:  0.25, klass: 'Global Equity' },
  // extra catalog entries available when adding holdings
  XEQT:  { name: 'iShares Core Equity ETF Portfolio',     cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:XEQT',      seedPrice:  37.40, seedChg:  0.33, klass: 'Global Equity' },
  VDY:   { name: 'Vanguard FTSE Cdn High Div Yield ETF',  cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:VDY',       seedPrice:  49.90, seedChg:  0.18, klass: 'Cdn Equity' },
  ZAG:   { name: 'BMO Aggregate Bond Index ETF',          cur: 'CAD', exchange: 'TSX', gfSymbol: 'TSE:ZAG',       seedPrice:  13.60, seedChg: -0.06, klass: 'Fixed Income' },
  QQQ:   { name: 'Invesco QQQ Trust',                     cur: 'USD', exchange: 'US',  gfSymbol: 'NASDAQ:QQQ',    seedPrice: 498.30, seedChg:  0.62, klass: 'US Equity' },
  // Synthetic "cash" assets — uninvested money held in an account. Priced at 1
  // (shares = dollar amount in the native currency) and never quoted by the
  // market layer (exchange 'NONE'); see MARKET_TICKERS / isCash below.
  CASH_CAD: { name: 'Cash (CAD)', cur: 'CAD', exchange: 'NONE', seedPrice: 1, seedChg: 0, klass: 'Cash' },
  CASH_USD: { name: 'Cash (USD)', cur: 'USD', exchange: 'NONE', seedPrice: 1, seedChg: 0, klass: 'Cash' },
};

// Synthetic cash tickers — recorded like holdings but not market-listed.
export const CASH_TICKERS = ['CASH_CAD', 'CASH_USD'];
export const isCash = (ticker) => CASH_TICKERS.includes(ticker);
// Tickers the market layer may fetch (everything except cash).
export const MARKET_TICKERS = Object.keys(ASSETS).filter((t) => !isCash(t));

// Default portfolios = Canadian account types. holding: { ticker, shares, target% }
export const DEFAULT_PORTFOLIOS = [
  { id: 'tfsa',   type: 'TFSA',   holdings: [{ ticker: 'VFV', shares: 120, target: 60 }, { ticker: 'IBIT', shares: 85, target: 40 }] },
  { id: 'rrsp',   type: 'RRSP',   holdings: [{ ticker: 'VOO', shares: 40, target: 70 }, { ticker: 'SPUS', shares: 138, target: 30 }] },
  { id: 'fhsa',   type: 'FHSA',   holdings: [{ ticker: 'ETHXB', shares: 174, target: 40 }, { ticker: 'WSHR', shares: 65, target: 35 }, { ticker: 'ZJPN', shares: 33, target: 25 }] },
  { id: 'nonreg', type: 'NONREG', holdings: [{ ticker: 'VFV', shares: 60, target: 50 }, { ticker: 'VOO', shares: 8, target: 50 }] },
];

// Combined (all-accounts) target allocation by ticker.
export const GLOBAL_TARGETS = { VOO: 35, VFV: 30, SPUS: 10, IBIT: 8, ETHXB: 7, WSHR: 5, ZJPN: 5 };

export const ACCOUNT_ORDER = ['TFSA', 'RRSP', 'FHSA', 'NONREG'];

// A resolved-asset map seeded purely from the catalog (no live data yet).
// The market layer overrides `price`/`chg` on top of this shape.
export const seedAssets = () => {
  const out = {};
  for (const [ticker, a] of Object.entries(ASSETS)) {
    out[ticker] = { ...a, price: a.seedPrice, chg: a.seedChg, live: false };
  }
  return out;
};

// US-listing exchanges (GOOGLEFINANCE prefix). Everything else (TSE/TSX/NEO/…)
// and anything unrecognised is treated as CAD — the app only supports CAD/USD.
const USD_EXCHANGES = new Set(['NASDAQ', 'NYSE', 'NYSEARCA', 'NYSEAMERICAN', 'NYSEMKT', 'AMEX', 'BATS', 'OTCMKTS', 'CBOE', 'ARCA']);
const exchangeCode = (gfSymbol) => String(gfSymbol || '').split(':')[0].trim().toUpperCase();
// Currency / internal exchange inferred from a `EXCHANGE:TICKER` Google symbol.
export const currencyFromGfSymbol = (gfSymbol) => (USD_EXCHANGES.has(exchangeCode(gfSymbol)) ? 'USD' : 'CAD');
export const exchangeFromGfSymbol = (gfSymbol) => {
  const ex = exchangeCode(gfSymbol);
  if (!ex) return 'NONE';
  return USD_EXCHANGES.has(ex) ? 'US' : 'TSX';
};

// Build the resolved asset map from the catalog seed plus sheet-derived quotes.
// `quotes[ticker]` may carry { price, chg?, name?, gfSymbol?, klass? }. Metadata
// from the sheet OVERRIDES the catalog when present (blank cells keep the catalog
// default); tickers not in the catalog are synthesised as full asset records.
// Pure + side-effect free so it can be unit-tested directly.
export const assetsFromQuotes = (quotes) => {
  const out = seedAssets();
  for (const [ticker, q] of Object.entries(quotes || {})) {
    if (!q) continue;
    const base = out[ticker] || {
      name: ticker, cur: 'CAD', exchange: 'NONE', klass: 'Other',
      seedPrice: Number.isFinite(q.price) ? q.price : 0, seedChg: 0,
      price: 0, chg: 0, live: false,
    };
    const merged = { ...base };
    if (q.name) merged.name = q.name;
    if (q.klass) merged.klass = q.klass;
    if (q.gfSymbol) {
      merged.gfSymbol = q.gfSymbol;
      merged.cur = currencyFromGfSymbol(q.gfSymbol);
      merged.exchange = exchangeFromGfSymbol(q.gfSymbol);
    }
    if (Number.isFinite(q.price)) { merged.price = q.price; merged.live = true; }
    if (Number.isFinite(q.chg)) merged.chg = q.chg;
    out[ticker] = merged;
  }
  return out;
};

// Pipe-separated starter block the user pastes into their Google Sheet (cell A1),
// then Data → Split text to columns → separator "|". A pipe is used because the
// =GOOGLEFINANCE() formulas contain commas, so a comma paste would break them.
// Once published to the web as CSV, src/market/googleSheets.js reads it back as
// the asset registry: ticker | name | gfSymbol | class | price. The sheet is the
// source of truth — add a row here to add an asset without touching code; the
// app infers currency from the gfSymbol exchange (TSE→CAD, NASDAQ→USD). Fix any
// EXCHANGE:TICKER if Google reports #N/A for a row.
//
// Only the single-argument (price) form is used: it's GOOGLEFINANCE's default
// attribute and, unlike a two-argument call, works regardless of the sheet's
// locale (locales with comma decimals use ";" as the formula argument separator,
// which breaks `=GOOGLEFINANCE("…","changepct")`). Daily change isn't fetched;
// holdings fall back to their catalog seed change.
export const SHEET_SEP = '|';
export const SHEET_COLUMNS = ['ticker', 'name', 'gfSymbol', 'class', 'price'];
export const sheetTemplate = () => {
  const rows = [SHEET_COLUMNS.join(SHEET_SEP)];
  for (const ticker of MARKET_TICKERS) {
    const a = ASSETS[ticker];
    if (!a?.gfSymbol) continue;
    rows.push([ticker, a.name, a.gfSymbol, a.klass, `=GOOGLEFINANCE("${a.gfSymbol}")`].join(SHEET_SEP));
  }
  rows.push(['__FX_USDCAD', '', '', '', '=GOOGLEFINANCE("CURRENCY:USDCAD")'].join(SHEET_SEP));
  return rows.join('\n');
};
