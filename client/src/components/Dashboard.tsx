import { useMemo, useState } from 'react';
import type {
  Agent,
  Approval,
  BudgetLedgerEntry,
  Company,
  CompanyGenome,
  CompanyMemoryEntry,
  Evaluation,
  EventRecord,
  HiringCandidate,
  SandboxRun,
  SponsorStatus,
  Task,
} from '../types';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentGraph } from './AgentGraph';
import { ApprovalsPanel } from './ApprovalsPanel';
import { EvolutionPanel } from './EvolutionPanel';
import { GenomePanel } from './GenomePanel';
import { HudPanel } from './HudPanel';
import { HudEvaluations } from './HudEvaluations';
import { MemoryPanel } from './MemoryPanel';
import { SandboxPanel } from './SandboxPanel';
import { SponsorsPanel } from './SponsorsPanel';
import { StatsCards } from './StatsCards';
import { Timeline } from './Timeline';

const tabs = ['evolution', 'hud', 'agents', 'approvals', 'sandbox', 'genome', 'memory', 'sponsors'] as const;
type DashboardTab = (typeof tabs)[number];

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
  genome: CompanyGenome;
  sponsors: SponsorStatus[];
  pitchMode: boolean;
  selectedAgent: Agent | null;
  onSelectAgent: (agentId: string) => void;
  onRunDemo: () => Promise<void>;
  onRunPhaseTwoDemo: () => Promise<void>;
  onRunFullDemo: () => Promise<void>;
  onApproveRequest: (approvalId: string) => Promise<void>;
  onRejectRequest: (approvalId: string) => Promise<void>;
  onTogglePitchMode: () => void;
  onOpenSponsors: () => void;
}

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
  genome,
  sponsors,
  pitchMode,
  selectedAgent,
  onSelectAgent,
  onRunDemo,
  onRunPhaseTwoDemo,
  onRunFullDemo,
  onApproveRequest,
  onRejectRequest,
  onTogglePitchMode,
  onOpenSponsors,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('evolution');

  const summary = useMemo(() => {
    const pendingApprovals = approvals.filter((approval) => approval.status === 'pending').length;
    const activeAgents = agents.filter((agent) => agent.status !== 'terminated').length;
    const connectedSponsors = sponsors.filter((sponsor) => sponsor.mode === 'connected').length;
    return { pendingApprovals, activeAgents, connectedSponsors };
  }, [approvals, agents, sponsors]);

  const stat = (label: string, value: string) => (
    <div className="rounded-full border border-line bg-cream px-3.5 py-1.5 text-xs font-medium text-steel">
      {label}: <span className="font-semibold text-ink">{value}</span>
    </div>
  );

  return (
    <main className="relative min-h-screen bg-white/45 px-4 py-4 text-ink md:px-6">
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-4">
        <div className="glass relative overflow-hidden rounded-2xl p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px gradient-line" />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yc text-sm font-bold text-white">Y</span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">evoler.ai · Company OS</p>
              </div>
              <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-ink md:text-3xl">{company.idea}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-steel">
                evoler.ai creates agents, assigns work, evaluates outcomes with HUD, saves memory, terminates weak
                operators, and mutates into a stronger company.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
                onClick={() => void onRunDemo()}
              >
                Run Task 1
              </button>
              <button
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
                onClick={() => void onRunPhaseTwoDemo()}
              >
                Run Phase 2
              </button>
              <button
                className="rounded-lg bg-yc px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-ycDark"
                onClick={() => void onRunFullDemo()}
              >
                Run Full Demo
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                pitchMode ? 'bg-yc text-white' : 'border border-line bg-cream text-steel hover:text-ink'
              }`}
              onClick={onTogglePitchMode}
            >
              Pitch Mode {pitchMode ? 'On' : 'Off'}
            </button>
            {stat('Pending approvals', `${summary.pendingApprovals}`)}
            {stat('Active agents', `${summary.activeAgents}`)}
            {stat('Sponsors connected', `${summary.connectedSponsors}/${sponsors.length}`)}
          </div>
        </div>

        <StatsCards company={company} agents={agents} approvals={approvals} budgetLedger={budgetLedger} evaluations={evaluations} />

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="glass rounded-2xl p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Control Surface</p>
                <p className="mt-1 text-lg font-semibold text-ink">Live company operating view</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition ${
                      activeTab === tab ? 'bg-yc text-white' : 'border border-line bg-white text-steel hover:bg-cream'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'evolution' ? <EvolutionPanel company={company} events={events} agents={agents} pitchMode={pitchMode} /> : null}
            {activeTab === 'hud' ? <HudPanel evaluations={evaluations} agents={agents} /> : null}
            {activeTab === 'agents' ? <AgentGraph agents={agents} onSelectAgent={onSelectAgent} /> : null}
            {activeTab === 'approvals' ? (
              <ApprovalsPanel approvals={approvals} agents={agents} hiringCandidates={hiringCandidates} onApprove={onApproveRequest} onReject={onRejectRequest} />
            ) : null}
            {activeTab === 'sandbox' ? <SandboxPanel sandboxRuns={sandboxRuns} agents={agents} /> : null}
            {activeTab === 'genome' ? <GenomePanel genome={genome} /> : null}
            {activeTab === 'memory' ? <MemoryPanel memory={memory} /> : null}
            {activeTab === 'sponsors' ? <SponsorsPanel sponsors={sponsors} onOpenPage={onOpenSponsors} /> : null}
          </div>

          <div className="grid gap-4">
            <Timeline events={events} />
            <HudEvaluations evaluations={evaluations} agents={agents} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <AgentDetailPanel agent={selectedAgent} task={tasks.find((item) => item.agentId === selectedAgent?.id) ?? null} />
          <div className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Judge Narrative</p>
            <p className="mt-1.5 text-lg font-semibold text-ink">What the room should see</p>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-steel">
              <li>1. CEO, Finance, and Memory Agents anchor the company as core operators.</li>
              <li>2. Research uses Exa, Product uses Daytona, Hiring uses SixtyFour, and reasoning flows through Fireworks-style summaries.</li>
              <li>3. HUD evaluates every outcome, memory captures the result, weak agents die, and the genome mutates.</li>
              <li>4. The company ends the demo visibly stronger than it started.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
