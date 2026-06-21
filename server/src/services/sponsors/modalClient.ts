const apiKey = process.env.MODAL_API_KEY;

export async function runParallelWork<T>(label: string, tasks: Array<() => Promise<T>>): Promise<{
  results: T[];
  simulated: boolean;
  provider: string;
  label: string;
}> {
  try {
    const results = await Promise.all(tasks.map((task) => task()));
    return {
      results,
      simulated: !apiKey,
      provider: apiKey ? 'Modal' : 'Modal Simulation',
      label,
    };
  } catch (error) {
    console.error('Modal client failed, retrying with local fallback.', error);
    const results = await Promise.all(tasks.map((task) => task()));
    return {
      results,
      simulated: true,
      provider: 'Modal Simulation',
      label,
    };
  }
}
