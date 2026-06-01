// App shell — sidebar + topbar, routing, global controls, persistence,
// and the market-data wiring (resolved assets/fx flow into AppCtx).
import React, { useState, useEffect } from 'react';
import { AppCtx, useApp } from './context.jsx';
import { tokens, assetColor, FONTS } from './theme.js';
import { t, acctLabel } from './i18n.js';
import { DEFAULT_PORTFOLIOS } from './data/catalog.js';
import { Icon } from './components/icons.jsx';
import { Segmented } from './components/ui.jsx';
import { useMarketData } from './market/useMarketData.js';
import { ViewOverview } from './views/Overview.jsx';
import { ViewPortfolio } from './views/Portfolio.jsx';
import { ViewData } from './views/Data.jsx';
import { Settings } from './views/Settings.jsx';

const LS = 'allocator-state-v1';

function NavItem({ icon, label, active, onClick, indent }) {
  const { tk } = useApp();
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', border: 'none', cursor: 'pointer',
        background: active ? tk.accentSoft : (h ? tk.inset : 'transparent'), color: active ? tk.accent : tk.sub,
        fontFamily: FONTS.body, fontSize: 14, fontWeight: active ? 700 : 600, textAlign: 'left',
        padding: indent ? '9px 12px 9px 40px' : '10px 12px', borderRadius: 11, transition: 'all .12s' }}>
      {icon && <Icon name={icon} size={18} />}
      <span style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function Sidebar() {
  const { tk, lang, route, setRoute, portfolios } = useApp();
  return (
    <div style={{ width: 250, flexShrink: 0, background: tk.panel, borderRight: '1px solid ' + tk.line, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 22px' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: tk.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: FONTS.disp, fontWeight: 700, fontSize: 18 }}>◆</span>
        <div>
          <div style={{ fontFamily: FONTS.disp, fontSize: 17, fontWeight: 700, color: tk.ink, letterSpacing: -0.3, lineHeight: 1 }}>{t(lang, 'appTitle')}</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: tk.faint, marginTop: 3 }}>{t(lang, 'appTag')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <NavItem icon="overview" label={t(lang, 'nav_overview')} active={route.name === 'overview'} onClick={() => setRoute({ name: 'overview' })} />
        <div style={{ fontFamily: FONTS.body, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: tk.faint, padding: '14px 12px 6px' }}>{t(lang, 'nav_accounts')}</div>
        {portfolios.map((p) => (
          <NavItem key={p.id} indent label={acctLabel(lang, p.type)} active={route.name === 'account' && route.id === p.id} onClick={() => setRoute({ name: 'account', id: p.id })} />
        ))}
        <div style={{ height: 10 }} />
        <NavItem icon="data" label={t(lang, 'nav_data')} active={route.name === 'data'} onClick={() => setRoute({ name: 'data' })} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: tk.faint, padding: '0 10px' }}>{t(lang, 'asOf')}</div>
    </div>
  );
}

function IconButton({ icon, onClick, title, badge }) {
  const { tk } = useApp();
  return (
    <button onClick={onClick} title={title}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, border: '1px solid ' + tk.line, background: tk.inset, color: tk.ink, cursor: 'pointer' }}>
      <Icon name={icon} size={18} />
      {badge && <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, background: tk.accent, border: '1.5px solid ' + tk.inset }} />}
    </button>
  );
}

function Topbar({ onOpenSettings }) {
  const { tk, lang, disp, setDisp, setLang, mode, setMode, market } = useApp();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 34px', borderBottom: '1px solid ' + tk.line, background: tk.bg, position: 'sticky', top: 0, zIndex: 20 }}>
      <Segmented size="sm" value={disp} onChange={setDisp} options={[{ value: 'CAD', label: 'CAD' }, { value: 'USD', label: 'USD' }]} />
      <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'en', label: 'EN' }, { value: 'fr', label: 'FR' }]} />
      <IconButton icon="settings" title={t(lang, 'settings')} onClick={onOpenSettings} badge={!market.configured} />
      <IconButton icon={mode === 'dark' ? 'sun' : 'moon'} title={t(lang, 'theme')} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
    </div>
  );
}

function Shell() {
  const { tk, route } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  let view;
  if (route.name === 'account') view = <ViewPortfolio id={route.id} />;
  else if (route.name === 'data') view = <ViewData />;
  else view = <ViewOverview />;
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: tk.bg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onOpenSettings={() => setSettingsOpen(true)} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 34px 80px' }}>{view}</div>
        </div>
      </div>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default function App() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } })();
  const [mode, setMode] = useState(saved.mode || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [lang, setLang] = useState(saved.lang || ((navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'));
  const [disp, setDisp] = useState(saved.disp || 'CAD');
  const [portfolios, setPortfolios] = useState(saved.portfolios || JSON.parse(JSON.stringify(DEFAULT_PORTFOLIOS)));
  const [route, setRoute] = useState(saved.route || { name: 'overview' });

  const tk = tokens(mode);
  const ac = assetColor(mode);
  const market = useMarketData();

  useEffect(() => {
    try { localStorage.setItem(LS, JSON.stringify({ mode, lang, disp, portfolios, route })); } catch { /* noop */ }
  }, [mode, lang, disp, portfolios, route]);
  useEffect(() => {
    document.documentElement.style.background = tk.bg;
    document.body.style.background = tk.bg;
    document.body.style.colorScheme = mode;
  }, [tk.bg, mode]);

  const ctx = {
    mode, setMode, lang, setLang, disp, setDisp, portfolios, setPortfolios, route, setRoute, tk, ac,
    assets: market.assets, fx: market.fx, market,
  };
  return <AppCtx.Provider value={ctx}><Shell /></AppCtx.Provider>;
}
