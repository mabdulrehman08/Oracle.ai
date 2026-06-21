import clsx from 'clsx';
import type { NodeProps } from 'reactflow';
import type { Agent } from '../types';

type AgentNodeData = {
  agent: Agent;
  onSelect: (agentId: string) => void;
};

export function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const { agent, onSelect } = data;

  return (
    <button
      className={clsx(
        'w-56 rounded-3xl border px-4 py-4 text-left shadow-glow transition',
        agent.status === 'terminated'
          ? 'border-white/10 bg-white/5 opacity-40'
          : 'border-glow/30 bg-[#0d1525]/90 hover:border-glow/70',
        agent.status === 'working' && 'animate-pulseSoft',
      )}
      onClick={() => onSelect(agent.id)}
    >
      <div className="flex items-center justify-between">
        <p className={clsx('text-sm font-semibold text-white', agent.status === 'terminated' && 'line-through')}>{agent.name}</p>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
          {agent.status}
        </span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-glow">{agent.role}</p>
      <p className="mt-3 text-xs leading-5 text-steel">{agent.kpi}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-steel">
        <span>Score</span>
        <span className="font-semibold text-white">{agent.score ?? '--'}</span>
      </div>
    </button>
  );
}
