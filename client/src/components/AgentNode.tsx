import clsx from 'clsx';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Agent } from '../types';
import { ScoreRing, statusMeta } from './ui';

type AgentNodeData = {
  agent: Agent;
  onSelect: (agentId: string) => void;
};

export function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const { agent, onSelect } = data;
  const meta = statusMeta[agent.status];
  const terminated = agent.status === 'terminated';
  const alive = agent.status === 'working' || agent.status === 'executing' || agent.status === 'spawned';

  return (
    <button
      className={clsx(
        'group relative w-60 overflow-hidden rounded-2xl border bg-white px-4 py-4 text-left shadow-card transition',
        terminated ? 'border-line opacity-55' : 'border-line hover:-translate-y-0.5 hover:border-yc/50 hover:shadow-glow',
        alive && 'animate-pulseSoft',
      )}
      style={!terminated ? { borderColor: `${meta.ring}55` } : undefined}
      onClick={() => onSelect(agent.id)}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-yc/60" />
      {/* status accent bar */}
      {!terminated && <span className="absolute left-0 top-0 h-full w-1" style={{ background: meta.ring }} />}
      <div className="relative flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx('h-2 w-2 rounded-full', meta.dot, alive && 'animate-pulse')} />
            <p className={clsx('truncate text-sm font-semibold text-ink', terminated && 'line-through')}>{agent.name}</p>
          </div>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-yc">{agent.role}</p>
          {agent.isCore && (
            <span className="mt-2 inline-block rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-violet">
              Core
            </span>
          )}
        </div>
        <ScoreRing score={agent.score} size={52} stroke={5} label="HUD" />
      </div>
      <p className="relative mt-3 line-clamp-2 pl-1 text-xs leading-5 text-steel">{agent.kpi}</p>
      <div className="relative mt-3 flex items-center justify-between border-t border-line pl-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
        <span className={meta.tone}>{meta.label}</span>
        {agent.deathReason ? <span className="truncate text-coral/80">{agent.deathReason}</span> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-yc/60" />
    </button>
  );
}
