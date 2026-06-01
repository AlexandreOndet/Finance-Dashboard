import { describe, it, expect } from 'vitest';
import { rebalance, grandTotal, portfolioTotal, holdingValue, toDisplay } from './compute.js';
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
    { ticker: 'AAA', shares: 100, target: 50 }, // 1000 CAD
    { ticker: 'USD1', shares: 5, target: 50 },   // 500 USD = 700 CAD
  ],
};

describe('currency conversion', () => {
  it('converts USD holdings to CAD at the fx rate', () => {
    expect(holdingValue({ ticker: 'USD1', shares: 5 }, 'CAD', assets, fx)).toBeCloseTo(700);
    expect(holdingValue({ ticker: 'USD1', shares: 5 }, 'USD', assets, fx)).toBeCloseTo(500);
  });
  it('toDisplay is identity for matching currency', () => {
    expect(toDisplay(1000, 'CAD', 'CAD', fx)).toBe(1000);
  });
});

describe('rebalance', () => {
  it('conserves cash — sum of deltas is ~0 (full rebalance)', () => {
    const rows = rebalance(p, 'CAD', assets, fx);
    const net = rows.reduce((s, r) => s + r.delta, 0);
    expect(net).toBeCloseTo(0, 6);
  });
  it('produces a sell for the over-weight asset and a buy for the under-weight one', () => {
    const rows = rebalance(p, 'CAD', assets, fx);
    const aaa = rows.find((r) => r.ticker === 'AAA');
    const usd = rows.find((r) => r.ticker === 'USD1');
    // total = 1700 CAD, target 50/50 = 850 each. AAA at 1000 is over → sell.
    expect(aaa.delta).toBeLessThan(0);
    expect(usd.delta).toBeGreaterThan(0);
  });
  it('totals are display-currency consistent', () => {
    expect(portfolioTotal(p, 'CAD', assets, fx)).toBeCloseTo(1700);
    expect(grandTotal([p], 'CAD', assets, fx)).toBeCloseTo(1700);
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

  it('rebalance treats a 0%-target cash holding as funds to deploy (negative delta)', () => {
    const seeded = seedAssets();
    const pc = { id: 'c', type: 'NONREG', holdings: [
      { ticker: 'VFV', shares: 10, target: 100 },     // priced from seed catalog
      { ticker: 'CASH_CAD', shares: 500, target: 0 }, // $500 to deploy
    ] };
    const rows = rebalance(pc, 'CAD', seeded, fx);
    const cash = rows.find((r) => r.ticker === 'CASH_CAD');
    expect(cash.cur).toBeCloseTo(500);
    expect(cash.delta).toBeCloseTo(-500); // target 0 → deploy all of it
  });
});
