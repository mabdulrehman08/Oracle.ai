import type { Server as SocketServer } from 'socket.io';
import { evaluateTaskOutput } from './evaluator.js';
import { processEvaluation } from './services/evolutionEngine.js';
import { runDaytonaTask } from './services/sponsors/daytonaClient.js';
import { researchCompetitors } from './services/sponsors/exaClient.js';
import { decideNextAgents, generateReasoning } from './services/sponsors/fireworksClient.js';
import { runParallelWork } from './services/sponsors/modalClient.js';
import { searchContractors } from './services/sponsors/sixtyFourClient.js';
import {
  createAgent,
  createApproval,
  createBudgetLedgerEntry,
  createEvaluation,
  createEvent,
  createHiringCandidate,
  createMemoryEntry,
  createSandboxRun,
  createTask,
  getAgent,
  getApproval,
  getApprovalsByCompany,
  getCompany,
  getCompanySnapshot,
  getEvaluationsByCompany,
  getMemoryByCompany,
  updateAgent,
  updateApproval,
  updateCompany,
  updateSandboxRun,
  updateTask,
} from './store.js';
import type {
  Agent,
  ApprovalType,
  Company,
  CompanyMode,
  EventRecord,
  HiringCandidate,
  SandboxRun,
} from './types.js';

const DAY = 24 * 60 * 60 * 1000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fullDemoTimers = new Map<string, NodeJS.Timeout>();

const emitTimeline = (io: SocketServer, companyId: string, event: EventRecord) => {
  io.to(companyId).emit(event.type, event);
  io.to(companyId).emit('timeline_event', event);
};

const logEvent = (
  io: SocketServer,
  companyId: string,
  type: string,
  message: string,
  agentId?: string,
  metadata?: Record<string, unknown>,
) => {
  const event = createEvent({ companyId, agentId, type, message, metadata });
  emitTimeline(io, companyId, event);
  return event;
};

const isCoreAgent = (name: string) => ['CEO Agent', 'Finance Agent', 'Memory Agent'].includes(name);

const createAgentRecord = (
  io: SocketServer,
  companyId: string,
  parentAgentId: string | undefined,
  name: string,
  role: string,
  kpi: string,
) => {
  const agent = createAgent({
    companyId,
    parentAgentId,
    name,
    role,
    status: 'spawned',
    kpi,
    isCore: isCoreAgent(name),
    expiresAt: isCoreAgent(name) ? undefined : new Date(Date.now() + DAY).toISOString(),
  });
  logEvent(io, companyId, 'agent_created', `${name} spawned into the org chart.`, agent.id, { agent });
  logEvent(io, companyId, 'pitch_signal', 'Agent Born', agent.id, { label: 'Agent Born', agentName: name });
  return agent;
};

export const spawnAgent = createAgentRecord;

const getCompanyAgents = (companyId: string) => getCompanySnapshot(companyId)?.agents ?? [];

const findAgentByName = (companyId: string, name: string) => getCompanyAgents(companyId).find((agent) => agent.name === name);

const updatePitchSignal = (io: SocketServer, companyId: string, label: string, agentId?: string, metadata?: Record<string, unknown>) => {
  logEvent(io, companyId, 'pitch_signal', label, agentId, { label, ...metadata });
};

const createCoreMemory = (companyId: string, title: string, content: string, source = 'Memory Agent', tags?: string[]) =>
  createMemoryEntry({ companyId, title, content, source, tags });

const getSpawnBiasFromMemory = (companyId: string) => {
  const memory = getMemoryByCompany(companyId)
    .slice()
    .reverse();

  const failedSeo = memory.some((entry) => entry.title.includes('SEO Agent evaluation') && entry.content.toLowerCase().includes('fail'));
  if (failedSeo) {
    return ['TikTok Agent', 'Partnership Agent', 'Conversion Agent'];
  }

  const failedMarketing = memory.some(
    (entry) => entry.title.includes('Marketing Agent evaluation') && entry.content.toLowerCase().includes('replace'),
  );
  if (failedMarketing) {
    return ['TikTok Agent', 'Partnership Agent', 'Conversion Agent'];
  }

  return [];
};

