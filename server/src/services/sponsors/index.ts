import type { SponsorStatus } from '../../types.js';

const envStates = [
  {
    id: 'hud',
    name: 'HUD',
    purpose: 'Evaluation and natural selection',
    badge: 'HUD',
    detail: 'Evaluates every agent task and recommends keep, kill, split, or replace.',
    key: process.env.HUD_API_KEY,
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    purpose: 'Agent reasoning',
    badge: 'Fireworks',
    detail: 'Powers agent reasoning and narrative summaries.',
    key: process.env.FIREWORKS_API_KEY,
  },
  {
    id: 'exa',
    name: 'Exa',
    purpose: 'Research',
    badge: 'Exa',
    detail: 'Finds competitor intelligence and market context.',
    key: process.env.EXA_API_KEY,
  },
  {
    id: 'daytona',
    name: 'Daytona',
    purpose: 'Coding sandbox',
    badge: 'Daytona',
    detail: 'Runs Product Agent code tasks and previews generated work.',
    key: process.env.DAYTONA_API_KEY,
  },
  {
    id: 'modal',
    name: 'Modal',
    purpose: 'Parallel execution',
    badge: 'Modal',
    detail: 'Coordinates multiple specialist agents in parallel.',
    key: process.env.MODAL_API_KEY,
  },
  {
    id: 'sixtyfour',
    name: 'SixtyFour',
    purpose: 'Hiring research',
    badge: 'SixtyFour',
    detail: 'Finds contractors and relevant creative partners.',
    key: process.env.SIXTYFOUR_API_KEY,
  },
] as const;

export function getSponsorStatuses(): SponsorStatus[] {
  return envStates.map((item) => ({
    id: item.id,
    name: item.name,
    purpose: item.purpose,
    badge: item.badge,
    detail: item.detail,
    mode: item.key ? 'connected' : 'simulated',
  }));
}
