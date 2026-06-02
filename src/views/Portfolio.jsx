// View: Portfolio detail — per-account holdings and current weights. Targets
// are global (net-worth level), so this page is informational: it shows what
// the account holds, each position's value/weight and its share of net worth.
// The rebalance/trade blotter lives on the Overview.
import React from 'react';
import { useApp } from '../context.jsx';
import { Card, Donut, TargetBar, Dot } from '../components/ui.jsx';
import { Icon } from '../components/icons.jsx';
import { assetColor } from '../theme.js';
import { holdingsBreakdown, portfolioTotal, grandTotal, dayChange, holdingNative, toDisplay, curOf } from '../data/compute.js';
import { ASSETS, isCash } from '../data/catalog.js';
import { t, acctLabel, acctFull, fmtMoney, fmtNum, fmtPct, fmtPctSigned } from '../i18n.js';

const FD = '"Bricolage Grotesque", sans-serif';

function StatChip({ label, value, accent }) {
  const { tk } = useApp();
  return (
    <div style={{ background: tk.panel, border: '1px solid ' + tk.line2, borderRadius: 16, padding: '16px 18px', boxShadow: tk.shadowSm, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: tk.faint, marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: accent || tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{value}</div>
    </div>
  );
}

function HeaderCell({ children, align }) {
  const { tk } = useApp();
  return <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: tk.faint, textAlign: align || 'left' }}>{children}</span>;
}

