import { ArrowUpRight } from 'lucide-react';
import { LINKS } from '../lib/data';
import { Button, Reveal, SectionHead } from './ui';

const facts = [
  ['School', 'The Harker School, San Jose, California'],
  ['Grade', 'Sophomore (10th grade)'],
  ['Team', 'Solo. She did the data, the model and this website herself.'],
  ['Hackathon', 'Veritas AI International High School Hackathon 2026, AI + Finance track'],
];

function Monogram() {
  return (
    <div className="relative grid size-28 shrink-0 place-items-center rounded-full border border-line-strong bg-raised">
      <svg viewBox="0 0 112 112" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="56" cy="56" r="44" fill="none" stroke="#f4f4f0" strokeOpacity=".1" />
        <circle cx="56" cy="56" r="30" fill="none" stroke="#f4f4f0" strokeOpacity=".14" />
        <g className="origin-center animate-sweep" style={{ transformBox: 'fill-box' }}>
          <circle cx="56" cy="56" r="44" fill="none" stroke="none" />
          <path d="M76.2 43 L93 32.1" stroke="#ff5a4e" strokeOpacity=".8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
      <span className="relative text-3xl font-semibold tracking-[-0.04em]">RA</span>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="About the author" title="Built by Raina Arora." muted="A sophomore at Harker." />
        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          <Reveal className="card p-7 lg:col-span-2">
            <div className="flex items-center gap-5">
              <img src="/raina-circle.jpg" alt="Raina Arora" width="128" height="128" className="size-32 shrink-0 rounded-full border-2 border-white object-cover" />
              <div>
                <div className="text-xl font-semibold tracking-tight">Raina Arora</div>
                <div className="mt-1 text-[14.5px] text-muted">Sophomore, The Harker School</div>
                <div className="mt-0.5 text-[14.5px] text-faint">San Jose, California</div>
              </div>
            </div>
            <p className="mt-7 text-[15px] leading-relaxed text-muted">
              Raina built Rug-Pull Radar on her own for the Veritas AI hackathon. She was new to AI when she started, so she learned how to collect the data, train the model and test it fairly while building the project.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              She picked crypto scams because new tokens launch every day, a lot of them are traps, and the people buying them usually have no way to check. She used Claude as an AI coding assistant for the code and the website.
            </p>
            <div className="mt-7">
              <Button as="a" href="https://github.com/notrainaarora" target="_blank" rel="noreferrer" variant="outline">Raina on GitHub <ArrowUpRight className="size-4" /></Button>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="card p-7 lg:col-span-3">
            <div className="eyebrow">At a glance</div>
            <dl className="mt-3 divide-y divide-line">
              {facts.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[130px_1fr] sm:gap-6">
                  <dt className="font-mono text-xs uppercase tracking-wider text-faint sm:pt-1">{k}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 rounded-xl border border-lower/20 bg-lower/[0.05] px-5 py-4 text-[14.5px] leading-relaxed text-muted">
              <span className="font-semibold text-lower">Finalist.</span> Rug-Pull Radar was shortlisted for the hackathon finals, where Raina presented it to the judges and won a <span className="text-ink">$1,250 prize</span> toward a Veritas AI program.
            </div>
            <p className="mt-5 text-sm text-faint">
              The full project, including the notebook and this site&rsquo;s code, is on <a className="text-muted underline decoration-white/20 underline-offset-4 hover:text-ink" href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
