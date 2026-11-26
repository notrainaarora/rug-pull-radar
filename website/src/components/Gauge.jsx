import { motion } from 'motion/react';
import { BAND } from '../lib/data';
import { Ticker } from './ui';

// Ring gauge: 0-100 score, with tick marks at 50 (caution) and the model's alert line
export default function Gauge({ score, band, threshold, size = 196 }) {
  const r = 78, c = 2 * Math.PI * r, arc = 0.75; // 270-degree arc
  const color = BAND[band].color;
  const tick = (v) => {
    const a = (135 + 270 * (v / 100)) * (Math.PI / 180);
    return { x1: 100 + 66 * Math.cos(a), y1: 100 + 66 * Math.sin(a), x2: 100 + 90 * Math.cos(a), y2: 100 + 90 * Math.sin(a) };
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="size-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${c * arc} ${c}`} transform="rotate(135 100 100)" />
        <motion.circle key={`g${score}`} cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" opacity=".35" filter="url(#glow)"
          transform="rotate(135 100 100)" initial={{ strokeDasharray: `0 ${c}` }} animate={{ strokeDasharray: `${c * arc * (score / 100)} ${c}` }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }} />
        <motion.circle key={`s${score}`} cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          transform="rotate(135 100 100)" initial={{ strokeDasharray: `0 ${c}` }} animate={{ strokeDasharray: `${Math.max(c * arc * (score / 100), 0.01)} ${c}` }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }} />
        {[50, threshold].map((v) => <line key={v} {...tick(v)} stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeDasharray="2 2" />)}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <div className="text-[56px] font-semibold leading-none tracking-[-0.05em]" style={{ color }}>
          <Ticker key={score} value={score} />
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">of 100</div>
      </div>
    </div>
  );
}
