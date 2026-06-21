import type { Server as SocketServer } from 'socket.io';
import { createAgent, createEvent, createMemoryEntry, getGenome, updateAgent, updateGenome } from '../store.js';
import type { Agent, Company, Evaluation } from '../types.js';

const roleMap: Record<string, { role: string; kpi: string }> = {
  'SEO Agent': {
    role: 'Search Growth Specialist',
    kpi: 'Own organic acquisition experiments and close search-intent gaps.',
  },
  'TikTok Agent': {
    role: 'Short-form Distribution',
    kpi: 'Create channel-native growth loops with low CAC.',
  },
  'Partnership Agent': {
    role: 'Distribution Partnerships',
    kpi: 'Open partner channels that accelerate trust and reach.',
  },
  'Conversion Agent': {
    role: 'Landing Page Optimization',
    kpi: 'Improve visit-to-signup conversion with faster iteration.',
  },
  'Specialist Agent': {
    role: 'Focused Operator',
    kpi: 'Attack one narrow bottleneck with measurable improvement.',
  },
};

const emitTimeline = (io: SocketServer, companyId: string, type: string, message: string, agentId?: string, metadata?: Record<string, unknown>) => {
  const event = createEvent({ companyId, agentId, type, message, metadata });
  io.to(companyId).emit(event.type, event);
  io.to(companyId).emit('timeline_event', event);
  return event;
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const buildGenomePatch = (companyId: string, agent: Agent, evaluation: Evaluation) => {
  const current = getGenome(companyId);
  const successfulAgents =
    evaluation.score >= 80 ? unique([...current.successfulAgents, agent.name]) : current.successfulAgents;
  const failedAgents =
    evaluation.score < 50 ? unique([...current.failedAgents, agent.name]) : current.failedAgents;

  return updateGenome(companyId, {
    successfulAgents,
    failedAgents,
    bestStrategy: evaluation.score >= 80 ? evaluation.reasoning.join(' ') : current.bestStrategy,
    worstStrategy: evaluation.score < 50 ? evaluation.weaknesses.join(' ') || evaluation.reasoning.join(' ') : current.worstStrategy,
    currentMutation:
      evaluation.suggestedAgents.length > 0
        ? `${agent.name} evolved into ${evaluation.suggestedAgents.join(', ')}.`
        : `${agent.name} completed ${evaluation.taskTitle}.`,
    nextRecommendedMutation:
      evaluation.suggestedAgents.length > 0
        ? `Spawn ${evaluation.suggestedAgents.join(', ')} next.`
        : current.nextRecommendedMutation,
  });
};

export async function processEvaluation(input: {
  io: SocketServer;
  company: Company;
  agent: Agent;
  evaluation: Evaluation;
  taskOutput: string;
  spawnParentAgentId?: string;
}) {
  const { io, company, agent, evaluation, taskOutput, spawnParentAgentId } = input;

  emitTimeline(io, company.id, 'hud_evaluation_started', `HUD started evaluating ${agent.name}.`, agent.id, {
    taskTitle: evaluation.taskTitle,
  });
  emitTimeline(
    io,
    company.id,
    'hud_evaluation_completed',
    `${evaluation.provider} scored ${agent.name} ${evaluation.score}/100.`,
    agent.id,
    { evaluation },
  );
  emitTimeline(
    io,
    company.id,
    'hud_decision_generated',
    `HUD decision for ${agent.name}: ${evaluation.decision.toUpperCase()}.`,
    agent.id,
    { decision: evaluation.decision, suggestedAgents: evaluation.suggestedAgents },
  );

  createMemoryEntry({
    companyId: company.id,
    title: `${agent.name} evaluation`,
    source: 'Memory Agent',
    tags: ['hud', agent.name, evaluation.decision],
    content: [
      `Agent Name: ${agent.name}`,
      `Task: ${evaluation.taskTitle}`,
      `Score: ${evaluation.score}`,
      `Decision: ${evaluation.decision}`,
      `Confidence: ${evaluation.confidence}`,
      `Reasoning: ${evaluation.reasoning.join(' | ')}`,
      `Strengths: ${evaluation.strengths.join(' | ') || 'None'}`,
      `Weaknesses: ${evaluation.weaknesses.join(' | ') || 'None'}`,
      `Output: ${taskOutput}`,
      `Failure reason: ${evaluation.pass ? 'N/A' : evaluation.weaknesses.join(' | ') || evaluation.reasoning.join(' | ')}`,
      `Replacement Agents: ${evaluation.suggestedAgents.join(', ') || 'None'}`,
      `Suggested next agents: ${evaluation.suggestedAgents.join(', ') || 'None'}`,
    ].join('\n'),
  });
  emitTimeline(io, company.id, 'agent_strategy_saved', `Memory Agent saved ${agent.name}'s HUD evaluation.`, agent.id, {
    score: evaluation.score,
    decision: evaluation.decision,
  });

  const genome = buildGenomePatch(company.id, agent, evaluation);
  emitTimeline(io, company.id, 'genome_updated', 'Company genome updated after HUD evaluation.', agent.id, { genome });

  if (agent.isCore) {
    updateAgent(agent.id, { score: evaluation.score, status: 'completed' });
    return { spawned: [], genome };
  }

  let deathReason = 'HUD completed lifecycle review.';
  if (evaluation.score >= 80) {
    deathReason = 'Successful strategy preserved in memory.';
  } else if (evaluation.score >= 50) {
    deathReason = 'Acceptable result; follow-up specialist recommended.';
  } else {
    deathReason = 'HUD rejected the operator and requested replacement specialists.';
  }

  updateAgent(agent.id, {
    score: evaluation.score,
    status: 'terminated',
    deathReason,
  });
  emitTimeline(io, company.id, 'agent_terminated', `${agent.name} terminated after HUD review.`, agent.id, {
    deathReason,
  });

  if (evaluation.suggestedAgents.length === 0 || evaluation.score >= 80) {
    return { spawned: [], genome };
  }

  emitTimeline(
    io,
    company.id,
    'agent_replacement_recommended',
    `HUD recommended ${evaluation.suggestedAgents.join(', ')} after ${agent.name}.`,
    agent.id,
    { suggestedAgents: evaluation.suggestedAgents },
  );

  const spawnLimit = evaluation.score >= 50 ? 1 : 3;
  const spawned = evaluation.suggestedAgents.slice(0, spawnLimit).map((name) => {
    const profile = roleMap[name] ?? roleMap['Specialist Agent'];
    return createAgent({
      companyId: company.id,
      parentAgentId: spawnParentAgentId ?? agent.parentAgentId ?? agent.id,
      name,
      role: profile.role,
      kpi: profile.kpi,
      status: 'spawned',
      isCore: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  spawned.forEach((nextAgent) => {
    emitTimeline(io, company.id, 'agent_created', `${nextAgent.name} spawned into the org chart.`, nextAgent.id, { agent: nextAgent });
    emitTimeline(io, company.id, 'agent_replaced', `${agent.name} evolved into ${nextAgent.name}.`, nextAgent.id, {
      previousAgentId: agent.id,
      parentAgentId: spawnParentAgentId ?? agent.id,
    });
  });

  return { spawned, genome };
}
