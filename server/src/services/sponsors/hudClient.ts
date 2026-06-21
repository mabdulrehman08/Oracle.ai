import type { Agent, Company, CompanyMemoryEntry, HudDecision } from '../../types.js';

export interface HudTaskInput {
  title: string;
  role?: string;
  goal?: string;
}

export interface HudEvaluationInput {
  company: Company;
  agent: Agent;
  task: HudTaskInput;
  output: string;
  memory: CompanyMemoryEntry[];
}

export interface HudEvaluationResult {
  score: number;
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
  decision: HudDecision;
  suggestedAgents: string[];
  confidence: number;
  pass: boolean;
  verdict: 'pass' | 'fail';
  trace: string[];
  provider: string;
  simulated: boolean;
}

const apiKey = process.env.HUD_API_KEY;

const hasAny = (value: string, patterns: string[]) => patterns.some((pattern) => value.includes(pattern));

const toVerdict = (score: number) => ({
  pass: score >= 50,
  verdict: score >= 50 ? ('pass' as const) : ('fail' as const),
});

const scoreToDecision = (score: number): HudDecision => {
  if (score >= 80) return 'keep';
  if (score >= 50) return 'specialize';
  if (score >= 25) return 'replace';
  return 'terminate';
};

const buildSimulation = (input: HudEvaluationInput): HudEvaluationResult => {
  const normalizedOutput = input.output.toLowerCase();
  const normalizedTask = input.task.title.toLowerCase();
  const normalizedRole = input.agent.role.toLowerCase();
  const priorFailures = input.memory.filter((entry) => entry.content.toLowerCase().includes('score:') && entry.content.toLowerCase().includes('replacement')).length;

  let score = 64;
  let strengths = ['Delivered a usable intermediate result.'];
  let weaknesses = ['Execution still needs tighter specialization.'];
  let reasoning = [
    `${input.agent.name} completed ${input.task.title} for ${input.company.idea}.`,
    'HUD simulation judged the work as useful but not yet category-defining.',
  ];
  let suggestedAgents = ['Specialist Agent'];

  if (
    hasAny(normalizedOutput, ['competitor', 'pricing', 'market gap', 'pain point']) ||
    hasAny(normalizedTask, ['research', 'competitors']) ||
    normalizedRole.includes('research')
  ) {
    score = 87;
    strengths = ['Strong competitor discovery.', 'Pricing and pain-point analysis are clearly surfaced.'];
    weaknesses = ['Could add deeper primary-customer evidence.'];
    reasoning = [
      'Research output found competitors, pricing anchors, market gaps, and pain points.',
      'This gives the CEO enough signal to specialize downstream growth and product work.',
    ];
    suggestedAgents = ['TikTok Agent', 'SEO Agent'];
  } else if (
    hasAny(normalizedOutput, ['generic channel', 'no segmentation', 'generic growth', 'broad strategy']) ||
    normalizedRole.includes('marketing')
  ) {
    score = 31;
    strengths = ['Started a growth direction quickly.'];
    weaknesses = ['Too generic.', 'No customer segmentation.', 'No channel-specific execution plan.'];
    reasoning = [
      'Marketing work stayed broad instead of choosing a target audience and channel.',
      'HUD recommends replacing this generalist with specialist operators.',
    ];
    suggestedAgents = ['TikTok Agent', 'Partnership Agent', 'Conversion Agent'];
  } else if (normalizedRole.includes('finance') || normalizedTask.includes('budget')) {
    score = 82;
    strengths = ['Protected runway.', 'Made a clear capital-allocation recommendation.'];
    weaknesses = ['Could include expected ROI ranges.'];
    reasoning = [
      'Finance reviewed spend with an explicit go/no-go stance.',
      'This is strong enough to keep the operator and save the strategy to memory.',
    ];
    suggestedAgents = [];
  } else if (normalizedRole.includes('hiring') || normalizedTask.includes('contractor')) {
    score = 73;
    strengths = ['Generated practical candidate options.', 'Reduced execution bottlenecks.'];
    weaknesses = ['Candidate quality still needs a narrower skill match.'];
    reasoning = [
      'Hiring produced helpful options, but not enough precision to fully close the gap.',
      'HUD recommends a specialist follow-up rather than broad replacement.',
    ];
    suggestedAgents = ['Conversion Agent'];
  } else if (normalizedRole.includes('product') || hasAny(normalizedOutput, ['landing page', 'pricing page', 'sandbox'])) {
    score = 76;
    strengths = ['Product execution created visible assets.', 'The sandbox output is demo-ready.'];
    weaknesses = ['Conversion optimization remains underdeveloped.'];
    reasoning = [
      'Product shipped meaningful progress, but conversion design is still weak.',
      'A specialist can compound this output faster than a full reset.',
    ];
    suggestedAgents = ['Conversion Agent'];
  } else if (normalizedRole.includes('ceo') || normalizedTask.includes('plan')) {
    score = 84;
    strengths = ['Created a coherent operating sequence.', 'Connected memory to next actions.'];
    weaknesses = ['Could specify tighter success metrics for each spawned agent.'];
    reasoning = [
      'CEO reasoning created a credible evolution plan for the company.',
      'HUD views this as a strong orchestration step that should remain in memory.',
    ];
    suggestedAgents = [];
  }

  if (priorFailures >= 3 && score < 80) {
    reasoning.push('HUD detected repeated historical failures in memory and increased pressure to specialize faster.');
    if (score >= 50 && suggestedAgents.length === 0) {
      suggestedAgents = ['Specialist Agent'];
    }
  }

  const decision = scoreToDecision(score);
  const verdict = toVerdict(score);

  return {
    score,
    reasoning,
    strengths,
    weaknesses,
    decision,
    suggestedAgents,
    confidence: Math.max(0.61, Math.min(0.96, score / 100 + 0.08)),
    ...verdict,
    trace: [
      apiKey ? 'HUD API key detected.' : 'HUD Simulation Mode.',
      `Decision heuristic: ${decision}.`,
      `Company memory samples used: ${Math.min(input.memory.length, 8)}.`,
    ],
    provider: apiKey ? 'HUD Compatible Simulation' : 'HUD Simulation Mode',
    simulated: true,
  };
};

async function tryRealHud(_input: HudEvaluationInput): Promise<HudEvaluationResult | null> {
  if (!apiKey) return null;

  try {
    // Future HUD SDK/API integration belongs here.
    return null;
  } catch (error) {
    console.error('HUD client failed, using simulation fallback.', error);
    return null;
  }
}

export async function evaluateAgentTask(input: HudEvaluationInput): Promise<HudEvaluationResult> {
  const live = await tryRealHud(input);
  if (live) {
    return live;
  }

  return buildSimulation(input);
}

export const evaluateWithHud = evaluateAgentTask;
