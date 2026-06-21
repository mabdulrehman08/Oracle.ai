import type { Agent, Task } from '../types';
import { Chip, Panel, ScoreRing, StatusDot, statusMeta } from './ui';

export function AgentDetailPanel({ agent, task }: { agent: Agent | null; task: Task | null }) {
  if (!agent) {
    return (
      <Panel eyebrow="Agent Detail" title="Inspect lifecycle">
        <p className="text-sm text-muted">Select an agent in the org chart to inspect its lifecycle, KPI, and HUD score.</p>
      </Panel>
    );
  }

  const meta = statusMeta[agent.status];
  const alive = agent.status === 'working' || agent.status === 'executing';

  return (
    <Panel eyebrow="Agent Detail" title={agent.name} badge={<Chip tone="glow">{agent.role}</Chip>}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <StatusDot status={agent.status} pulse={alive} />
            <span className={meta.tone}>{meta.label}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip>Fireworks</Chip>
            {agent.name.includes('Research') ? <Chip>Exa</Chip> : null}
            {agent.name.includes('Product') ? <Chip>Daytona</Chip> : null}
            {agent.isCore ? <Chip tone="violet">Core operator</Chip> : null}
          </div>
        </div>
        <ScoreRing score={agent.score} size={76} stroke={7} label="HUD" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-glow">KPI</p>
          <p className="mt-2 text-sm leading-6 text-steel">{agent.kpi}</p>
        </div>
        <div className="rounded-xl border border-line bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-glow">Lifecycle</p>
          <p className="mt-2 font-mono text-xs text-steel">born {new Date(agent.createdAt).toLocaleTimeString()}</p>
          {agent.expiresAt ? <p className="font-mono text-xs text-muted">expires {new Date(agent.expiresAt).toLocaleTimeString()}</p> : null}
          {agent.deathReason ? <p className="mt-2 text-sm text-coral">☠ {agent.deathReason}</p> : null}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-cream p-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-glow">Active task</p>
        {task ? (
          <>
            <p className="mt-2 text-sm font-semibold text-white">{task.title}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-steel">{task.output ?? task.input}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No task has been assigned yet.</p>
        )}
      </div>
    </Panel>
  );
}
