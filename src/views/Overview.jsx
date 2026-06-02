// View: Overview — hero donut + net worth + global allocation. The
// Overview/Forecast toggle switches the lower section between informational
// account tiles and the single net-worth trade blotter (global forecast).
import React from 'react';
import { useApp } from '../context.jsx';
import { Card, Donut, TargetBar, StackBar, Drift, Dot, Pill, Segmented } from '../components/ui.jsx';
import { Icon } from '../components/icons.jsx';
import { assetColor } from '../theme.js';
import { globalRebalance, holdingsBreakdown, portfolioTotal, grandTotal, dayChange, curOf } from '../data/compute.js';
import { isCash } from '../data/catalog.js';
import { t, acctLabel, fmtMoney, fmtMoneySigned, fmtPct, fmtPctSigned, fmtNum } from '../i18n.js';

const FD = '"Bricolage Grotesque", sans-serif';

function HoldingRow({ r }) {
  const { tk, lang, disp, assets } = useApp();
  const cash = isCash(r.ticker);
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
      </div>
    </div>
  );
}

function AccountTile({ p }) {
  const { tk, lang, disp, setRoute, assets, fx, isMobile } = useApp();
  const rows = holdingsBreakdown(p, disp, assets, fx);
  const total = portfolioTotal(p, disp, assets, fx);
  const dc = dayChange(p, disp, assets, fx);
  return (
    <Card interactive onClick={() => setRoute({ name: 'account', id: p.id })} style={{ padding: isMobile ? '18px' : '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: tk.ink, letterSpacing: -0.3 }}>{acctLabel(lang, p.type)}</div>
          <div style={{ fontSize: 12, color: tk.faint, marginTop: 2 }}>{p.holdings.length} {t(lang, 'positions')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FD, fontSize: 21, fontWeight: 700, color: tk.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{fmtMoney(total, disp, lang)}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: dc.abs >= 0 ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{fmtPctSigned(dc.pct, lang, 2)} · {t(lang, 'today')}</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}><StackBar rows={rows} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r) => <HoldingRow key={r.ticker} r={r} />)}
      </div>
    </Card>
  );
}

// Net-worth trade blotter: how to move every ticker to its global target,
// aggregated across all accounts.
function GlobalForecast({ rows, total }) {
  const { tk, lang, disp } = useApp();
  const trades = rows.filter((r) => Math.abs(r.delta) >= total * 0.005);
  if (trades.length === 0) {
    return (
      <Card style={{ padding: '34px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 23, background: tk.buySoft, color: tk.buy, marginBottom: 12 }}><Icon name="check" size={24} /></div>
        <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: tk.ink }}>{t(lang, 'balanced')}</div>
      </Card>
    );
  }
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {trades.map((r) => {
        const buy = r.delta > 0;
        const cash = isCash(r.ticker);
        return (
          <div key={r.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: buy ? tk.buySoft : tk.sellSoft }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Pill kind={buy ? 'buy' : 'sell'}>{cash ? t(lang, buy ? 'toRaise' : 'deploy') : (buy ? t(lang, 'buy') : t(lang, 'sell'))}</Pill>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: tk.ink }}>{r.ticker}</span>
              {!cash && <span style={{ fontSize: 11.5, color: tk.faint }}>{fmtNum(Math.abs(r.sharesDelta), lang, Math.abs(r.sharesDelta) < 10 ? 1 : 0)} {t(lang, 'sharesToTrade')} · {fmtPct(r.curPct, lang, 1)} → {fmtPct(r.target, lang, 0)}</span>}
            </div>
            <span style={{ fontFamily: FD, fontSize: 15.5, fontWeight: 700, color: buy ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums' }}>{fmtMoneySigned(r.delta, disp, lang, cash ? { maxDecimals: 2 } : undefined)}</span>
          </div>
        );
      })}
    </Card>
  );
}

export function ViewOverview() {
  const { tk, lang, disp, portfolios, targets, assets, fx, isMobile } = useApp();
  const [forecast, setForecast] = React.useState(false);
  const rows = globalRebalance(portfolios, disp, assets, fx, targets);
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
      <Card style={{ padding: isMobile ? '20px 18px' : '30px 34px', marginBottom: 22, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 20 : 40 }}>
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <Donut rows={rows.map((r) => ({ ticker: r.ticker, val: r.cur }))} size={isMobile ? 150 : 230} label={t(lang, 'allAccounts')} value={fmtMoney(total, disp, lang)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: tk.faint, marginBottom: 8 }}>{t(lang, 'netWorth')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: isMobile ? 36 : 52, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: tk.ink }}>{fmtMoney(total, disp, lang)}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: dayAbs >= 0 ? tk.buy : tk.sell, fontVariantNumeric: 'tabular-nums' }}>{fmtPctSigned(dayPct, lang, 2)} · {t(lang, 'today')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '10px' : '12px 32px' }}>
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

      {forecast ? (
        <GlobalForecast rows={rows} total={total} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 22 }}>
          {portfolios.map((p) => <AccountTile key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
