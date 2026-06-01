import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { ViewPortfolio } from './views/Portfolio.jsx';
import { ViewData } from './views/Data.jsx';
import { AppCtx } from './context.jsx';
import { tokens, assetColor } from './theme.js';
import { DEFAULT_PORTFOLIOS, seedAssets, DEFAULT_FX } from './data/catalog.js';

// Smoke test: render the whole tree server-side to catch import cycles,
// undefined refs, and render-time crashes across every view.
describe('App renders', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });

  it('mounts the shell with the app title and default account labels', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Allocator');
    expect(html).toContain('TFSA');
    expect(html).toContain('Overview');
  });
});

// Render the account-detail and data views directly through a context
// provider so their full table/forecast paths are exercised.
function withCtx(node, overrides = {}) {
  const ctx = {
    mode: 'light', lang: 'en', disp: 'CAD',
    portfolios: DEFAULT_PORTFOLIOS, setPortfolios: () => {},
    route: { name: 'overview' }, setRoute: () => {},
    tk: tokens('light'), ac: assetColor('light'),
    assets: seedAssets(), fx: { ...DEFAULT_FX },
    market: { configured: false, sheetUrl: '', loading: false, lastUpdated: null, fx: { ...DEFAULT_FX }, setSheetUrl: () => {}, refresh: () => {} },
    ...overrides,
  };
  return renderToString(<AppCtx.Provider value={ctx}>{node}</AppCtx.Provider>);
}

describe('views render with seeded data', () => {
  it('account detail shows holdings and trade math', () => {
    const html = withCtx(<ViewPortfolio id="rrsp" />);
    expect(html).toContain('VOO');
    expect(html).toContain('SPUS');
  });
  it('data view lists the editable rows', () => {
    const html = withCtx(<ViewData />);
    expect(html).toContain('TICKER');
  });
});
