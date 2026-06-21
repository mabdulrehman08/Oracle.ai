import type { Verdict } from './types.js';

export const evaluateTaskOutput = (taskOutput: string): { score: number; verdict: Verdict; reasoning: string } => {
  const normalized = taskOutput.toLowerCase();

  if (normalized.includes('generic channel strategy') || normalized.includes('specialized growth agents')) {
    return {
      score: 34,
      verdict: 'fail',
      reasoning: 'Generic channel strategy. Needs specialized growth agents.',
    };
  }

  if (normalized.includes('deepl') || normalized.includes('competitor') || normalized.includes('market gap')) {
    return {
      score: 88,
      verdict: 'pass',
      reasoning: 'Strong competitor analysis with clear market gap.',
    };
  }

  return {
    score: 62,
    verdict: 'pass',
    reasoning: 'Solid execution with room for sharper specialization.',
  };
};
