import { describe, it, expect, beforeEach } from 'vitest';
import { sheetTemplate } from '../data/catalog.js';
import { isFresh, staleTickers, writeQuotes, readQuotes, TTL_MS, clearCache } from './cache.js';
import { parseSheetCsv, fetchSheet } from './googleSheets.js';

describe('cache TTL', () => {
  beforeEach(() => clearCache());

  it('treats entries within TTL as fresh and older ones as stale', () => {
    const now = 1_000_000_000_000;
    expect(isFresh({ ts: now }, now)).toBe(true);
    expect(isFresh({ ts: now - TTL_MS + 1 }, now)).toBe(true);
    expect(isFresh({ ts: now - TTL_MS - 1 }, now)).toBe(false);
    expect(isFresh(undefined, now)).toBe(false);
  });

  it('staleTickers returns only missing/expired tickers', () => {
    const now = 2_000_000_000_000;
    writeQuotes({ VFV: { price: 10, cur: 'CAD', chg: 0 } }, now);
    expect(staleTickers(['VFV', 'VOO'], now)).toEqual(['VOO']);
    // far in the future → everything stale again
    expect(staleTickers(['VFV'], now + TTL_MS + 1)).toEqual(['VFV']);
  });

  it('writeQuotes/readQuotes persists with a timestamp', () => {
    const now = 3_000_000_000_000;
    writeQuotes({ VOO: { price: 545, cur: 'USD', chg: 0.4 } }, now);
    expect(readQuotes().VOO).toMatchObject({ price: 545, ts: now });
  });
});

describe('googleSheets parsing', () => {
  it('parses quotes + the FX row, skipping the header', () => {
    const csv = [
      'ticker,price,change',
      'VFV,154.32,0.41',
      'VOO,545.10,0.39',
      '__FX_USDCAD,1.3712,',
    ].join('\n');
    const { quotes, fx, errors } = parseSheetCsv(csv);
    expect(errors).toEqual({});
    expect(quotes.VFV).toMatchObject({ price: 154.32, chg: 0.41 });
    expect(quotes.VOO.price).toBeCloseTo(545.10);
    expect(fx).toBeCloseTo(1.3712);
  });

  it('tolerates #N/A and blank cells without throwing', () => {
    const csv = [
      'ticker,price,change',
      'VFV,#N/A,#N/A',   // still calculating → per-ticker error, not a throw
      'ZAG,13.60,',      // blank change → chg defaults to 0
      '__FX_USDCAD,#N/A,',
    ].join('\n');
    const { quotes, fx, errors } = parseSheetCsv(csv);
    expect(quotes.VFV).toBeUndefined();
    expect(errors.VFV).toBeDefined();
    expect(quotes.ZAG).toMatchObject({ price: 13.6, chg: 0 });
    expect(fx).toBeNull();
    expect(errors.__FX_USDCAD).toBeDefined();
  });

  it('strips thousands separators and currency symbols', () => {
    const { quotes } = parseSheetCsv('ticker,price,change\nBRK,"1,234.50",0.1');
    expect(quotes.BRK.price).toBeCloseTo(1234.5);
  });

  it('fetchSheet returns empty when no URL is set (and never fetches)', async () => {
    const r = await fetchSheet('', async () => { throw new Error('should not fetch'); });
    expect(r).toEqual({ quotes: {}, fx: null, errors: {} });
  });

  it('fetchSheet fetches the URL and parses the CSV text', async () => {
    const fetchImpl = async () => ({ text: async () => 'ticker,price,change\nVOO,545,0.4\n__FX_USDCAD,1.37,' });
    const { quotes, fx } = await fetchSheet('https://docs.google.com/.../pub?output=csv', fetchImpl);
    expect(quotes.VOO.price).toBe(545);
    expect(fx).toBeCloseTo(1.37);
  });

  it('reports a network failure without throwing', async () => {
    const fetchImpl = async () => { throw new Error('boom'); };
    const { quotes, errors } = await fetchSheet('https://x', fetchImpl);
    expect(quotes).toEqual({});
    expect(errors._network).toMatch(/boom/);
  });
});

describe('sheetTemplate', () => {
  it('emits a header, GOOGLEFINANCE rows and the FX row', () => {
    const tpl = sheetTemplate();
    expect(tpl.split('\n')[0]).toBe('ticker,price,change');
    expect(tpl).toMatch(/VFV,=GOOGLEFINANCE\("VFV:TSE","price"\)/);
    expect(tpl).toMatch(/__FX_USDCAD,=GOOGLEFINANCE\("CURRENCY:USDCAD","price"\)/);
  });
});
