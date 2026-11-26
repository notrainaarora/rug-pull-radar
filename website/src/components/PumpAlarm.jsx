import { motion } from 'motion/react';
import { MessageSquareWarning } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSiteData } from '../lib/data';
import { cn } from '../lib/cn';
import { Badge, Reveal, SectionHead } from './ui';

const PRESETS = [
  ['Pump countdown', '⏰ 10 minutes until the pump! Next post will be the coin name. Exchange: Binance. Buy fast and HOLD 🚀'],
  ['Trading signal', 'BTC broke resistance at 60k, long with stop loss at 58k, targets 62k-64k'],
  ['News', 'Big news: Ethereum upgrade scheduled for next month, devs confirm timeline'],
];

export default function PumpAlarm() {
  const site = useSiteData();
  const [msg, setMsg] = useState(PRESETS[0][1]);
  const r = useMemo(() => {
    if (!site.data?.pump || !window.RadarEngine || !msg.trim()) return null;
    return window.RadarEngine.pumpScore(site.data.pump, msg);
  }, [site.data, msg]);
  const tone = r ? (r.alarm ? 'high' : 'lower') : 'neutral';

  return (
    <section id="pump" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Second signal · Pump Alarm" title="Check the message, too." muted="Not just the token.">
          Scams usually start with a hype post in a Telegram group. Paste one here. A text model trained on 2,783 hand-labeled messages scores it as you type, right in your browser.
        </SectionHead>
        <Reveal className="mt-12 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map(([l, t]) => (
                <button key={l} onClick={() => setMsg(t)} className={cn('rounded-full border px-3 py-1 text-xs transition cursor-pointer', msg === t ? 'border-white/25 bg-white/10 text-ink' : 'border-line text-muted hover:text-ink')}>{l}</button>
              ))}
            </div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={6} placeholder="Paste a crypto message…"
              className="w-full resize-none rounded-xl border border-line bg-bg/60 p-4 font-mono text-[14px] leading-relaxed text-ink outline-none transition focus:border-white/25" />
            <p className="mt-3 text-xs text-faint">Usernames, links and phone numbers are masked before scoring. Nothing you type leaves your browser.</p>
          </div>
          <div className="card relative flex flex-col justify-between overflow-hidden p-6">
            <div className={cn('pointer-events-none absolute -right-20 -top-20 size-72 rounded-full blur-3xl transition-colors duration-500', r?.alarm ? 'bg-high/20' : 'bg-lower/10')} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Pump score</span>
                <Badge tone={tone} dot>{r ? (r.alarm ? 'Looks like a pump call' : 'Doesn’t look like a pump call') : 'Waiting for a message'}</Badge>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className={cn('num text-7xl font-semibold tracking-[-0.05em] transition-colors', r?.alarm ? 'text-high' : 'text-lower')}>{r ? r.score : '–'}</span>
                <span className="mb-3 font-mono text-sm text-faint">/ 100</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div className={cn('h-full rounded-full', r?.alarm ? 'bg-high' : 'bg-lower')} animate={{ width: `${r ? Math.max(2, r.score) : 0}%` }} transition={{ type: 'spring', damping: 30, stiffness: 160 }} />
              </div>
              <div className="mt-6">
                <div className="eyebrow mb-2.5">Words that raised the score</div>
                <div className="flex flex-wrap gap-2">
                  {r && r.words.length ? r.words.map((w) => <span key={w} className="rounded-md border border-high/25 bg-high/10 px-2 py-1 font-mono text-[13px] text-high">{w}</span>)
                    : <span className="text-sm text-faint">No strong pump words.</span>}
                </div>
              </div>
            </div>
            <div className="relative mt-8 flex gap-2.5 rounded-xl border border-line bg-bg/50 p-3.5 text-xs leading-relaxed text-muted">
              <MessageSquareWarning className="size-4 shrink-0 text-faint" />
              Honest note: on chat groups it never saw, it catches about half of pump calls (F1 0.50, vs 0.20 for a keyword rule).
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
