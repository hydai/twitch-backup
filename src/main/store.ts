import Store from 'electron-store';
import type { Config, DownloadTask, ScheduledTask } from '../shared/types';
import path from 'path';
import { app } from 'electron';

interface StoreSchema {
  config: Config;
  downloads: DownloadTask[];
  scheduledTasks: ScheduledTask[];
}

const schema = {
  config: {
    type: 'object',
    properties: {
      twitchClientId: { type: 'string', default: '' },
      twitchClientSecret: { type: 'string', default: '' },
      downloadPath: { type: 'string', default: path.join(app.getPath('downloads'), 'twitch-vods') },
      maxConcurrentDownloads: { type: 'number', default: 2 },
      preferredQuality: { type: 'string', default: 'source' }
    }
  },
  downloads: {
    type: 'array',
    default: []
  },
  scheduledTasks: {
    type: 'array',
    default: []
  }
} as const;

export let store: Store<StoreSchema>;

export function initializeStore() {
  store = new Store<StoreSchema>({
    schema,
    encryptionKey: 'twitch-backup-secure-key' // Encrypts sensitive data
  });

  // Initialize with defaults if not exists
  if (!store.has('config')) {
    store.set('config', {
      twitchClientId: '',
      twitchClientSecret: '',
      downloadPath: path.join(app.getPath('downloads'), 'twitch-backup'),
      maxConcurrentDownloads: 2,
      preferredQuality: 'source'
    });
  }
}

export function getConfig(): Config {
  return store.get('config');
}

export function updateConfig(updates: Partial<Config>) {
  const current = store.get('config');
  store.set('config', { ...current, ...updates });
}

export function getDownloads(): DownloadTask[] {
  return store.get('downloads', []);
}

export function saveDownload(download: DownloadTask) {
  const downloads = getDownloads();
  const index = downloads.findIndex(d => d.id === download.id);
  
  if (index >= 0) {
    downloads[index] = download;
  } else {
    downloads.push(download);
  }
  
  store.set('downloads', downloads);
}

export function removeDownload(id: string) {
  const downloads = getDownloads().filter(d => d.id !== id);
  store.set('downloads', downloads);
}

export function getScheduledTasks(): ScheduledTask[] {
  return store.get('scheduledTasks', []);
}

export function saveScheduledTask(task: ScheduledTask) {
  const tasks = getScheduledTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  
  store.set('scheduledTasks', tasks);
}

export function removeScheduledTask(id: string) {
  const tasks = getScheduledTasks().filter(t => t.id !== id);
  store.set('scheduledTasks', tasks);
}