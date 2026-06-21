import type { Agent, Approval, HiringCandidate } from '../types';

export function ApprovalsPanel({
  approvals,
  agents,
  hiringCandidates,
  onApprove,
  onReject,
}: {
  approvals: Approval[];
  agents: Agent[];
  hiringCandidates: HiringCandidate[];
  onApprove: (approvalId: string) => Promise<void>;
  onReject: (approvalId: string) => Promise<void>;
}) {
  const candidatesByAgent = new Map<string, HiringCandidate[]>();
  hiringCandidates.forEach((candidate) => {
    candidatesByAgent.set(candidate.agentId, [...(candidatesByAgent.get(candidate.agentId) ?? []), candidate]);
  });

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Approvals</p>
          <p className="mt-1 text-lg font-semibold text-ink">Human-in-the-loop decisions</p>
        </div>
        <div className="rounded-full border border-line bg-cream px-3 py-1 text-xs font-medium text-steel">
          {approvals.filter((approval) => approval.status === 'pending').length} pending
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {approvals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-cream px-4 py-8 text-sm text-muted">
            No approvals yet. Run Phase 2 or the full demo to watch agents request budget and contractor help.
          </div>
        ) : (
          approvals
            .slice()
            .reverse()
            .map((approval) => {
              const agent = agents.find((item) => item.id === approval.agentId);
              const candidates = candidatesByAgent.get(approval.agentId) ?? [];
              const pending = approval.status === 'pending';
              return (
                <div key={approval.id} className="rounded-xl border border-line bg-cream p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-ink">{approval.title}</p>
                        <span className="rounded-full border border-yc/25 bg-ycSoft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-yc">
                          {approval.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-steel">
                        {agent?.name ?? 'Unknown Agent'} wants ${approval.amount.toLocaleString()}.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-steel">{approval.reason}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          approval.status === 'approved'
                            ? 'bg-lime/10 text-lime'
                            : approval.status === 'rejected'
                              ? 'bg-coral/10 text-coral'
                              : 'bg-cream text-steel'
                        }`}
                      >
                        {approval.status}
                      </span>
                      {pending ? (
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg bg-yc px-4 py-2 text-sm font-semibold text-white transition hover:bg-ycDark"
                            onClick={() => void onApprove(approval.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream"
                            onClick={() => void onReject(approval.id)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {approval.financeRecommendation ? (
                    <div className="mt-4 rounded-lg border border-line bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-lime/25 bg-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-lime">
                          Finance
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-steel">{approval.financeRecommendation}</span>
                      </div>
                      <p className="mt-2 text-sm text-steel">{approval.financeReasoning}</p>
                    </div>
                  ) : null}

                  {candidates.length > 0 ? (
                    <div className="mt-4 rounded-lg border border-line bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-line bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-steel">
                          SixtyFour
                        </span>
                        <span className="text-sm font-medium text-ink">Hiring candidates</span>
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        {candidates.map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border border-line bg-cream p-3">
                            <p className="text-sm font-semibold text-ink">{candidate.name}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-yc">{candidate.role}</p>
                            <p className="mt-2 text-sm text-steel">
                              {candidate.company} · {candidate.location}
                            </p>
                            <p className="mt-1 font-mono text-sm text-ink">${candidate.costEstimate.toLocaleString()}</p>
                            <p className="mt-2 text-xs leading-5 text-steel">{candidate.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
        )}
      </div>
    </section>
  );
}
