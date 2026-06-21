import type { Agent, SandboxRun } from '../types';

export function SandboxPanel({ sandboxRuns, agents }: { sandboxRuns: SandboxRun[]; agents: Agent[] }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-glow">Sandbox</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
          Daytona
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold">Product agent runs</p>

      <div className="mt-4 space-y-4">
        {sandboxRuns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-steel">
            No sandbox runs yet. Phase 2 launches a mock coding task automatically.
          </div>
        ) : (
          sandboxRuns
            .slice()
            .reverse()
            .map((run) => {
              const agent = agents.find((item) => item.id === run.agentId);
              return (
                <div key={run.id} className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{run.taskTitle}</p>
                      <p className="mt-1 text-sm text-steel">{agent?.name ?? 'Unknown Agent'}</p>
                    </div>
                    <div className="rounded-full border border-glow/30 bg-glow/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-glow">
                      {run.status}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-steel">Logs</p>
                      <div className="mt-3 space-y-2 text-sm text-steel">
                        {run.logs.map((log, index) => (
                          <p key={`${run.id}-${index}`}>{log}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-steel">Files Changed</p>
                      <div className="mt-3 space-y-2 text-sm text-white">
                        {run.filesChanged.map((file) => (
                          <p key={file}>{file}</p>
                        ))}
                      </div>
                      {run.previewUrl ? (
                        <a className="mt-4 inline-block text-sm font-semibold text-glow underline" href={run.previewUrl} target="_blank" rel="noreferrer">
                          Open preview
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
