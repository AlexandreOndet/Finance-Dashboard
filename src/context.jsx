import { createContext, useContext } from 'react';

// Shared app context — carries theme tokens (tk), asset colours (ac),
// language/currency/mode, the portfolios state + setters, the current
// route, and the resolved market data ({ assets, fx } + status/refresh).
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
