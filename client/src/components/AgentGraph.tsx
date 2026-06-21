import { useEffect, useRef } from 'react';
import type { Agent, AgentStatus } from '../types';

/**
 * AgentGraph — a force-directed "knowledge graph" of the company's agents.
 * Nodes repel, parent→child links act as springs, the layout breathes, and the
 * whole thing reacts to hover / drag. Working agents pulse and fire signals down
 * their links; terminated agents fade out (deletion you can watch happen).
 * Pure canvas, dark surface to match the brain hero.
 */

interface GNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  appear: number; // 0→1 spawn animation
  fade: number; // 1→0 when terminated
}

const COLORS: Record<AgentStatus, string> = {
  working: '255, 102, 0',
  executing: '167, 88, 250',
  spawned: '34, 197, 94',
  completed: '22, 163, 74',
  idle: '159, 178, 204',
  terminated: '120, 120, 132',
};

const ALIVE: AgentStatus[] = ['working', 'executing', 'spawned'];

export function AgentGraph({ agents, onSelectAgent }: { agents: Agent[]; onSelectAgent: (agentId: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const agentsRef = useRef(agents);
  const selectRef = useRef(onSelectAgent);
  const nodesRef = useRef<Map<string, GNode>>(new Map());

  agentsRef.current = agents;
  selectRef.current = onSelectAgent;

  // keep the node map in sync with the agent list
  useEffect(() => {
    const map = nodesRef.current;
    const seen = new Set<string>();
    agents.forEach((agent) => {
      seen.add(agent.id);
      if (!map.has(agent.id)) {
        const parent = agent.parentAgentId ? map.get(agent.parentAgentId) : undefined;
        map.set(agent.id, {
          id: agent.id,
          x: (parent?.x ?? 0) + (Math.random() - 0.5) * 80,
          y: (parent?.y ?? 0) + (Math.random() - 0.5) * 80,
          vx: 0,
          vy: 0,
          r: 6,
          appear: 0,
          fade: 1,
        });
      }
    });
    // drop nodes whose agent vanished entirely (rare; terminated still stay in list)
    for (const id of [...map.keys()]) if (!seen.has(id)) map.delete(id);
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    const mouse = { x: 0, y: 0, inside: false };
    let hoverId: string | null = null;
    let dragId: string | null = null;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const radiusFor = (agent: Agent, childCount: number) => {
      let r = 7 + childCount * 2.4;
      if (agent.isCore) r += 4;
      if (typeof agent.score === 'number') r += (agent.score / 100) * 4;
      return Math.min(22, r);
    };

    const nodeAt = (mx: number, my: number): string | null => {
      const map = nodesRef.current;
      let found: string | null = null;
      let best = Infinity;
      map.forEach((n) => {
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d < n.r + 8 && d < best) {
          best = d;
          found = n.id;
        }
      });
      return found;
    };

    const toLocal = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left - width / 2, y: e.clientY - rect.top - height / 2 };
    };

    const onMove = (e: MouseEvent) => {
      const p = toLocal(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.inside = true;
      if (dragId) {
        const n = nodesRef.current.get(dragId);
        if (n) {
          n.x = p.x;
          n.y = p.y;
          n.vx = 0;
          n.vy = 0;
        }
      } else {
        hoverId = nodeAt(p.x, p.y);
        canvas.style.cursor = hoverId ? 'pointer' : 'default';
      }
    };
    const onDown = (e: MouseEvent) => {
      const p = toLocal(e);
      dragId = nodeAt(p.x, p.y);
    };
    const onUp = () => {
      if (dragId) {
        selectRef.current(dragId);
        dragId = null;
      }
    };
    const onLeave = () => {
      mouse.inside = false;
      hoverId = null;
      dragId = null;
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onLeave);

    const frame = (time: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      const list = agentsRef.current;
      const map = nodesRef.current;
      const byId = new Map(list.map((a) => [a.id, a]));

      // child counts for sizing
      const childCount = new Map<string, number>();
      list.forEach((a) => {
        if (a.parentAgentId) childCount.set(a.parentAgentId, (childCount.get(a.parentAgentId) ?? 0) + 1);
      });

      // ---- physics ----
      const nodes = [...map.values()];
      if (!reduce) {
        // repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) {
              d2 = 1;
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
            }
            const d = Math.sqrt(d2);
            const force = 2600 / d2;
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
        // springs along parent→child
        list.forEach((agent) => {
          if (!agent.parentAgentId) return;
          const a = map.get(agent.id);
          const b = map.get(agent.parentAgentId);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const target = 110;
          const k = (d - target) * 0.015;
          const fx = (dx / d) * k;
          const fy = (dy / d) * k;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        });
        // gravity to center + integrate
        nodes.forEach((n) => {
          if (n.id === dragId) return;
          n.vx += -n.x * 0.004;
          n.vy += -n.y * 0.004;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += Math.max(-6, Math.min(6, n.vx));
          n.y += Math.max(-6, Math.min(6, n.vy));
        });
      }

      // animations + radius easing
      nodes.forEach((n) => {
        const agent = byId.get(n.id);
        n.appear = Math.min(1, n.appear + 0.05);
        const dead = agent?.status === 'terminated';
        n.fade += ((dead ? 0.32 : 1) - n.fade) * 0.06;
        const target = agent ? radiusFor(agent, childCount.get(n.id) ?? 0) : 6;
        n.r += (target - n.r) * 0.1;
      });

      // ---- draw ----
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);

      const hl = hoverId;
      const neighbours = new Set<string>();
      if (hl) {
        neighbours.add(hl);
        list.forEach((a) => {
          if (a.id === hl && a.parentAgentId) neighbours.add(a.parentAgentId);
          if (a.parentAgentId === hl) neighbours.add(a.id);
        });
      }

      // edges
      list.forEach((agent) => {
        if (!agent.parentAgentId) return;
        const a = map.get(agent.id);
        const b = map.get(agent.parentAgentId);
        if (!a || !b) return;
        const active = ALIVE.includes(agent.status);
        const dim = hl ? (neighbours.has(agent.id) ? 1 : 0.18) : 1;
        const baseA = Math.min(a.fade, b.fade) * dim;
        ctx.strokeStyle = active ? `rgba(255,102,0,${0.5 * baseA})` : `rgba(159,178,204,${0.16 * baseA})`;
        ctx.lineWidth = active ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // signal travelling parent → child on live edges
        if (active && !reduce) {
          const t = ((time * 0.0006 + (a.x + a.y) * 0.01) % 1 + 1) % 1;
          const sx = b.x + (a.x - b.x) * t;
          const sy = b.y + (a.y - b.y) * t;
          ctx.fillStyle = `rgba(255,180,90,${baseA})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // nodes
      ctx.textAlign = 'center';
      ctx.font = '600 11px Inter, sans-serif';
      nodes.forEach((n) => {
        const agent = byId.get(n.id);
        if (!agent) return;
        const color = COLORS[agent.status];
        const alive = ALIVE.includes(agent.status);
        const dim = hl ? (neighbours.has(n.id) ? 1 : 0.22) : 1;
        const alpha = n.fade * n.appear * dim;
        const pulse = alive && !reduce ? 1 + 0.18 * Math.sin(time * 0.005 + n.x) : 1;
        const r = n.r * n.appear * pulse;

        // glow halo
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.4);
        halo.addColorStop(0, `rgba(${color}, ${0.5 * alpha})`);
        halo.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3.4, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // ring for hovered / selected
        if (n.id === hl) {
          ctx.strokeStyle = `rgba(255,255,255,${0.8 * alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // label
        const labelA = (hl ? (neighbours.has(n.id) ? 0.95 : 0.25) : 0.78) * n.fade * n.appear;
        ctx.fillStyle = `rgba(235,235,245,${labelA})`;
        ctx.fillText(agent.name, n.x, n.y + r + 13);
        if (agent.status === 'terminated') {
          const w = ctx.measureText(agent.name).width;
          ctx.strokeStyle = `rgba(229,72,77,${labelA})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x - w / 2, n.y + r + 9);
          ctx.lineTo(n.x + w / 2, n.y + r + 9);
          ctx.stroke();
        }
      });

      ctx.restore();
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // ---- live counts ----
  const counts = agents.reduce(
    (acc, a) => {
      acc.total += 1;
      if (a.status === 'terminated') acc.terminated += 1;
      else acc.active += 1;
      if (a.status === 'working') acc.working += 1;
      if (a.status === 'executing') acc.executing += 1;
      return acc;
    },
    { total: 0, active: 0, working: 0, executing: 0, terminated: 0 },
  );

  const legend = [
    { label: 'Active', value: counts.active, dot: 'bg-lime', text: 'text-lime' },
    { label: 'Working', value: counts.working, dot: 'bg-yc', text: 'text-yc' },
    { label: 'Executing', value: counts.executing, dot: 'bg-violet', text: 'text-violet' },
    { label: 'Terminated', value: counts.terminated, dot: 'bg-coral', text: 'text-coral' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07060b]">
      {/* live counts */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        {legend.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur"
          >
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            <span className="text-[11px] font-medium text-white/70">{item.label}</span>
            <span className={`font-mono text-xs font-semibold ${item.text}`}>{item.value}</span>
          </div>
        ))}
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/50 backdrop-blur">
        {counts.total} agents · drag to explore · click to inspect
      </div>
      <div ref={wrapRef} className="h-[560px] w-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
