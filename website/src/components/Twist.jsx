import { motion } from 'motion/react';
import { RESULTS, pct } from '../lib/data';
import { Reveal, SectionHead } from './ui';

const W = RESULTS.window;
const rows = [
  { label: 'Hour-one model', sub: 'Warns at the 1-hour mark', m: W.h1, ours: true },
  { label: 'Six-hour model', sub: 'Waits for 6 hours of trading', m: W.h6 },
];

function RaceBar({ m, ours, delay }) {
  const gone = 1 - m.running, warned = m.warned, missed = m.running - m.warned;
  const seg = [
    { w: gone, cls: 'bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.07)_0_6px,transparent_6px_12px)] border-r border-bg', label: `${pct(gone)} already pulled`, sh: pct(gone), text: 'text-faint' },
    { w: warned, cls: ours ? 'bg-ink' : 'bg-white/45', label: `${pct(warned, 1)} warned in time`, sh: pct(warned), text: 'text-bg font-semibold' },
    { w: missed, cls: 'bg-white/[0.08]', label: `${pct(missed)} missed`, sh: pct(missed), text: 'text-muted' },
  ];
  return (
    <div className="flex h-14 overflow-hidden rounded-xl border border-line">
      {seg.map((s, i) => (
        <motion.div key={i} className={`relative flex items-center overflow-hidden px-2 sm:px-3 ${s.cls}`} initial={{ width: 0 }} whileInView={{ width: `${s.w * 100}%` }}
          viewport={{ once: true }} transition={{ duration: 1.1, delay: delay + i * 0.15, ease: [0.16, 1, 0.3, 1] }}>
          <span className={`whitespace-nowrap text-[12px] sm:text-[13px] ${s.text}`}><span className="sm:hidden">{s.sh}</span><span className="hidden sm:inline">{s.label}</span></span>
        </motion.div>
      ))}
    </div>
  );
}

export default function Twist() {
  const t = RESULTS.timing;
  return (
    <section id="twist" className="relative px-5 py-28">
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="The twist · earlier vs. more accurate" title="Waiting longer makes the model a bit smarter." muted="And a lot later.">
          Most rug-pull research looks at a token&rsquo;s whole history. A buyer doesn&rsquo;t have that. So we trained two models, one that decides at hour one and one that waits six hours, and asked: out of all rug pulls, how many does each warn about before the money is gone?
        </SectionHead>

        <Reveal className="mt-14">
          <div className="card p-6 sm:p-8">
            <div className="eyebrow mb-6">When do rug pulls happen? (all 16,000+ rug pulls in the data)</div>
            <div className="relative h-16">
              <div className="absolute inset-x-0 top-7 h-px bg-white/15" />
              {[{ x: 0, l: 'Launch', v: '' }, { x: 0.22, l: '1 hour', v: pct(t.h1) }, { x: 0.52, l: `${t.median} hours`, v: pct(t.h6) }, { x: 0.86, l: '1 day', v: pct(t.h24) }].map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * i }}
                  className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${p.x * 100}%`, transform: i === 0 ? 'none' : undefined }}>
                  <div className="h-4 font-mono text-xs text-high">{p.v && `${p.v} gone`}</div>
                  <div className={`mx-auto mt-1.5 size-3 rounded-full border-2 ${i ? 'border-high bg-bg' : 'border-ink bg-ink'}`} />
                  <div className="mt-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-faint">{p.l}</div>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-[15px] text-muted">A quarter of scams are over in the first hour. Half are over within six. Every hour of waiting lets more of them finish first.</p>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-5">
          <Reveal className="card p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow">Out of every rug pull in the test period</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">Who raises the alarm in time?</div>
              </div>
              <div className="flex gap-4 font-mono text-[11px] uppercase tracking-wider text-faint">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ink" /> warned in time</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-white/10" /> missed</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.25)_0_2px,transparent_2px_4px)]" /> already pulled</span>
              </div>
            </div>
            <div className="grid gap-6">
              {rows.map((r, i) => (
                <div key={r.label} className="grid items-center gap-3 md:grid-cols-[200px_1fr_110px]">
                  <div>
                    <div className={`text-[15px] font-medium ${r.ours ? 'text-ink' : 'text-muted'}`}>{r.label}</div>
                    <div className="text-xs text-faint">{r.sub}</div>
                  </div>
                  <RaceBar m={r.m} ours={r.ours} delay={i * 0.2} />
                  <div className="text-right">
                    <div className={`text-3xl font-semibold tracking-tight num ${r.ours ? 'text-ink' : 'text-faint'}`}>{pct(r.m.warned)}</div>
                    <div className="text-xs text-faint">warned in time</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Balanced accuracy', W.h1.ba.toFixed(3), W.h6.ba.toFixed(3), 'Practically a tie.'],
              ['Scams still running at decision time', pct(W.h1.running), pct(W.h6.running), 'Six hours in, 11 points more are gone.'],
              ['Warned before the rug', pct(W.h1.warned, 1), pct(W.h6.warned, 1), 'Earlier wins by 7 points.'],
            ].map(([k, a, b, note], i) => (
              <Reveal key={k} delay={i * 0.08} className="card p-6">
                <div className="eyebrow">{k}</div>
                <div className="mt-5 flex items-baseline gap-5">
                  <div><div className="num text-3xl font-semibold tracking-tight">{a}</div><div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">hour one</div></div>
                  <div className="text-faint">vs</div>
                  <div><div className="num text-3xl font-semibold tracking-tight text-faint">{b}</div><div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">six hours</div></div>
                </div>
                <div className="mt-4 text-sm text-muted">{note}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
