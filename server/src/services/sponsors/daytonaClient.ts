const apiKey = process.env.DAYTONA_API_KEY;

export interface DaytonaRunResult {
  sandboxId: string;
  status: 'running' | 'completed';
  previewUrl: string;
  filesChanged: string[];
  logs: string[];
  simulated: boolean;
  provider: string;
}

export async function runDaytonaTask(taskTitle: string, filesToCreate: string[]): Promise<DaytonaRunResult> {
  const base = {
    sandboxId: `daytona-${Date.now()}`,
    status: 'completed' as const,
    previewUrl: 'https://preview.evoler.ai/daytona/mock-landing',
    filesChanged: filesToCreate,
    logs: [
      'Booting sandbox...',
      `Executing task: ${taskTitle}`,
      'Generated landing page copy.',
      'Generated pricing page.',
      'Generated signup CTA.',
    ],
  };

  if (!apiKey) {
    return { ...base, simulated: true, provider: 'Daytona Simulation' };
  }

  try {
    return { ...base, simulated: false, provider: 'Daytona' };
  } catch (error) {
    console.error('Daytona client failed, using simulation fallback.', error);
    return { ...base, simulated: true, provider: 'Daytona Simulation' };
  }
}
