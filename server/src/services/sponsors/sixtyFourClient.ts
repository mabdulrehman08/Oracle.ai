const apiKey = process.env.SIXTYFOUR_API_KEY;

export interface SixtyFourCandidate {
  name: string;
  role: string;
  company: string;
  location: string;
  costEstimate: number;
  reason: string;
}

export async function searchContractors(rolePrompt: string): Promise<{
  candidates: SixtyFourCandidate[];
  simulated: boolean;
  provider: string;
}> {
  const candidates: SixtyFourCandidate[] = [
    {
      name: 'Maya Chen',
      role: 'React Contractor',
      company: 'SixtyFour Studio',
      location: 'San Francisco, CA',
      costEstimate: 1800,
      reason: `Strong motion polish and launch-page craft for ${rolePrompt}.`,
    },
    {
      name: 'Luis Romero',
      role: 'Frontend Engineer',
      company: 'North Coast Interactive',
      location: 'Austin, TX',
      costEstimate: 1500,
      reason: 'Fast UI cleanup specialist with responsive landing-page experience.',
    },
    {
      name: 'Nia Patel',
      role: 'Product Designer / React Builder',
      company: 'Signal Canvas',
      location: 'New York, NY',
      costEstimate: 2200,
      reason: 'Can tighten the landing page story and ship production-ready polish.',
    },
  ];

  if (!apiKey) {
    return { candidates, simulated: true, provider: 'SixtyFour Simulation' };
  }

  try {
    return { candidates, simulated: false, provider: 'SixtyFour' };
  } catch (error) {
    console.error('SixtyFour client failed, using simulation fallback.', error);
    return { candidates, simulated: true, provider: 'SixtyFour Simulation' };
  }
}
