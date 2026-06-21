import type { Agent, Evaluation } from '../types';
import { Chip, EmptyState, Panel, ScoreRing } from './ui';

export function HudEvaluations({ evaluations, agents }: { evaluations: Evaluation[]; agents: Agent[] }) {
  return (
    <Panel
      eyebrow="HUD · Natural Selection"
      title="Evaluation verdicts"
      badge={<Chip tone="glow">{evaluations.length} graded</Chip>}
    >
      <div className="space-y-3">
        {evaluations.length === 0 ? (
          <EmptyState icon="🎯">Waiting for the first HUD verdict — every agent gets scored 0–100.</EmptyState>
        ) : (
          evaluations
            .slice()
            .reverse()
            .map((evaluation) => {
              const agent = agents.find((item) => item.id === evaluation.agentId);
              return (
                <div
                  key={evaluation.id}
                  className="animate-rise rounded-xl border border-line bg-cream p-4 transition hover:border-yc/40"
                >
                  <div className="flex items-start gap-4">
                    <ScoreRing score={evaluation.score} size={56} stroke={5} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{agent?.name ?? 'Unknown Agent'}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                            evaluation.pass ? 'bg-lime/15 text-lime' : 'bg-coral/15 text-coral'
                          }`}
                        >
                          {evaluation.decision}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-steel">{evaluation.reasoning.join(' ')}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Chip>{evaluation.provider}</Chip>
                    <Chip tone={evaluation.decision === 'terminate' || evaluation.decision === 'replace' ? 'coral' : 'glow'}>
                      {evaluation.decision}
                    </Chip>
                    {evaluation.simulated ? <Chip tone="coral">simulated</Chip> : null}
                  </div>

                  {evaluation.strengths.length > 0 ? (
                    <p className="mt-3 text-xs leading-5 text-steel">
                      <span className="text-lime">Strengths:</span> {evaluation.strengths.join(', ')}
                    </p>
                  ) : null}
                  {evaluation.weaknesses.length > 0 ? (
                    <p className="mt-2 text-xs leading-5 text-steel">
                      <span className="text-coral">Weaknesses:</span> {evaluation.weaknesses.join(', ')}
                    </p>
                  ) : null}
                  {evaluation.suggestedAgents.length > 0 ? (
                    <p className="mt-3 text-xs leading-5 text-steel">
                      <span className="text-violet">Suggested spawns:</span> {evaluation.suggestedAgents.join(', ')}
                    </p>
                  ) : null}
                  {evaluation.trace.length > 0 ? (
                    <p className="mt-2 font-mono text-[11px] leading-5 text-muted">trace › {evaluation.trace.join(' › ')}</p>
                  ) : null}
                </div>
              );
            })
        )}
      </div>
    </Panel>
  );
}
