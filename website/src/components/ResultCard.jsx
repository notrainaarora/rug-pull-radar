import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight, Check, Copy, ExternalLink, Eye, Radio, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { BAND, bandOf, hoursText, short } from '../lib/data';
import { cn } from '../lib/cn';
import Gauge from './Gauge';
import { Badge, Button } from './ui';

export default function ResultCard({ r, threshold, onLive, liveBusy }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const band = bandOf(r.score, threshold);
  const B = BAND[band];
  const maxW = Math.max(...r.reasons.map((x) => x.weight || 0), 0.0001);
  const outcome = r.is_rug != null ? { is_rug: r.is_rug, hours: r.hours_to_rug } : null;
  const flagged = r.score >= threshold;
  const right = outcome && (flagged === !!outcome.is_rug);
  const copy = () => { navigator.clipboard?.writeText(r.address); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <motion.div layout initial={{ opacity: 0, y: 16, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-3xl" style={{ background: B.color }} />

      {/* header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-line-strong bg-raised font-mono text-sm text-ink">
            {(r.symbol || r.name || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold tracking-tight">{r.name || 'Unnamed token'}</span>
              {r.symbol && <span className="font-mono text-xs text-faint">{r.symbol}</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-faint">
              <button onClick={copy} className="inline-flex items-center gap-1 hover:text-ink cursor-pointer" title="Copy address">
                {short(r.address)} {copied ? <Check className="size-3 text-lower" /> : <Copy className="size-3" />}
              </button>
              <span>·</span>
              <a className="inline-flex items-center gap-1 hover:text-ink" href={`https://etherscan.io/token/${r.address}`} target="_blank" rel="noreferrer">Etherscan <ExternalLink className="size-3" /></a>
              {r.launched && <span className="hidden sm:inline">· launched {String(r.launched).slice(0, 10)}</span>}
            </div>
          </div>
        </div>
        {r.source === 'live'
          ? <Badge tone="neutral"><Radio className="size-3 text-lower" /> Checked live from the blockchain</Badge>
          : <Badge tone="neutral">From the held-out test set</Badge>}
      </div>

      {/* body */}
      <div className="relative grid gap-8 px-6 py-7 md:grid-cols-[220px_1fr] md:gap-10">
        <div className="flex flex-col items-center">
          <Gauge score={r.score} band={band} threshold={threshold} />
          <div className={cn('mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset', B.text, B.soft, B.ring)}>
            <span className={cn('size-2 rounded-full', B.bg)} /> {B.label}
          </div>
          <p className="mt-3 max-w-[200px] text-center text-xs leading-relaxed text-faint">
            Red from {threshold}, the model&rsquo;s alert line. Yellow from 50.
          </p>
        </div>

        <div>
          <div className="eyebrow mb-3">Top 3 reasons</div>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-bg/40">
            {r.reasons.map((x, i) => {
              const up = x.effect === 'up';
              return (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
                  className="flex items-start gap-3.5 px-4 py-3.5">
                  <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', up ? 'bg-high/10 text-high' : 'bg-lower/10 text-lower')}>
                    {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] leading-snug text-ink">{x.text}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div className={cn('h-full rounded-full', up ? 'bg-high' : 'bg-lower')} initial={{ width: 0 }}
                          animate={{ width: `${Math.max(6, (100 * (x.weight || 0)) / maxW)}%` }} transition={{ delay: 0.4 + i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                      </div>
                      <span className={cn('w-20 text-right font-mono text-[11px] uppercase tracking-wider', up ? 'text-high' : 'text-lower')}>{up ? 'raises risk' : 'lowers risk'}</span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>

          {r.source === 'live' && !r.young && r.features && r.features.n_swaps <= 2 && (
            <div className="mt-4 flex gap-2.5 rounded-xl border border-caution/25 bg-caution/[0.07] px-4 py-3 text-sm text-caution">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Almost no trading happened in this pool&rsquo;s first hour ({r.features.n_swaps} trade{r.features.n_swaps === 1 ? '' : 's'}). Trading probably opened later, so this score says little about the token.
            </div>
          )}

          {r.young && (
            <div className="mt-4 flex gap-2.5 rounded-xl border border-caution/25 bg-caution/[0.07] px-4 py-3 text-sm text-caution">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Launched less than an hour ago, so its first hour isn&rsquo;t complete yet. Check again later.
            </div>
          )}

          {outcome && (
            <div className="mt-4">
              <AnimatePresence mode="wait" initial={false}>
                {!revealed ? (
                  <motion.button key="btn" exit={{ opacity: 0 }} onClick={() => setRevealed(true)}
                    className="group flex w-full items-center justify-between rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-left text-sm text-muted transition hover:border-white/30 hover:text-ink cursor-pointer">
                    <span><span className="font-medium text-ink">What really happened?</span> Make your guess, then reveal it.</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider"><Eye className="size-4" /> Reveal</span>
                  </motion.button>
                ) : (
                  <motion.div key="res" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5', outcome.is_rug ? 'border-high/25 bg-high/[0.06]' : 'border-lower/25 bg-lower/[0.06]')}>
                    <div className="text-sm">
                      <span className={cn('font-semibold', outcome.is_rug ? 'text-high' : 'text-lower')}>
                        {outcome.is_rug ? `Rug pull, ${hoursText(outcome.hours)} after launch.` : 'No rug pull recorded.'}
                      </span>
                      <span className="text-muted"> {outcome.is_rug ? 'The creator pulled nearly all the money out of the pool.' : 'The pool was never drained.'}</span>
                    </div>
                    <Badge tone={right ? 'lower' : 'high'}>{right ? <Check className="size-3" /> : <X className="size-3" />} {right ? 'Model got it right' : 'Model got it wrong'}</Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg/40 px-6 py-3.5 text-xs text-faint">
        <span>Scored on the token&rsquo;s first hour only. This is a prototype, not financial advice.</span>
        {onLive && r.source !== 'live' && (
          <Button variant="ghost" size="sm" onClick={onLive} disabled={liveBusy}>
            <RefreshCw className={cn('size-3.5', liveBusy && 'animate-spin')} /> Re-check live from the blockchain
          </Button>
        )}
        {r.source === 'live' && r.provider && <span>{r.provider === 'Blockscout' ? 'Blockchain data via Blockscout (free public explorer, same data as Etherscan)' : 'Blockchain data via Etherscan'}</span>}
      </div>
    </motion.div>
  );
}
