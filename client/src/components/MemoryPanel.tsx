import type { CompanyMemoryEntry } from '../types';

export function MemoryPanel({ memory }: { memory: CompanyMemoryEntry[] }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-glow">Memory</p>
      <p className="mt-2 text-xl font-semibold">Company memory stream</p>

      <div className="mt-4 space-y-3">
        {memory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-steel">
            Memory entries will appear here as agents save useful findings.
          </div>
        ) : (
          memory
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{entry.title}</p>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-steel">
                    {entry.source}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-steel">{entry.content}</p>
              </div>
            ))
        )}
      </div>
    </section>
  );
}
