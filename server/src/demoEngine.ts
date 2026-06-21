import type { Server as SocketServer } from 'socket.io';
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
  getCompany,
  getCompanySnapshot,
  updateAgent,
  updateApproval,
  updateCompany,
  updateSandboxRun,
  updateTask,
} from './store.js';
import { evaluateTaskOutput } from './evaluator.js';
import type {
  Agent,
  Approval,
  ApprovalType,
  Company,
  CompanyMode,
  EventRecord,
  HiringCandidate,
  SandboxRun,
} from './types.js';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const spawnAgent = (
  io: SocketServer,
  companyId: string,
  parentAgentId: string | undefined,
  name: string,
  role: string,
  kpi: string,
) => {
  const agent = createAgent({ companyId, parentAgentId, name, role, status: 'spawned', kpi });
  logEvent(io, companyId, 'agent_created', `${name} spawned into the org chart.`, agent.id, { agent });
  return agent;
};

export const startCompanyFlow = (io: SocketServer, idea: string, budget: number, mode: CompanyMode, company: Company) => {
  logEvent(io, company.id, 'company_created', `Company created for ${idea}.`, undefined, { company, budget, mode });
};

export const createApprovalRequest = (
  io: SocketServer,
  companyId: string,
  agentId: string,
  type: ApprovalType,
  title: string,
  amount: number,
  reason: string,
) => {
  const recommendation =
    amount <= 300
      ? {
          financeRecommendation: 'approve' as const,
          financeReasoning: 'Approve because budget impact is low and growth potential is high.',
        }
      : {
          financeRecommendation: 'needs_review' as const,
          financeReasoning: 'Needs review because the spend size could distort runway.',
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

  logEvent(io, companyId, 'approval_requested', `${title} requested for $${amount}.`, agentId, { approval });
  logEvent(
    io,
    companyId,
    'finance_reviewed',
    `Finance Agent recommendation: ${recommendation.financeRecommendation}. ${recommendation.financeReasoning}`,
    agentId,
    { approvalId: approval.id, ...recommendation },
  );

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
  logEvent(io, approval.companyId, 'approval_rejected', `${approval.title} was rejected.`, approval.agentId, {
    approval: updated,
  });
  return updated;
};

export const createHiringCandidates = (io: SocketServer, companyId: string, agentId: string): HiringCandidate[] => {
  const candidates = [
    {
      name: 'Maya Chen',
      role: 'React Contractor',
      company: 'SixtyFour Studio',
      location: 'San Francisco, CA',
      costEstimate: 1800,
      reason: 'Strong motion polish and launch-page craft for AI products.',
    },
    {
      name: 'Luis Romero',
      role: 'Frontend Engineer',
      company: 'North Coast Interactive',
      location: 'Austin, TX',
      costEstimate: 1500,
      reason: 'Fast UI cleanup specialist with responsive landing-page experience.',
    },
    {
      name: 'Nia Patel',
      role: 'Product Designer / React Builder',
      company: 'Signal Canvas',
      location: 'New York, NY',
      costEstimate: 2200,
      reason: 'Can tighten the landing page story and ship production-ready polish.',
    },
  ].map((candidate) => createHiringCandidate({ companyId, agentId, ...candidate }));

  logEvent(io, companyId, 'hiring_candidates_found', 'Hiring Agent found 3 React contractor candidates.', agentId, {
    candidates,
  });
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
  await wait(900);

  const completed = updateSandboxRun(run.id, {
    status: 'completed',
    previewUrl: 'https://preview.oracle-evolution.local/daytona/mock-landing',
    filesChanged: filesToCreate,
    logs: [
      'Booting sandbox...',
      'Installing project context...',
      'Writing landing page variants...',
      'Generated pricing page and signup CTA.',
      'Preview deployed successfully.',
    ],
    completedAt: new Date().toISOString(),
  });

  logEvent(io, companyId, 'sandbox_completed', 'Sandbox run completed with landing and pricing page updates.', agentId, {
    run: completed,
  });
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

  await wait(500);
  const ceo = spawnAgent(io, companyId, undefined, 'CEO Agent', 'Chief Evolution Officer', 'Spawn specialists and maximize company fitness');

  await wait(700);
  const research = spawnAgent(io, companyId, ceo.id, 'Research Agent', 'Competitive Intelligence', 'Map rivals and pricing');
  spawnAgent(io, companyId, ceo.id, 'Product Agent', 'Product Strategy', 'Shape translator roadmap');
  const marketing = spawnAgent(io, companyId, ceo.id, 'Marketing Agent', 'Growth Generalist', 'Find scalable acquisition channels');
  spawnAgent(io, companyId, ceo.id, 'Finance Agent', 'Unit Economics', 'Model margin and runway');

  logEvent(io, companyId, 'agents_spawned', 'CEO spawned Research, Product, Marketing, and Finance agents.', ceo.id, {
    agents: [research, marketing],
  });

  await wait(900);
  updateAgent(research.id, { status: 'working' });
  logEvent(io, companyId, 'task_started', 'Research Agent started competitor and pricing analysis.', research.id);

  const task = createTask({
    agentId: research.id,
    title: 'Find competitors and pricing.',
    status: 'running',
    input: 'Find competitors and pricing.',
  });

  await wait(1100);
  const researchOutput = [
    'DeepL: strong translation quality, B2B pricing',
    'Google Translate: massive distribution, free/low-cost',
    'Papago: strong Asian language support',
    'ElevenLabs Dubbing: voice/video translation angle',
    'Opportunity: niche vertical AI translator for creators and businesses',
  ].join('\n');

  updateTask(task.id, {
    status: 'completed',
    output: researchOutput,
    completedAt: new Date().toISOString(),
  });
  createMemoryEntry({
    companyId,
    title: 'Research competitor map',
    content: researchOutput,
    source: 'Research Agent',
  });
  logEvent(io, companyId, 'task_completed', 'Research Agent returned competitor analysis and pricing intel.', research.id, {
    output: researchOutput,
  });

  await wait(900);
  const evaluation = evaluateTaskOutput(researchOutput);
  createEvaluation(research.id, evaluation.score, evaluation.verdict, evaluation.reasoning);
  updateAgent(research.id, { score: evaluation.score });
  logEvent(io, companyId, 'hud_evaluated', `HUD scored Research Agent ${evaluation.score}/100: ${evaluation.reasoning}`, research.id, evaluation);

  await wait(700);
  updateAgent(research.id, { status: 'completed' });
  logEvent(io, companyId, 'agent_completed', 'Research Agent completed its mission.', research.id);

  await wait(700);
  updateAgent(research.id, {
    status: 'terminated',
    deathReason: 'Task completed. Knowledge saved to company memory.',
  });
  logEvent(io, companyId, 'agent_terminated', 'Research Agent was retired after completing its task.', research.id, {
    deathReason: 'Task completed. Knowledge saved to company memory.',
  });

  await wait(800);
  const seo = spawnAgent(io, companyId, ceo.id, 'SEO Agent', 'Search Growth Specialist', 'Capture intent-driven demand');
  const tiktok = spawnAgent(io, companyId, ceo.id, 'TikTok Agent', 'Short-form Distribution', 'Find creator-led acquisition loops');
  logEvent(io, companyId, 'agents_spawned', 'CEO spawned SEO Agent and TikTok Agent from research findings.', ceo.id, {
    agents: [seo, tiktok],
  });

  await wait(900);
  const marketingEval = evaluateTaskOutput('Generic channel strategy. Needs specialized growth agents.');
  createEvaluation(marketing.id, marketingEval.score, marketingEval.verdict, marketingEval.reasoning);
  updateAgent(marketing.id, {
    score: marketingEval.score,
    status: 'terminated',
    deathReason: 'HUD rejected the generalist plan.',
  });
  logEvent(io, companyId, 'hud_evaluated', `HUD scored Marketing Agent ${marketingEval.score}/100: ${marketingEval.reasoning}`, marketing.id, marketingEval);

  await wait(700);
  logEvent(io, companyId, 'agent_terminated', 'Marketing Agent was terminated after failing evaluation.', marketing.id, {
    deathReason: 'HUD rejected the generalist plan.',
  });

  await wait(800);
  const referral = spawnAgent(io, companyId, ceo.id, 'Referral Agent', 'Referral Engine', 'Design word-of-mouth loops');
  const creator = spawnAgent(io, companyId, ceo.id, 'Creator Outreach Agent', 'Creator Partnerships', 'Recruit niche creators and business evangelists');
  logEvent(io, companyId, 'agents_spawned', 'CEO replaced Marketing Agent with Referral and Creator Outreach specialists.', ceo.id, {
    agents: [referral, creator],
  });

  await wait(900);
  const updatedCompany = updateCompany(companyId, {
    profit: 1200,
    growthScore: 27,
    status: 'evolving',
  });
  logEvent(io, companyId, 'metrics_updated', 'Company metrics updated after specialization.', undefined, {
    profit: 1200,
    growthScore: 27,
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

  const ceo = spawnAgent(io, companyId, undefined, 'CEO Agent', 'Chief Evolution Officer', 'Review cross-functional outcomes');
  const marketing = spawnAgent(io, companyId, ceo.id, 'Marketing Agent', 'Paid Acquisition', 'Request and deploy ad budget effectively');
  const finance = spawnAgent(io, companyId, ceo.id, 'Finance Agent', 'Capital Allocation', 'Review spend and protect runway');
  const hiring = spawnAgent(io, companyId, ceo.id, 'Hiring Agent', 'Talent Scout', 'Find targeted human support when leverage is high');
  const product = spawnAgent(io, companyId, ceo.id, 'Product Agent', 'Sandbox Builder', 'Ship landing page and pricing improvements');

  logEvent(io, companyId, 'agents_spawned', 'CEO spawned Marketing, Finance, Hiring, and Product agents for Autonomous Company Mode.', ceo.id, {
    agents: [marketing, finance, hiring, product],
  });

  updateAgent(marketing.id, { status: 'working' });
  updateAgent(finance.id, { status: 'working' });
  updateAgent(hiring.id, { status: 'working' });
  updateAgent(product.id, { status: 'working' });

  const approvalPromise = (async () => {
    await wait(350);
    return createApprovalRequest(
      io,
      companyId,
      marketing.id,
      'ad_budget',
      'TikTok Ad Budget Request',
      300,
      'Need a focused ad test to validate creator-led translator acquisition.',
    );
  })();

  void (async () => {
    await wait(850);
    createApprovalRequest(
      io,
      companyId,
      hiring.id,
      'contractor',
      'React Contractor Search',
      1800,
      'Need React contractor to build landing page polish.',
    );
    await wait(350);
    createMemoryEntry({
      companyId,
      title: 'Hiring need',
      content: 'Need React contractor to build landing page polish.',
      source: 'Hiring Agent',
    });
    createHiringCandidates(io, companyId, hiring.id);
  })();

  void (async () => {
    await wait(950);
    await runSandboxTask(io, companyId, product.id, 'Build launch page polish bundle', [
      'app/landing/page.tsx',
      'app/pricing/page.tsx',
      'components/signup-cta.tsx',
    ]);
  })();

  const approval = await approvalPromise;
  return { approvalId: approval.id, ceoId: ceo.id, marketingId: marketing.id, financeId: finance.id, hiringId: hiring.id, productId: product.id };
};

export const continuePhaseTwoAfterApproval = async (io: SocketServer, approvalId: string) => {
  const approval = getApproval(approvalId);
  if (!approval) throw new Error('Approval not found');

  updateAgent(approval.agentId, { status: 'executing' });
  logEvent(io, approval.companyId, 'task_started', 'Marketing Agent began executing the approved TikTok ad campaign.', approval.agentId);

  await wait(700);
  createMemoryEntry({
    companyId: approval.companyId,
    title: 'Campaign execution',
    content: 'TikTok campaign launched with creator-led hooks and translator ROI narrative.',
    source: 'Marketing Agent',
  });

  const marketingOutput =
    'Executed a focused TikTok campaign. CTR improved, but conversion path still needs a partnership and conversion specialist layer.';
  const evaluation = evaluateTaskOutput(marketingOutput);
  const adjustedScore = 58;
  createEvaluation(
    approval.agentId,
    adjustedScore,
    evaluation.verdict,
    'Promising experiment, but execution still needs sharper specialization and conversion follow-through.',
  );
  updateAgent(approval.agentId, {
    score: adjustedScore,
    status: 'terminated',
    deathReason: 'Campaign run completed. CEO wants more specialized operators.',
  });
  logEvent(
    io,
    approval.companyId,
    'hud_evaluated',
    'HUD scored Marketing Agent 58/100: Promising experiment, but execution still needs sharper specialization and conversion follow-through.',
    approval.agentId,
    { score: adjustedScore, verdict: 'pass', reasoning: 'Promising experiment, but execution still needs sharper specialization and conversion follow-through.' },
  );
  await wait(400);
  logEvent(io, approval.companyId, 'agent_terminated', 'Marketing Agent was retired after the campaign simulation.', approval.agentId, {
    deathReason: 'Campaign run completed. CEO wants more specialized operators.',
  });

  return approval;
};

export const completePhaseTwoRun = async (
  io: SocketServer,
  companyId: string,
  ceoId: string,
) => {
  const snapshot = getCompanySnapshot(companyId);
  createMemoryEntry({
    companyId,
    title: 'CEO review',
    content: 'Budget approved, contractor candidates sourced, and sandbox landing assets generated. Next step: specialize growth execution.',
    source: 'CEO Agent',
  });

  logEvent(io, companyId, 'agent_completed', 'CEO Agent reviewed all Phase 2 outcomes.', ceoId, {
    approvals: snapshot?.approvals,
    sandboxRuns: snapshot?.sandboxRuns,
    hiringCandidates: snapshot?.hiringCandidates,
  });

  const tikTok = spawnAgent(io, companyId, ceoId, 'TikTok Agent', 'Channel Specialist', 'Scale the winning creator hooks');
  const partnership = spawnAgent(io, companyId, ceoId, 'Partnership Agent', 'Distribution Partnerships', 'Unlock partner distribution channels');
  const conversion = spawnAgent(io, companyId, ceoId, 'Conversion Agent', 'Landing Page Optimization', 'Improve signup conversion after traffic capture');

  logEvent(io, companyId, 'agents_spawned', 'CEO spawned TikTok, Partnership, and Conversion agents as upgraded specialists.', ceoId, {
    agents: [tikTok, partnership, conversion],
  });

  updateCompany(companyId, {
    profit: 1600,
    growthScore: 41,
  });
  logEvent(io, companyId, 'metrics_updated', 'Budget moved, specialists spawned, and Autonomous Company Mode updated the company metrics.', undefined, {
    profit: 1600,
    growthScore: 41,
  });
  logEvent(io, companyId, 'parallel_run_completed', 'Autonomous Company Mode completed its parallel execution cycle.', ceoId);
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

  const updated = updateAgent(agentId, { status: 'terminated', deathReason });
  logEvent(io, agent.companyId, 'agent_terminated', `${agent.name} was terminated.`, agentId, { deathReason });
  return updated;
};
