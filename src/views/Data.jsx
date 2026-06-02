// View: Data — CSV import (drop/paste), editable holdings table, export.
// Edits commit straight to the shared portfolios state so every other
// view updates live. Prices/currencies come from the resolved market
// data (live quotes, falling back to seed catalog prices) by ticker.
import React from 'react';
import { useApp } from '../context.jsx';
import { Card, Dot } from '../components/ui.jsx';
import { Icon } from '../components/icons.jsx';
import { DEFAULT_PORTFOLIOS, GLOBAL_TARGETS, ACCOUNT_ORDER, isCash } from '../data/catalog.js';
import { CSV_HEADER, csvToPortfolios, portfoliosToCSV } from '../data/csv.js';
import { holdingValue, curOf } from '../data/compute.js';
import { t, acctLabel, fmtMoney } from '../i18n.js';

const FB = '"Hanken Grotesk", sans-serif';

let _uid = 0;
const flatten = (ps) => { const out = []; ps.forEach((p) => p.holdings.forEach((h) => out.push({ uid: ++_uid, type: p.type, ticker: h.ticker, shares: h.shares }))); return out; };
const build = (rows) => {
  const map = {};
  rows.forEach((r) => { const type = (r.type || 'NONREG'); if (!map[type]) map[type] = { id: type.toLowerCase(), type, holdings: [] }; map[type].holdings.push({ ticker: (r.ticker || '').toUpperCase(), shares: parseFloat(r.shares) || 0 }); });
  const order = ACCOUNT_ORDER;
  return Object.values(map).sort((a, b) => { const ai = order.indexOf(a.type), bi = order.indexOf(b.type); return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi); });
};

function Field({ value, onChange, onBlur, width, align, type, list, placeholder }) {
  const { tk } = useApp();
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} type={type || 'text'} list={list} placeholder={placeholder}
      style={{ width: width || '100%', boxSizing: 'border-box', fontFamily: FB, fontSize: 13.5, fontWeight: 600,
        color: tk.ink, background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 9, padding: '8px 10px',
        textAlign: align || 'left', fontVariantNumeric: 'tabular-nums', outline: 'none' }}
      onFocus={(e) => (e.target.style.borderColor = tk.accent)}
      onBlurCapture={(e) => (e.target.style.borderColor = tk.line)} />
  );
}

function ActionBtn({ icon, label, onClick, primary, danger }) {
  const { tk } = useApp();
  const [h, setH] = React.useState(false);
  const bg = primary ? tk.accent : (h ? tk.inset : 'transparent');
  const col = primary ? '#fff' : (danger ? tk.sell : tk.ink);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid ' + (primary ? 'transparent' : tk.line), background: bg, color: col,
        cursor: 'pointer', fontFamily: FB, fontSize: 13.5, fontWeight: 600, padding: '9px 14px', borderRadius: 10, transition: 'all .12s' }}>
      {icon && <Icon name={icon} size={16} />}{label}
    </button>
  );
}

