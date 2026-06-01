// Market-data provider — Google Finance via a user-published Google Sheet.
//
// There is no official Google Finance REST API, and this app is a static,
// client-side site (no backend), so it cannot call Google Finance directly
// (CORS). Instead the user keeps one Google Sheet whose cells use
// `=GOOGLEFINANCE(...)` and publishes it to the web as CSV. A published-CSV
// URL *is* CORS-accessible, free, and needs no API key. We fetch that one
// document and parse it.
//
// Expected (evaluated) CSV shape — one row per ticker plus a reserved FX row:
//
//   ticker,price,change
//   VFV,154.32,0.41
//   VOO,545.10,0.39
//   __FX_USDCAD,1.3712,
//
// Column A is the app's internal catalog ticker. `price`/`change` come from
// GOOGLEFINANCE("…","price") / ("…","changepct"). The __FX_USDCAD row carries
// CAD-per-USD (GOOGLEFINANCE("CURRENCY:USDCAD","price")). Currency is not read
// here — each asset's native currency lives in the catalog.

export const FX_ROW = '__FX_USDCAD';

// Pick the delimiter for a line. Google publishes to the web as comma CSV, but
// be tolerant: a tab- or pipe-separated variant parses too (pipe is what the
// paste-in template uses, since GOOGLEFINANCE() formulas contain commas).
function delimOf(line) {
  if (line.includes('\t')) return '\t';
  if (line.includes('|')) return '|';
  return ',';
}

// Split one line into trimmed cells. For comma (real CSV) we honour simple
// double-quoted fields; tab/pipe data is split plainly.
function splitLine(line, delim) {
  if (delim !== ',') return line.split(delim).map((s) => s.trim());
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells.map((s) => s.trim());
}

// Parse a possibly-formatted number cell into a JS number. Handles both the
// US (1,234.56) and European/locale (1.234,56 or 185,61 — comma decimal) styles
// Google publishes depending on the sheet's locale. Returns NaN for blanks,
// "#N/A"/"#ERROR" (still calculating / bad formula), or unresolved formulas.
function parseNum(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/[$£€\s]/g, '');
  if (!s || /#N\/?A|#ERROR|#REF|GOOGLEFINANCE/i.test(s)) return NaN;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // Both separators present → the right-most one is the decimal point.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') // 1.234,56
                            : s.replace(/,/g, '');                   // 1,234.56
  } else if (lastComma !== -1) {
    // Only comma(s): several → thousands grouping; a single one → decimal.
    const parts = s.split(',');
    s = parts.length > 2 ? parts.join('') : s.replace(',', '.');
  }
  return parseFloat(s);
}

// Locate columns from the header row. The sheet is the asset registry, so it
// may carry metadata columns (name, gfSymbol, class) alongside price. Matching
// is by header name, order-independent; a sheet with no recognised header falls
// back to positional ticker, price[, change].
function columnsOf(headerCells) {
  const lower = headerCells.map((c) => c.toLowerCase());
  const find = (...names) => { for (const n of names) { const i = lower.indexOf(n); if (i >= 0) return i; } return -1; };
  const ticker = find('ticker');
  if (ticker < 0) return null; // not a header row
  const cols = {
    ticker,
    name: find('name'),
    gf: find('gfsymbol', 'gf_symbol', 'symbol'),
    klass: find('class', 'klass', 'category'),
    price: find('price', 'value'),
    chg: find('change', 'changepct', 'chg'),
  };
  if (cols.price < 0) cols.price = ticker + 1; // tolerate a header without an explicit price column
  return cols;
}

// Parse the published-sheet CSV text into { quotes, fx, errors }.
// quotes[ticker] = { price, chg?, name?, gfSymbol?, klass? }; fx is number|null;
// errors[ticker] records cells that didn't resolve (never throws).
export function parseSheetCsv(text) {
  const quotes = {};
  const errors = {};
  let fx = null;

  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let cols = null;
  for (const line of lines) {
    const cells = splitLine(line, delimOf(line));
    if (!cols) {
      cols = columnsOf(cells);
      if (cols) continue;                              // header row consumed
      cols = { ticker: 0, name: -1, gf: -1, klass: -1, price: 1, chg: 2 }; // no header → positional
    }
    const at = (i) => (i >= 0 && i < cells.length ? cells[i] : undefined);
    const ticker = (at(cols.ticker) || '').trim();
    if (!ticker || ticker.toLowerCase() === 'ticker') continue;

    const price = parseNum(at(cols.price));

    if (ticker.toUpperCase() === FX_ROW) {
      if (Number.isFinite(price)) fx = price;
      else errors[FX_ROW] = 'no fx';
      continue;
    }

    if (!Number.isFinite(price)) { errors[ticker] = 'no quote'; continue; }
    // Carry only the metadata the sheet actually provides, so blank cells leave
    // the catalog defaults intact when the assets map is resolved.
    const q = { price };
    const name = (at(cols.name) || '').trim();
    if (name) q.name = name;
    const gf = (at(cols.gf) || '').trim();
    if (gf) q.gfSymbol = gf;
    const klass = (at(cols.klass) || '').trim();
    if (klass) q.klass = klass;
    const chg = parseNum(at(cols.chg));
    if (Number.isFinite(chg)) q.chg = chg;
    quotes[ticker] = q;
  }

  return { quotes, fx, errors };
}

// Fetch + parse the published sheet. `fetchImpl` is injectable for tests.
// Blank URL → empty result (app silently runs on seed prices). Network errors
// are reported, never thrown.
export async function fetchSheet(sheetUrl, fetchImpl = fetch) {
  const url = (sheetUrl || '').trim();
  if (!url) return { quotes: {}, fx: null, errors: {} };
  try {
    const res = await fetchImpl(url);
    const text = await res.text();
    return parseSheetCsv(text);
  } catch (e) {
    return { quotes: {}, fx: null, errors: { _network: e.message || 'network error' } };
  }
}
