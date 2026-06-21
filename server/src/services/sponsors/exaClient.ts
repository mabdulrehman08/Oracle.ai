const apiKey = process.env.EXA_API_KEY;

export interface ExaResearchResult {
  findings: string[];
  simulated: boolean;
  provider: string;
  trace: string[];
}

const buildMock = (query: string): ExaResearchResult => ({
  findings: [
    'DeepL: strong translation quality, B2B pricing',
    'Google Translate: massive distribution, free/low-cost',
    'Papago: strong Asian language support',
    'ElevenLabs Dubbing: voice/video translation angle',
    `Opportunity: niche vertical AI translator for creators and businesses around "${query}"`,
    'Pain point: generic translation misses vertical-specific creator and business workflows',
  ],
  simulated: true,
  provider: 'Exa Simulation',
  trace: ['EXA_API_KEY missing or Exa unavailable; returning mock competitor, pricing, gap, and pain-point data.'],
});

export async function researchCompetitors(query: string): Promise<ExaResearchResult> {
  if (!apiKey) {
    return buildMock(query);
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query: `${query}. Find competitors, pricing, market gaps, and customer pain points for this company idea.`,
        type: 'auto',
        numResults: 5,
        contents: {
          highlights: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa search failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        summary?: string;
        highlights?: string[];
        text?: string;
      }>;
      requestId?: string;
    };

    const findings =
      payload.results?.map((result) => {
        const parts = [result.title, result.highlights?.[0], result.highlights?.[1], result.url]
          .filter(Boolean)
          .join(': ');
        return parts;
      }).filter(Boolean) ?? [];

    if (findings.length === 0) {
      throw new Error('Exa returned no structured findings');
    }

    return {
      findings,
      simulated: false,
      provider: 'Exa',
      trace: [
        'Exa search type: auto',
        'Exa contents mode: highlights',
        `Exa search completed${payload.requestId ? ` (request ${payload.requestId})` : ''}.`,
      ],
    };
  } catch (error) {
    console.error('Exa client failed, using simulation fallback.', error);
    const fallback = buildMock(query);
    return {
      ...fallback,
      trace: [...fallback.trace, error instanceof Error ? error.message : 'Unknown Exa error'],
    };
  }
}
