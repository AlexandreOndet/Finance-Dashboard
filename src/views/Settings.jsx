// Settings modal — market-data configuration. The user pastes the URL of their
// own Google Sheet (=GOOGLEFINANCE() rows) published to the web as CSV (stored
// only in localStorage), can force a refresh, and sees when prices were last
// updated + whether live data is active. A copyable template seeds the sheet.
import React from 'react';
import { useApp } from '../context.jsx';
import { Icon } from '../components/icons.jsx';
import { t, fmtNum } from '../i18n.js';
import { sheetTemplate } from '../data/catalog.js';

const FD = '"Bricolage Grotesque", sans-serif';
const FB = '"Hanken Grotesk", sans-serif';

// How to publish a Google Sheet to the web as CSV.
const HELP_URL = 'https://support.google.com/docs/answer/183965';

function fmtWhen(ts, lang) {
  if (!ts) return t(lang, 'never');
  return new Date(ts).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function Settings({ onClose }) {
  const { tk, lang, market, isMobile } = useApp();
  const { configured, sheetUrl, loading, error, lastUpdated, fx, setSheetUrl, refresh } = market;
  const [draft, setDraft] = React.useState(sheetUrl || '');
  const [copied, setCopied] = React.useState(false);

  const save = () => setSheetUrl(draft);
  const clear = () => { setDraft(''); setSheetUrl(''); };
  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(sheetTemplate());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,14,8,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: isMobile ? '6vh 12px' : '8vh 20px' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: tk.panel, border: '1px solid ' + tk.line2, borderRadius: 20, boxShadow: tk.shadow, padding: isMobile ? 18 : 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, color: tk.ink, letterSpacing: -0.3 }}>{t(lang, 'settings')}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tk.faint, display: 'flex' }}><Icon name="close" size={20} /></button>
        </div>

        {/* status banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: FB, fontSize: 13, fontWeight: 600,
          color: configured ? tk.buy : tk.sub, background: configured ? tk.buySoft : tk.inset, border: '1px solid ' + tk.line2,
          padding: '11px 14px', borderRadius: 12, marginBottom: 18 }}>
          <Icon name={configured ? 'check' : 'refresh'} size={16} />
          {configured ? t(lang, 'livePrices') : t(lang, 'usingSample')}
        </div>

        {/* sheet CSV url */}
        <label style={{ display: 'block', fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: tk.faint, marginBottom: 8 }}>{t(lang, 'apiKey')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t(lang, 'apiKeyPlaceholder')}
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', fontFamily: FB, fontSize: 13.5, color: tk.ink, background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 10, padding: '10px 12px', outline: 'none' }} />
          <button onClick={save}
            style={{ border: '1px solid transparent', background: tk.accent, color: '#fff', cursor: 'pointer', fontFamily: FB, fontSize: 13.5, fontWeight: 600, padding: '0 16px', borderRadius: 10 }}>{t(lang, 'save')}</button>
        </div>
        <div style={{ fontFamily: FB, fontSize: 12, color: tk.faint, lineHeight: 1.5, marginBottom: 8 }}>{t(lang, 'apiKeyHelp')}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <a href={HELP_URL} target="_blank" rel="noreferrer"
            style={{ fontFamily: FB, fontSize: 12.5, fontWeight: 600, color: tk.accent, textDecoration: 'none' }}>{t(lang, 'getKey')} →</a>
          {configured && <button onClick={clear} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FB, fontSize: 12.5, fontWeight: 600, color: tk.faint }}>{t(lang, 'clearKey')}</button>}
        </div>

        {/* sheet template */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontFamily: FB, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: tk.faint }}>{t(lang, 'sheetTemplateLabel')}</label>
          <button onClick={copyTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid ' + tk.line, background: tk.inset, color: tk.ink, cursor: 'pointer', fontFamily: FB, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 8 }}>
            <Icon name={copied ? 'check' : 'copy'} size={13} />{copied ? t(lang, 'copied') : t(lang, 'copyTemplate')}
          </button>
        </div>
        <pre style={{ margin: 0, marginBottom: 20, maxHeight: 132, overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, lineHeight: 1.5, color: tk.sub, background: tk.inset, border: '1px solid ' + tk.line2, borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre' }}>{sheetTemplate()}</pre>

        {error && <div style={{ fontFamily: FB, fontSize: 12.5, color: tk.sell, marginBottom: 14 }}>{error}</div>}

        {/* meta row: last updated + fx + refresh */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTop: '1px solid ' + tk.line2 }}>
          <div style={{ fontFamily: FB, fontSize: 12.5, color: tk.sub, lineHeight: 1.6 }}>
            <div>{t(lang, 'lastUpdated')}: <b style={{ color: tk.ink }}>{fmtWhen(lastUpdated, lang)}</b></div>
            <div>{t(lang, 'fxRate')}: <b style={{ color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(fx.CADperUSD, lang, 4)}</b></div>
          </div>
          <button onClick={refresh} disabled={!configured || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid ' + tk.line, background: tk.inset, color: configured ? tk.ink : tk.faint, cursor: configured && !loading ? 'pointer' : 'not-allowed', fontFamily: FB, fontSize: 13, fontWeight: 600, padding: '9px 13px', borderRadius: 10, opacity: loading ? 0.7 : 1 }}>
            <Icon name="refresh" size={15} />{loading ? t(lang, 'refreshing') : t(lang, 'refresh')}
          </button>
        </div>

        <div style={{ fontFamily: FB, fontSize: 11.5, color: tk.faint, marginTop: 14 }}>{t(lang, 'sourceNote')}</div>
      </div>
    </div>
  );
}
