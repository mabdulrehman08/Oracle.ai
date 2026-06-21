import { useEffect, useRef } from 'react';
import type { EventRecord } from '../types';

const dotFor = (type: string): string => {
  if (type.includes('terminated') || type.includes('reject') || type.includes('fail')) return 'bg-coral';
  if (type.includes('spawn') || type.includes('created') || type.includes('approv')) return 'bg-lime';
  if (type.includes('evolv') || type.includes('genome') || type.includes('mutat')) return 'bg-violet';
  if (type.includes('sandbox') || type.includes('parallel') || type.includes('execut')) return 'bg-amber';
  if (type.includes('hud') || type.includes('evaluat')) return 'bg-yc';
  return 'bg-muted';
};

export function Timeline({ events }: { events: EventRecord[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [events]);

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">Timeline</p>
          <p className="mt-1 text-lg font-semibold text-ink">Live evolution log</p>
        </div>
        <span className="rounded-full border border-line bg-cream px-2.5 py-1 font-mono text-[10px] text-steel">
          {events.length} events
        </span>
      </div>
      <div ref={containerRef} className="mt-4 h-[300px] overflow-y-auto pr-1">
        <div className="relative ml-1 space-y-1 border-l border-line pl-4">
          {events.length === 0 ? (
            <p className="py-8 text-sm text-muted">The log will stream live as agents act.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="animate-rise relative py-2">
                <span className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-white ${dotFor(event.type)}`} />
                <div className="rounded-xl border border-line bg-cream px-3 py-2 transition hover:border-yc/40">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-5 text-ink">{event.message}</p>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">{event.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
