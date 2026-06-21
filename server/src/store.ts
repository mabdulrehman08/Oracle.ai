import { v4 as uuid } from 'uuid';
import type {
  Agent,
  Approval,
  ApprovalStatus,
  ApprovalType,
  BudgetLedgerEntry,
  Company,
  CompanyMemoryEntry,
  CompanyMode,
  CompanySnapshot,
  Evaluation,
  EventRecord,
  FinanceRecommendation,
  HiringCandidate,
  SandboxRun,
  SandboxStatus,
  Task,
  Verdict,
} from './types.js';

const companies = new Map<string, Company>();
const agents = new Map<string, Agent>();
const tasks = new Map<string, Task>();
const evaluations = new Map<string, Evaluation>();
const events = new Map<string, EventRecord>();
const approvals = new Map<string, Approval>();
const budgetLedger = new Map<string, BudgetLedgerEntry>();
const sandboxRuns = new Map<string, SandboxRun>();
const hiringCandidates = new Map<string, HiringCandidate>();
const memoryEntries = new Map<string, CompanyMemoryEntry>();

const now = () => new Date().toISOString();

export const createCompany = (idea: string, budget: number, mode: CompanyMode): Company => {
  const company: Company = {
    id: uuid(),
    name: 'Oracle Evolution Co.',
    idea,
    mode,
    budget,
    profit: 0,
    growthScore: 0,
    status: 'created',
    createdAt: now(),
  };
  companies.set(company.id, company);
  return company;
};

export const updateCompany = (id: string, patch: Partial<Company>) => {
  const company = companies.get(id);
  if (!company) return undefined;
  const next = { ...company, ...patch };
  companies.set(id, next);
  return next;
};

export const createAgent = (input: Omit<Agent, 'id' | 'createdAt'>): Agent => {
  const agent: Agent = { ...input, id: uuid(), createdAt: now() };
  agents.set(agent.id, agent);
  return agent;
};

export const updateAgent = (id: string, patch: Partial<Agent>) => {
  const agent = agents.get(id);
  if (!agent) return undefined;
  const next = { ...agent, ...patch };
  agents.set(id, next);
  return next;
};

export const createTask = (input: Omit<Task, 'id' | 'createdAt'>): Task => {
  const task: Task = { ...input, id: uuid(), createdAt: now() };
  tasks.set(task.id, task);
  return task;
};

export const updateTask = (id: string, patch: Partial<Task>) => {
  const task = tasks.get(id);
  if (!task) return undefined;
  const next = { ...task, ...patch };
  tasks.set(id, next);
  return next;
};

export const createEvaluation = (agentId: string, score: number, verdict: Verdict, reasoning: string): Evaluation => {
  const evaluation: Evaluation = {
    id: uuid(),
    agentId,
    score,
    verdict,
    reasoning,
    createdAt: now(),
  };
  evaluations.set(evaluation.id, evaluation);
  return evaluation;
};

export const createEvent = (input: Omit<EventRecord, 'id' | 'createdAt'>): EventRecord => {
  const event: EventRecord = { ...input, id: uuid(), createdAt: now() };
  events.set(event.id, event);
  return event;
};

export const createApproval = (
  input: Omit<Approval, 'id' | 'createdAt' | 'status'> & {
    status?: ApprovalStatus;
    financeRecommendation?: FinanceRecommendation;
    financeReasoning?: string;
  },
): Approval => {
  const approval: Approval = {
    ...input,
    id: uuid(),
    createdAt: now(),
    status: input.status ?? 'pending',
  };
  approvals.set(approval.id, approval);
  return approval;
};

export const updateApproval = (id: string, patch: Partial<Approval>) => {
  const approval = approvals.get(id);
  if (!approval) return undefined;
  const next = { ...approval, ...patch };
  approvals.set(id, next);
  return next;
};

export const createBudgetLedgerEntry = (
  input: Omit<BudgetLedgerEntry, 'id' | 'createdAt'>,
): BudgetLedgerEntry => {
  const entry: BudgetLedgerEntry = { ...input, id: uuid(), createdAt: now() };
  budgetLedger.set(entry.id, entry);
  return entry;
};

export const createSandboxRun = (
  input: Omit<SandboxRun, 'id' | 'createdAt' | 'status' | 'logs' | 'filesChanged'> & {
    status?: SandboxStatus;
    logs?: string[];
    filesChanged?: string[];
  },
): SandboxRun => {
  const run: SandboxRun = {
    ...input,
    id: uuid(),
    createdAt: now(),
    status: input.status ?? 'queued',
    logs: input.logs ?? [],
    filesChanged: input.filesChanged ?? [],
  };
  sandboxRuns.set(run.id, run);
  return run;
};

export const updateSandboxRun = (id: string, patch: Partial<SandboxRun>) => {
  const run = sandboxRuns.get(id);
  if (!run) return undefined;
  const next = { ...run, ...patch };
  sandboxRuns.set(id, next);
  return next;
};

export const createHiringCandidate = (input: Omit<HiringCandidate, 'id' | 'createdAt'>): HiringCandidate => {
  const candidate: HiringCandidate = { ...input, id: uuid(), createdAt: now() };
  hiringCandidates.set(candidate.id, candidate);
  return candidate;
};

export const createMemoryEntry = (input: Omit<CompanyMemoryEntry, 'id' | 'createdAt'>): CompanyMemoryEntry => {
  const entry: CompanyMemoryEntry = { ...input, id: uuid(), createdAt: now() };
  memoryEntries.set(entry.id, entry);
  return entry;
};

export const getCompanySnapshot = (companyId: string): CompanySnapshot | undefined => {
  const company = companies.get(companyId);
  if (!company) return undefined;

  return {
    company,
    agents: [...agents.values()].filter((agent) => agent.companyId === companyId),
    tasks: [...tasks.values()].filter((task) => {
      const agent = agents.get(task.agentId);
      return agent?.companyId === companyId;
    }),
    evaluations: [...evaluations.values()].filter((evaluation) => {
      const agent = agents.get(evaluation.agentId);
      return agent?.companyId === companyId;
    }),
    events: [...events.values()]
      .filter((event) => event.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    approvals: [...approvals.values()]
      .filter((approval) => approval.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    budgetLedger: [...budgetLedger.values()]
      .filter((entry) => entry.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    sandboxRuns: [...sandboxRuns.values()]
      .filter((run) => run.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    hiringCandidates: [...hiringCandidates.values()]
      .filter((candidate) => candidate.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    memory: [...memoryEntries.values()]
      .filter((entry) => entry.companyId === companyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
};

export const getAgent = (id: string) => agents.get(id);
export const getCompany = (id: string) => companies.get(id);
export const getApproval = (id: string) => approvals.get(id);
export const getApprovalsByCompany = (companyId: string) =>
  [...approvals.values()].filter((approval) => approval.companyId === companyId);
export const getBudgetLedgerByCompany = (companyId: string) =>
  [...budgetLedger.values()].filter((entry) => entry.companyId === companyId);
export const getSandboxRunsByCompany = (companyId: string) =>
  [...sandboxRuns.values()].filter((run) => run.companyId === companyId);
export const getHiringCandidatesByCompany = (companyId: string) =>
  [...hiringCandidates.values()].filter((candidate) => candidate.companyId === companyId);
