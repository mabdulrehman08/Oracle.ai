import type { SponsorStatus } from '../types';

export function SponsorsPage({ sponsors, onBack }: { sponsors: SponsorStatus[]; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-white/45 px-4 py-6 text-ink md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="glass flex flex-col gap-4 rounded-2xl p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yc text-sm font-bold text-white">Y</span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Sponsors</p>
            </div>
            <h1 className="mt-2.5 text-3xl font-bold tracking-tight md:text-4xl">evoler.ai Sponsor Stack</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-steel">
              HUD powers evaluation and natural selection, Fireworks supports reasoning, Exa drives research, Daytona runs
              code tasks, Modal coordinates parallel work, and SixtyFour supports hiring research.
            </p>
          </div>
          <button
            className="rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cream"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="glass rounded-2xl p-5 transition hover:shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-ink">{sponsor.name}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
                    sponsor.mode === 'connected' ? 'bg-lime/10 text-lime' : 'bg-coral/10 text-coral'
                  }`}
                >
                  {sponsor.mode}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-yc">{sponsor.purpose}</p>
              <p className="mt-3 text-sm leading-7 text-steel">{sponsor.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
