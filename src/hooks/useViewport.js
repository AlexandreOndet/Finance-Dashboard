// Viewport hook — lets inline-style components branch on a mobile breakpoint
// without any CSS/media queries (styling here is 100% inline style objects).
// Mirrors the window.matchMedia guard already used in App.jsx so it stays safe
// under SSR/jsdom (the smoke tests renderToString <App/> where matchMedia is absent).
import { useState, useEffect } from 'react';

const query = (bp) => `(max-width: ${bp - 1}px)`;

const matches = (bp) => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query(bp)).matches;
};

export function useIsMobile(breakpoint = 720) {
  const [mobile, setMobile] = useState(() => matches(breakpoint));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query(breakpoint));
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    setMobile(mq.matches); // resync in case the breakpoint prop changed
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return mobile;
}
