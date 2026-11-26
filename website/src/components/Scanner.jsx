import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Loader2, Search, ScanLine } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BAND, FEATURED, bandOf, useSiteData } from '../lib/data';
import { cn } from '../lib/cn';
import ResultCard from './ResultCard';

const DEMO_MS = 7000;
const STEPS = ['Finding the token’s trading pool', 'Reading its launch facts', 'Replaying its first hour of trades', 'Scoring with the model', 'Writing the reasons'];

function fromToken(t) { return { ...t, source: 'test' }; }

async function liveCheck(address) {
  const res = await fetch(`/api/score?address=${encodeURIComponent(address)}`);
  let j = null;
  try { j = await res.json(); } catch { /* not JSON */ }
  if (!j || !j.ok) throw new Error((j && j.error) || 'The live checker is not available right now.');
  return { ...j, source: 'live', is_rug: j.known ? j.known.is_rug : null, hours_to_rug: j.known ? j.known.hours_to_rug : null };
}

// The search box + result. Exposed so other sections (featured chips, the token table) can load a token.
const Scanner = forwardRef(function Scanner({ compact }, ref) {
  const site = useSiteData();
  const d = site.data;
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const anchor = useRef(null);
  const rail = useRef(null);
  const [auto, setAuto] = useState(!compact);
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const threshold = d ? Math.round(d.threshold * 100) : 50;

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600);
    return () => clearInterval(id);
  }, [busy]);

  const suggestions = useMemo(() => {
    if (!d || !q.trim() || q.trim().startsWith('0x')) return [];
    const s = q.trim().toLowerCase();
    return d.tokens.filter((t) => t.name.toLowerCase().includes(s) || t.symbol.toLowerCase().includes(s)).slice(0, 6);
  }, [d, q]);

  const show = (r) => { setResult(r); setErr(''); setTimeout(() => anchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };
  const stopAuto = () => setAuto(false);
  const runLive = async (address) => {
    stopAuto(); setBusy(true); setErr('');
    try { show(await liveCheck(address)); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const submit = (e) => {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    stopAuto();
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) {
      const t = d?.byAddress.get(v.toLowerCase());
      return t ? show(fromToken(t)) : runLive(v);
    }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v) && !suggestions[0]) {
      return setErr('That looks like a Solana address. Rug-Pull Radar checks Ethereum tokens on Uniswap for now. Solana is on our roadmap.');
    }
    if (suggestions[0]) { setQ(''); return show(fromToken(suggestions[0])); }
    setErr(v.startsWith('0x') ? 'That address looks incomplete. An Ethereum address is 0x followed by 40 letters and numbers.' : 'No token with that name in our test set. Paste its contract address (0x…) to check it live.');
  };
  useImperativeHandle(ref, () => ({ load: (t) => { stopAuto(); show(fromToken(t)); } }));

  const featured = d ? FEATURED.map((f) => ({ ...f, t: d.tokens.find((t) => t.name === f.name) })).filter((f) => f.t) : [];
  const demoOn = auto && featured.length > 0 && !result && !busy && !err;
  const shown = result || (demoOn ? fromToken(featured[active % featured.length].t) : null);
  const next = () => { setActive((a) => (a + 1) % Math.max(featured.length, 1)); setCycle((c) => c + 1); };
  const pick = (i) => { setResult(null); setErr(''); setAuto(true); setActive(i); setCycle((c) => c + 1); };

  useEffect(() => {
    const el = rail.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const btn = el.children[active % Math.max(el.children.length, 1)];
    if (btn) el.scrollTo({ left: el.scrollLeft + btn.getBoundingClientRect().left - el.getBoundingClientRect().left - 20, behavior: 'smooth' });
  }, [active]);

  return (
    <div className={cn('mx-auto w-full', compact ? 'max-w-3xl' : 'max-w-6xl')}>
      <form onSubmit={submit} className="relative mx-auto max-w-3xl">
        <div className={cn('group relative flex items-center gap-2 rounded-2xl border bg-surface/80 p-2 pl-4 backdrop-blur-xl transition-all duration-300',
          focus ? 'border-white/25 shadow-[0_0_0_6px_rgba(255,255,255,.04),0_30px_80px_-20px_rgba(0,0,0,.8)]' : 'border-line-strong shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]')}>
          <Search className="size-5 shrink-0 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder="Paste a token address (0x…) or search a token name" spellCheck={false} autoComplete="off"
            className="h-12 min-w-0 flex-1 bg-transparent font-mono text-[15px] text-ink outline-none" aria-label="Token address or name" />
          <button type="submit" disabled={busy}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-bg transition hover:bg-white disabled:opacity-60 cursor-pointer">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
            <span className="hidden sm:inline">{busy ? 'Scanning' : 'Check token'}</span>
          </button>
        </div>
        <AnimatePresence>
          {focus && suggestions.length > 0 && (
            <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line-strong bg-raised/95 p-1.5 text-left shadow-2xl backdrop-blur-xl">
              {suggestions.map((t) => (
                <li key={t.address}>
                  <button type="button" onMouseDown={() => { setQ(''); show(fromToken(t)); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-white/[0.06] cursor-pointer">
                    <span className="truncate"><span className="text-ink">{t.name}</span> <span className="font-mono text-xs text-faint">{t.symbol}</span></span>
                    <span className="font-mono text-xs text-faint">launched {t.launched}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-3 text-center text-xs text-faint">
        Checks <span className="text-muted">Ethereum tokens traded on Uniswap V2</span> for now. BNB Chain, Base and Solana are <a href="#roadmap" className="underline decoration-white/20 underline-offset-2 hover:text-ink">coming next</a>.
      </p>

      {site.status === 'error' && <p className="mt-4 text-center text-sm text-caution">The token data file (data.json) hasn&rsquo;t been added yet, so only live checks will work.</p>}

      <div ref={anchor} className="scroll-mt-28" />
      <div className={cn('mt-12 grid grid-cols-[minmax(0,1fr)] items-start gap-5 text-left lg:mt-[clamp(44px,calc((100vh-993px)*0.45-28px),149px)]', featured.length > 0 && 'lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]')}>
        {featured.length > 0 && (
          <div className="lg:sticky lg:top-24">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {demoOn ? 'Watch it work on real tokens' : 'Real tokens from the test set'}
            </div>
            <div ref={rail} role="tablist" aria-orientation="vertical" className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-1 lg:gap-y-2 lg:overflow-visible lg:px-0">
              {featured.map((f, i) => {
                const on = demoOn ? i === active % featured.length : shown && shown.address === f.t.address;
                return (
                  <button key={f.name} role="tab" aria-selected={!!on} onClick={() => pick(i)}
                    className={cn('group relative w-[68%] shrink-0 snap-start px-1 pb-4 pt-3 text-left text-sm transition cursor-pointer sm:w-[calc((100%-3rem)/3)] lg:w-auto', on ? 'opacity-100' : 'opacity-60 hover:opacity-90')}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn('size-1.5 shrink-0 rounded-full', BAND[f.tone].bg)} />
                        <span className={cn('truncate', on ? 'text-ink' : 'text-muted')}>{f.name}</span>
                      </span>
                      <span className={cn('font-mono text-xs tabular-nums', on ? 'text-ink' : 'text-faint')}>{Math.round(f.t.score)}<span className="text-faint">/100</span></span>
                    </span>
                    <span className="mt-1 block text-xs text-faint">{f.tag}</span>
                    <span className="absolute inset-x-0 bottom-0 h-px bg-white/[0.12]" />
                    <span className="absolute inset-x-0 -bottom-px h-[3px]">
                      {demoOn && on && (
                        <span key={cycle} onAnimationEnd={next} className="demo-progress block h-full rounded-full bg-ink"
                          style={{ animationDuration: `${DEMO_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
                      )}
                      {!demoOn && on && <span className="block h-full w-full rounded-full bg-ink/70" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 hidden text-xs leading-relaxed text-faint lg:block">
              Each one is a real token the model never saw while it was learning. Click one to pin it, or paste any address above to check it live.
            </p>
          </div>
        )}

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {busy && (
              <motion.div key="busy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="relative grid size-12 place-items-center">
                    <span className="absolute inset-0 rounded-full border border-white/20 animate-pulse-ring" />
                    <span className="absolute inset-2 rounded-full border border-white/30" />
                    <span className="size-2 rounded-full bg-ink" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] text-ink">Reading the blockchain&hellip;</div>
                    <div className="mt-1 font-mono text-xs text-faint">This takes about 5 to 15 seconds.</div>
                  </div>
                </div>
                <ol className="mt-5 grid gap-2">
                  {STEPS.map((s, i) => (
                    <li key={s} className={cn('flex items-center gap-3 font-mono text-[13px] transition-colors', i < step ? 'text-muted' : i === step ? 'text-ink' : 'text-faint/60')}>
                      <span className={cn('grid size-4 place-items-center rounded-full border text-[9px]', i < step ? 'border-lower/50 bg-lower/15 text-lower' : i === step ? 'border-white/40' : 'border-white/10')}>
                        {i < step ? '✓' : ''}
                      </span>
                      {s}
                      {i === step && <span className="shimmer ml-1 h-3 w-24 rounded" />}
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
            {!busy && err && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-xl border border-caution/25 bg-caution/[0.06] px-5 py-4 text-sm text-caution">{err}</motion.div>
            )}
            {!busy && shown && (
              <motion.div key={(shown.address || '') + shown.source} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
                onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                <ResultCard r={shown} threshold={threshold} onLive={() => runLive(shown.address)} liveBusy={busy} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default Scanner;
export { bandOf };
