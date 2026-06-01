// Minimal geometric icon set. <Icon name=… size=… /> — inherits currentColor.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

const paths = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...P} /></>,
  account: <><rect x="3" y="6" width="18" height="13" rx="2.5" {...P} /><path d="M3 10h18" {...P} /><path d="M7 3h10" {...P} /></>,
  data: <><rect x="3.5" y="4" width="17" height="16" rx="2" {...P} /><path d="M3.5 9.5h17M9 9.5V20M15 9.5V20" {...P} /></>,
  sun: <><circle cx="12" cy="12" r="4" {...P} /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" {...P} /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" {...P} />,
  upload: <><path d="M12 16V4M12 4 7 9M12 4l5 5" {...P} /><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" {...P} /></>,
  download: <><path d="M12 4v12M12 16l-5-5M12 16l5-5" {...P} /><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" {...P} /></>,
  plus: <path d="M12 5v14M5 12h14" {...P} />,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" {...P} /></>,
  chevron: <path d="M9 5l7 7-7 7" {...P} />,
  arrowUp: <path d="M12 19V5M12 5l-6 6M12 5l6 6" {...P} />,
  arrowDown: <path d="M12 5v14M12 19l-6-6M12 19l6-6" {...P} />,
  close: <path d="M6 6l12 12M18 6 6 18" {...P} />,
  check: <path d="M5 12.5l4.5 4.5L19 6.5" {...P} />,
  refresh: <><path d="M20 11a8 8 0 1 0-1.5 6" {...P} /><path d="M20 5v6h-6" {...P} /></>,
  settings: <><circle cx="12" cy="12" r="3.2" {...P} /><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.5 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H2a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 3.7 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H8.5A1.7 1.7 0 0 0 9.5 2.6V2a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V8.5a1.7 1.7 0 0 0 1.56 1.03H22a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" {...P} /></>,
};

export const Icon = ({ name, size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', ...style }} aria-hidden="true">{paths[name] || null}</svg>
);
