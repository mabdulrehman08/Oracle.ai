import type { SponsorStatus } from '../types';

export function SponsorsPanel({ sponsors, onOpenPage }: { sponsors: SponsorStatus[]; onOpenPage: () => void }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Sponsors</p>
          <p className="mt-1 text-lg font-semibold text-ink">Integration health</p>
        </div>
        <button
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream"
          onClick={onOpenPage}
        >
          Open Sponsors Page →
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sponsors.map((sponsor) => (
          <div key={sponsor.id} className="rounded-xl border border-line bg-cream p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{sponsor.name}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                  sponsor.mode === 'connected' ? 'bg-lime/10 text-lime' : 'bg-coral/10 text-coral'
                }`}
              >
                {sponsor.mode}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-yc">{sponsor.purpose}</p>
            <p className="mt-2 text-sm leading-6 text-steel">{sponsor.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
