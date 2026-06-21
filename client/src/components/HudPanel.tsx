import type { Agent, Evaluation } from '../types';
import { Chip, EmptyState, Panel, ScoreRing } from './ui';

export function HudPanel({ evaluations, agents }: { evaluations: Evaluation[]; agents: Agent[] }) {
  if (evaluations.length === 0) {
    return (
      <Panel eyebrow="HUD" title="Natural selection dashboard">
        <EmptyState icon="HUD">Waiting for the first HUD evaluation.</EmptyState>
      </Panel>
    );
  }

  const sorted = evaluations.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = Math.round(sorted.reduce((sum, evaluation) => sum + evaluation.score, 0) / sorted.length);
  const best = sorted.reduce((top, evaluation) => (evaluation.score > top.score ? evaluation : top), sorted[0]);
  const worst = sorted.reduce((low, evaluation) => (evaluation.score < low.score ? evaluation : low), sorted[0]);
  const overall = Math.round(sorted.slice(0, 5).reduce((sum, evaluation) => sum + evaluation.score, 0) / Math.min(sorted.length, 5));

  const labelFor = (evaluation: Evaluation) => agents.find((agent) => agent.id === evaluation.agentId)?.name ?? evaluation.agentName;

  return (
    <Panel eyebrow="HUD" title="Natural selection dashboard" badge={<Chip tone="glow">{sorted.length} evaluations</Chip>}>
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Overall Company HUD Score</p>
            <div className="mt-3 flex items-center gap-4">
              <ScoreRing score={overall} size={74} stroke={6} label="HUD" />
              <div className="text-sm leading-6 text-steel">
                <p>Average score: <span className="font-semibold text-ink">{average}</span></p>
                <p>Best agent: <span className="font-semibold text-ink">{labelFor(best)}</span></p>
                <p>Worst agent: <span className="font-semibold text-ink">{labelFor(worst)}</span></p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Latest mutation</p>
            <p className="mt-2 text-sm leading-6 text-steel">
              {worst.suggestedAgents.length > 0
                ? `${labelFor(worst)} triggered ${worst.suggestedAgents.join(', ')}.`
                : `${labelFor(best)} completed without replacement.`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sorted.slice(0, 5).map((evaluation) => (
            <article key={evaluation.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{labelFor(evaluation)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{evaluation.taskTitle}</p>
                </div>
                <ScoreRing score={evaluation.score} size={58} stroke={5} label="HUD" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone={evaluation.pass ? 'lime' : 'coral'}>{evaluation.decision}</Chip>
                <Chip>{Math.round(evaluation.confidence * 100)}% confidence</Chip>
                {evaluation.simulated ? <Chip tone="amber">simulation</Chip> : <Chip tone="glow">connected</Chip>}
              </div>
              <p className="mt-3 text-sm leading-6 text-steel">{evaluation.reasoning.join(' ')}</p>
              {evaluation.strengths.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-steel">
                  <span className="text-lime">Strengths:</span> {evaluation.strengths.join(', ')}
                </p>
              ) : null}
              {evaluation.weaknesses.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-steel">
                  <span className="text-coral">Weaknesses:</span> {evaluation.weaknesses.join(', ')}
                </p>
              ) : null}
              {evaluation.suggestedAgents.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-steel">
                  <span className="text-violet">Suggested replacements:</span> {evaluation.suggestedAgents.join(', ')}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}
