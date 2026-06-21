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
  const budgetPct = company.budget > 0 ? Math.min(100, Math.round((budgetUsed / company.budget) * 100)) : 0;

  const cards: Array<{ label: string; value: string; icon: string; accent: string; meter?: number }> = [
    { label: company.mode === 'growth' ? 'Growth Score' : 'Profit', value: company.mode === 'growth' ? `${company.growthScore}` : `$${company.profit.toLocaleString()}`, icon: company.mode === 'growth' ? '📈' : '💰', accent: 'text-lime' },
    { label: 'Budget Used', value: `$${budgetUsed.toLocaleString()}`, icon: '🔥', accent: 'text-coral', meter: budgetPct },
    { label: 'Remaining', value: `$${remainingBudget.toLocaleString()}`, icon: '🪙', accent: 'text-ink' },
    { label: 'Pending Approvals', value: `${pendingApprovals}`, icon: '✋', accent: 'text-amber' },
    { label: 'Active Agents', value: `${activeAgents}`, icon: '🧬', accent: 'text-glow' },
    { label: 'Terminated', value: `${terminatedAgents}`, icon: '☠️', accent: 'text-coral' },
    { label: 'HUD Average', value: evaluations.length > 0 ? `${averageHudScore}` : '--', icon: '🎯', accent: 'text-violet', meter: evaluations.length > 0 ? averageHudScore : undefined },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass group relative overflow-hidden rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted">{card.label}</p>
            <span className="text-sm opacity-70 transition group-hover:scale-110">{card.icon}</span>
          </div>
          <p className={`mt-3 font-mono text-2xl font-semibold ${card.accent}`}>{card.value}</p>
          {typeof card.meter === 'number' && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${card.accent.replace('text-', 'bg-')}`}
                style={{ width: `${card.meter}%`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
