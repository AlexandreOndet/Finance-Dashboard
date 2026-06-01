// View: Overview — hero donut + net worth + global allocation, and a
// grid of clickable account tiles. Overview/Forecast toggle is local.
import React from 'react';
import { useApp } from '../context.jsx';
import { Card, Donut, TargetBar, StackBar, Drift, Dot, Pill, Segmented } from '../components/ui.jsx';
import { assetColor } from '../theme.js';
import { rebalance, portfolioTotal, grandTotal, dayChange, globalAllocation, curOf } from '../data/compute.js';
import { isCash } from '../data/catalog.js';
import { t, acctLabel, fmtMoney, fmtMoneySigned, fmtPct, fmtPctSigned, fmtNum } from '../i18n.js';

function HoldingRow({ r, forecast }) {
  const { tk, lang, disp, assets } = useApp();
  const cash = isCash(r.ticker);
  if (forecast) {
    const buy = r.delta > 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 12, background: buy ? tk.buySoft : tk.sellSoft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill kind={buy ? 'buy' : 'sell'}>{cash ? t(lang, buy ? 'toRaise' : 'deploy') : (buy ? t(lang, 'buy') : t(lang, 'sell'))}</Pill>
          <span style={{ fontSize: 14, fontWeight: 700, color: tk.ink }}>{r.ticker}</span>
          {!cash && <span style={{ fontSize: 11.5, color: tk.faint }}>{fmtNum(Math.abs(r.sharesDelta), lang, Math.abs(r.sharesDelta) < 10 ? 1 : 0)} {t(lang, 'sharesToTrade')}</span>}
        </div>
        <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 15.5, fontWeight: 700, color: buy ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums' }}>{fmtMoneySigned(r.delta, disp, lang, cash ? { maxDecimals: 2 } : undefined)}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Dot ticker={r.ticker} />
        <span style={{ fontSize: 14, fontWeight: 600, color: tk.ink }}>{r.ticker}</span>
        <span style={{ fontSize: 11, color: tk.faint }}>{curOf(r.ticker, assets)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 13, color: tk.sub, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(r.cur, disp, lang, cash ? { maxDecimals: 2 } : undefined)}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', width: 46, textAlign: 'right' }}>{fmtPct(r.curPct, lang, 0)}</span>
        <span style={{ fontSize: 11.5, width: 42, textAlign: 'right' }}><Drift pct={r.driftPct} /></span>
      </div>
    </div>
  );
}

function AccountTile({ p, forecast }) {
  const { tk, lang, disp, setRoute, assets, fx } = useApp();
  const rows = rebalance(p, disp, assets, fx);
  const total = portfolioTotal(p, disp, assets, fx);
  const dc = dayChange(p, disp, assets, fx);
  const trades = rows.filter((r) => Math.abs(r.delta) >= total * 0.005);
  return (
    <Card interactive onClick={() => setRoute({ name: 'account', id: p.id })} style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 20, fontWeight: 700, color: tk.ink, letterSpacing: -0.3 }}>{acctLabel(lang, p.type)}</div>
          <div style={{ fontSize: 12, color: tk.faint, marginTop: 2 }}>{p.holdings.length} {t(lang, 'positions')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 21, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{fmtMoney(total, disp, lang)}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: dc.abs >= 0 ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtPctSigned(dc.pct, lang, 2)} · {t(lang, 'today')}</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}><StackBar rows={rows} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: forecast ? 8 : 11 }}>
        {forecast && trades.length === 0 && <div style={{ fontSize: 13, color: tk.faint, padding: '4px 0' }}>{t(lang, 'balanced')}</div>}
        {(forecast ? trades : rows).map((r) => <HoldingRow key={r.ticker} r={r} forecast={forecast} />)}
      </div>
    </Card>
  );
}

export function ViewOverview() {
  const { tk, lang, disp, portfolios, assets, fx } = useApp();
  const [forecast, setForecast] = React.useState(false);
  const rows = globalAllocation(portfolios, disp, assets, fx);
  const total = grandTotal(portfolios, disp, assets, fx);
  let dayAbs = 0; portfolios.forEach((p) => dayAbs += dayChange(p, disp, assets, fx).abs);
  const dayPct = total ? (dayAbs / total) * 100 : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 26, fontWeight: 700, color: tk.ink, letterSpacing: -0.5 }}>{t(lang, 'nav_overview')}</h1>
        <Segmented value={forecast ? 'f' : 'o'} onChange={(v) => setForecast(v === 'f')}
          options={[{ value: 'o', label: t(lang, 'overview') }, { value: 'f', label: t(lang, 'forecast') }]} />
      </div>

      {/* hero */}
      <Card style={{ padding: '30px 34px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 40 }}>
        <Donut rows={rows} label={t(lang, 'allAccounts')} value={fmtMoney(total, disp, lang)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: tk.faint, marginBottom: 8 }}>{t(lang, 'netWorth')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 52, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: tk.ink }}>{fmtMoney(total, disp, lang)}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: dayAbs >= 0 ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums' }}>{fmtPctSigned(dayPct, lang, 2)} · {t(lang, 'today')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
            {rows.map((r) => (
              <div key={r.ticker} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Dot ticker={r.ticker} size={11} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: tk.ink, width: 54 }}>{r.ticker}</span>
                <div style={{ flex: 1 }}><TargetBar actual={r.curPct} target={r.target} color={assetColor(tk.mode)(r.ticker)} height={5} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', width: 44, textAlign: 'right' }}>{fmtPct(r.curPct, lang, 0)}</span>
                <span style={{ fontSize: 11, width: 40, textAlign: 'right' }}><Drift pct={r.driftPct} /></span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {portfolios.map((p) => <AccountTile key={p.id} p={p} forecast={forecast} />)}
      </div>
    </div>
  );
}
