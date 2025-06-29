import { ipcMain, shell } from 'electron';
import { 
  getConfig, 
  updateConfig, 
  getDownloads, 
  removeDownload,
  getScheduledTasks,
  saveScheduledTask,
  removeScheduledTask as removeTask
} from './store';
import { searchStreamers, getVODs } from './twitch-api';
import { downloadVOD, cancelDownload, setProgressCallback, updateQueueConcurrency } from './downloader';
import type { Config, IpcChannels } from '../shared/types';
import path from 'path';

export function setupIpcHandlers() {
  // Config handlers
  ipcMain.handle('get-config', () => {
    return getConfig();
  });

  ipcMain.handle('save-config', (_, updates: Partial<Config>) => {
    updateConfig(updates);
    
    // Update download queue concurrency if changed
    if (updates.maxConcurrentDownloads) {
      updateQueueConcurrency(updates.maxConcurrentDownloads);
    }
    
    return getConfig();
  });

  // Streamer search
  ipcMain.handle('search-streamer', async (_, query: string) => {
    try {
      return await searchStreamers(query);
    } catch (error: any) {
      throw new Error(`Failed to search streamers: ${error.message}`);
    }
  });

  // VOD handlers
  ipcMain.handle('get-vods', async (_, streamerId: string) => {
    try {
      return await getVODs(streamerId);
    } catch (error: any) {
      throw new Error(`Failed to get VODs: ${error.message}`);
    }
  });

  // Download handlers
  ipcMain.handle('download-vod', async (_, params: {
    vodId: string;
    streamerId: string;
    streamerName: string;
    quality?: string;
  }) => {
    try {
      const result = await downloadVOD(
        params.vodId,
        params.streamerId,
        params.streamerName,
        params.quality as any || 'source'
      );
      return result;
    } catch (error: any) {
      throw new Error(`Download failed: ${error.message}`);
    }
  });

  ipcMain.handle('get-download-progress', () => {
    return getDownloads();
  });

  ipcMain.handle('cancel-download', (_, taskId: string) => {
    const cancelled = cancelDownload(taskId);
    if (!cancelled) {
      // If not active, just remove from history
      removeDownload(taskId);
    }
    return cancelled;
  });

  // Scheduled tasks handlers
  ipcMain.handle('get-scheduled-tasks', () => {
    return getScheduledTasks();
  });

  ipcMain.handle('add-scheduled-task', (_, task: any) => {
    saveScheduledTask(task);
    // TODO: Register with scheduler
    return getScheduledTasks();
  });

  ipcMain.handle('remove-scheduled-task', (_, taskId: string) => {
    removeTask(taskId);
    // TODO: Unregister from scheduler
    return getScheduledTasks();
  });

  // Set up progress callback to emit to renderer
  setProgressCallback((taskId, progress, downloaded, total) => {
    // Emit progress to all windows
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach((window: any) => {
      window.webContents.send('download-progress', {
        taskId,
        progress,
        downloaded,
        total
      });
    });
  });

  // Open folder handler
  ipcMain.handle('open-download-folder', () => {
    const config = getConfig();
    shell.openPath(config.downloadPath);
  });

  // Check if yt-dlp is installed
  ipcMain.handle('check-ytdlp', async () => {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const ytdlp = spawn('yt-dlp', ['--version']);
      ytdlp.on('close', (code: number) => {
        resolve(code === 0);
      });
      ytdlp.on('error', () => {
        resolve(false);
      });
    });
  });
}