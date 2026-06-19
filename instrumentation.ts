export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startModerationWorker } = await import('@/lib/moderationWorker')
    startModerationWorker()
  }
}
