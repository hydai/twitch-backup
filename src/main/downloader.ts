import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import type { DownloadTask, VideoQuality } from '../shared/types';
import { getConfig, saveDownload } from './store';
import { getVODInfo } from './twitch-api';

// Download queue - will be initialized asynchronously
let downloadQueue: any;

// Initialize the queue
async function initializeQueue() {
  if (!downloadQueue) {
    const { default: PQueue } = await import('p-queue');
    downloadQueue = new PQueue({ concurrency: 2 });
  }
  return downloadQueue;
}

// Active downloads map
const activeDownloads = new Map<string, {
  process: any;
  task: DownloadTask;
  onProgress: (progress: number, downloaded: number, total: number) => void;
}>();

// Event emitter for progress updates
let progressCallback: ((taskId: string, progress: number, downloaded: number, total: number) => void) | null = null;

export function setProgressCallback(callback: typeof progressCallback) {
  progressCallback = callback;
}

export async function downloadVOD(
  vodId: string,
  streamerId: string,
  streamerName: string,
  quality: VideoQuality = 'source'
): Promise<string> {
  const taskId = `${vodId}-${Date.now()}`;
  const config = getConfig();
  
  // Get VOD info
  const vodInfo = await getVODInfo(vodId);
  if (!vodInfo) {
    throw new Error('VOD not found');
  }

  // Create download task
  const task: DownloadTask = {
    id: taskId,
    vodId,
    streamerId,
    streamerName,
    title: vodInfo.title,
    status: 'pending',
    progress: 0,
    createdAt: new Date()
  };

  // Save initial task
  saveDownload(task);

  // Initialize queue if needed
  const queue = await initializeQueue();

  // Add to queue
  return queue.add(async () => {
    try {
      task.status = 'downloading';
      saveDownload(task);

      // Create output directory
      const outputDir = path.join(config.downloadPath, streamerId);
      await fs.mkdir(outputDir, { recursive: true });

      // Generate filename
      const date = new Date(vodInfo.created_at).toISOString().split('T')[0];
      const safeTitle = vodInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${date}_${safeTitle}_${vodId}.mp4`;
      const outputPath = path.join(outputDir, filename);

      // Download using yt-dlp
      await downloadWithYtDlp(
        vodInfo.url,
        outputPath,
        quality,
        task,
        (progress, downloaded, total) => {
          task.progress = progress;
          task.downloadedSize = downloaded;
          task.totalSize = total;
          saveDownload(task);
          
          if (progressCallback) {
            progressCallback(taskId, progress, downloaded, total);
          }
        }
      );

      // Mark as completed
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      saveDownload(task);

      return outputPath;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      saveDownload(task);
      throw error;
    } finally {
      activeDownloads.delete(taskId);
    }
  }) as Promise<string>;
}

function downloadWithYtDlp(
  url: string,
  outputPath: string,
  quality: VideoQuality,
  task: DownloadTask,
  onProgress: (progress: number, downloaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // yt-dlp arguments
    const args = [
      url,
      '-o', outputPath,
      '--no-part',
      '--no-playlist',
      '--concurrent-fragments', '4'
    ];

    // Add quality selector
    if (quality !== 'source') {
      if (quality === 'audio_only') {
        args.push('-f', 'bestaudio');
      } else {
        args.push('-f', `best[height<=${quality.replace('p60', '').replace('p', '')}]`);
      }
    }

    // Spawn yt-dlp process
    const ytdlp = spawn('yt-dlp', args);
    
    // Store active download
    activeDownloads.set(task.id, {
      process: ytdlp,
      task,
      onProgress
    });

    let lastProgress = 0;
    let totalSize = 0;
    let downloadedSize = 0;

    // Parse output for progress
    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse progress
      const progressMatch = output.match(/(\d+\.\d+)%/);
      if (progressMatch) {
        lastProgress = parseFloat(progressMatch[1]);
      }

      // Parse sizes
      const sizeMatch = output.match(/(\d+\.\d+)([KMG]iB) \/ (\d+\.\d+)([KMG]iB)/);
      if (sizeMatch) {
        downloadedSize = parseSize(sizeMatch[1], sizeMatch[2]);
        totalSize = parseSize(sizeMatch[3], sizeMatch[4]);
        onProgress(lastProgress, downloadedSize, totalSize);
      }
    });

    ytdlp.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        onProgress(100, totalSize, totalSize);
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    ytdlp.on('error', (error) => {
      reject(error);
    });
  });
}

function parseSize(value: string, unit: string): number {
  const num = parseFloat(value);
  switch (unit) {
    case 'KiB': return num * 1024;
    case 'MiB': return num * 1024 * 1024;
    case 'GiB': return num * 1024 * 1024 * 1024;
    default: return num;
  }
}

export function cancelDownload(taskId: string): boolean {
  const active = activeDownloads.get(taskId);
  if (active) {
    active.process.kill('SIGTERM');
    activeDownloads.delete(taskId);
    
    // Update task status
    active.task.status = 'failed';
    active.task.error = 'Cancelled by user';
    saveDownload(active.task);
    
    return true;
  }
  return false;
}

export async function getQueueSize(): Promise<number> {
  const queue = await initializeQueue();
  return queue.size + queue.pending;
}

export async function updateQueueConcurrency(concurrency: number) {
  const queue = await initializeQueue();
  queue.concurrency = concurrency;
}