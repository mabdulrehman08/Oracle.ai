import type { Agent, Company, EventRecord } from '../types';

export function EvolutionPanel({
  company,
  events,
  agents,
  pitchMode,
}: {
  company: Company;
  events: EventRecord[];
  agents: Agent[];
  pitchMode: boolean;
}) {
  const pitchSignals = events.filter((event) => event.type === 'pitch_signal').slice(-6).reverse();
  const activeAgents = agents.filter((agent) => agent.status !== 'terminated');

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Evolution</p>
            <p className="mt-1 text-lg font-semibold text-ink">Self-evolving company OS</p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
              company.status === 'evolved' ? 'bg-lime/10 text-lime' : 'bg-ycSoft text-yc'
            }`}
          >
            {company.status}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-line bg-cream p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel">Company Thesis</p>
            <p className="mt-3 text-sm leading-7 text-ink">
              evoler.ai creates agents, assigns work, evaluates outcomes with HUD, saves memory, kills weak
              operators, and mutates into a stronger company.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-cream p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel">Live Snapshot</p>
            <dl className="mt-3 space-y-2 text-sm text-ink">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Idea</dt>
                <dd className="truncate text-right font-medium">{company.idea}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Active agents</dt>
                <dd className="font-mono font-medium">{activeAgents.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Timeline events</dt>
                <dd className="font-mono font-medium">{events.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Profit</dt>
                <dd className="font-mono font-medium text-lime">${company.profit.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Growth score</dt>
                <dd className="font-mono font-medium text-violet">{company.growthScore}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {pitchMode ? (
        <div className="rounded-xl border border-yc/30 bg-ycSoft p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Pitch Mode</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pitchSignals.length > 0 ? (
              pitchSignals.map((signal) => (
                <div key={signal.id} className="rounded-xl border border-line bg-white p-4">
                  <p className="text-base font-semibold text-ink">{signal.message}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                    {new Date(signal.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
                Pitch labels will appear here during the live demo.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
