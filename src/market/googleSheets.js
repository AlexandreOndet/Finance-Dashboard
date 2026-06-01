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

// Parse a possibly-formatted number cell. Strips currency symbols, spaces and
// thousands separators. Returns NaN for blanks or "#N/A" (still-calculating).
function parseNum(raw) {
  if (raw == null) return NaN;
  const s = String(raw).replace(/[$£€\s]/g, '').replace(/,(?=\d{3}\b)/g, '');
  if (!s || /#N\/?A|#ERROR|#REF/i.test(s)) return NaN;
  return parseFloat(s);
}

// Parse the published-sheet CSV text into { quotes, fx, errors }.
// quotes[ticker] = { price, chg, currency: null }; fx is a number|null;
// errors[ticker] records cells that didn't resolve (never throws).
export function parseSheetCsv(text) {
  const quotes = {};
  const errors = {};
  let fx = null;

  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const [tickerCell, priceCell, chgCell] = splitLine(line, delimOf(line));
    const ticker = (tickerCell || '').trim();
    if (!ticker) continue;
    if (ticker.toLowerCase() === 'ticker') continue; // header

    const price = parseNum(priceCell);

    if (ticker.toUpperCase() === FX_ROW) {
      if (Number.isFinite(price)) fx = price;
      else errors[FX_ROW] = 'no fx';
      continue;
    }

    if (!Number.isFinite(price)) { errors[ticker] = 'no quote'; continue; }
    const chg = parseNum(chgCell);
    quotes[ticker] = { price, chg: Number.isFinite(chg) ? chg : 0, currency: null };
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
