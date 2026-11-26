import { motion } from 'motion/react';
import { forwardRef } from 'react';
import Scanner from './Scanner';
import { Pill } from './ui';

// Concentric arcs + a slow radar sweep behind the headline
function Rings() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1060px] overflow-hidden">
      <div className="absolute left-1/2 top-[600px] -translate-x-1/2 -translate-y-1/2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ width: 220 * i, height: 220 * i, borderColor: `rgba(255,255,255,${0.4 - i * 0.035})` }} />
        ))}
        <div className="absolute left-1/2 top-1/2 size-[1760px] -translate-x-1/2 -translate-y-1/2 animate-sweep opacity-100"
          style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 320deg, transparent 300deg, rgba(255,90,78,.2) 345deg, rgba(255,90,78,.5) 360deg)', borderRadius: '9999px', maskImage: 'radial-gradient(closest-side, #000 55%, transparent)' }} />
        {[[-310, -140, 0.2], [380, 60, 1.4], [-180, 260, 2.6], [250, -300, 3.6]].map(([x, y, dl], i) => (
          <span key={i} className="absolute left-1/2 top-1/2" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <span className="absolute -inset-3 rounded-full border border-high/70 animate-pulse-ring" style={{ animationDelay: `${dl}s` }} />
            <span className="block size-2 rounded-full bg-high shadow-[0_0_16px_3px_rgba(255,90,78,.75)]" />
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_10%,transparent,var(--color-bg)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}

const Hero = forwardRef(function Hero(_, ref) {
  return (
    <section id="check" className="relative isolate px-5 pb-24 pt-48 sm:pt-60 lg:pt-[clamp(112px,calc((100vh-993px)*0.55),240px)]">
      <Rings />
      <div className="mx-auto max-w-6xl text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
          <Pill><span className="size-1.5 rounded-full bg-high shadow-[0_0_8px_rgba(255,90,78,.9)]" /> Crypto Safety Copilot · AI + Finance</Pill>
          <span className="h-8 w-px border-l border-dashed border-white/20" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl md:text-[88px]">
          Spot the rug pull
          <br />
          <span className="text-faint">before it&rsquo;s pulled.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}
          className="mx-auto mt-7 max-w-3xl text-balance text-lg leading-relaxed text-muted sm:text-xl">
          Paste any new Ethereum token. Rug-Pull Radar reads its first hour on the blockchain and gives you a
          <span className="text-ink"> 0&ndash;100 scam-risk score</span> with the <span className="text-ink">three reasons</span> behind it.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }} className="mt-10">
          <Scanner ref={ref} />
        </motion.div>
      </div>
    </section>
  );
});
export default Hero;
