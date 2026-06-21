import OpenAI from 'openai';
import type { Agent, Company, CompanyMemoryEntry } from '../../types.js';

const hasKey = !!process.env.FIREWORKS_API_KEY;

const client = hasKey
  ? new OpenAI({
      apiKey: process.env.FIREWORKS_API_KEY,
      baseURL: 'https://api.fireworks.ai/inference/v1',
    })
  : null;

export interface FireworksReasoningResult {
  text: string;
  simulated: boolean;
  provider: string;
  trace: string[];
}

export interface FireworksAskResult {
  connected: boolean;
  content: string;
  usage?: unknown;
  error?: string;
  mode: 'live' | 'simulation';
}

export interface ReplacementAgentPlan {
  reasoning: string;
  agents: Array<{
    name: string;
    role: string;
    kpi: string;
  }>;
}

const defaultReplacementPlan: ReplacementAgentPlan = {
  reasoning: 'Marketing failed, so spawn specialist growth agents.',
  agents: [
    { name: 'TikTok Agent', role: 'Create viral short-form strategy', kpi: 'Generate low-cost leads' },
    { name: 'Partnership Agent', role: 'Find partner channels', kpi: 'Create 3 partnership opportunities' },
    { name: 'Conversion Agent', role: 'Improve landing page conversion', kpi: 'Increase conversion rate' },
  ],
};

export async function askFireworks(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  fallback = 'Simulated Fireworks response',
): Promise<FireworksAskResult> {
  if (!client) {
    return {
      connected: false,
      content: fallback,
      mode: 'simulation',
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/deepseek-v3p1',
      messages,
      temperature: 0.4,
      max_tokens: 700,
    });

    return {
      connected: true,
      content: response.choices[0]?.message?.content ?? fallback,
      usage: response.usage,
      mode: 'live',
    };
  } catch (err) {
    return {
      connected: false,
      content: fallback,
      error: err instanceof Error ? err.message : 'Unknown Fireworks error',
      mode: 'simulation',
    };
  }
}

export async function generateReasoning(prompt: string): Promise<FireworksReasoningResult> {
  const result = await askFireworks(
    [
      {
        role: 'system',
        content: 'You are an AI company operator. Return concise, actionable reasoning.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    `Fireworks Simulation: ${prompt}`,
  );

  return {
    text: result.content,
    simulated: result.mode !== 'live',
    provider: result.mode === 'live' ? 'Fireworks' : 'Fireworks Simulation',
    trace: [
      result.mode === 'live'
        ? 'Fireworks Chat Completions succeeded.'
        : 'FIREWORKS_API_KEY missing or Fireworks unavailable; using mock reasoning.',
      ...(result.error ? [result.error] : []),
    ],
  };
}

export async function decideNextAgents(input: {
  company: Company;
  failedAgent: Agent;
  hudScore: number;
  memory: CompanyMemoryEntry[];
}): Promise<ReplacementAgentPlan> {
  const result = await askFireworks(
    [
      {
        role: 'system',
        content: 'You are the CEO Agent of evoler.ai. Return only JSON.',
      },
      {
        role: 'user',
        content: `
Company: ${input.company.name}
Goal: ${input.company.idea}
Failed Agent: ${input.failedAgent.name}
HUD Score: ${input.hudScore}
Memory: ${JSON.stringify(input.memory.slice(-8))}

Create 2-3 better replacement agents.
Return JSON:
{
  "reasoning": "...",
  "agents": [
    {"name": "...", "role": "...", "kpi": "..."}
  ]
}
        `,
      },
    ],
    JSON.stringify(defaultReplacementPlan),
  );

  try {
    return JSON.parse(result.content) as ReplacementAgentPlan;
  } catch {
    return defaultReplacementPlan;
  }
}
