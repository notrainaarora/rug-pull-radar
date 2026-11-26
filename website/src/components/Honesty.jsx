import { motion } from 'motion/react';
import { RESULTS, pct } from '../lib/data';
import { Reveal, SectionHead } from './ui';

export default function Honesty() {
  return (
    <section id="honesty" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Honesty" title="The 0.99 we threw away," muted="and where it still fails." />
        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          <Reveal className="card relative overflow-hidden p-7 lg:col-span-3">
            <div className="eyebrow">The leakage trap</div>
            <div className="mt-5 flex items-end gap-4">
              <span className="text-7xl font-semibold tracking-[-0.05em] text-faint line-through decoration-high decoration-[3px]">0.99</span>
              <span className="mb-2 text-sm text-muted">too good to be true</span>
            </div>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              The dataset&rsquo;s ready-made trading numbers scored almost perfectly. The catch: for scams they were measured up to the rug pull (a median of <span className="text-ink">1.5 hours</span>),
              for normal tokens over <span className="text-ink">1,446 hours</span>. The model was learning the length of the window, not the token. We dropped them and replayed every token&rsquo;s first hour the same way.
            </p>
            <div className="mt-7 grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-3 font-mono text-xs text-faint">
              <span>Rug pulls</span>
              <div className="h-2.5 rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-high" initial={{ width: 0 }} whileInView={{ width: '1.2%' }} viewport={{ once: true }} transition={{ duration: 1 }} /></div>
              <span>Normal tokens</span>
              <div className="h-2.5 rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-white/40" initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.4 }} /></div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="card p-7 lg:col-span-2">
            <div className="eyebrow">Who gets wrongly flagged</div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">A false alarm can scare buyers off an honest project. It is not harsher on small projects. It is harsher on big pools, because 2021 scammers seeded big pools to look trustworthy.</p>
            <div className="mt-6 grid gap-4">
              {RESULTS.fairness.map((f, i) => (
                <div key={f.label}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="text-ink">{f.label} <span className="text-faint">· {f.sub}</span></span><span className="num font-mono text-muted">{pct(f.rate)}</span></div>
                  <div className="h-2 rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-caution" initial={{ width: 0 }} whileInView={{ width: `${(f.rate / 0.3) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.12 }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-faint">Launch-facts model, honest tokens in the test set.</p>
          </Reveal>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ['It still misses about 4 in 10 scams.', 'The ones it rates safest are slow rugs, pulled weeks later. First-hour data can’t see what a creator does in a month.'],
            ['Serial launchers look guilty.', 'Its worst false alarms were honest tokens from creators with many earlier launches, or with big starting pools.'],
            ['Trained on 2020–21 tokens.', 'Scam tactics change, so live scores on today’s tokens are less reliable than our test results. Ethereum and Uniswap V2 only.'],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08} className="card p-6">
              <div className="text-[17px] font-semibold tracking-tight">{t}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
