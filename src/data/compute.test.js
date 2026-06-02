import { describe, it, expect } from 'vitest';
import { globalRebalance, holdingsBreakdown, grandTotal, portfolioTotal, holdingValue, toDisplay } from './compute.js';
import { seedAssets, MARKET_TICKERS } from './catalog.js';

// Minimal resolved-assets map + fx for deterministic math.
const assets = {
  AAA: { cur: 'CAD', price: 10, chg: 0 },
  USD1: { cur: 'USD', price: 100, chg: 0 },
};
const fx = { CADperUSD: 1.4 };

const p = {
  id: 'x', type: 'TFSA',
  holdings: [
    { ticker: 'AAA', shares: 100 }, // 1000 CAD
    { ticker: 'USD1', shares: 5 },   // 500 USD = 700 CAD
  ],
};
const targets = { AAA: 50, USD1: 50 };

describe('currency conversion', () => {
  it('converts USD holdings to CAD at the fx rate', () => {
    expect(holdingValue({ ticker: 'USD1', shares: 5 }, 'CAD', assets, fx)).toBeCloseTo(700);
    expect(holdingValue({ ticker: 'USD1', shares: 5 }, 'USD', assets, fx)).toBeCloseTo(500);
  });
  it('toDisplay is identity for matching currency', () => {
    expect(toDisplay(1000, 'CAD', 'CAD', fx)).toBe(1000);
  });
});

describe('globalRebalance', () => {
  it('conserves cash — sum of deltas is ~0 when targets total 100', () => {
    const rows = globalRebalance([p], 'CAD', assets, fx, targets);
    const net = rows.reduce((s, r) => s + r.delta, 0);
    expect(net).toBeCloseTo(0, 6);
  });
  it('produces a sell for the over-weight asset and a buy for the under-weight one', () => {
    const rows = globalRebalance([p], 'CAD', assets, fx, targets);
    const aaa = rows.find((r) => r.ticker === 'AAA');
    const usd = rows.find((r) => r.ticker === 'USD1');
    // total = 1700 CAD, target 50/50 = 850 each. AAA at 1000 is over → sell.
    expect(aaa.delta).toBeLessThan(0);
    expect(usd.delta).toBeGreaterThan(0);
  });
  it('aggregates the same ticker held across multiple accounts into one row', () => {
    const p2 = { id: 'y', type: 'RRSP', holdings: [{ ticker: 'AAA', shares: 50 }] }; // +500 CAD
    const rows = globalRebalance([p, p2], 'CAD', assets, fx, targets);
    const aaa = rows.filter((r) => r.ticker === 'AAA');
    expect(aaa).toHaveLength(1);
    expect(aaa[0].cur).toBeCloseTo(1500); // 1000 + 500
    expect(aaa[0].shares).toBe(150);
  });
  it('totals are display-currency consistent', () => {
    expect(portfolioTotal(p, 'CAD', assets, fx)).toBeCloseTo(1700);
    expect(grandTotal([p], 'CAD', assets, fx)).toBeCloseTo(1700);
  });
});

describe('holdingsBreakdown', () => {
  it('reports per-account value and weight (no target/delta), summing to ~100%', () => {
    const rows = holdingsBreakdown(p, 'CAD', assets, fx);
    expect(rows.reduce((s, r) => s + r.curPct, 0)).toBeCloseTo(100);
    const aaa = rows.find((r) => r.ticker === 'AAA');
    expect(aaa.cur).toBeCloseTo(1000);
    expect(aaa.curPct).toBeCloseTo(1000 / 1700 * 100);
    expect(aaa.target).toBeUndefined();
    expect(aaa.delta).toBeUndefined();
  });
});

describe('cash holdings', () => {
  it('seeds cash assets at price 1 and keeps them out of MARKET_TICKERS', () => {
    const seeded = seedAssets();
    expect(seeded.CASH_CAD).toMatchObject({ price: 1, cur: 'CAD' });
    expect(seeded.CASH_USD).toMatchObject({ price: 1, cur: 'USD' });
    expect(MARKET_TICKERS).not.toContain('CASH_CAD');
    expect(MARKET_TICKERS).not.toContain('CASH_USD');
  });

  it('values cash as its dollar amount (shares × 1), converting USD at fx', () => {
    const seeded = seedAssets();
    expect(holdingValue({ ticker: 'CASH_CAD', shares: 2000 }, 'CAD', seeded, fx)).toBeCloseTo(2000);
    expect(holdingValue({ ticker: 'CASH_USD', shares: 2000 }, 'CAD', seeded, fx)).toBeCloseTo(2000 * 1.4);
  });

  it('globalRebalance treats a 0%-target cash holding as funds to deploy (negative delta)', () => {
    const seeded = seedAssets();
    const pc = { id: 'c', type: 'NONREG', holdings: [
      { ticker: 'VFV', shares: 10 },       // priced from seed catalog
      { ticker: 'CASH_CAD', shares: 500 }, // $500 to deploy
    ] };
    const rows = globalRebalance([pc], 'CAD', seeded, fx, { VFV: 100 }); // CASH_CAD target 0
    const cash = rows.find((r) => r.ticker === 'CASH_CAD');
    expect(cash.cur).toBeCloseTo(500);
    expect(cash.delta).toBeCloseTo(-500); // target 0 → deploy all of it
  });
});
