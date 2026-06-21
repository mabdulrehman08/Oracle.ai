import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType, MiniMap, Position, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import type { Agent } from '../types';
import { AgentNode } from './AgentNode';

const nodeTypes = { agent: AgentNode };

export function OrgChart({ agents, onSelectAgent }: { agents: Agent[]; onSelectAgent: (agentId: string) => void }) {
  const { nodes, edges } = useMemo(() => {
    const levelMap = new Map<string, number>();

    const assignLevel = (agent: Agent): number => {
      if (!agent.parentAgentId) {
        levelMap.set(agent.id, 0);
        return 0;
      }
      if (levelMap.has(agent.id)) return levelMap.get(agent.id)!;
      const parent = agents.find((item) => item.id === agent.parentAgentId);
      const level = parent ? assignLevel(parent) + 1 : 1;
      levelMap.set(agent.id, level);
      return level;
    };

    agents.forEach(assignLevel);

    const grouped = new Map<number, Agent[]>();
    agents.forEach((agent) => {
      const level = levelMap.get(agent.id) ?? 0;
      grouped.set(level, [...(grouped.get(level) ?? []), agent]);
    });

    const flowNodes: Node[] = [];
    [...grouped.entries()].forEach(([level, items]) => {
      items.forEach((agent, index) => {
        flowNodes.push({
          id: agent.id,
          type: 'agent',
          position: {
            x: index * 260 + (level % 2 === 0 ? 60 : 0),
            y: level * 180 + 40,
          },
          data: {
            agent,
            onSelect: onSelectAgent,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    const flowEdges: Edge[] = agents
      .filter((agent) => agent.parentAgentId)
      .map((agent) => {
        const dead = agent.status === 'terminated';
        const color = dead ? '#c9c3b8' : '#ff6600';
        return {
          id: `${agent.parentAgentId}-${agent.id}`,
          source: agent.parentAgentId!,
          target: agent.id,
          type: 'smoothstep',
          animated: agent.status === 'working' || agent.status === 'spawned' || agent.status === 'executing',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
          },
          style: {
            stroke: color,
            strokeWidth: 1.5,
            opacity: dead ? 0.2 : 0.7,
          },
        };
      });

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [agents, onSelectAgent]);

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_0%,rgba(255,102,0,0.05),transparent_55%),#ffffff]">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.35} maxZoom={1.4} proOptions={{ hideAttribution: true }}>
        <Background color="#e7e2d8" gap={26} size={1.4} />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(250,248,244,0.7)"
          style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eae6df' }}
          nodeColor={(node) => (node.data?.agent?.status === 'terminated' ? '#c9c3b8' : '#ff6600')}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
