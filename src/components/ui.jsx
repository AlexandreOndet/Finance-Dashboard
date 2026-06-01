// ───────────────────────────────────────────────────────────────
// Presentational components for the Modern UI. They pull theme tokens
// (tk) and asset colours (ac) from AppCtx via useApp().
// ───────────────────────────────────────────────────────────────
import React from 'react';
import { useApp } from '../context.jsx';
import { FONTS, assetColor } from '../theme.js';
import { fmtPctSigned } from '../i18n.js';

// Segmented pill control
export function Segmented({ value, onChange, options, size = 'md' }) {
  const { tk } = useApp();
  const pad = size === 'sm' ? '6px 12px' : '8px 16px';
  const fs = size === 'sm' ? 12.5 : 13.5;
  return (
    <div style={{ display: 'inline-flex', background: tk.inset, border: '1px solid ' + tk.line, borderRadius: 11, padding: 3 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 'none', cursor: 'pointer', fontFamily: FONTS.body, fontSize: fs, fontWeight: 600,
            padding: pad, borderRadius: 8, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
            background: on ? tk.accent : 'transparent', color: on ? '#fff' : tk.sub, transition: 'all .15s',
          }}>{o.icon || null}{o.label}</button>
        );
      })}
    </div>
  );
}

export function Card({ children, style, onClick, interactive }) {
  const { tk } = useApp();
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => interactive && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: tk.panel, borderRadius: 20, boxShadow: tk.shadow, border: '1px solid ' + tk.line2,
        transition: 'transform .15s, box-shadow .15s', cursor: interactive ? 'pointer' : 'default',
        transform: hov ? 'translateY(-2px)' : 'none',
        ...(hov ? { boxShadow: '0 4px 10px rgba(0,0,0,.06), 0 16px 40px rgba(0,0,0,.09)' } : null),
        ...style,
      }}>{children}</div>
  );
}

// donut from rows [{ticker,val}], with a center label/value
export function Donut({ rows, size = 230, stroke = 26, label, value }) {
  const { ac, tk } = useApp();
  const sum = rows.reduce((s, r) => s + r.val, 0) || 1;
  const R = (size - stroke) / 2 - 2, C = size / 2, CIRC = 2 * Math.PI * R;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={C} cy={C} r={R} fill="none" stroke={tk.track} strokeWidth={stroke} />
        {rows.map((r) => {
          const len = (r.val / sum) * CIRC;
          const seg = <circle key={r.ticker} cx={C} cy={C} r={R} fill="none" stroke={ac(r.ticker)} strokeWidth={stroke} strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-off} strokeLinecap="butt" />;
          off += len; return seg;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {label && <span style={{ fontFamily: FONTS.body, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.9, textTransform: 'uppercase', color: tk.faint }}>{label}</span>}
        {value && <span style={{ fontFamily: FONTS.disp, fontSize: size > 200 ? 27 : 21, fontWeight: 700, color: tk.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{value}</span>}
      </div>
    </div>
  );
}

// thin track + actual fill + target tick
export function TargetBar({ actual, target, color, height = 6 }) {
  const { tk } = useApp();
  return (
    <div style={{ position: 'relative', height, background: tk.track, borderRadius: height / 2 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min(100, Math.max(0, actual)) + '%', background: color, borderRadius: height / 2 }} />
      <div style={{ position: 'absolute', left: 'calc(' + Math.min(100, target) + '% - 1px)', top: -2, bottom: -2, width: 2, background: tk.ink, opacity: 0.5, borderRadius: 1 }} />
    </div>
  );
}

// segmented stacked weight bar
export function StackBar({ rows, height = 10, gap = 2 }) {
  const { ac } = useApp();
  const sum = rows.reduce((s, r) => s + (r.curPct ?? r.val), 0) || 1;
  return (
    <div style={{ display: 'flex', height, borderRadius: height / 2, overflow: 'hidden', gap }}>
      {rows.map((r) => <div key={r.ticker} title={r.ticker} style={{ width: ((r.curPct ?? r.val) / sum) * 100 + '%', background: ac(r.ticker), borderRadius: 2 }} />)}
    </div>
  );
}

export function Drift({ pct, dp = 0, threshold = 1 }) {
  const { tk, lang } = useApp();
  const on = Math.abs(pct) < threshold;
  const col = on ? tk.faint : (pct > 0 ? tk.sell : tk.buy);
  return <span style={{ color: col, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtPctSigned(pct, lang, dp)}</span>;
}

export function Dot({ ticker, size = 10 }) {
  const { ac } = useApp();
  return <span style={{ width: size, height: size, borderRadius: Math.max(2, size / 3), background: ac(ticker), flexShrink: 0, display: 'inline-block' }} />;
}

export function Pill({ kind, children }) {
  const { tk } = useApp();
  const c = kind === 'buy' ? tk.buy : kind === 'sell' ? tk.sell : tk.faint;
  return <span style={{ fontFamily: FONTS.body, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#fff', background: c, padding: '4px 9px', borderRadius: 7, lineHeight: 1 }}>{children}</span>;
}

// re-export so views can grab the mode-aware colour fn directly
export { assetColor };
