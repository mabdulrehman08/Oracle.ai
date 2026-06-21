import { useEffect, useRef } from 'react';
import type { EventRecord } from '../types';

export function Timeline({ events }: { events: EventRecord[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [events]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-glow">Timeline</p>
      <p className="mt-2 text-xl font-semibold">Live evolution log</p>
      <div ref={containerRef} className="mt-4 h-[280px] space-y-3 overflow-y-auto pr-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-white">{event.message}</p>
              <span className="text-[10px] uppercase tracking-[0.25em] text-steel">{event.type.replace(/_/g, ' ')}</span>
            </div>
            <p className="mt-2 text-xs text-steel">{new Date(event.createdAt).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
