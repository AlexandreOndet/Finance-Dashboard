import { describe, it, expect } from 'vitest';
import { csvToPortfolios, portfoliosToCSV, CSV_HEADER } from './csv.js';
import { DEFAULT_PORTFOLIOS } from './catalog.js';

describe('csv round-trip', () => {
  it('export → import reproduces the same holdings', () => {
    const csv = portfoliosToCSV(DEFAULT_PORTFOLIOS);
    expect(csv.split('\n')[0]).toBe(CSV_HEADER);
    const { portfolios, errors } = csvToPortfolios(csv);
    expect(errors).toHaveLength(0);

    const flat = (ps) => ps.flatMap((p) => p.holdings.map((h) => `${p.type}:${h.ticker}:${h.shares}:${h.target}`)).sort();
    expect(flat(portfolios)).toEqual(flat(DEFAULT_PORTFOLIOS));
  });

  it('tolerates reordered headers and whitespace', () => {
    const csv = 'ticker, portfolio , shares,target_pct\n VFV , TFSA, 10 , 100 ';
    const { portfolios, errors } = csvToPortfolios(csv);
    expect(errors).toHaveLength(0);
    expect(portfolios[0].type).toBe('TFSA');
    expect(portfolios[0].holdings[0]).toEqual({ ticker: 'VFV', shares: 10, target: 100 });
  });

  it('reports rows with invalid shares', () => {
    const csv = 'portfolio,ticker,shares,target_pct\nTFSA,VFV,abc,50';
    const { errors } = csvToPortfolios(csv);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('flags missing required columns', () => {
    const { errors } = csvToPortfolios('foo,bar\n1,2');
    expect(errors.some((e) => /required columns/i.test(e))).toBe(true);
  });

  it('round-trips an uninvested-cash holding', () => {
    const csv = 'portfolio,ticker,shares,target_pct\nNONREG,CASH_CAD,2000,0';
    const { portfolios, errors } = csvToPortfolios(csv);
    expect(errors).toHaveLength(0);
    expect(portfolios[0].holdings[0]).toEqual({ ticker: 'CASH_CAD', shares: 2000, target: 0 });
    expect(portfoliosToCSV(portfolios)).toContain('NONREG,CASH_CAD,2000,0');
  });
});
