import { RESULTS } from '../lib/data';
import { Reveal, Ticker } from './ui';

const stats = [
  { v: 26, s: '%', label: 'of rug pulls happen in the very first hour', note: 'Half are over within 6 hours.' },
  { v: 88, s: '%', label: 'of the model’s red flags were real scams', note: 'Precision on unseen, newer tokens.' },
  { v: 44, s: '%', label: 'of all rug pulls warned about in time', note: 'vs 37% if you wait six hours.' },
  { v: RESULTS.totals.remeasured, s: '', label: 'tokens replayed from the blockchain', note: 'Out of 18,344 labeled Uniswap tokens.' },
];

export default function Stats() {
  return (
    <section className="px-5">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 1 }}>
        {stats.map((x, i) => (
          <Reveal key={i} delay={i * 0.06} className="bg-bg p-7">
            <div className="text-5xl font-semibold tracking-[-0.045em]"><Ticker value={x.v} />{x.s}</div>
            <div className="mt-3 text-[15px] leading-snug text-ink">{x.label}</div>
            <div className="mt-1.5 text-sm text-faint">{x.note}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
