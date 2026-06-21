import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { AgentStatus } from '../types';

/* -------------------------------------------------------------------------- */
/*  Panel — the clean white card used everywhere                               */
/* -------------------------------------------------------------------------- */

interface PanelProps {
  eyebrow?: string;
  title?: string;
  badge?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({ eyebrow, title, badge, className, bodyClassName, children }: PanelProps) {
  return (
    <section className={clsx('glass rounded-2xl p-5', className)}>
      {(eyebrow || title || badge) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yc">{eyebrow}</p>}
            {title && <p className="mt-1.5 text-lg font-semibold text-ink">{title}</p>}
          </div>
          {badge}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chip / Tag                                                                 */
/* -------------------------------------------------------------------------- */

export function Chip({
  children,
  tone = 'steel',
  className,
}: {
  children: ReactNode;
  tone?: 'steel' | 'glow' | 'coral' | 'lime' | 'violet' | 'amber';
  className?: string;
}) {
  const tones: Record<string, string> = {
    steel: 'border-line bg-cream text-steel',
    glow: 'border-yc/25 bg-ycSoft text-yc',
    coral: 'border-coral/25 bg-coral/10 text-coral',
    lime: 'border-lime/25 bg-lime/10 text-lime',
    violet: 'border-violet/25 bg-violet/10 text-violet',
    amber: 'border-amber/25 bg-amber/10 text-amber',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Agent status helpers                                                       */
/* -------------------------------------------------------------------------- */

export const statusMeta: Record<AgentStatus, { label: string; tone: string; dot: string; ring: string }> = {
  idle: { label: 'Idle', tone: 'text-muted', dot: 'bg-muted', ring: '#8a857c' },
  working: { label: 'Working', tone: 'text-yc', dot: 'bg-yc', ring: '#ff6600' },
  executing: { label: 'Executing', tone: 'text-violet', dot: 'bg-violet', ring: '#7c3aed' },
  spawned: { label: 'Spawned', tone: 'text-lime', dot: 'bg-lime', ring: '#16a34a' },
  completed: { label: 'Completed', tone: 'text-lime', dot: 'bg-lime', ring: '#16a34a' },
  terminated: { label: 'Terminated', tone: 'text-coral', dot: 'bg-coral', ring: '#e5484d' },
};

export function StatusDot({ status, pulse }: { status: AgentStatus; pulse?: boolean }) {
  const meta = statusMeta[status];
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', meta.dot)} />}
      <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', meta.dot)} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  ScoreRing — circular HUD score gauge                                       */
/* -------------------------------------------------------------------------- */

export function ScoreRing({
  score,
  size = 64,
  stroke = 6,
  label,
}: {
  score?: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const value = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = value === null ? circumference : circumference * (1 - value / 100);
  const color = value === null ? '#cdc7bc' : value >= 70 ? '#16a34a' : value >= 45 ? '#d97706' : '#e5484d';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(27,26,23,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-mono text-base font-semibold text-ink">{value === null ? '--' : value}</span>
        {label && <span className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-muted">{label}</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({ icon, children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-cream px-4 py-10 text-center">
      {icon && <span className="text-2xl opacity-70">{icon}</span>}
      <p className="max-w-sm text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}
