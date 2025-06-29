import * as cron from 'node-cron';
import { parseExpression } from 'cron-parser';
import { getScheduledTasks, saveScheduledTask } from './store';
import { getVODs } from './twitch-api';
import { downloadVOD } from './downloader';
import type { ScheduledTask } from '../shared/types';

// Map of active cron jobs
const activeJobs = new Map<string, cron.ScheduledTask>();

export function initializeScheduler() {
  // Load all scheduled tasks on startup
  const tasks = getScheduledTasks();
  tasks.forEach(task => {
    if (task.enabled) {
      scheduleTask(task);
    }
  });
}

export function scheduleTask(task: ScheduledTask) {
  // Remove existing job if any
  stopTask(task.id);

  if (!task.enabled) {
    return;
  }

  try {
    // Validate cron expression
    if (!cron.validate(task.cronExpression)) {
      console.error(`Invalid cron expression for task ${task.id}: ${task.cronExpression}`);
      return;
    }

    // Create cron job
    const job = cron.schedule(task.cronExpression, async () => {
      console.log(`Running scheduled task for streamer: ${task.streamerName}`);
      
      try {
        // Update last run time
        task.lastRun = new Date();
        saveScheduledTask(task);

        // Get recent VODs
        const vods = await getVODs(task.streamerId, 5);
        
        if (vods.length === 0) {
          console.log(`No VODs found for ${task.streamerName}`);
          return;
        }

        // Download the most recent VOD
        const latestVod = vods[0];
        
        // Check if we already downloaded this VOD
        const downloads = require('./store').getDownloads();
        const alreadyDownloaded = downloads.some(
          (d: any) => d.vodId === latestVod.id && d.status === 'completed'
        );

        if (!alreadyDownloaded) {
          console.log(`Downloading VOD: ${latestVod.title}`);
          await downloadVOD(
            latestVod.id,
            task.streamerId,
            task.streamerName,
            task.quality
          );
        } else {
          console.log(`VOD already downloaded: ${latestVod.title}`);
        }
      } catch (error) {
        console.error(`Failed to run scheduled task ${task.id}:`, error);
      }
    });

    job.start();
    activeJobs.set(task.id, job);

    // Calculate next run time
    const nextRun = getNextRunTime(task.cronExpression);
    if (nextRun) {
      task.nextRun = nextRun;
      saveScheduledTask(task);
    }

    console.log(`Scheduled task ${task.id} for ${task.streamerName}`);
  } catch (error) {
    console.error(`Failed to schedule task ${task.id}:`, error);
  }
}

export function stopTask(taskId: string) {
  const job = activeJobs.get(taskId);
  if (job) {
    job.stop();
    activeJobs.delete(taskId);
    console.log(`Stopped scheduled task ${taskId}`);
  }
}

export function stopAllTasks() {
  activeJobs.forEach((job, taskId) => {
    job.stop();
    console.log(`Stopped scheduled task ${taskId}`);
  });
  activeJobs.clear();
}

function getNextRunTime(cronExpression: string): Date | null {
  try {
    const interval = parseExpression(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    console.error('Failed to parse cron expression:', error);
    return null;
  }
}

export function validateCronExpression(expression: string): boolean {
  return cron.validate(expression);
}

// Common cron patterns for user reference
export const CRON_PATTERNS = {
  'Every hour': '0 * * * *',
  'Every 4 hours': '0 */4 * * *',
  'Every day at midnight': '0 0 * * *',
  'Every day at 6 AM': '0 6 * * *',
  'Every Monday at 9 AM': '0 9 * * 1',
  'Every week on Sunday': '0 0 * * 0',
  'First day of month': '0 0 1 * *'
};