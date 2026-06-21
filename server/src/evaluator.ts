import { evaluateAgentTask } from './services/sponsors/hudClient.js';
import type { Agent, Company, CompanyMemoryEntry, Evaluation } from './types.js';

export async function evaluateTaskOutput(input: {
  company: Company;
  agent: Agent;
  taskTitle: string;
  taskOutput: string;
  memory: CompanyMemoryEntry[];
}): Promise<Omit<Evaluation, 'id' | 'createdAt'>> {
  const result = await evaluateAgentTask({
    company: input.company,
    agent: input.agent,
    task: {
      title: input.taskTitle,
      role: input.agent.role,
      goal: input.agent.kpi,
    },
    output: input.taskOutput,
    memory: input.memory,
  });

  return {
    companyId: input.company.id,
    agentId: input.agent.id,
    agentName: input.agent.name,
    taskTitle: input.taskTitle,
    score: result.score,
    decision: result.decision,
    confidence: result.confidence,
    reasoning: result.reasoning,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    suggestedAgents: result.suggestedAgents,
    pass: result.pass,
    verdict: result.verdict,
    provider: result.provider,
    simulated: result.simulated,
    trace: result.trace,
  };
}
