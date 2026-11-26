import { motion } from 'motion/react';
import { RESULTS, pct } from '../lib/data';
import { cn } from '../lib/cn';
import { Badge, Reveal, SectionHead } from './ui';

export default function Results() {
  return (
    <section id="results" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Results · newest 15% of tokens, held out" title="It beats the simple rules." muted="By a wide margin.">
          We rebuilt first-hour data for 4,837 tokens, trained on the oldest 70%, tuned on the next 15%, and tested once on the newest 15%. Balanced accuracy is the fair score here: 0.50 means guessing, because most tokens are scams.
        </SectionHead>
        <Reveal className="mt-12">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-6 py-4 font-normal">Method</th>
                  <th className="px-4 py-4 font-normal">Balanced accuracy</th>
                  <th className="px-4 py-4 font-normal">Scams caught</th>
                  <th className="px-4 py-4 font-normal">Red flags that were scams</th>
                  <th className="px-4 py-4 font-normal">Honest tokens flagged</th>
                </tr>
              </thead>
              <tbody>
                {RESULTS.main.map((r, i) => {
                  const ours = r.kind === 'ours';
                  return (
                    <tr key={r.method} className={cn('border-b border-line last:border-0', ours && 'bg-white/[0.035]')}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <span className={cn('text-[15px]', ours ? 'font-semibold text-ink' : 'text-muted')}>{r.method}</span>
                          {r.kind === 'baseline' && <Badge>baseline</Badge>}
                          {ours && <Badge tone="lower">our model</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <span className={cn('num w-11 font-mono text-[15px]', ours ? 'text-ink' : 'text-muted')}>{r.ba.toFixed(2)}</span>
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div className={cn('h-full rounded-full', ours ? 'bg-ink' : 'bg-white/30')} initial={{ width: 0 }} whileInView={{ width: `${((r.ba - 0.5) / 0.5) * 100}%` }}
                              viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                          </div>
                        </div>
                      </td>
                      <td className="num px-4 py-5 font-mono text-[15px] text-muted">{pct(r.recall)}</td>
                      <td className="num px-4 py-5 font-mono text-[15px] text-muted">{pct(r.precision)}</td>
                      <td className={cn('num px-4 py-5 font-mono text-[15px]', r.fpr > 0.5 ? 'text-high' : 'text-muted')}>{pct(r.fpr, r.fpr < 0.1 ? 1 : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ['+17 points', 'more scams caught once the first hour is added (43% → 60%), while flagging fewer honest tokens.'],
            ['0.50', 'is all the popular "did they burn their pool tokens?" rule scores. Almost no 2021 creator burned them in hour one.'],
            ['0.68 vs 0.58', 'on all 18,344 tokens, launch facts alone already beat the best single rule ("pool over 4 ETH").'],
          ].map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.08} className="card p-6">
              <div className="text-3xl font-semibold tracking-[-0.03em]">{k}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{v}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
