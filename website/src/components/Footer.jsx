import { ArrowUpRight } from 'lucide-react';
import { LINKS } from '../lib/data';
import { Logo } from './Nav';
import { Button, Reveal } from './ui';

export default function Footer() {
  return (
    <footer className="px-5 pb-12 pt-16">
      <div className="mx-auto max-w-6xl">
        <Reveal className="card relative overflow-hidden px-8 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
          <div className="relative">
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Check before you buy.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] text-muted">A red light is a reason to slow down. A green light is not a promise.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button as="a" href="#check" size="lg">Check a token</Button>
              <Button as="a" href={LINKS.colab} target="_blank" rel="noreferrer" variant="outline" size="lg">Open the notebook <ArrowUpRight className="size-4" /></Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 rounded-2xl border border-caution/20 bg-caution/[0.05] px-6 py-4 text-center text-sm text-caution">
          <strong className="font-semibold">This project is a prototype and is not financial advice.</strong> Never invest money you can&rsquo;t afford to lose.
        </div>

        <div className="mt-12 grid gap-10 border-t border-line pt-10 text-sm md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm leading-relaxed text-faint">Built solo by Raina Arora for the Veritas AI International High School Hackathon 2026, AI + Finance track. Part of the Crypto Safety Copilot.</p>
          </div>
          <div>
            <div className="eyebrow mb-3">Project</div>
            <ul className="grid gap-2 text-muted">
              <li><a className="hover:text-ink" href={LINKS.colab} target="_blank" rel="noreferrer">Colab notebook</a></li>
              <li><a className="hover:text-ink" href={LINKS.github} target="_blank" rel="noreferrer">GitHub repository</a></li>
              <li><a className="hover:text-ink" href="#results">Results</a></li>
              <li><a className="hover:text-ink" href="#honesty">Limits and failures</a></li>
              <li><a className="hover:text-ink" href="#about">About the author</a></li>
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Credits</div>
            <ul className="grid gap-2 leading-relaxed text-faint">
              <li>Rug-pull labels: <a className="text-muted hover:text-ink" href="https://github.com/kangmyoungseok/RugPull-Prediction-AI" target="_blank" rel="noreferrer">RugPull-Prediction-AI</a> (Team BOBAI, 2021)</li>
              <li>Pump labels: <a className="text-muted hover:text-ink" href="https://github.com/Bayi-Hu/Pump-and-Dump-Detection-on-Cryptocurrency" target="_blank" rel="noreferrer">Hu et al., SIGMOD 2023</a></li>
              <li>Blockchain data: Etherscan</li>
              <li>XGBoost, SHAP, scikit-learn, React, Tailwind CSS, Motion</li>
              <li>Claude (Anthropic), used as an AI coding assistant</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
