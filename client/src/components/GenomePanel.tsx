import type { CompanyGenome } from '../types';

export function GenomePanel({ genome }: { genome: CompanyGenome }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Company Genome</p>
          <p className="mt-1 text-lg font-semibold text-ink">Mutation logic</p>
        </div>
        <div className="rounded-full border border-line bg-cream px-3 py-1 font-mono text-xs text-steel">
          Updated {new Date(genome.updatedAt).toLocaleTimeString()}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime">Successful Agents</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.successfulAgents.join(', ') || 'None yet'}</p>
        </div>
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-coral">Failed Agents</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.failedAgents.join(', ') || 'None yet'}</p>
        </div>
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel">Best Strategy</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.bestStrategy}</p>
        </div>
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel">Worst Strategy</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.worstStrategy}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-yc/25 bg-ycSoft p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-yc">Current Mutation</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.currentMutation}</p>
        </div>
        <div className="rounded-xl border border-violet/25 bg-violet/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet">Next Recommended Mutation</p>
          <p className="mt-2 text-sm leading-6 text-ink">{genome.nextRecommendedMutation}</p>
        </div>
      </div>
    </section>
  );
}
