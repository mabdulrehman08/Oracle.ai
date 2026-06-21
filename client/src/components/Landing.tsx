import { useState } from 'react';
import type { CompanyMode } from '../types';

interface LandingProps {
  loading: boolean;
  onStart: (idea: string, budget: number, mode: CompanyMode) => Promise<void>;
  onDemo: () => Promise<void>;
}

export function Landing({ loading, onStart, onDemo }: LandingProps) {
  const [idea, setIdea] = useState('Build a profitable AI Translator startup');
  const [budget, setBudget] = useState(5000);
  const [mode, setMode] = useState<CompanyMode>('profit');

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(110,231,249,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,0.18),transparent_28%),linear-gradient(135deg,#070b14_0%,#0f1726_46%,#070b14_100%)]" />
      <div className="absolute left-10 top-24 h-48 w-48 animate-drift rounded-full bg-glow/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-64 w-64 animate-drift rounded-full bg-coral/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <section className="max-w-2xl space-y-6">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-glow">
            Hackathon MVP · Task 1
          </div>
          <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">Oracle Evolution</h1>
          <p className="max-w-xl text-lg text-steel">
            A company where agents are born, evaluated, terminated, and evolved.
          </p>
          <p className="max-w-xl text-sm leading-7 text-steel/80">
            Start a business organism, watch specialist agents work under a live HUD, and show judges the full self-improving loop in one crisp realtime flow.
          </p>
        </section>

        <section className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-glow">Launch Console</p>
              <p className="mt-2 text-2xl font-semibold">Declare the company</p>
            </div>
            <div className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs text-lime">Zero API keys required</div>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-steel">Business idea</span>
              <textarea
                className="h-28 w-full rounded-2xl border border-white/10 bg-nebula/80 px-4 py-3 text-sm outline-none transition focus:border-glow"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-steel">Budget</span>
              <input
                type="number"
                className="w-full rounded-2xl border border-white/10 bg-nebula/80 px-4 py-3 text-sm outline-none transition focus:border-glow"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-steel">Mode</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-nebula/80 px-4 py-3 text-sm outline-none transition focus:border-glow"
                value={mode}
                onChange={(event) => setMode(event.target.value as CompanyMode)}
              >
                <option value="profit">Profit Mode</option>
                <option value="growth">Growth Mode</option>
              </select>
            </label>

            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              <button
                className="rounded-2xl bg-glow px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                disabled={loading}
                onClick={() => onStart(idea, budget, mode)}
              >
                Start Evolution
              </button>
              <button
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                disabled={loading}
                onClick={() => void onDemo()}
              >
                Run Demo
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
