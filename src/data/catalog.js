// ───────────────────────────────────────────────────────────────
// Asset catalog — static metadata per ticker. `seedPrice`/`seedChg`
// are the fallback values used when the market-data layer has no live
// quote (no API key / no coverage / offline). `cur` is the native
// trading currency; `exchange` tells the market layer where to query
// the ticker ('TSX' for Canadian listings, 'US' for US listings).
// All portfolio math runs in a holding's native currency, converted at
// display time. Targets are desired % of each portfolio.
// ───────────────────────────────────────────────────────────────

export const DEFAULT_FX = { CADperUSD: 1.37 }; // 1 USD = 1.37 CAD (fallback; market layer refreshes)

export const ASSETS = {
  VFV:   { name: 'Vanguard S&P 500 Index ETF',            cur: 'CAD', exchange: 'TSX', seedPrice: 154.00, seedChg:  0.42, klass: 'US Equity' },
  IBIT:  { name: 'iShares Bitcoin Trust',                 cur: 'USD', exchange: 'US',  seedPrice:  61.50, seedChg: -1.83, klass: 'Crypto' },
  VOO:   { name: 'Vanguard S&P 500 ETF',                  cur: 'USD', exchange: 'US',  seedPrice: 545.00, seedChg:  0.39, klass: 'US Equity' },
  SPUS:  { name: 'SP Funds S&P 500 Sharia ETF',           cur: 'USD', exchange: 'US',  seedPrice:  49.20, seedChg:  0.51, klass: 'US Equity' },
  ETHXB: { name: 'Purpose Ether ETF',                     cur: 'CAD', exchange: 'TSX', seedPrice:  18.40, seedChg: -2.61, klass: 'Crypto' },
  WSHR:  { name: 'Wealthsimple Shariah World Equity ETF', cur: 'CAD', exchange: 'TSX', seedPrice:  32.10, seedChg:  0.28, klass: 'Global Equity' },
  ZJPN:  { name: 'BMO Japan Index ETF',                   cur: 'CAD', exchange: 'TSX', seedPrice:  41.80, seedChg:  0.74, klass: 'Intl Equity' },
  // extra catalog entries available when adding holdings
  XEQT:  { name: 'iShares Core Equity ETF Portfolio',     cur: 'CAD', exchange: 'TSX', seedPrice:  37.40, seedChg:  0.33, klass: 'Global Equity' },
  VDY:   { name: 'Vanguard FTSE Cdn High Div Yield ETF',  cur: 'CAD', exchange: 'TSX', seedPrice:  49.90, seedChg:  0.18, klass: 'Cdn Equity' },
  ZAG:   { name: 'BMO Aggregate Bond Index ETF',          cur: 'CAD', exchange: 'TSX', seedPrice:  13.60, seedChg: -0.06, klass: 'Fixed Income' },
  QQQ:   { name: 'Invesco QQQ Trust',                     cur: 'USD', exchange: 'US',  seedPrice: 498.30, seedChg:  0.62, klass: 'US Equity' },
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
