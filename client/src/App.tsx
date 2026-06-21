import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { SponsorsPage } from './components/SponsorsPage';
import { api } from './lib/api';
import { joinCompanyRoom, socket } from './lib/socket';
import type {
  Agent,
  Approval,
  BudgetLedgerEntry,
  Company,
  CompanyGenome,
  CompanyMemoryEntry,
  CompanyMode,
  CompanySnapshot,
  Evaluation,
  EventRecord,
  HiringCandidate,
  SandboxRun,
  SponsorStatus,
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
  'genome_updated',
  'company_evolved',
  'pitch_signal',
];

const emptyGenome: CompanyGenome = {
  companyId: '',
  successfulAgents: [],
  failedAgents: [],
  bestStrategy: 'No winning strategy recorded yet.',
  worstStrategy: 'No failed strategy recorded yet.',
  currentMutation: 'Baseline company blueprint.',
  nextRecommendedMutation: 'Observe the first agent evaluation to mutate intelligently.',
  updatedAt: new Date(0).toISOString(),
};

const getPath = () => window.location.pathname;

export default function App() {
  const [path, setPath] = useState(getPath());
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
  const [genome, setGenome] = useState<CompanyGenome>(emptyGenome);
  const [sponsors, setSponsors] = useState<SponsorStatus[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pitchMode, setPitchMode] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(getPath());
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    api.getSponsors().then((response) => setSponsors(response.sponsors)).catch((error) => {
      console.error('Failed to load sponsors, keeping empty state.', error);
    });
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
      setGenome(snapshot.genome);
      setSponsors(snapshot.sponsors);
      setSelectedAgentId((current) => current ?? snapshot.agents[0]?.id ?? null);
    };

    socketEvents.forEach((eventName) => socket.on(eventName, refreshSnapshot));
    return () => {
      socketEvents.forEach((eventName) => socket.off(eventName, refreshSnapshot));
    };
  }, [company?.id]);

  const navigate = (nextPath: '/' | '/sponsors') => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPath(nextPath);
    }
  };

  const resetCompanyState = () => {
    setTasks([]);
    setEvaluations([]);
    setEvents([]);
    setApprovals([]);
    setBudgetLedger([]);
    setSandboxRuns([]);
    setHiringCandidates([]);
    setMemory([]);
    setGenome(emptyGenome);
  };

  const startCompany = async (idea: string, budget: number, mode: CompanyMode) => {
    setLoading(true);
    try {
      const response = await api.startCompany(idea, budget, mode);
      setCompany(response.company);
      setAgents(response.agents);
      resetCompanyState();
      setEvents(response.events);
      setSelectedAgentId(response.agents[0]?.id ?? null);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const ensureDemoCompany = async () => {
    if (company) return company;
    const response = await api.startCompany('Build a profitable AI Translator startup', 5000, 'profit');
    setCompany(response.company);
    setAgents(response.agents);
    resetCompanyState();
    setEvents(response.events);
    setSelectedAgentId(response.agents[0]?.id ?? null);
    navigate('/');
    return response.company;
  };

  const runDemo = async () => {
    const currentCompany = await ensureDemoCompany();
    await api.runDemo(currentCompany.id);
  };

  const runPhaseTwoDemo = async () => {
    const currentCompany = await ensureDemoCompany();
    await api.runPhaseTwoDemo(currentCompany.id);
  };

  const runFullDemo = async () => {
    const currentCompany = await ensureDemoCompany();
    await api.runFullDemo(currentCompany.id);
  };

  const approveRequest = async (approvalId: string) => {
    await api.approveRequest(approvalId);
  };

  const rejectRequest = async (approvalId: string) => {
    await api.rejectRequest(approvalId);
  };

  if (path === '/sponsors') {
    return <SponsorsPage sponsors={sponsors} onBack={() => navigate('/')} />;
  }

  if (!company) {
    return <Landing loading={loading} onStart={startCompany} onDemo={runFullDemo} />;
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
      genome={genome}
      sponsors={sponsors}
      pitchMode={pitchMode}
      selectedAgent={selectedAgent}
      onSelectAgent={setSelectedAgentId}
      onRunDemo={runDemo}
      onRunPhaseTwoDemo={runPhaseTwoDemo}
      onRunFullDemo={runFullDemo}
      onApproveRequest={approveRequest}
      onRejectRequest={rejectRequest}
      onTogglePitchMode={() => setPitchMode((current) => !current)}
      onOpenSponsors={() => navigate('/sponsors')}
    />
  );
}
