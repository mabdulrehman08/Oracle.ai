import { useEffect, useRef } from 'react';

/**
 * NeuralBackground
 * A living "brain" / synaptic network rendered on a fixed full-viewport canvas.
 * Drifting neurons wire themselves to nearby neighbours, orange signal pulses
 * fire along the synapses, hub neurons breathe, and the whole web reaches toward
 * the cursor. Pure canvas — no dependencies. Tuned for the white/orange theme.
 */

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean;
  phase: number;
}

interface Pulse {
  a: number;
  b: number;
  t: number;
  speed: number;
}

const ORANGE = '255, 102, 0';
const INK = '27, 26, 23';
const CONNECT = 158; // px to wire two neurons
const MOUSE_RADIUS = 240;
const MAX_PULSES = 46;

export function NeuralBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let neurons: Neuron[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let lastSpawn = 0;
    let running = true;
    const mouse = { x: -9999, y: -9999, active: false };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(36, Math.min(96, Math.floor((width * height) / 15000)));
      neurons = [];
      for (let i = 0; i < count; i++) {
        const hub = Math.random() < 0.16;
        neurons.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: hub ? 2.6 + Math.random() * 1.8 : 1.0 + Math.random() * 1.1,
          hub,
          phase: Math.random() * Math.PI * 2,
        });
      }
      pulses = [];
    };

    const neighbour = (i: number): number => {
      let best = -1;
      let bd = CONNECT * CONNECT;
      for (let j = 0; j < neurons.length; j++) {
        if (j === i) continue;
        const dx = neurons[i].x - neurons[j].x;
        const dy = neurons[i].y - neurons[j].y;
        const d = dx * dx + dy * dy;
        if (d < bd && Math.random() < 0.55) {
          best = j;
          bd = d;
        }
      }
      return best;
    };

    const spawnPulse = () => {
      if (neurons.length < 2 || pulses.length >= MAX_PULSES) return;
      const a = Math.floor(Math.random() * neurons.length);
      const b = neighbour(a);
      if (b >= 0) pulses.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.012 });
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // --- move neurons ---
      for (const n of neurons) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          n.x = Math.max(0, Math.min(width, n.x));
          n.y = Math.max(0, Math.min(height, n.y));
          if (mouse.active) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const d = Math.hypot(dx, dy);
            if (d < MOUSE_RADIUS && d > 1) {
              const f = (1 - d / MOUSE_RADIUS) * 0.4;
              n.x += (dx / d) * f;
              n.y += (dy / d) * f;
            }
          }
        }
      }

      // --- hub halos (breathing brain regions) ---
      for (const n of neurons) {
        if (!n.hub) continue;
        const breath = 0.5 + 0.5 * Math.sin(time * 0.0014 + n.phase);
        const radius = 26 + breath * 26;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius);
        grad.addColorStop(0, `rgba(${ORANGE}, ${0.06 + breath * 0.05})`);
        grad.addColorStop(1, `rgba(${ORANGE}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- synapses ---
      ctx.lineWidth = 1;
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[i].x - neurons[j].x;
          const dy = neurons[i].y - neurons[j].y;
          const d = Math.hypot(dx, dy);
          if (d > CONNECT) continue;
          const a = (1 - d / CONNECT) * 0.16;
          ctx.strokeStyle = `rgba(${INK}, ${a})`;
          ctx.beginPath();
          ctx.moveTo(neurons[i].x, neurons[i].y);
          ctx.lineTo(neurons[j].x, neurons[j].y);
          ctx.stroke();
        }
      }

      // --- reactive web reaching for the cursor ---
      if (mouse.active) {
        for (const n of neurons) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d > MOUSE_RADIUS) continue;
          const a = (1 - d / MOUSE_RADIUS) * 0.5;
          ctx.strokeStyle = `rgba(${ORANGE}, ${a})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${ORANGE}, 0.9)`;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- neuron bodies ---
      for (const n of neurons) {
        ctx.fillStyle = n.hub ? `rgba(${ORANGE}, 0.6)` : `rgba(${INK}, 0.32)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- firing signal pulses ---
      if (!reduce) {
        ctx.shadowColor = `rgba(${ORANGE}, 0.9)`;
        for (let p = pulses.length - 1; p >= 0; p--) {
          const pulse = pulses[p];
          const a = neurons[pulse.a];
          const b = neurons[pulse.b];
          if (!a || !b) {
            pulses.splice(p, 1);
            continue;
          }
          pulse.t += pulse.speed;
          const x = a.x + (b.x - a.x) * pulse.t;
          const y = a.y + (b.y - a.y) * pulse.t;
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(${ORANGE}, ${Math.max(0, 1 - pulse.t * 0.4)})`;
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          if (pulse.t >= 1) {
            pulses.splice(p, 1);
            // chain the signal onward — propagating thought
            if (Math.random() < 0.62) {
              const next = neighbour(pulse.b);
              if (next >= 0) pulses.push({ a: pulse.b, b: next, t: 0, speed: pulse.speed });
            }
          }
        }
        ctx.shadowBlur = 0;
      }

      if (!reduce && time - lastSpawn > 240) {
        spawnPulse();
        lastSpawn = time;
      }

      if (running) raf = requestAnimationFrame(render);
    };

    const onResize = () => build();
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };

    build();
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduce) {
      render(0); // single static frame
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen"
    />
  );
}
