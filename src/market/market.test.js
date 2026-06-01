import { describe, it, expect, beforeEach } from 'vitest';
import { groupByExchange, exchangeOf } from './symbols.js';
import { MARKET_TICKERS, CASH_TICKERS } from '../data/catalog.js';
import { isFresh, staleTickers, writeQuotes, readQuotes, TTL_MS, clearCache } from './cache.js';
import { fetchQuotes, fetchFx } from './twelveData.js';

describe('symbols', () => {
  it('classifies catalog tickers by exchange', () => {
    expect(exchangeOf('VFV')).toBe('TSX');
    expect(exchangeOf('VOO')).toBe('US');
  });
  it('groups a mixed list by exchange', () => {
    const groups = groupByExchange(['VFV', 'VOO', 'ETHXB', 'IBIT']);
    expect(groups.TSX.sort()).toEqual(['ETHXB', 'VFV']);
    expect(groups.US.sort()).toEqual(['IBIT', 'VOO']);
  });
  it('never quotes cash: excluded from MARKET_TICKERS and dropped by groupByExchange', () => {
    CASH_TICKERS.forEach((t) => expect(MARKET_TICKERS).not.toContain(t));
    const groups = groupByExchange(['VFV', 'CASH_CAD', 'CASH_USD']);
    expect(Object.values(groups).flat()).toEqual(['VFV']);
  });
});

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

// Build a fake fetch that returns canned JSON for matched URL fragments.
const makeFetch = (routes) => async (url) => {
  for (const [frag, payload] of Object.entries(routes)) {
    if (url.includes(frag)) return { json: async () => payload };
  }
  throw new Error('unexpected url ' + url);
};

describe('twelveData parsing', () => {
  it('parses a multi-symbol US quote batch', async () => {
    const fetchImpl = makeFetch({
      'symbol=VOO%2CSPUS': {
        VOO: { symbol: 'VOO', close: '545.00', percent_change: '0.39', currency: 'USD' },
        SPUS: { symbol: 'SPUS', close: '49.20', percent_change: '0.51', currency: 'USD' },
      },
    });
    const { quotes, errors } = await fetchQuotes(['VOO', 'SPUS'], 'KEY', fetchImpl);
    expect(errors).toEqual({});
    expect(quotes.VOO).toMatchObject({ price: 545, chg: 0.39 });
    expect(quotes.SPUS.price).toBeCloseTo(49.2);
  });

  it('parses a single-symbol response returned as a bare object', async () => {
    const fetchImpl = makeFetch({
      'symbol=ETHXB': { symbol: 'ETHXB', close: '18.40', percent_change: '-2.61', currency: 'CAD' },
    });
    const { quotes } = await fetchQuotes(['ETHXB'], 'KEY', fetchImpl);
    expect(quotes.ETHXB).toMatchObject({ price: 18.4, chg: -2.61 });
  });

  it('reports a whole-request error without throwing', async () => {
    const fetchImpl = makeFetch({
      quote: { code: 401, status: 'error', message: 'invalid api key' },
    });
    const { quotes, errors } = await fetchQuotes(['VOO'], 'BADKEY', fetchImpl);
    expect(quotes).toEqual({});
    expect(errors.VOO).toMatch(/invalid api key/);
  });

  it('returns no quotes when no key is set', async () => {
    const { quotes } = await fetchQuotes(['VOO'], '', makeFetch({}));
    expect(quotes).toEqual({});
  });

  it('parses the USD/CAD exchange rate', async () => {
    const fetchImpl = makeFetch({ exchange_rate: { symbol: 'USD/CAD', rate: 1.3712 } });
    expect(await fetchFx('KEY', fetchImpl)).toBeCloseTo(1.3712);
  });

  it('returns null fx on error', async () => {
    const fetchImpl = makeFetch({ exchange_rate: { status: 'error', message: 'nope' } });
    expect(await fetchFx('KEY', fetchImpl)).toBeNull();
  });
});
