import cron from 'node-cron';
import { syncAllIncomplete } from '../service/trainingSyncService.js';
import { isTrainingApiConfigured } from '../service/trainingPortalService.js';

cron.schedule('0 */3 * * *', async () => {
  if (!isTrainingApiConfigured()) {
    console.log('[TrainingSync] TRAINING_API_BASE_URL not set, skipping cron');
    return;
  }
  console.log(`[TrainingSync] Cron started at ${new Date().toISOString()}`);
  try {
    const result = await syncAllIncomplete();
    console.log(
      `[TrainingSync] Cron done: ${result.success} ok, ${result.error} fail, ${result.skipped} skip, ${result.elapsed}ms`,
    );
  } catch (err) {
    console.error('[TrainingSync] Cron error:', err.message);
  }
});

console.log('[TrainingSync] Scheduler registered (every 3 hours)');
