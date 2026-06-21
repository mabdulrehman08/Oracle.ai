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
      .map((agent) => ({
        id: `${agent.parentAgentId}-${agent.id}`,
        source: agent.parentAgentId!,
        target: agent.id,
        animated: agent.status === 'working' || agent.status === 'spawned',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6ee7f9',
        },
        style: {
          stroke: '#6ee7f9',
          opacity: agent.status === 'terminated' ? 0.25 : 0.8,
        },
      }));

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [agents, onSelectAgent]);

  return (
    <div className="h-[520px] rounded-[24px] bg-[#050814]">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.35} maxZoom={1.4}>
        <Background color="#243248" gap={24} />
        <MiniMap pannable zoomable style={{ background: '#0f1726' }} nodeColor="#6ee7f9" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