const summarizeGenome = (snapshot?: ReturnType<typeof getCompanySnapshot>) => {
  const genome = snapshot?.genome;
  if (!genome) return 'Genome pending.';
  const successful = genome.successfulAgents.join(', ') || 'None yet';
  const failed = genome.failedAgents.join(', ') || 'None yet';
  return `Successful: ${successful}\nFailed: ${failed}\nCurrent mutation: ${genome.currentMutation}\nNext mutation: ${genome.nextRecommendedMutation}`;
};

const markAgentLifecycle = async (
  io: SocketServer,
  companyId: string,
  agent: Agent,
  taskTitle: string,
  taskOutput: string,
) => {
  const company = getCompany(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  const memory = getMemoryByCompany(companyId);
  logEvent(io, companyId, 'hud_evaluation_started', `HUD evaluating ${agent.name} after ${taskTitle}.`, agent.id, { taskTitle });

  const evaluationInput = await evaluateTaskOutput({
    company,
    agent,
    taskTitle,
    taskOutput,
    memory,
  });
  const evaluation = createEvaluation(evaluationInput);
  const reasoning = await generateReasoning(
    `Explain ${agent.name}'s result and what the CEO should do next. Task: ${taskTitle}. Output summary: ${taskOutput.slice(0, 400)}`,
  );

  const lifecycle = await processEvaluation({
    io,
    company,
    agent,
    evaluation,
    taskOutput: `${taskOutput}\nCEO reasoning: ${reasoning.text}`,
    spawnParentAgentId: findAgentByName(companyId, 'CEO Agent')?.id ?? agent.parentAgentId ?? agent.id,
  });
  logEvent(
    io,
    companyId,
    'hud_evaluated',
    `${evaluation.provider} scored ${agent.name} ${evaluation.score}/100: ${evaluation.reasoning.join(' ')}`,
    agent.id,
    { ...evaluation, ceoReasoning: reasoning.text, spawnedAgents: lifecycle.spawned },
  );
  updatePitchSignal(io, companyId, 'HUD Evaluating', agent.id, { score: evaluation.score, decision: evaluation.decision });

  return evaluation;
};

const evolveFromSuggestions = (io: SocketServer, companyId: string, parentAgentId: string, suggestions: string[]) => {
  const memoryBias = getSpawnBiasFromMemory(companyId);
  const finalSuggestions = memoryBias.length > 0 ? memoryBias : suggestions;
  if (!finalSuggestions.length) return [];

  const created = finalSuggestions.slice(0, 3).map((name) => {
    const roleMap: Record<string, string> = {
      'SEO Agent': 'Search Growth Specialist',
      'TikTok Agent': 'Short-form Distribution',
      'Partnership Agent': 'Distribution Partnerships',
      'Conversion Agent': 'Landing Page Optimization',
      'Referral Agent': 'Referral Engine',
      'Creator Outreach Agent': 'Creator Partnerships',
      'Specialist Agent': 'Focused Operator',
    };
    return createAgentRecord(
      io,
      companyId,
      parentAgentId,
      name,
      roleMap[name] ?? 'Specialist Operator',
      `Improve on the previous ${name.replace(' Agent', '').toLowerCase()} outcome.`,
    );
  });

  logEvent(io, companyId, 'agents_spawned', `CEO spawned ${created.map((agent) => agent.name).join(', ')}.`, parentAgentId, {
    agents: created,
  });
  updatePitchSignal(io, companyId, 'New Agents Spawned', parentAgentId, { agents: created.map((agent) => agent.name) });
  return created;
};

const evolveFromFailure = async (
  io: SocketServer,
  companyId: string,
  parentAgentId: string,
  failedAgent: Agent,
  hudScore: number,
  fallbackSuggestions: string[],
) => {
  const company = getCompany(companyId);
  if (!company) {
    return evolveFromSuggestions(io, companyId, parentAgentId, fallbackSuggestions);
  }

  const memory = getMemoryByCompany(companyId);
  const plan = await decideNextAgents({
    company,
    failedAgent,
    hudScore,
    memory,
  });

  createCoreMemory(
    companyId,
    `${failedAgent.name} replacement plan`,
    `${plan.reasoning}\nNext agents: ${plan.agents.map((agent) => agent.name).join(', ')}`,
    'CEO Agent',
    ['replacement-plan', failedAgent.name],
  );

  const memoryBias = getSpawnBiasFromMemory(companyId);
  const plannedNames =
    memoryBias.length > 0
      ? plan.agents.map((agent) => agent.name).filter((name) => memoryBias.includes(name))
      : plan.agents.map((agent) => agent.name);
  const chosen = plannedNames.length > 0 ? plannedNames : fallbackSuggestions;
  const currentAgents = getCompanyAgents(companyId).map((agent) => agent.name);
  const missing = chosen.filter((name) => !currentAgents.includes(name));
  return evolveFromSuggestions(io, companyId, parentAgentId, missing);
};

export const startCompanyFlow = (io: SocketServer, idea: string, budget: number, mode: CompanyMode, company: Company) => {
  logEvent(io, company.id, 'company_created', `Company created for ${idea}.`, undefined, { company, budget, mode });
};

export const createApprovalRequest = async (
  io: SocketServer,
  companyId: string,
  agentId: string,
  type: ApprovalType,
  title: string,
  amount: number,
  reason: string,
) => {
  const financeAgent = findAgentByName(companyId, 'Finance Agent');
  const financeSummary = await generateReasoning(
    `Finance review for ${title}: approve if the spend is low and the upside is strong.`,
  );
  const recommendation =
    amount <= 300
      ? {
          financeRecommendation: 'approve' as const,
          financeReasoning: `Approve because budget impact is low and growth potential is high. ${financeSummary.simulated ? '(Fireworks Simulation)' : ''}`.trim(),
        }
      : {
          financeRecommendation: 'needs_review' as const,
          financeReasoning: `Needs review because the spend size could distort runway. ${financeSummary.simulated ? '(Fireworks Simulation)' : ''}`.trim(),
        };

  const approval = createApproval({
    companyId,
    agentId,
    type,
    title,
    amount,
    reason,
    ...recommendation,
  });

  createCoreMemory(companyId, `${title} approval`, `${reason}\nRecommendation: ${recommendation.financeRecommendation}`, 'Finance Agent', [
    'approval',
    type,
  ]);
  logEvent(io, companyId, 'approval_requested', `${title} requested for $${amount}.`, agentId, { approval });
  logEvent(
    io,
    companyId,
    'finance_reviewed',
    `Finance Agent recommendation: ${recommendation.financeRecommendation}. ${recommendation.financeReasoning}`,
    agentId,
    { approvalId: approval.id, ...recommendation, provider: financeSummary.provider },
  );
  if (financeAgent) {
    await markAgentLifecycle(
      io,
      companyId,
      financeAgent,
      `Review approval: ${title}`,
      `${reason}\nRecommendation: ${recommendation.financeRecommendation}\nReasoning: ${recommendation.financeReasoning}`,
    );
  }
  return approval;
};

export const approveRequest = (io: SocketServer, approvalId: string) => {
  const approval = getApproval(approvalId);
  if (!approval) throw new Error('Approval not found');

  const updated = updateApproval(approvalId, { status: 'approved', resolvedAt: new Date().toISOString() });
  if (!updated) throw new Error('Approval could not be updated');
  createBudgetLedgerEntry({
    companyId: approval.companyId,
    agentId: approval.agentId,
    approvalId: approval.id,
    type: 'approved_spend',
    amount: approval.amount,
    description: approval.title,
  });
  createCoreMemory(approval.companyId, `${approval.title} approved`, `Approved for $${approval.amount}.`, 'Finance Agent', ['approval']);
  logEvent(io, approval.companyId, 'approval_approved', `${approval.title} approved for $${approval.amount}.`, approval.agentId, {
    approval: updated,
  });
  return updated;
};

export const rejectRequest = (io: SocketServer, approvalId: string) => {
  const approval = getApproval(approvalId);
  if (!approval) throw new Error('Approval not found');

  const updated = updateApproval(approvalId, { status: 'rejected', resolvedAt: new Date().toISOString() });
  if (!updated) throw new Error('Approval could not be updated');
  createCoreMemory(approval.companyId, `${approval.title} rejected`, approval.reason, 'Finance Agent', ['approval']);
  logEvent(io, approval.companyId, 'approval_rejected', `${approval.title} was rejected.`, approval.agentId, {
    approval: updated,
  });
  return updated;
};

export const createHiringCandidates = async (io: SocketServer, companyId: string, agentId: string): Promise<HiringCandidate[]> => {
  const result = await searchContractors('AI translator landing page polish');
  const candidates = result.candidates.map((candidate) => createHiringCandidate({ companyId, agentId, ...candidate }));
  createCoreMemory(companyId, 'Hiring candidates', candidates.map((candidate) => `${candidate.name} - ${candidate.reason}`).join('\n'), 'Hiring Agent', [
    'hiring',
  ]);
  logEvent(io, companyId, 'hiring_candidates_found', 'Hiring Agent found 3 React contractor candidates.', agentId, {
    candidates,
    provider: result.provider,
    simulated: result.simulated,
  });
  const hiringAgent = getAgent(agentId);
  if (hiringAgent) {
    await markAgentLifecycle(
      io,
      companyId,
      hiringAgent,
      'Find contractor candidates',
      candidates.map((candidate) => `${candidate.name} - ${candidate.role} - ${candidate.reason}`).join('\n'),
    );
  }
  return candidates;
};

export const runSandboxTask = async (
  io: SocketServer,
  companyId: string,
  agentId: string,
  taskTitle: string,
  filesToCreate: string[],
) => {
  const run = createSandboxRun({
    companyId,
    agentId,
    taskTitle,
    status: 'running',
    logs: ['Booting sandbox...', 'Installing project context...', 'Writing landing page variants...'],
    filesChanged: [],
  });

  logEvent(io, companyId, 'sandbox_started', `Product Agent launched sandbox task: ${taskTitle}.`, agentId, { run });
  const result = await runDaytonaTask(taskTitle, filesToCreate);
  const completed = updateSandboxRun(run.id, {
    status: result.status,
    previewUrl: result.previewUrl,
    filesChanged: result.filesChanged,
    logs: result.logs,
    completedAt: new Date().toISOString(),
  });

  createCoreMemory(companyId, 'Sandbox run', result.logs.join('\n'), 'Product Agent', ['sandbox']);
  logEvent(io, companyId, 'sandbox_completed', 'Sandbox run completed with landing and pricing page updates.', agentId, {
    run: completed,
    provider: result.provider,
    simulated: result.simulated,
  });
  const productAgent = getAgent(agentId);
  if (productAgent) {
    await markAgentLifecycle(io, companyId, productAgent, taskTitle, result.logs.join('\n'));
  }
  return completed;
};

export const runDemoSequence = async (io: SocketServer, companyId: string) => {
  const company = getCompany(companyId);
  if (!company) throw new Error('Company not found');

  updateCompany(companyId, {
    status: 'evolving',
    idea: 'Build a profitable AI Translator startup',
    budget: 5000,
    mode: 'profit',
  });

  logEvent(io, companyId, 'company_created', 'Demo scenario initialized: AI Translator startup in Profit Mode.', undefined, {
    idea: 'Build a profitable AI Translator startup',
    budget: 5000,
    mode: 'profit',
  });

  await wait(400);
  const ceo = createAgentRecord(io, companyId, undefined, 'CEO Agent', 'Chief Evolution Officer', 'Spawn specialists and maximize company fitness');
  const finance = createAgentRecord(io, companyId, ceo.id, 'Finance Agent', 'Capital Allocation', 'Protect runway and approve spend');
  const memory = createAgentRecord(io, companyId, ceo.id, 'Memory Agent', 'Organizational Memory', 'Store learning and influence mutations');
  const research = createAgentRecord(io, companyId, ceo.id, 'Research Agent', 'Competitive Intelligence', 'Map rivals and pricing');
  const marketing = createAgentRecord(io, companyId, ceo.id, 'Marketing Agent', 'Growth Generalist', 'Find scalable acquisition channels');
  logEvent(io, companyId, 'agents_spawned', 'CEO created the first operating team.', ceo.id, {
    agents: [ceo, finance, memory, research, marketing],
  });

  updateAgent(research.id, { status: 'working' });
  updatePitchSignal(io, companyId, 'Agent Working', research.id, { agentName: research.name });
  const researchTask = createTask({
    agentId: research.id,
    title: 'Find competitors and pricing.',
    status: 'running',
    input: 'Find competitors and pricing.',
  });
  await wait(800);
  const researchResult = await researchCompetitors(company.idea);
  const researchOutput = researchResult.findings.join('\n');
  updateTask(researchTask.id, { status: 'completed', output: researchOutput, completedAt: new Date().toISOString() });
  createCoreMemory(companyId, 'Research findings', `${researchOutput}\nTrace: ${researchResult.trace.join(' | ')}`, 'Research Agent', ['research']);
  logEvent(io, companyId, 'task_completed', 'Research Agent returned competitor analysis and pricing intel.', research.id, {
    output: researchOutput,
    provider: researchResult.provider,
    simulated: researchResult.simulated,
  });

  const researchEvaluation = await markAgentLifecycle(io, companyId, research, researchTask.title, researchOutput);
  evolveFromSuggestions(io, companyId, ceo.id, researchEvaluation.suggestedAgents.slice(0, 2));

  await wait(600);
  const marketingEval = await markAgentLifecycle(
    io,
    companyId,
    marketing,
    'Draft growth strategy',
    'Generic channel strategy. Needs specialized growth agents.',
  );
  await evolveFromFailure(io, companyId, ceo.id, marketing, marketingEval.score, marketingEval.suggestedAgents);

  const updatedCompany = updateCompany(companyId, {
    profit: 1200,
    growthScore: 27,
    status: 'evolving',
  });
  logEvent(io, companyId, 'metrics_updated', 'Company metrics updated after specialization.', undefined, {
    company: updatedCompany,
  });
};

export const runPhaseTwoDemo = async (io: SocketServer, companyId: string) => {
  const company = getCompany(companyId);
  if (!company) throw new Error('Company not found');

  updateCompany(companyId, { status: 'evolving' });
  logEvent(io, companyId, 'parallel_run_started', 'Autonomous Company Mode launched. Multiple specialist agents are running in parallel.', undefined, {
    mode: 'phase2',
  });

  const ceo = findAgentByName(companyId, 'CEO Agent') ?? createAgentRecord(io, companyId, undefined, 'CEO Agent', 'Chief Evolution Officer', 'Review cross-functional outcomes');
  const finance = findAgentByName(companyId, 'Finance Agent') ?? createAgentRecord(io, companyId, ceo.id, 'Finance Agent', 'Capital Allocation', 'Review spend and protect runway');
  const memory = findAgentByName(companyId, 'Memory Agent') ?? createAgentRecord(io, companyId, ceo.id, 'Memory Agent', 'Organizational Memory', 'Preserve failed attempts and winning strategies');
  const marketing = createAgentRecord(io, companyId, ceo.id, 'Marketing Agent', 'Paid Acquisition', 'Request and deploy ad budget effectively');
  const hiring = createAgentRecord(io, companyId, ceo.id, 'Hiring Agent', 'Talent Scout', 'Find targeted human support when leverage is high');
  const product = createAgentRecord(io, companyId, ceo.id, 'Product Agent', 'Sandbox Builder', 'Ship landing page and pricing improvements');

  logEvent(io, companyId, 'agents_spawned', 'CEO spawned Marketing, Finance, Hiring, Product, and Memory agents for Autonomous Company Mode.', ceo.id, {
    agents: [marketing, finance, hiring, product, memory],
  });

  updateAgent(marketing.id, { status: 'working' });
  updateAgent(finance.id, { status: 'working' });
  updateAgent(hiring.id, { status: 'working' });
  updateAgent(product.id, { status: 'working' });

  const approval = await createApprovalRequest(
    io,
    companyId,
    marketing.id,
    'ad_budget',
    'TikTok Ad Budget Request',
    300,
    'Need a focused ad test to validate creator-led translator acquisition.',
  );

  void runParallelWork<unknown>('Phase 2 support jobs', [
    () => createHiringCandidates(io, companyId, hiring.id),
    () => runSandboxTask(io, companyId, product.id, 'Build launch page polish bundle', [
      'app/landing/page.tsx',
      'app/pricing/page.tsx',
      'components/signup-cta.tsx',
    ]),
  ]);

  return { approvalId: approval.id, ceoId: ceo.id };
};

export const continuePhaseTwoAfterApproval = async (io: SocketServer, approvalId: string) => {
  const approval = getApproval(approvalId);
  if (!approval) throw new Error('Approval not found');

  const agent = getAgent(approval.agentId);
  if (!agent) throw new Error('Agent not found');

  updateAgent(approval.agentId, { status: 'executing' });
  updatePitchSignal(io, approval.companyId, 'Agent Working', approval.agentId, { agentName: agent.name });
  logEvent(io, approval.companyId, 'task_started', 'Marketing Agent began executing the approved TikTok ad campaign.', approval.agentId);

  await wait(700);
  const marketingOutput =
    'Executed a focused TikTok campaign. CTR improved, but conversion path still needs a partnership and conversion specialist layer.';
  createCoreMemory(approval.companyId, 'Campaign execution', marketingOutput, 'Marketing Agent', ['marketing']);
  const evaluation = await markAgentLifecycle(io, approval.companyId, agent, 'Run campaign simulation', marketingOutput);
  await evolveFromFailure(
    io,
    approval.companyId,
    findAgentByName(approval.companyId, 'CEO Agent')?.id ?? agent.id,
    agent,
    evaluation.score,
    evaluation.suggestedAgents,
  );

  return approval;
};

export const completePhaseTwoRun = async (io: SocketServer, companyId: string, ceoId: string) => {
  const snapshot = getCompanySnapshot(companyId);
  createCoreMemory(
    companyId,
    'CEO review',
    'Budget approved, contractor candidates sourced, and sandbox landing assets generated. Next step: specialize growth execution.',
    'CEO Agent',
    ['ceo'],
  );
  logEvent(io, companyId, 'agent_completed', 'CEO Agent reviewed all Phase 2 outcomes.', ceoId, {
    approvals: snapshot?.approvals,
    sandboxRuns: snapshot?.sandboxRuns,
    hiringCandidates: snapshot?.hiringCandidates,
  });
  logEvent(io, companyId, 'parallel_run_completed', 'Autonomous Company Mode completed its parallel execution cycle.', ceoId);
};

const autoApproveIfPending = (io: SocketServer, companyId: string, approvalId: string) => {
  const timer = setTimeout(async () => {
    const current = getApproval(approvalId);
    if (!current || current.status !== 'pending') return;
    approveRequest(io, approvalId);
    await continuePhaseTwoAfterApproval(io, approvalId);
    const ceo = findAgentByName(companyId, 'CEO Agent');
    if (ceo) {
      await completePhaseTwoRun(io, companyId, ceo.id);
      await finalizeFullEvolution(io, companyId);
    }
  }, 5000);
  fullDemoTimers.set(companyId, timer);
};

export const runFullEvolutionDemo = async (io: SocketServer, companyId: string) => {
  const company = getCompany(companyId);
  if (!company) throw new Error('Company not found');

  const existingTimer = fullDemoTimers.get(companyId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  updateCompany(companyId, {
    status: 'evolving',
    idea: 'Build a profitable AI Translator startup',
    budget: 5000,
    mode: 'profit',
  });
  logEvent(io, companyId, 'parallel_run_started', 'Run Full Evolution Demo started.', undefined, { demo: 'full' });

  const ceo = findAgentByName(companyId, 'CEO Agent') ?? createAgentRecord(io, companyId, undefined, 'CEO Agent', 'Chief Evolution Officer', 'Direct company mutation');
  const finance = findAgentByName(companyId, 'Finance Agent') ?? createAgentRecord(io, companyId, ceo.id, 'Finance Agent', 'Capital Allocation', 'Protect runway');
  const memory = findAgentByName(companyId, 'Memory Agent') ?? createAgentRecord(io, companyId, ceo.id, 'Memory Agent', 'Organizational Memory', 'Store every outcome');
  const research = createAgentRecord(io, companyId, ceo.id, 'Research Agent', 'Exa Research', 'Find competitors and pricing');
  const marketing = createAgentRecord(io, companyId, ceo.id, 'Marketing Agent', 'Growth Generalist', 'Run paid acquisition experiments');
  const hiring = createAgentRecord(io, companyId, ceo.id, 'Hiring Agent', 'Talent Scout', 'Find React contractor help');
  const product = createAgentRecord(io, companyId, ceo.id, 'Product Agent', 'Sandbox Builder', 'Ship landing page and pricing updates');

  logEvent(io, companyId, 'agents_spawned', 'CEO created core and specialist agents.', ceo.id, {
    agents: [ceo, finance, memory, research, marketing, hiring, product],
  });

  const ceoPlan = await generateReasoning(
    `Plan the initial operating sequence for ${company.idea}. Prioritize research, evaluation, budget approvals, hiring, and product execution.`,
  );
  createCoreMemory(companyId, 'CEO launch plan', ceoPlan.text, 'CEO Agent', ['planning']);
  logEvent(io, companyId, 'task_started', 'CEO Agent used Fireworks-compatible reasoning to plan the evolution cycle.', ceo.id, {
    provider: ceoPlan.provider,
    simulated: ceoPlan.simulated,
    trace: ceoPlan.trace,
  });
  await markAgentLifecycle(io, companyId, ceo, 'Plan the initial evolution cycle', ceoPlan.text);

  updateAgent(research.id, { status: 'working' });
  updatePitchSignal(io, companyId, 'Agent Working', research.id, { agentName: research.name });
  const researchTask = createTask({
    agentId: research.id,
    title: 'Research competitors with Exa',
    status: 'running',
    input: company.idea,
  });
  await wait(600);
  const exa = await researchCompetitors(company.idea);
  const researchOutput = exa.findings.join('\n');
  updateTask(researchTask.id, { status: 'completed', output: researchOutput, completedAt: new Date().toISOString() });
  logEvent(io, companyId, 'task_completed', 'Research Agent used Exa to map competitors.', research.id, {
    output: researchOutput,
    provider: exa.provider,
    simulated: exa.simulated,
  });
  const researchEvaluation = await markAgentLifecycle(io, companyId, research, researchTask.title, researchOutput);

  const budgetApproval = await createApprovalRequest(
    io,
    companyId,
    marketing.id,
    'ad_budget',
    'TikTok Ad Budget Request',
    300,
    'Need a focused creator acquisition test for the AI Translator launch.',
  );
  autoApproveIfPending(io, companyId, budgetApproval.id);

  void runParallelWork<unknown>('Full evolution support jobs', [
    async () => {
      await wait(700);
      return createHiringCandidates(io, companyId, hiring.id);
    },
    async () => {
      await wait(900);
      return runSandboxTask(io, companyId, product.id, 'Build launch pages in Daytona', [
        'app/landing/page.tsx',
        'app/pricing/page.tsx',
        'components/signup-cta.tsx',
      ]);
    },
  ]);

  const summary = await generateReasoning('CEO review: companies should evolve like software.');
  createCoreMemory(companyId, 'CEO principle', summary.text, 'CEO Agent', ['strategy']);

  return { approvalId: budgetApproval.id, companyId };
};

export const finalizeFullEvolution = async (io: SocketServer, companyId: string) => {
  const ceo = findAgentByName(companyId, 'CEO Agent');
  if (!ceo) return;

  const memory = getMemoryByCompany(companyId);
  const approvals = getApprovalsByCompany(companyId);
  const evaluations = getEvaluationsByCompany(companyId);

  createCoreMemory(
    companyId,
    'Company evolved',
    `evoler.ai completed a full evolution cycle.\nApprovals: ${approvals.length}\nEvaluations: ${evaluations.length}\nMemory entries: ${memory.length}`,
    'Memory Agent',
    ['evolved'],
  );

  updateCompany(companyId, {
    status: 'evolved',
    evolvedAt: new Date().toISOString(),
    profit: 2100,
    growthScore: 63,
  });
  logEvent(io, companyId, 'company_evolved', 'Company Evolved', ceo.id, {
    genome: getCompanySnapshot(companyId)?.genome,
  });
  updatePitchSignal(io, companyId, 'Company Mutated', ceo.id, { mutation: summarizeGenome(getCompanySnapshot(companyId)) });
};

export const runAgentTask = (io: SocketServer, agentId: string) => {
  const agent = getAgent(agentId);
  if (!agent) throw new Error('Agent not found');

  updateAgent(agentId, { status: 'working' });
  logEvent(io, agent.companyId, 'task_started', `${agent.name} started manual task execution.`, agentId);
  return agent;
};

export const terminateAgent = (io: SocketServer, agentId: string, deathReason = 'Terminated manually.') => {
  const agent = getAgent(agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.isCore) return agent;

  const updated = updateAgent(agentId, { status: 'terminated', deathReason });
  logEvent(io, agent.companyId, 'agent_terminated', `${agent.name} was terminated.`, agentId, { deathReason });
  return updated;
};