function ImportPanel({ onApply, onClose }) {
  const { tk, lang } = useApp();
  const [text, setText] = React.useState('');
  const [drag, setDrag] = React.useState(false);
  const fileRef = React.useRef(null);
  const parsed = text.trim() ? csvToPortfolios(text) : null;
  const rowCount = parsed ? parsed.portfolios.reduce((s, p) => s + p.holdings.length, 0) : 0;
  const readFile = (f) => { const r = new FileReader(); r.onload = () => setText(r.result); r.readAsText(f); };
  return (
    <Card style={{ padding: 22, marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 17, fontWeight: 700, color: tk.ink }}>{t(lang, 'importCsv')}</span>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tk.faint, display: 'flex' }}><Icon name="close" size={18} /></button>
      </div>
      <div onClick={() => fileRef.current && fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); }}
        style={{ border: '1.5px dashed ' + (drag ? tk.accent : tk.line), background: drag ? tk.accentSoft : tk.inset, borderRadius: 14, padding: '26px', textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', color: tk.accent, marginBottom: 8 }}><Icon name="upload" size={26} /></div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: tk.sub }}>{t(lang, 'dropCsv')}</div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && readFile(e.target.files[0])} />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={CSV_HEADER + '\nTFSA,VFV,120,60'}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 96, fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: tk.ink, background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical' }} />
      {parsed && (
        <div style={{ marginTop: 14 }}>
          {parsed.errors.length > 0 && <div style={{ fontSize: 12.5, color: tk.sell, marginBottom: 10 }}>{parsed.errors.slice(0, 4).join(' · ')}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: tk.sub }}>{t(lang, 'parsed')}: <b style={{ color: tk.ink }}>{rowCount}</b> {t(lang, 'rowsFound')} · {parsed.portfolios.length} {t(lang, 'nav_accounts').toLowerCase()}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <ActionBtn label={t(lang, 'cancel')} onClick={onClose} />
              <ActionBtn label={t(lang, 'apply')} icon="check" primary onClick={() => rowCount && onApply(parsed.portfolios)} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ViewData() {
  const { tk, lang, disp, portfolios, setPortfolios, targets, setTargets, assets, fx, isMobile } = useApp();
  const [rows, setRows] = React.useState(() => flatten(portfolios));
  const [importing, setImporting] = React.useState(false);

  const commit = (next) => { setRows(next); setPortfolios(build(next)); };
  const setCell = (uid, key, val) => commit(rows.map((r) => (r.uid === uid ? { ...r, [key]: val } : r)));
  const addRow = () => commit([...rows, { uid: ++_uid, type: 'TFSA', ticker: '', shares: 0 }]);
  const removeRow = (uid) => commit(rows.filter((r) => r.uid !== uid));
  const reset = () => { const ps = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIOS)); setPortfolios(ps); setRows(flatten(ps)); setTargets({ ...GLOBAL_TARGETS }); };
  const applyImport = (ps) => { setPortfolios(ps); setRows(flatten(ps)); setImporting(false); };
  const exportCsv = () => {
    const blob = new Blob([portfoliosToCSV(build(rows))], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'portfolio-holdings.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // Global targets editor: tickers are the union of held tickers and any
  // ticker that already carries a target. Edits commit straight to `targets`.
  const targetTickers = [...new Set([...rows.map((r) => (r.ticker || '').toUpperCase()).filter(Boolean), ...Object.keys(targets)])];
  const setTarget = (ticker, val) => setTargets({ ...targets, [ticker]: parseFloat(val) || 0 });
  const targetTotal = Math.round(targetTickers.reduce((s, tkr) => s + (parseFloat(targets[tkr]) || 0), 0));
  const targetsOk = targetTotal === 100;

  const typeOpts = ACCOUNT_ORDER;
  const cols = '1.3fr 1.4fr 1fr 1.1fr 1.2fr 44px';

  return (
    <div>
      <datalist id="ticker-list">{Object.keys(assets).map((tk2) => <option key={tk2} value={tk2}>{assets[tk2].name}</option>)}</datalist>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 26, fontWeight: 700, color: tk.ink, letterSpacing: -0.5 }}>{t(lang, 'data_title')}</h1>
          <div style={{ fontSize: 13.5, color: tk.faint, marginTop: 4 }}>{t(lang, 'data_sub')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ActionBtn icon="refresh" label={t(lang, 'sampleData')} onClick={reset} />
          <ActionBtn icon="download" label={t(lang, 'exportCsv')} onClick={exportCsv} />
          <ActionBtn icon="upload" label={t(lang, 'importCsv')} primary onClick={() => setImporting((v) => !v)} />
        </div>
      </div>

      {importing && <ImportPanel onApply={applyImport} onClose={() => setImporting(false)} />}

      <Card style={{ padding: isMobile ? '6px 0 12px' : '8px 6px 14px' }}>
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '14px 20px 12px', borderBottom: '1px solid ' + tk.line2 }}>
            {[t(lang, 'portfolio'), t(lang, 'asset'), t(lang, 'shares'), t(lang, 'price'), t(lang, 'value'), ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: tk.faint, textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
        )}
        {rows.map((r) => {
          const tkr = (r.ticker || '').toUpperCase();
          const a = assets[tkr];
          const cash = isCash(tkr);
          const native = a ? curOf(tkr, assets) : null;
          const val = a ? holdingValue({ ticker: tkr, shares: parseFloat(r.shares) || 0 }, disp, assets, fx) : null;
          const selStyle = { fontFamily: FB, fontSize: 13.5, fontWeight: 600, color: tk.ink, background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 9, padding: '8px 10px', outline: 'none', cursor: 'pointer' };
          const delBtn = (
            <button onClick={() => removeRow(r.uid)} title={t(lang, 'remove')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tk.faint, display: 'flex', justifyContent: 'center', padding: 6, borderRadius: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = tk.sell; e.currentTarget.style.background = tk.sellSoft; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = tk.faint; e.currentTarget.style.background = 'transparent'; }}><Icon name="trash" size={16} /></button>
          );
          const lbl = { fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: tk.faint, marginBottom: 4 };
          if (isMobile) {
            return (
              <div key={r.uid} style={{ padding: '14px 16px', borderTop: '1px solid ' + tk.line2, display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={r.type} onChange={(e) => setCell(r.uid, 'type', e.target.value)} style={{ ...selStyle, flex: 1 }}>
                    {typeOpts.map((tp) => <option key={tp} value={tp}>{acctLabel(lang, tp)}</option>)}
                  </select>
                  {delBtn}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {a ? <Dot ticker={tkr} /> : <span style={{ width: 10, height: 10, borderRadius: 3, background: tk.line, flexShrink: 0 }} />}
                  <Field value={r.ticker} onChange={(v) => setCell(r.uid, 'ticker', v.toUpperCase())} list="ticker-list" placeholder="TICKER" />
                </div>
                <div><div style={lbl}>{t(lang, 'shares')}</div><Field value={r.shares} onChange={(v) => setCell(r.uid, 'shares', v)} type="number" align="right" /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 12.5, color: a && !cash ? tk.sub : tk.faint }}>{t(lang, 'price')}: {a && !cash ? fmtMoney(a.price, native, lang, { decimals: 2 }) + ' ' + native : '—'}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: a ? tk.ink : tk.faint }}>{t(lang, 'value')}: {a ? fmtMoney(val, disp, lang, cash ? { maxDecimals: 2 } : undefined) : '—'}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={r.uid} style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '9px 20px', borderTop: '1px solid ' + tk.line2 }}>
              <select value={r.type} onChange={(e) => setCell(r.uid, 'type', e.target.value)} style={selStyle}>
                {typeOpts.map((tp) => <option key={tp} value={tp}>{acctLabel(lang, tp)}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {a ? <Dot ticker={tkr} /> : <span style={{ width: 10, height: 10, borderRadius: 3, background: tk.line, flexShrink: 0 }} />}
                <Field value={r.ticker} onChange={(v) => setCell(r.uid, 'ticker', v.toUpperCase())} list="ticker-list" placeholder="TICKER" />
              </div>
              <Field value={r.shares} onChange={(v) => setCell(r.uid, 'shares', v)} type="number" align="right" />
              <span style={{ fontSize: 13, color: a && !cash ? tk.sub : tk.faint, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{a && !cash ? fmtMoney(a.price, native, lang, { decimals: 2 }) + ' ' + native : '—'}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: a ? tk.ink : tk.faint, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{a ? fmtMoney(val, disp, lang, cash ? { maxDecimals: 2 } : undefined) : '—'}</span>
              {delBtn}
            </div>
          );
        })}
        <div style={{ padding: isMobile ? '14px 16px 6px' : '14px 20px 6px' }}><ActionBtn icon="plus" label={t(lang, 'addRow')} onClick={addRow} /></div>
      </Card>

      {/* global targets editor — one allocation across all accounts */}
      <Card style={{ padding: isMobile ? '18px 16px' : '20px 22px', marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 17, fontWeight: 700, color: tk.ink }}>{t(lang, 'globalTargets')}</div>
            <div style={{ fontSize: 12.5, color: tk.faint, marginTop: 3 }}>{t(lang, 'globalTargetsSub')}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600, color: targetsOk ? tk.sub : tk.sell, background: targetsOk ? tk.inset : tk.sellSoft, border: '1px solid ' + (targetsOk ? tk.line2 : 'transparent'), padding: '6px 11px', borderRadius: 9 }}>
            {t(lang, 'totalTarget')} {targetTotal}%{!targetsOk && ' (' + t(lang, 'mustBe100') + ')'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : '10px 28px' }}>
          {targetTickers.map((tkr) => {
            const a = assets[tkr];
            return (
              <div key={tkr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {a ? <Dot ticker={tkr} /> : <span style={{ width: 10, height: 10, borderRadius: 3, background: tk.line, flexShrink: 0 }} />}
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: tk.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tkr}{a?.name ? <span style={{ fontWeight: 500, color: tk.faint }}> · {a.name}</span> : null}</span>
                <Field value={targets[tkr] ?? 0} onChange={(v) => setTarget(tkr, v)} type="number" align="right" width={84} />
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ fontSize: 12.5, color: tk.faint, marginTop: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="refresh" size={14} /> {t(lang, 'csvNote')}
      </div>
    </div>
  );
}
