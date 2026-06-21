import { useEffect, useState } from 'react';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { api } from './lib/api';
import { joinCompanyRoom, socket } from './lib/socket';
import type {
  Agent,
  Approval,
  BudgetLedgerEntry,
  Company,
  CompanyMemoryEntry,
  CompanyMode,
  CompanySnapshot,
  Evaluation,
  EventRecord,
  HiringCandidate,
  SandboxRun,
  Task,
} from './types';

const socketEvents = [
  'company_created',
  'agent_created',
  'task_started',
  'task_completed',
  'hud_evaluated',
  'agent_completed',
  'agent_terminated',
  'agents_spawned',
  'metrics_updated',
  'timeline_event',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
  'finance_reviewed',
  'hiring_candidates_found',
  'sandbox_started',
  'sandbox_completed',
  'parallel_run_started',
  'parallel_run_completed',
];

export default function App() {
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [budgetLedger, setBudgetLedger] = useState<BudgetLedgerEntry[]>([]);
  const [sandboxRuns, setSandboxRuns] = useState<SandboxRun[]>([]);
  const [hiringCandidates, setHiringCandidates] = useState<HiringCandidate[]>([]);
  const [memory, setMemory] = useState<CompanyMemoryEntry[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!company?.id) return;

    joinCompanyRoom(company.id);

    const refreshSnapshot = async () => {
      const snapshot: CompanySnapshot = await api.getCompany(company.id);
      setCompany(snapshot.company);
      setAgents(snapshot.agents);
      setTasks(snapshot.tasks);
      setEvaluations(snapshot.evaluations);
      setEvents(snapshot.events);
      setApprovals(snapshot.approvals);
      setBudgetLedger(snapshot.budgetLedger);
      setSandboxRuns(snapshot.sandboxRuns);
      setHiringCandidates(snapshot.hiringCandidates);
      setMemory(snapshot.memory);
      setSelectedAgentId((current) => current ?? snapshot.agents[0]?.id ?? null);
    };

    socketEvents.forEach((eventName) => socket.on(eventName, refreshSnapshot));
    return () => {
      socketEvents.forEach((eventName) => socket.off(eventName, refreshSnapshot));
    };
  }, [company?.id]);

  const startCompany = async (idea: string, budget: number, mode: CompanyMode) => {
    setLoading(true);
    try {
      const response = await api.startCompany(idea, budget, mode);
      setCompany(response.company);
      setAgents(response.agents);
      setTasks([]);
      setEvaluations([]);
      setEvents(response.events);
      setApprovals([]);
      setBudgetLedger([]);
      setSandboxRuns([]);
      setHiringCandidates([]);
      setMemory([]);
      setSelectedAgentId(response.agents[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async () => {
    if (!company) {
      const response = await api.startCompany('Build a profitable AI Translator startup', 5000, 'profit');
      setCompany(response.company);
      setAgents(response.agents);
      setEvents(response.events);
      setTasks([]);
      setEvaluations([]);
      setApprovals([]);
      setBudgetLedger([]);
      setSandboxRuns([]);
      setHiringCandidates([]);
      setMemory([]);
      setSelectedAgentId(response.agents[0]?.id ?? null);
      await api.runDemo(response.company.id);
      return;
    }

    await api.runDemo(company.id);
  };

  const runPhaseTwoDemo = async () => {
    if (!company) return;
    await api.runPhaseTwoDemo(company.id);
  };

  const approveRequest = async (approvalId: string) => {
    await api.approveRequest(approvalId);
  };

  const rejectRequest = async (approvalId: string) => {
    await api.rejectRequest(approvalId);
  };

  if (!company) {
    return <Landing loading={loading} onStart={startCompany} onDemo={runDemo} />;
  }

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;

  return (
    <Dashboard
      company={company}
      agents={agents}
      tasks={tasks}
      evaluations={evaluations}
      events={events}
      approvals={approvals}
      budgetLedger={budgetLedger}
      sandboxRuns={sandboxRuns}
      hiringCandidates={hiringCandidates}
      memory={memory}
      selectedAgent={selectedAgent}
      onSelectAgent={setSelectedAgentId}
      onRunDemo={runDemo}
      onRunPhaseTwoDemo={runPhaseTwoDemo}
      onApproveRequest={approveRequest}
      onRejectRequest={rejectRequest}
    />
  );
}
