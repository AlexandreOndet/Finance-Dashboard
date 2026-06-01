// ─── CSV: simple shape → portfolio,ticker,shares,target_pct ───
// Prices/currencies are NOT in the CSV — they come from the catalog +
// market-data layer by ticker. This keeps the import file something a
// user can hand-write: which assets they hold and how many shares.
import { ACCOUNT_ORDER } from './catalog.js';

export const CSV_HEADER = 'portfolio,ticker,shares,target_pct';

export const portfoliosToCSV = (ps) => {
  const lines = [CSV_HEADER];
  ps.forEach((p) => p.holdings.forEach((h) => {
    lines.push([p.type, h.ticker, h.shares, h.target].join(','));
  }));
  return lines.join('\n');
};

// Parse CSV → portfolios array. Tolerant of header order & whitespace.
export const csvToPortfolios = (text) => {
  const rows = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!rows.length) return { portfolios: [], errors: ['empty'] };
  const head = rows[0].toLowerCase().split(',').map((s) => s.trim());
  const ix = (n) => head.indexOf(n);
  const ip = ix('portfolio'), it = ix('ticker'), is = ix('shares'), ig = ix('target_pct');
  const errors = [];
  if (ip < 0 || it < 0 || is < 0) errors.push('Missing required columns (portfolio, ticker, shares)');
  const map = {};
  rows.slice(1).forEach((line, i) => {
    const c = line.split(',').map((s) => s.trim());
    const type = (c[ip] || '').toUpperCase();
    const ticker = (c[it] || '').toUpperCase();
    const shares = parseFloat(c[is]);
    const target = ig >= 0 ? parseFloat(c[ig]) : 0;
    if (!type || !ticker) { errors.push(`Row ${i + 2}: missing portfolio or ticker`); return; }
    if (!Number.isFinite(shares)) { errors.push(`Row ${i + 2}: invalid shares "${c[is]}"`); return; }
    if (!map[type]) map[type] = { id: type.toLowerCase(), type, holdings: [] };
    map[type].holdings.push({ ticker, shares, target: Number.isFinite(target) ? target : 0 });
  });
  const order = ACCOUNT_ORDER;
  const portfolios = Object.values(map).sort((a, b) => {
    const ai = order.indexOf(a.type), bi = order.indexOf(b.type);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return { portfolios, errors };
};
