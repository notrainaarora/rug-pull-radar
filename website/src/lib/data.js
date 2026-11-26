import { useEffect, useState } from 'react';

export const LINKS = {
  colab: 'https://colab.research.google.com/drive/1BQ9yZiHuNi4HdX_51NihZayGJDvcArsQ?usp=sharing',
  github: 'https://github.com/notrainaarora/rug-pull-radar',
};

// Official numbers from the final notebook run (Nov 15, 2026)
export const RESULTS = {
  main: [
    { method: '"Everything is a scam"', kind: 'baseline', recall: 1.0, precision: 0.44, fpr: 1.0, ba: 0.5, prauc: null },
    { method: 'Rule: creator didn’t burn pool tokens', kind: 'baseline', recall: 0.98, precision: 0.44, fpr: 0.97, ba: 0.5, prauc: null },
    { method: 'XGBoost, launch facts only', kind: 'before', recall: 0.43, precision: 0.82, fpr: 0.074, ba: 0.68, prauc: 0.74 },
    { method: 'XGBoost, launch + first hour', kind: 'ours', recall: 0.6, precision: 0.88, fpr: 0.064, ba: 0.77, prauc: 0.85 },
  ],
  window: {
    h1: { recall: 0.59, precision: 0.859, fpr: 0.064, ba: 0.763, prauc: 0.825, running: 0.73, warned: 0.435 },
    h6: { recall: 0.593, precision: 0.874, fpr: 0.057, ba: 0.768, prauc: 0.841, running: 0.62, warned: 0.366 },
  },
  timing: { h1: 0.26, h6: 0.5, h24: 0.74, median: 5.9 },
  fairness: [
    { label: 'Small pools', sub: '2 ETH or less', n: 213, rate: 0.05 },
    { label: 'Medium pools', sub: '2 to 10 ETH', n: 208, rate: 0.18 },
    { label: 'Large pools', sub: 'over 10 ETH', n: 69, rate: 0.3 },
  ],
  totals: { tokens: 18344, remeasured: 4837 },
};

export const FEATURED = [
  { name: 'Chatex', tag: 'Caught a real rug', tone: 'high' },
  { name: 'IslandInu', tag: 'Honest token', tone: 'lower' },
  { name: 'Toy Story Project', tag: 'A scam it missed', tone: 'caution' },
];

let cached = null;
export function useSiteData() {
  const [state, setState] = useState(cached || { status: 'loading' });
  useEffect(() => {
    if (cached) return;
    fetch('/data.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => {
        d.byAddress = new Map(d.tokens.map((t) => [t.address.toLowerCase(), t]));
        cached = { status: 'ready', data: d };
        setState(cached);
      })
      .catch(() => setState({ status: 'error' }));
  }, []);
  return state;
}

export function bandOf(score, threshold) {
  if (score >= threshold) return 'high';
  if (score >= 50) return 'caution';
  return 'lower';
}

export const BAND = {
  high: { label: 'High risk', short: 'High', color: 'var(--color-high)', text: 'text-high', bg: 'bg-high', soft: 'bg-high/10', ring: 'ring-high/30' },
  caution: { label: 'Caution', short: 'Caution', color: 'var(--color-caution)', text: 'text-caution', bg: 'bg-caution', soft: 'bg-caution/10', ring: 'ring-caution/30' },
  lower: { label: 'Lower risk', short: 'Lower', color: 'var(--color-lower)', text: 'text-lower', bg: 'bg-lower', soft: 'bg-lower/10', ring: 'ring-lower/30' },
};

export function hoursText(h) {
  if (h == null) return '';
  if (h < 1) return `${Math.round(h * 60)} minutes`;
  if (h < 48) return `${h < 10 ? h.toFixed(1) : Math.round(h)} hours`;
  return `${Math.round(h / 24)} days`;
}
export const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
export const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
