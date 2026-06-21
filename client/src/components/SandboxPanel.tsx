import type { Agent, SandboxRun } from '../types';

export function SandboxPanel({ sandboxRuns, agents }: { sandboxRuns: SandboxRun[]; agents: Agent[] }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Sandbox</p>
        <span className="rounded-full border border-line bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-steel">
          Daytona
        </span>
      </div>
      <p className="mt-1 text-lg font-semibold text-ink">Product agent runs</p>

      <div className="mt-4 space-y-4">
        {sandboxRuns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-cream px-4 py-8 text-sm text-muted">
            No sandbox runs yet. Phase 2 launches a mock coding task automatically.
          </div>
        ) : (
          sandboxRuns
            .slice()
            .reverse()
            .map((run) => {
              const agent = agents.find((item) => item.id === run.agentId);
              return (
                <div key={run.id} className="rounded-xl border border-line bg-cream p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink">{run.taskTitle}</p>
                      <p className="mt-1 text-sm text-steel">{agent?.name ?? 'Unknown Agent'}</p>
                    </div>
                    <div className="rounded-full border border-yc/25 bg-ycSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-yc">
                      {run.status}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-lg border border-line bg-[#1b1a17] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Logs</p>
                      <div className="mt-3 space-y-1.5 font-mono text-xs text-lime">
                        {run.logs.map((log, index) => (
                          <p key={`${run.id}-${index}`}>
                            <span className="text-white/30">$</span> {log}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-line bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">Files Changed</p>
                      <div className="mt-3 space-y-1.5 font-mono text-xs text-ink">
                        {run.filesChanged.map((file) => (
                          <p key={file}>{file}</p>
                        ))}
                      </div>
                      {run.previewUrl ? (
                        <a
                          className="mt-4 inline-block text-sm font-semibold text-yc underline-offset-2 hover:underline"
                          href={run.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open preview →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </section>
  );
}
