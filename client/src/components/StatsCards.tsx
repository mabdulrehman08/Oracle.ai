import type { Agent, Approval, BudgetLedgerEntry, Company, Evaluation } from '../types';

export function StatsCards({
  company,
  agents,
  approvals,
  budgetLedger,
  evaluations,
}: {
  company: Company;
  agents: Agent[];
  approvals: Approval[];
  budgetLedger: BudgetLedgerEntry[];
  evaluations: Evaluation[];
}) {
  const budgetUsed = budgetLedger.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingBudget = company.budget - budgetUsed;
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending').length;
  const activeAgents = agents.filter((agent) => !['terminated', 'completed'].includes(agent.status)).length;
  const terminatedAgents = agents.filter((agent) => agent.status === 'terminated').length;
  const averageHudScore =
    evaluations.length > 0 ? Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length) : 0;

  const cards = [
    ['Company', company.name],
    ['Budget Used', `$${budgetUsed.toLocaleString()}`],
    ['Remaining Budget', `$${remainingBudget.toLocaleString()}`],
    ['Pending Approvals', `${pendingApprovals}`],
    ['Active Agents', `${activeAgents}`],
    ['Terminated Agents', `${terminatedAgents}`],
    ['HUD Average', evaluations.length > 0 ? `${averageHudScore}/100` : '--'],
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value], index) => (
        <div
          key={label}
          className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-steel">{label}</p>
          <p className={`mt-3 text-2xl font-semibold ${index === 3 ? 'text-lime' : index === 4 ? 'text-glow' : 'text-white'}`}>
            {value}
          </p>
        </div>
      ))}
    </section>
  );
}
