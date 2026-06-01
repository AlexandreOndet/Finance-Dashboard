import { describe, it, expect, beforeEach } from 'vitest';
import { sheetTemplate, assetsFromQuotes, currencyFromGfSymbol, exchangeFromGfSymbol } from '../data/catalog.js';
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
      'ticker,price',
      'VFV,#N/A',   // still calculating → per-ticker error, not a throw
      'ZAG,13.60',  // no change column → chg omitted (seed change preserved)
      '__FX_USDCAD,#N/A',
    ].join('\n');
    const { quotes, fx, errors } = parseSheetCsv(csv);
    expect(quotes.VFV).toBeUndefined();
    expect(errors.VFV).toBeDefined();
    expect(quotes.ZAG).toMatchObject({ price: 13.6 });
    expect(quotes.ZAG.chg).toBeUndefined();
    expect(fx).toBeNull();
    expect(errors.__FX_USDCAD).toBeDefined();
  });

  it('parses locale (comma-decimal) numbers, quoted, as Google publishes them', () => {
    const csv = [
      'ticker,price',
      'VFV,"185,61"',          // comma decimal → 185.61
      '__FX_USDCAD,"1,381005"', // 6-dp comma decimal → 1.381005
    ].join('\n');
    const { quotes, fx } = parseSheetCsv(csv);
    expect(quotes.VFV.price).toBeCloseTo(185.61);
    expect(fx).toBeCloseTo(1.381005);
  });

  it('handles both US (1,234.50) and EU (1.234,56) thousands/decimals', () => {
    const { quotes } = parseSheetCsv('ticker,price\nUS,"1,234.50"\nEU,"1.234,56"');
    expect(quotes.US.price).toBeCloseTo(1234.5);
    expect(quotes.EU.price).toBeCloseTo(1234.56);
  });

  it('keeps an optional change column when present and valid', () => {
    const pipe = parseSheetCsv('ticker|price|change\nVFV|154.32|0.41\n__FX_USDCAD|1.37|');
    expect(pipe.quotes.VFV).toMatchObject({ price: 154.32, chg: 0.41 });
    expect(pipe.fx).toBeCloseTo(1.37);
    const tab = parseSheetCsv('ticker\tprice\nVOO\t545');
    expect(tab.quotes.VOO.price).toBe(545);
  });

  it('fetchSheet returns empty when no URL is set (and never fetches)', async () => {
    const r = await fetchSheet('', async () => { throw new Error('should not fetch'); });
    expect(r).toEqual({ quotes: {}, fx: null, errors: {} });
  });

  it('fetchSheet fetches the URL and parses the CSV text', async () => {
    const fetchImpl = async () => ({ text: async () => 'ticker,price\nVOO,545\n__FX_USDCAD,1.37' });
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

describe('googleSheets registry columns', () => {
  it('reads name / gfSymbol / class metadata columns by header', () => {
    const csv = [
      'ticker|name|gfSymbol|class|price',
      'VFV|Vanguard 500|TSE:VFV|US Equity|185.61',
      'XYZ|My New ETF|NASDAQ:XYZ|Crypto|12.50',
      '__FX_USDCAD||||1.38',
    ].join('\n');
    const { quotes, fx, errors } = parseSheetCsv(csv);
    expect(errors).toEqual({});
    expect(quotes.VFV).toMatchObject({ price: 185.61, name: 'Vanguard 500', gfSymbol: 'TSE:VFV', klass: 'US Equity' });
    expect(quotes.XYZ).toMatchObject({ price: 12.5, name: 'My New ETF', gfSymbol: 'NASDAQ:XYZ', klass: 'Crypto' });
    expect(fx).toBeCloseTo(1.38);
  });

  it('matches columns by name regardless of order, and omits blank cells', () => {
    const { quotes } = parseSheetCsv('price|gfsymbol|ticker\n9.87|TSE:ETHX.B|ETHXB');
    expect(quotes.ETHXB).toMatchObject({ price: 9.87, gfSymbol: 'TSE:ETHX.B' });
    expect(quotes.ETHXB.name).toBeUndefined();
  });
});

describe('currency / exchange inference from gfSymbol', () => {
  it('infers USD for US listings and CAD otherwise', () => {
    expect(currencyFromGfSymbol('NASDAQ:QQQ')).toBe('USD');
    expect(currencyFromGfSymbol('NYSEARCA:VOO')).toBe('USD');
    expect(currencyFromGfSymbol('TSE:VFV')).toBe('CAD');
    expect(currencyFromGfSymbol('')).toBe('CAD');
    expect(exchangeFromGfSymbol('NASDAQ:QQQ')).toBe('US');
    expect(exchangeFromGfSymbol('TSE:VFV')).toBe('TSX');
    expect(exchangeFromGfSymbol('')).toBe('NONE');
  });
});

describe('assetsFromQuotes (catalog ⊕ sheet)', () => {
  it('overrides catalog metadata when the sheet provides it, keeps catalog when blank', () => {
    const a = assetsFromQuotes({ VFV: { price: 185.61, name: 'My VFV', gfSymbol: 'TSE:VFV' } });
    expect(a.VFV).toMatchObject({ name: 'My VFV', cur: 'CAD', price: 185.61, live: true });
    const b = assetsFromQuotes({ VFV: { price: 185.61 } }); // no name → catalog default kept
    expect(b.VFV.name).toBe('Vanguard S&P 500 Index ETF');
    expect(b.VFV.price).toBe(185.61);
  });

  it('synthesises a full asset record for a ticker not in the catalog', () => {
    const a = assetsFromQuotes({ XYZ: { price: 12.5, name: 'My New ETF', gfSymbol: 'NASDAQ:XYZ', klass: 'Crypto' } });
    expect(a.XYZ).toMatchObject({ name: 'My New ETF', cur: 'USD', exchange: 'US', klass: 'Crypto', price: 12.5, live: true });
  });

  it('defaults an unknown ticker with no gfSymbol to CAD / Other', () => {
    const a = assetsFromQuotes({ ZZZ: { price: 7 } });
    expect(a.ZZZ).toMatchObject({ name: 'ZZZ', cur: 'CAD', klass: 'Other', price: 7 });
  });
});

describe('sheetTemplate', () => {
  it('emits the registry header, single-argument price rows and the FX row', () => {
    const tpl = sheetTemplate();
    expect(tpl.split('\n')[0]).toBe('ticker|name|gfSymbol|class|price');
    expect(tpl).toMatch(/VFV\|Vanguard S&P 500 Index ETF\|TSE:VFV\|US Equity\|=GOOGLEFINANCE\("TSE:VFV"\)$/m);
    expect(tpl).toMatch(/__FX_USDCAD\|\|\|\|=GOOGLEFINANCE\("CURRENCY:USDCAD"\)$/m);
    expect(tpl).not.toMatch(/changepct/); // change column dropped (locale-fragile)
  });
});
