import { useMemo, useState } from 'react';
import type {
  Agent,
  Approval,
  BudgetLedgerEntry,
  Company,
  CompanyMemoryEntry,
  Evaluation,
  EventRecord,
  HiringCandidate,
  SandboxRun,
  Task,
} from '../types';
import { AgentDetailPanel } from './AgentDetailPanel';
import { ApprovalsPanel } from './ApprovalsPanel';
import { HudEvaluations } from './HudEvaluations';
import { MemoryPanel } from './MemoryPanel';
import { OrgChart } from './OrgChart';
import { SandboxPanel } from './SandboxPanel';
import { StatsCards } from './StatsCards';
import { Timeline } from './Timeline';

interface DashboardProps {
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
  selectedAgent: Agent | null;
  onSelectAgent: (agentId: string) => void;
  onRunDemo: () => Promise<void>;
  onRunPhaseTwoDemo: () => Promise<void>;
  onApproveRequest: (approvalId: string) => Promise<void>;
  onRejectRequest: (approvalId: string) => Promise<void>;
}

const tabs = ['org chart', 'timeline', 'approvals', 'sandbox', 'memory'] as const;
type DashboardTab = (typeof tabs)[number];

export function Dashboard({
  company,
  agents,
  tasks,
  evaluations,
  events,
  approvals,
  budgetLedger,
  sandboxRuns,
  hiringCandidates,
  memory,
  selectedAgent,
  onSelectAgent,
  onRunDemo,
  onRunPhaseTwoDemo,
  onApproveRequest,
  onRejectRequest,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('org chart');

  const sideSummary = useMemo(() => {
    const activeApprovals = approvals.filter((approval) => approval.status === 'pending').length;
    const sandboxActive = sandboxRuns.filter((run) => run.status !== 'completed').length;
    return { activeApprovals, sandboxActive };
  }, [approvals, sandboxRuns]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050814_0%,#0a1020_100%)] px-4 py-4 text-white md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-glow">Oracle Evolution Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">{company.idea}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-2xl border border-glow/40 bg-glow/10 px-5 py-3 text-sm font-semibold text-glow transition hover:bg-glow/20"
              onClick={() => void onRunDemo()}
            >
              Run Task 1 Demo
            </button>
            <button
              className="rounded-2xl bg-coral px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              onClick={() => void onRunPhaseTwoDemo()}
            >
              Run Phase 2 Demo
            </button>
          </div>
        </div>

        <StatsCards company={company} agents={agents} approvals={approvals} budgetLedger={budgetLedger} evaluations={evaluations} />

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-glow">Control Surface</p>
                <p className="mt-1 text-xl font-semibold">Autonomous company view</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                      activeTab === tab ? 'bg-glow text-slate-950' : 'border border-white/10 bg-white/5 text-steel'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'org chart' ? <OrgChart agents={agents} onSelectAgent={onSelectAgent} /> : null}
            {activeTab === 'timeline' ? <Timeline events={events} /> : null}
            {activeTab === 'approvals' ? (
              <ApprovalsPanel approvals={approvals} agents={agents} hiringCandidates={hiringCandidates} onApprove={onApproveRequest} onReject={onRejectRequest} />
            ) : null}
            {activeTab === 'sandbox' ? <SandboxPanel sandboxRuns={sandboxRuns} agents={agents} /> : null}
            {activeTab === 'memory' ? <MemoryPanel memory={memory} /> : null}
          </div>

          <div className="grid gap-4">
            <HudEvaluations evaluations={evaluations} agents={agents} />
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-glow">Parallel Run</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
                  Modal
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
                  Fireworks
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-steel">
                <p>Pending approvals: {sideSummary.activeApprovals}</p>
                <p>Active sandbox runs: {sideSummary.sandboxActive}</p>
                <p>Live events: {events.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <AgentDetailPanel agent={selectedAgent} task={tasks.find((item) => item.agentId === selectedAgent?.id) ?? null} />
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-glow">Narrative</p>
            <p className="mt-3 text-lg font-semibold">What the judges should see</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-steel">
              <p>1. CEO births specialist agents under one mission.</p>
              <p>2. Research Agent works, gets a strong HUD score, then dies after preserving knowledge.</p>
              <p>3. Marketing Agent fails HUD review and is replaced by sharper specialists.</p>
              <p>4. Profit and growth metrics improve live as the org chart evolves.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
