import { lazy, Suspense, useState } from 'react';
import type { CompanyMode } from '../types';

// Three.js is heavy — only pull it in when the Landing hero mounts.
const BrainScene = lazy(() => import('./BrainScene').then((m) => ({ default: m.BrainScene })));

interface LandingProps {
  loading: boolean;
  onStart: (idea: string, budget: number, mode: CompanyMode) => Promise<void>;
  onDemo: () => Promise<void>;
}

const lifecycle = [
  { icon: '🌱', title: 'Born', text: 'A CEO agent spawns specialist agents under one mission.' },
  { icon: '⚙️', title: 'Work', text: 'Agents research, build, and ship real tasks.' },
  { icon: '🎯', title: 'Scored', text: 'A live HUD grades every agent from 0 to 100.' },
  { icon: '🔁', title: 'Evolve', text: 'Weak agents die; sharper specialists replace them.' },
];

const ideaPresets = [
  'Build a profitable AI Translator startup',
  'Launch a viral short-form video studio',
  'Bootstrap a developer tools company',
];

export function Landing({ loading, onStart, onDemo }: LandingProps) {
  const [idea, setIdea] = useState(ideaPresets[0]);
  const [budget, setBudget] = useState(5000);
  const [mode, setMode] = useState<CompanyMode>('profit');

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07060b] text-white">
      {/* living 3D brain */}
      <Suspense fallback={null}>
        <BrainScene />
      </Suspense>
      {/* legibility wash: dark on the left where the copy sits, clear on the right */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07060b] via-[#07060b]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07060b] to-transparent" />

      {/* top nav */}
      <header className="relative z-20 border-b border-white/10 bg-[#07060b]/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yc text-sm font-bold text-white shadow-glow">Y</span>
            <span className="text-base font-semibold tracking-tight">evoler.ai</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/60 sm:flex">
            <span className="cursor-default transition hover:text-white">How it works</span>
            <span className="cursor-default transition hover:text-white">Agents</span>
            <span className="cursor-default transition hover:text-white">HUD</span>
          </nav>
          <button
            className="rounded-lg bg-yc px-4 py-2 text-sm font-semibold text-white transition hover:bg-ycDark disabled:opacity-60"
            disabled={loading}
            onClick={() => void onDemo()}
          >
            Run demo
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        {/* ---- pitch ---- */}
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yc opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yc" />
            </span>
            A self-improving agent organism
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            The company that
            <br />
            <span className="text-yc [text-shadow:0_0_30px_rgba(255,102,0,0.45)]">evolves itself.</span>
          </h1>

          <p className="max-w-xl text-lg leading-8 text-white/70">
            evoler.ai runs your business like a living brain. AI agents are born, assigned work, scored by a
            real-time HUD, terminated when they fail, and replaced by stronger specialists — autonomously.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg bg-yc px-6 py-3 text-sm font-semibold text-white shadow-glow-lg transition hover:bg-ycDark disabled:opacity-60"
              disabled={loading}
              onClick={() => onStart(idea, budget, mode)}
            >
              {loading ? 'Spawning company…' : 'Start your company →'}
            </button>
            <button
              className="rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 disabled:opacity-60"
              disabled={loading}
              onClick={() => void onDemo()}
            >
              ▶ Watch the demo
            </button>
          </div>

          <div className="grid gap-3 pt-4 sm:grid-cols-4">
            {lifecycle.map((step, i) => (
              <div
                key={step.title}
                className="animate-rise rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-xl">{step.icon}</div>
                <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ---- launch console ---- */}
        <div className="animate-rise rounded-2xl border border-white/10 bg-white/[0.06] p-7 shadow-glow-lg backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Genesis Console</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-white">Found your company</p>
            </div>
            <span className="rounded-full border border-lime/40 bg-lime/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-lime">
              0 API keys
            </span>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Business idea</span>
              <textarea
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-yc focus:ring-2 focus:ring-yc/30"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="What should this company become?"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {ideaPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setIdea(preset)}
                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                      idea === preset ? 'border-yc/50 bg-yc/15 text-yc' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'
                    }`}
                  >
                    {preset.split(' ').slice(0, 3).join(' ')}…
                  </button>
                ))}
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Budget</span>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-yc focus-within:ring-2 focus-within:ring-yc/30">
                  <span className="text-white/40">$</span>
                  <input
                    type="number"
                    className="w-full bg-transparent px-2 py-3 font-mono text-sm text-white outline-none"
                    value={budget}
                    onChange={(event) => setBudget(Number(event.target.value))}
                  />
                </div>
              </label>

              <div className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['profit', 'growth'] as CompanyMode[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                        mode === option ? 'border-yc bg-yc/15 text-yc' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="w-full rounded-xl bg-yc px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:bg-ycDark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={() => onStart(idea, budget, mode)}
            >
              {loading ? 'Spawning…' : 'Start Evolution'}
            </button>

            <p className="text-center text-[11px] text-white/40">
              Powered by HUD · Fireworks · Exa · Daytona · Modal · SixtyFour
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