// label/value pair used inside the mobile stacked-card rows
function MStat({ label, value, accent }) {
  const { tk } = useApp();
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: tk.faint, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent || tk.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function HoldingsTable({ p, grand }) {
  const { tk, lang, disp, assets, fx, isMobile } = useApp();
  const rows = holdingsBreakdown(p, disp, assets, fx);
  const cols = '2.4fr 1.1fr 0.8fr 1fr 1.2fr 1.6fr 0.9fr';
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => {
          const a = assets[r.ticker] || ASSETS[r.ticker] || {};
          const native = curOf(r.ticker, assets);
          const cash = isCash(r.ticker);
          return (
            <Card key={r.ticker} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Dot ticker={r.ticker} size={11} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tk.ink }}>{r.ticker} <span style={{ fontSize: 10.5, fontWeight: 600, color: tk.faint }}>{native}</span></div>
                  <div style={{ fontSize: 11.5, color: tk.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || a.klass}</div>
                </div>
              </div>
              <TargetBar actual={r.curPct} color={assetColor(tk.mode)(r.ticker)} height={6} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px', marginTop: 14 }}>
                <MStat label={t(lang, 'value')} value={fmtMoney(r.cur, disp, lang, cash ? { maxDecimals: 2 } : undefined)} />
                <MStat label={t(lang, 'weight')} value={fmtPct(r.curPct, lang, 0)} />
                <MStat label={t(lang, 'shares')} value={fmtNum(r.shares, lang, 0, cash ? 2 : 0)} />
                <MStat label={t(lang, 'ofNetWorth')} value={fmtPct(grand ? (r.cur / grand) * 100 : 0, lang, 1)} />
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
  return (
    <Card style={{ padding: '8px 6px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, alignItems: 'center', padding: '14px 22px 12px', borderBottom: '1px solid ' + tk.line2 }}>
        <HeaderCell>{t(lang, 'asset')}</HeaderCell>
        <HeaderCell>{t(lang, 'class')}</HeaderCell>
        <HeaderCell align="right">{t(lang, 'shares')}</HeaderCell>
        <HeaderCell align="right">{t(lang, 'price')}</HeaderCell>
        <HeaderCell align="right">{t(lang, 'value')}</HeaderCell>
        <HeaderCell>{t(lang, 'weight')}</HeaderCell>
        <HeaderCell align="right">{t(lang, 'ofNetWorth')}</HeaderCell>
      </div>
      {rows.map((r, i) => {
        const a = assets[r.ticker] || ASSETS[r.ticker] || {};
        const native = curOf(r.ticker, assets);
        const cash = isCash(r.ticker);
        return (
          <div key={r.ticker} style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, alignItems: 'center', padding: '13px 22px', borderTop: i ? '1px solid ' + tk.line2 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <Dot ticker={r.ticker} size={11} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: tk.ink }}>{r.ticker} <span style={{ fontSize: 10.5, fontWeight: 600, color: tk.faint }}>{native}</span></div>
                <div style={{ fontSize: 11.5, color: tk.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
              </div>
            </div>
            <span style={{ fontSize: 12.5, color: tk.sub }}>{a.klass}</span>
            <span style={{ fontSize: 13.5, color: tk.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(r.shares, lang, 0, cash ? 2 : 0)}</span>
            <span style={{ fontSize: 13, color: tk.sub, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{cash ? '—' : fmtMoney(r.price, native, lang, { decimals: 2 })}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(r.cur, disp, lang, cash ? { maxDecimals: 2 } : undefined)}</div>
              {native !== disp && <div style={{ fontSize: 11, color: tk.faint, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(toDisplay(holdingNative({ ticker: r.ticker, shares: r.shares }, assets), native, native, fx), native, lang, cash ? { maxDecimals: 2 } : undefined)} {native}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}><TargetBar actual={r.curPct} color={assetColor(tk.mode)(r.ticker)} height={6} /></div>
              <span style={{ fontSize: 13, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', width: 38, textAlign: 'right' }}>{fmtPct(r.curPct, lang, 0)}</span>
            </div>
            <span style={{ fontSize: 13, color: tk.sub, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtPct(grand ? (r.cur / grand) * 100 : 0, lang, 1)}</span>
          </div>
        );
      })}
    </Card>
  );
}

export function ViewPortfolio({ id }) {
  const { tk, lang, disp, portfolios, setRoute, assets, fx, isMobile } = useApp();
  const p = portfolios.find((x) => x.id === id) || portfolios[0];
  const rows = holdingsBreakdown(p, disp, assets, fx);
  const total = portfolioTotal(p, disp, assets, fx);
  const grand = grandTotal(portfolios, disp, assets, fx);
  const dc = dayChange(p, disp, assets, fx);
  const galloc = rows.map((r) => ({ ticker: r.ticker, val: r.cur }));

  return (
    <div>
      {/* breadcrumb + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setRoute({ name: 'overview' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tk.faint, padding: 0 }}>{t(lang, 'backToOverview')}</button>
        <span style={{ color: tk.faint, display: 'flex' }}><Icon name="chevron" size={14} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, color: tk.sub }}>{acctLabel(lang, p.type)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FD, fontSize: 30, fontWeight: 700, color: tk.ink, letterSpacing: -0.6 }}>{acctLabel(lang, p.type)}</h1>
          <div style={{ fontSize: 13.5, color: tk.faint, marginTop: 4 }}>{acctFull(lang, p.type)}</div>
        </div>
      </div>

      {/* hero row: donut + stats */}
      <div style={{ display: 'flex', gap: isMobile ? 16 : 22, marginBottom: 22, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Card style={{ padding: isMobile ? '20px 18px' : '26px 30px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 18 : 28, flex: isMobile ? '1 1 100%' : '1 1 380px' }}>
          <Donut rows={galloc} size={isMobile ? 140 : 180} stroke={22} label={acctLabel(lang, p.type)} value={fmtMoney(total, disp, lang)} />
          <div style={{ flex: 1, alignSelf: 'stretch', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r) => (
              <div key={r.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Dot ticker={r.ticker} />
                <span style={{ fontSize: 13, fontWeight: 700, color: tk.ink, width: 52 }}>{r.ticker}</span>
                <div style={{ flex: 1 }}><TargetBar actual={r.curPct} color={assetColor(tk.mode)(r.ticker)} height={5} /></div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', width: 40, textAlign: 'right' }}>{fmtPct(r.curPct, lang, 0)}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '1 1 300px' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <StatChip label={t(lang, 'value')} value={fmtMoney(total, disp, lang)} />
            <StatChip label={t(lang, 'today')} value={fmtPctSigned(dc.pct, lang, 2)} accent={dc.abs >= 0 ? tk.buy : tk.sell} />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <StatChip label={t(lang, 'ofNetWorth')} value={fmtPct(grand ? (total / grand) * 100 : 0, lang, 1)} />
            <StatChip label={t(lang, 'positions')} value={fmtNum(p.holdings.length, lang, 0)} />
          </div>
        </div>
      </div>

      <HoldingsTable p={p} grand={grand} />
    </div>
  );
}
