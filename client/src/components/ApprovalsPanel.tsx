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
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-glow">Approvals</p>
          <p className="mt-2 text-xl font-semibold">Human-in-the-loop decisions</p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-steel">
          {approvals.filter((approval) => approval.status === 'pending').length} pending
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {approvals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-steel">
            No approvals yet. Run Phase 2 to watch agents request budget and contractor help.
          </div>
        ) : (
          approvals
            .slice()
            .reverse()
            .map((approval) => {
              const agent = agents.find((item) => item.id === approval.agentId);
              const candidates = candidatesByAgent.get(approval.agentId) ?? [];
              return (
                <div key={approval.id} className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">{approval.title}</p>
                        <span className="rounded-full border border-coral/30 bg-coral/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-coral">
                          {approval.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-steel">
                        {agent?.name ?? 'Unknown Agent'} wants ${approval.amount.toLocaleString()}.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-steel/90">{approval.reason}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-steel">
                        {approval.status}
                      </div>
                      {approval.status === 'pending' ? (
                        <>
                          <button
                            className="rounded-2xl bg-glow px-4 py-2 text-sm font-semibold text-slate-950"
                            onClick={() => void onApprove(approval.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                            onClick={() => void onReject(approval.id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {approval.financeRecommendation ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-lime/25 bg-lime/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-lime">
                          Finance
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-steel">{approval.financeRecommendation}</span>
                      </div>
                      <p className="mt-2 text-sm text-steel">{approval.financeReasoning}</p>
                    </div>
                  ) : null}

                  {candidates.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
                          SixtyFour
                        </span>
                        <span className="text-sm font-medium text-white">Hiring candidates</span>
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        {candidates.map((candidate) => (
                          <div key={candidate.id} className="rounded-2xl border border-white/10 bg-[#101828] p-3">
                            <p className="text-sm font-semibold text-white">{candidate.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-glow">{candidate.role}</p>
                            <p className="mt-2 text-sm text-steel">{candidate.company} · {candidate.location}</p>
                            <p className="mt-2 text-sm text-steel">${candidate.costEstimate.toLocaleString()}</p>
                            <p className="mt-2 text-xs leading-5 text-steel/90">{candidate.reason}</p>
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
