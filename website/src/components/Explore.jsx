import { Check, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BAND, bandOf, hoursText, useSiteData } from '../lib/data';
import { cn } from '../lib/cn';
import { Reveal, SectionHead } from './ui';

const FILTERS = [['all', 'All'], ['caught', 'Scams caught'], ['missed', 'Scams missed'], ['spared', 'Honest, cleared'], ['false', 'False alarms']];

export default function Explore({ onPick }) {
  const site = useSiteData();
  const [f, setF] = useState('all');
  const [n, setN] = useState(12);
  const d = site.data;
  const thr = d ? Math.round(d.threshold * 100) : 50;
  const rows = useMemo(() => {
    if (!d) return [];
    const test = d.tokens.filter((t) => t.in_test);
    const k = (t) => (t.is_rug ? (t.score >= thr ? 'caught' : 'missed') : (t.score >= thr ? 'false' : 'spared'));
    const counts = test.reduce((a, t) => ({ ...a, [k(t)]: (a[k(t)] || 0) + 1 }), {});
    const list = (f === 'all' ? test : test.filter((t) => k(t) === f)).slice().sort((a, b) => b.launched.localeCompare(a.launched));
    return { list, counts, total: test.length };
  }, [d, f, thr]);
  if (!d) return null;

  return (
    <section id="explore" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Every test token, in the open" title={`${rows.total} tokens the model never saw.`} muted="Wins and misses.">
          These are the newest 15% of tokens, kept aside and scored once at the end. We show every one, including the scams it missed and the honest tokens it wrongly flagged.
        </SectionHead>
        <Reveal className="mt-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map(([key, label]) => (
              <button key={key} onClick={() => { setF(key); setN(12); }}
                className={cn('rounded-full border px-3.5 py-1.5 text-[13px] transition cursor-pointer', f === key ? 'border-white/25 bg-white/10 text-ink' : 'border-line text-muted hover:text-ink')}>
                {label} <span className="ml-1 font-mono text-xs text-faint">{key === 'all' ? rows.total : rows.counts[key] || 0}</span>
              </button>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint sm:grid-cols-[1.4fr_.7fr_.8fr_1.2fr_auto]">
              <span>Token</span><span className="hidden sm:block">Launched</span><span>Score</span><span className="hidden sm:block">What happened</span><span />
            </div>
            {rows.list.slice(0, n).map((t) => {
              const b = bandOf(t.score, thr), right = (t.score >= thr) === !!t.is_rug;
              return (
                <button key={t.address} onClick={() => onPick(t)}
                  className="group grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line px-5 py-3.5 text-left transition last:border-0 hover:bg-white/[0.03] sm:grid-cols-[1.4fr_.7fr_.8fr_1.2fr_auto] cursor-pointer">
                  <span className="min-w-0 truncate"><span className="text-[15px] text-ink">{t.name}</span> <span className="font-mono text-xs text-faint">{t.symbol}</span></span>
                  <span className="hidden font-mono text-sm text-muted sm:block">{t.launched}</span>
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', BAND[b].bg)} />
                    <span className={cn('num font-mono text-sm', BAND[b].text)}>{t.score}</span>
                  </span>
                  <span className="hidden items-center gap-2 text-sm sm:flex">
                    <span className={cn('grid size-4 place-items-center rounded-full', right ? 'bg-lower/15 text-lower' : 'bg-high/15 text-high')}>
                      {right ? <Check className="size-2.5" /> : <X className="size-2.5" />}
                    </span>
                    <span className="text-muted">{t.is_rug ? `Rug pull after ${hoursText(t.hours_to_rug)}` : 'No rug pull'}</span>
                  </span>
                  <ChevronRight className="size-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </button>
              );
            })}
          </div>
          {n < rows.list.length && (
            <div className="mt-4 text-center">
              <button onClick={() => setN(n + 24)} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline cursor-pointer">Show more ({rows.list.length - n} left)</button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
