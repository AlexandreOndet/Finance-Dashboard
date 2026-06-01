// Maps catalog tickers to Twelve Data query parameters and groups them
// by exchange so the provider can batch one /quote request per exchange.
//
// Twelve Data resolves US listings from the bare symbol, but Canadian
// listings need an explicit `exchange` (TSX). We drive this off the
// catalog `exchange` field ('TSX' | 'US').
import { ASSETS, isCash } from '../data/catalog.js';

// Twelve Data `exchange` query value per catalog exchange code.
// 'US' → undefined (let Twelve Data pick the US listing).
const EXCHANGE_PARAM = {
  TSX: 'TSX',
  US: undefined,
};

export const exchangeOf = (ticker) => (ASSETS[ticker]?.exchange) || 'US';
export const apiSymbolOf = (ticker) => ticker; // Twelve Data uses the bare ticker
export const exchangeParam = (exchangeCode) => EXCHANGE_PARAM[exchangeCode];

// Group a list of tickers by their exchange code.
// → { TSX: ['VFV', ...], US: ['VOO', ...] }
export const groupByExchange = (tickers) => {
  const groups = {};
  for (const ticker of tickers) {
    if (isCash(ticker)) continue; // cash is never quoted by the provider
    const ex = exchangeOf(ticker);
    (groups[ex] ||= []).push(ticker);
  }
  return groups;
};
