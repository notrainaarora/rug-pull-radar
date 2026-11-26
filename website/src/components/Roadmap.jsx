import { Reveal, SectionHead } from './ui';
import { cn } from '../lib/cn';

const items = [
  { tag: 'Live now', t: 'Ethereum · Uniswap V2', d: 'Launch facts plus the first hour of trades, scored by the XGBoost model trained in the notebook.', now: true },
  { tag: 'Coming next', t: 'BNB Chain · PancakeSwap', d: 'The same pool events exist there, so the first-hour replay carries over. It needs new labeled tokens to retrain on.' },
  { tag: 'Coming next', t: 'Base', d: 'A fast-growing Ethereum network where many new tokens launch today. Same address format, new pools.' },
  { tag: 'Coming next', t: 'Solana', d: 'Where most meme coins launch now. Different blockchain, so new features: mint authority, freeze authority, liquidity locks.' },
  { tag: 'Later', t: 'Wallet-drainer check', d: 'Warn before you sign a transaction that hands a scammer access to your wallet.' },
  { tag: 'Later', t: 'NFT wash-trading check', d: 'Spot NFT collections whose trading volume is faked by the same few wallets.' },
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Roadmap" title="Ethereum first." muted="Other chains next.">
          Today Rug-Pull Radar checks Ethereum tokens on Uniswap V2, the market it was trained and tested on. Scams have moved to other chains, so that&rsquo;s where it goes next.
        </SectionHead>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((x, i) => (
            <Reveal key={x.t} delay={i * 0.06} className={cn('card relative p-6', x.now && 'border-lower/25')}>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ring-1 ring-inset',
                x.now ? 'bg-lower/10 text-lower ring-lower/25' : x.tag === 'Coming next' ? 'bg-white/[0.05] text-ink ring-white/15' : 'bg-white/[0.03] text-faint ring-white/10')}>
                {x.now && <span className="size-1.5 rounded-full bg-lower" />}{x.tag}
              </span>
              <div className="mt-5 text-lg font-semibold tracking-tight">{x.t}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{x.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
