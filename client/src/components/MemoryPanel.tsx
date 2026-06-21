import type { CompanyMemoryEntry } from '../types';

export function MemoryPanel({ memory }: { memory: CompanyMemoryEntry[] }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Memory</p>
      <p className="mt-1 text-lg font-semibold text-ink">Company memory stream</p>

      <div className="mt-4 space-y-3">
        {memory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-cream px-4 py-8 text-sm text-muted">
            Memory entries will appear here as agents save useful findings.
          </div>
        ) : (
          memory
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="rounded-xl border border-line bg-cream p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{entry.title}</p>
                  <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-steel">
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
