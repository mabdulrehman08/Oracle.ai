import type { Agent, Evaluation } from '../types';

export function HudEvaluations({ evaluations, agents }: { evaluations: Evaluation[]; agents: Agent[] }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-glow">HUD</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
          HUD
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold">Evaluation cards</p>
      <div className="mt-4 space-y-3">
        {evaluations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-steel">Waiting for the first HUD verdict.</div>
        ) : (
          evaluations
            .slice()
            .reverse()
            .map((evaluation) => {
              const agent = agents.find((item) => item.id === evaluation.agentId);
              return (
                <div key={evaluation.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{agent?.name ?? 'Unknown Agent'}</p>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        evaluation.verdict === 'pass' ? 'bg-lime/15 text-lime' : 'bg-coral/15 text-coral'
                      }`}
                    >
                      {evaluation.score}/100 · {evaluation.verdict}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-steel">{evaluation.reasoning}</p>
                </div>
              );
            })
        )}
      </div>
    </section>
  );
}
