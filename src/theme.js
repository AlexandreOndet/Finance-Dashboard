// ───────────────────────────────────────────────────────────────
// Theme — "Modern" (bold, warm) in light + dark. tokens(mode) returns
// the full palette; assetColor(mode)(ticker) gives a stable per-asset
// hue that stays vivid in both modes.
// ───────────────────────────────────────────────────────────────

const LIGHT = {
  mode: 'light',
  bg: 'oklch(0.984 0.008 76)',
  panel: '#ffffff',
  panel2: 'oklch(0.975 0.008 76)',
  inset: 'oklch(0.965 0.009 76)',
  ink: 'oklch(0.24 0.018 60)',
  sub: 'oklch(0.5 0.018 60)',
  faint: 'oklch(0.64 0.014 60)',
  line: 'oklch(0.91 0.01 70)',
  line2: 'oklch(0.95 0.008 70)',
  accent: 'oklch(0.62 0.16 34)',
  accentSoft: 'oklch(0.62 0.16 34 / 0.1)',
  buy: 'oklch(0.55 0.11 172)',
  buySoft: 'oklch(0.55 0.11 172 / 0.1)',
  sell: 'oklch(0.62 0.16 34)',
  sellSoft: 'oklch(0.62 0.16 34 / 0.1)',
  shadow: '0 1px 2px rgba(60,40,20,.04), 0 8px 24px rgba(60,40,20,.05)',
  shadowSm: '0 1px 3px rgba(60,40,20,.07)',
  track: 'oklch(0.93 0.008 70)',
};
const DARK = {
  mode: 'dark',
  bg: 'oklch(0.185 0.012 56)',
  panel: 'oklch(0.225 0.014 56)',
  panel2: 'oklch(0.255 0.015 56)',
  inset: 'oklch(0.2 0.012 56)',
  ink: 'oklch(0.95 0.008 76)',
  sub: 'oklch(0.74 0.012 70)',
  faint: 'oklch(0.58 0.012 70)',
  line: 'oklch(0.32 0.012 60)',
  line2: 'oklch(0.28 0.012 60)',
  accent: 'oklch(0.7 0.15 38)',
  accentSoft: 'oklch(0.7 0.15 38 / 0.16)',
  buy: 'oklch(0.74 0.12 172)',
  buySoft: 'oklch(0.74 0.12 172 / 0.15)',
  sell: 'oklch(0.7 0.15 38)',
  sellSoft: 'oklch(0.7 0.15 38 / 0.15)',
  shadow: '0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.35)',
  shadowSm: '0 1px 3px rgba(0,0,0,.35)',
  track: 'oklch(0.3 0.012 60)',
};
export const tokens = (mode) => (mode === 'dark' ? DARK : LIGHT);

const RAMP_LIGHT = ['oklch(0.64 0.16 34)', 'oklch(0.55 0.13 250)', 'oklch(0.62 0.14 162)', 'oklch(0.72 0.14 80)', 'oklch(0.56 0.16 305)', 'oklch(0.6 0.12 210)', 'oklch(0.7 0.12 50)', 'oklch(0.5 0.12 280)', 'oklch(0.66 0.13 130)', 'oklch(0.58 0.14 20)'];
const RAMP_DARK = ['oklch(0.72 0.16 38)', 'oklch(0.7 0.13 252)', 'oklch(0.74 0.14 162)', 'oklch(0.8 0.14 84)', 'oklch(0.7 0.15 305)', 'oklch(0.74 0.12 212)', 'oklch(0.8 0.12 54)', 'oklch(0.68 0.13 282)', 'oklch(0.76 0.13 132)', 'oklch(0.72 0.15 22)'];
// Stable assignment by catalog order so a ticker keeps its colour.
const ORDER = ['VOO', 'VFV', 'SPUS', 'IBIT', 'ETHXB', 'WSHR', 'ZJPN', 'XEQT', 'VDY', 'ZAG', 'QQQ'];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export const assetColor = (mode) => {
  const ramp = mode === 'dark' ? RAMP_DARK : RAMP_LIGHT;
  return (ticker) => {
    const i = ORDER.indexOf(ticker);
    return ramp[(i < 0 ? Math.abs(hash(ticker)) : i) % ramp.length];
  };
};

export const FONTS = {
  disp: '"Bricolage Grotesque", system-ui, sans-serif',
  body: '"Hanken Grotesk", system-ui, sans-serif',
};
