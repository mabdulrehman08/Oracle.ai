export type CompanyMode = 'profit' | 'growth';
export type CompanyStatus = 'created' | 'evolving' | 'paused' | 'evolved';
export type AgentStatus = 'idle' | 'working' | 'completed' | 'terminated' | 'spawned' | 'executing';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type Verdict = 'pass' | 'fail';
export type HudDecision = 'keep' | 'specialize' | 'replace' | 'terminate';
export type ApprovalType = 'ad_budget' | 'hiring' | 'tool_usage' | 'contractor';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type FinanceRecommendation = 'approve' | 'reject' | 'needs_review';
export type SandboxStatus = 'queued' | 'running' | 'completed' | 'failed';
export type SponsorMode = 'connected' | 'simulated';

export interface Company {
  id: string;
  name: string;
  idea: string;
  mode: CompanyMode;
  budget: number;
  profit: number;
  growthScore: number;
  status: CompanyStatus;
  createdAt: string;
  evolvedAt?: string;
}

export interface Agent {
  id: string;
  companyId: string;
  parentAgentId?: string;
  name: string;
  role: string;
  status: AgentStatus;
  kpi: string;
  score?: number;
  createdAt: string;
  expiresAt?: string;
  deathReason?: string;
  isCore?: boolean;
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  status: TaskStatus;
  input: string;
  output?: string;
  score?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Evaluation {
  id: string;
  companyId: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  score: number;
  decision: HudDecision;
  confidence: number;
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
  suggestedAgents: string[];
  verdict: Verdict;
  pass: boolean;
  provider: string;
  simulated: boolean;
  trace: string[];
  createdAt: string;
}

export interface EventRecord {
  id: string;
  companyId: string;
  agentId?: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Approval {
  id: string;
  companyId: string;
  agentId: string;
  type: ApprovalType;
  title: string;
  amount: number;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
  financeRecommendation?: FinanceRecommendation;
  financeReasoning?: string;
}

export interface BudgetLedgerEntry {
  id: string;
  companyId: string;
  agentId?: string;
  approvalId?: string;
  type: 'approved_spend' | 'reserved' | 'roi_projection';
  amount: number;
  description: string;
  createdAt: string;
}

export interface SandboxRun {
  id: string;
  companyId: string;
  agentId: string;
  taskTitle: string;
  status: SandboxStatus;
  logs: string[];
  previewUrl?: string;
  filesChanged: string[];
  createdAt: string;
  completedAt?: string;
}

export interface HiringCandidate {
  id: string;
  companyId: string;
  agentId: string;
  name: string;
  role: string;
  company: string;
  location: string;
  costEstimate: number;
  reason: string;
  createdAt: string;
}

export interface CompanyMemoryEntry {
  id: string;
  companyId: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
  tags?: string[];
}

export interface CompanyGenome {
  companyId: string;
  successfulAgents: string[];
  failedAgents: string[];
  bestStrategy: string;
  worstStrategy: string;
  currentMutation: string;
  nextRecommendedMutation: string;
  updatedAt: string;
}

export interface SponsorStatus {
  id: 'hud' | 'fireworks' | 'exa' | 'daytona' | 'modal' | 'sixtyfour';
  name: string;
  purpose: string;
  mode: SponsorMode;
  badge: string;
  detail: string;
}

export interface CompanySnapshot {
  company: Company;
  agents: Agent[];
  tasks: Task[];
  evaluations: Evaluation[];
  events: EventRecord[];
  approvals: Approval[];
  budgetLedger: BudgetLedgerEntry[];
  sandboxRuns: SandboxRun[];
  hiringCandidates: HiringCandidate[];
  memory: CompanyMemoryEntry[];
  genome: CompanyGenome;
  sponsors: SponsorStatus[];
}
