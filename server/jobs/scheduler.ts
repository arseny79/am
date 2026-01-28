import { sendKYCReminders } from './kycReminderJob';

// Simple cron-like scheduler using setInterval
// Runs at specified intervals instead of exact times for simplicity

interface ScheduledJob {
  name: string;
  intervalMs: number;
  handler: () => Promise<any>;
  lastRun?: Date;
  enabled: boolean;
}

const jobs: ScheduledJob[] = [
  {
    name: 'KYC Reminders',
    intervalMs: 24 * 60 * 60 * 1000, // Daily (24 hours)
    handler: sendKYCReminders,
    enabled: true,
  },
];

const runningIntervals: NodeJS.Timeout[] = [];

/**
 * Start all scheduled jobs
 */
export function startScheduler() {
  console.log('[Scheduler] Starting job scheduler...');

  for (const job of jobs) {
    if (!job.enabled) {
      console.log(`[Scheduler] Skipping disabled job: ${job.name}`);
      continue;
    }

    console.log(`[Scheduler] Scheduling job: ${job.name} (every ${job.intervalMs / 1000 / 60 / 60} hours)`);

    // Run immediately on startup (optional - comment out if not desired)
    // setTimeout(() => runJob(job), 5000); // 5 second delay after startup

    // Schedule recurring runs
    const interval = setInterval(() => runJob(job), job.intervalMs);
    runningIntervals.push(interval);
  }

  console.log('[Scheduler] All jobs scheduled');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  console.log('[Scheduler] Stopping job scheduler...');
  for (const interval of runningIntervals) {
    clearInterval(interval);
  }
  runningIntervals.length = 0;
  console.log('[Scheduler] All jobs stopped');
}

/**
 * Run a specific job
 */
async function runJob(job: ScheduledJob) {
  console.log(`[Scheduler] Running job: ${job.name}`);
  job.lastRun = new Date();

  try {
    const result = await job.handler();
    console.log(`[Scheduler] Job ${job.name} completed:`, result);
  } catch (error) {
    console.error(`[Scheduler] Job ${job.name} failed:`, error);
  }
}

/**
 * Manually trigger a job by name
 */
export async function triggerJob(jobName: string): Promise<any> {
  const job = jobs.find(j => j.name === jobName);
  if (!job) {
    throw new Error(`Job not found: ${jobName}`);
  }
  return await runJob(job);
}

/**
 * Get status of all jobs
 */
export function getJobStatus() {
  return jobs.map(job => ({
    name: job.name,
    enabled: job.enabled,
    intervalHours: job.intervalMs / 1000 / 60 / 60,
    lastRun: job.lastRun?.toISOString() || null,
  }));
}
