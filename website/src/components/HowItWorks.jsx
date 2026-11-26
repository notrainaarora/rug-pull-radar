import { motion } from 'motion/react';
import { Activity, Blocks, BrainCircuit, MessageSquareText } from 'lucide-react';
import { Reveal, SectionHead } from './ui';

const steps = [
  { icon: Blocks, k: '01', t: 'Launch facts', d: 'How much ETH the creator put in the pool, how many tokens, the creator’s earlier launches, hype words in the name.', chips: ['init_liq_eth', 'creator_prior_tokens', 'meme_word'] },
  { icon: Activity, k: '02', t: 'Replay the first hour', d: 'We read every trade and pool event from the public blockchain for exactly one hour: buys, sells, unique buyers, ETH left in the pool.', chips: ['n_buys', 'unique_buyers', 'eth_in_pool_1h'] },
  { icon: BrainCircuit, k: '03', t: 'Score with XGBoost', d: 'Hundreds of small decision trees vote on how much it looks like 2020–21 rug pulls. Trained on older tokens, tested on newer ones.', chips: ['300 trees', 'time split', 'threshold tuned'] },
  { icon: MessageSquareText, k: '04', t: 'Explain with SHAP', d: 'SHAP splits the score into how much each fact pushed it up or down. The top three become plain-English reasons.', chips: ['raises risk', 'lowers risk'] },
];

export default function HowItWorks() {
  return (
    <section id="how" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="How it works" title="From a contract address to a reason you can read." muted="In about ten seconds." />
        <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px lg:block">
            <motion.div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
          </div>
          {steps.map((s, i) => (
            <Reveal key={s.k} delay={i * 0.1} className="card group relative p-6 transition hover:border-white/15">
              <div className="flex items-center justify-between">
                <div className="grid size-11 place-items-center rounded-xl border border-line-strong bg-raised"><s.icon className="size-5 text-ink" strokeWidth={1.6} /></div>
                <span className="font-mono text-xs text-faint">{s.k}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.d}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {s.chips.map((c) => <span key={c} className="rounded-md border border-line bg-bg/60 px-2 py-0.5 font-mono text-[11px] text-faint">{c}</span>)}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-5">
          <div className="card flex flex-col gap-4 p-6 text-[14.5px] text-muted md:flex-row md:items-center md:justify-between">
            <span><span className="text-ink">Your privacy and our key stay safe.</span> Live checks run on our server. The blockchain API key never reaches your browser, and we don&rsquo;t store what you look up.</span>
            <span className="shrink-0 font-mono text-xs text-faint">Uniswap V2 · Ethereum · tokens paired with ETH</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
