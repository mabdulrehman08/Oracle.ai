import type { Agent, Task } from '../types';

export function AgentDetailPanel({ agent, task }: { agent: Agent | null; task: Task | null }) {
  if (!agent) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <p className="text-sm text-steel">Select an agent to inspect its lifecycle.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-glow">Agent Detail</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-white">{agent.name}</p>
          <p className="mt-2 text-sm text-steel">{agent.role}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
              Fireworks
            </span>
            {agent.name.includes('Research') ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
                Exa
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-steel">{agent.status}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-glow">KPI</p>
          <p className="mt-3 text-sm leading-6 text-steel">{agent.kpi}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-glow">HUD score</p>
          <p className="mt-3 text-3xl font-semibold text-white">{agent.score ?? '--'}</p>
          {agent.deathReason ? <p className="mt-2 text-sm text-coral">{agent.deathReason}</p> : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-glow">Active task</p>
        {task ? (
          <>
            <p className="mt-3 text-sm font-semibold text-white">{task.title}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-steel">{task.output ?? task.input}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-steel">No task has been assigned yet.</p>
        )}
      </div>
    </section>
  );
}
