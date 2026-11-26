import { cva } from 'class-variance-authority';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-bg hover:bg-white shadow-[0_0_0_1px_rgba(255,255,255,.1),0_8px_24px_-8px_rgba(255,255,255,.25)]',
        ghost: 'text-muted hover:text-ink hover:bg-white/5',
        outline: 'border border-line-strong text-ink hover:bg-white/5 hover:border-white/25',
        subtle: 'bg-white/[0.06] text-ink hover:bg-white/10 border border-line',
      },
      size: { sm: 'h-8 px-3.5 text-[13px]', md: 'h-10 px-5 text-sm', lg: 'h-12 px-6 text-[15px]' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
export function Button({ className, variant, size, as: As = 'button', ...p }) {
  return <As className={cn(buttonVariants({ variant, size }), className)} {...p} />;
}

export function Badge({ className, children, dot, tone }) {
  const tones = {
    high: 'text-high bg-high/10 ring-high/25', caution: 'text-caution bg-caution/10 ring-caution/25',
    lower: 'text-lower bg-lower/10 ring-lower/25', neutral: 'text-muted bg-white/[0.04] ring-white/10',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone || 'neutral'], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Pill({ children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted backdrop-blur', className)}>
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, muted, children, className, center }) {
  return (
    <Reveal className={cn('max-w-3xl', center && 'mx-auto text-center', className)}>
      <div className={cn('flex flex-col items-start gap-3', center && 'items-center')}>
        <Pill>{eyebrow}</Pill>
        <span className={cn('h-6 w-px border-l border-dashed border-white/20', !center && 'ml-5')} />
      </div>
      <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
        {title} {muted && <span className="text-faint">{muted}</span>}
      </h2>
      {children && <p className="mt-5 text-pretty text-[17px] leading-relaxed text-muted">{children}</p>}
    </Reveal>
  );
}

export function Reveal({ children, className, delay = 0, y = 18 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Animated number that counts up when it scrolls into view (Magic UI "NumberTicker" pattern)
export function Ticker({ value, decimals = 0, suffix = '', prefix = '', className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 40, stiffness: 120 });
  const [txt, setTxt] = useState((0).toFixed(decimals));
  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  useEffect(() => spring.on('change', (v) => setTxt(Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))), [spring, decimals]);
  return <span ref={ref} className={cn('num', className)}>{prefix}{txt}{suffix}</span>;
}

// A thin animated light that travels around a card's border (Magic UI "BorderBeam" pattern)
export function BorderBeam({ color = '#f4f4f0', duration = 8 }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px">
      <motion.div
        className="absolute aspect-square w-24"
        style={{ background: `radial-gradient(closest-side, ${color}, transparent)`, offsetPath: 'rect(0 auto auto 0 round 16px)' }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
