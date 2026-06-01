// Settings modal — market-data configuration. The user pastes their free
// Twelve Data API key (stored only in localStorage), can force a refresh,
// and sees when prices were last updated + whether live data is active.
import React from 'react';
import { useApp } from '../context.jsx';
import { Icon } from '../components/icons.jsx';
import { t, fmtNum } from '../i18n.js';

const FD = '"Bricolage Grotesque", sans-serif';
const FB = '"Hanken Grotesk", sans-serif';

function fmtWhen(ts, lang) {
  if (!ts) return t(lang, 'never');
  return new Date(ts).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function Settings({ onClose }) {
  const { tk, lang, market } = useApp();
  const { hasKey, apiKey, loading, error, lastUpdated, fx, setApiKey, refresh } = market;
  const [draft, setDraft] = React.useState(apiKey || '');

  const save = () => setApiKey(draft);
  const clear = () => { setDraft(''); setApiKey(''); };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,14,8,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 20px' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: tk.panel, border: '1px solid ' + tk.line2, borderRadius: 20, boxShadow: tk.shadow, padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, color: tk.ink, letterSpacing: -0.3 }}>{t(lang, 'settings')}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tk.faint, display: 'flex' }}><Icon name="close" size={20} /></button>
        </div>

        {/* status banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: FB, fontSize: 13, fontWeight: 600,
          color: hasKey ? tk.buy : tk.sub, background: hasKey ? tk.buySoft : tk.inset, border: '1px solid ' + tk.line2,
          padding: '11px 14px', borderRadius: 12, marginBottom: 18 }}>
          <Icon name={hasKey ? 'check' : 'refresh'} size={16} />
          {hasKey ? t(lang, 'livePrices') : t(lang, 'usingSample')}
        </div>

        {/* api key */}
        <label style={{ display: 'block', fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: tk.faint, marginBottom: 8 }}>{t(lang, 'apiKey')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t(lang, 'apiKeyPlaceholder')}
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: FB, fontSize: 13.5, color: tk.ink, background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 10, padding: '10px 12px', outline: 'none' }} />
          <button onClick={save}
            style={{ border: '1px solid transparent', background: tk.accent, color: '#fff', cursor: 'pointer', fontFamily: FB, fontSize: 13.5, fontWeight: 600, padding: '0 16px', borderRadius: 10 }}>{t(lang, 'save')}</button>
        </div>
        <div style={{ fontFamily: FB, fontSize: 12, color: tk.faint, lineHeight: 1.5, marginBottom: 8 }}>{t(lang, 'apiKeyHelp')}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer"
            style={{ fontFamily: FB, fontSize: 12.5, fontWeight: 600, color: tk.accent, textDecoration: 'none' }}>{t(lang, 'getKey')} →</a>
          {hasKey && <button onClick={clear} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FB, fontSize: 12.5, fontWeight: 600, color: tk.faint }}>{t(lang, 'clearKey')}</button>}
        </div>

        {error && <div style={{ fontFamily: FB, fontSize: 12.5, color: tk.sell, marginBottom: 14 }}>{error}</div>}

        {/* meta row: last updated + fx + refresh */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTop: '1px solid ' + tk.line2 }}>
          <div style={{ fontFamily: FB, fontSize: 12.5, color: tk.sub, lineHeight: 1.6 }}>
            <div>{t(lang, 'lastUpdated')}: <b style={{ color: tk.ink }}>{fmtWhen(lastUpdated, lang)}</b></div>
            <div>{t(lang, 'fxRate')}: <b style={{ color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(fx.CADperUSD, lang, 4)}</b></div>
          </div>
          <button onClick={refresh} disabled={!hasKey || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid ' + tk.line, background: tk.inset, color: hasKey ? tk.ink : tk.faint, cursor: hasKey && !loading ? 'pointer' : 'not-allowed', fontFamily: FB, fontSize: 13, fontWeight: 600, padding: '9px 13px', borderRadius: 10, opacity: loading ? 0.7 : 1 }}>
            <Icon name="refresh" size={15} />{loading ? t(lang, 'refreshing') : t(lang, 'refresh')}
          </button>
        </div>

        <div style={{ fontFamily: FB, fontSize: 11.5, color: tk.faint, marginTop: 14 }}>{t(lang, 'sourceNote')}</div>
      </div>
    </div>
  );
}
