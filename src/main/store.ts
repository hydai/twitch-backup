import Store from 'electron-store';
import type { Config, DownloadTask, ScheduledTask } from '../shared/types';
import path from 'path';
import { app, safeStorage } from 'electron';

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
  // Use safeStorage for encryption if available
  const storeOptions: any = { schema };
  
  if (safeStorage.isEncryptionAvailable()) {
    // Generate a unique encryption key based on the app's userData path
    // This ensures each installation has its own key
    const appPath = app.getPath('userData');
    const keySource = `twitch-backup-${appPath}`;
    
    // Use safeStorage to encrypt the key source
    const encryptedKey = safeStorage.encryptString(keySource);
    
    // Convert to base64 string for use as encryption key
    storeOptions.encryptionKey = encryptedKey.toString('base64');
  }
  
  store = new Store<StoreSchema>(storeOptions);

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
  const config = store.get('config');
  
  // For sensitive fields, ensure they're properly decrypted
  // electron-store handles this automatically when encryptionKey is set
  return config;
}

export function updateConfig(updates: Partial<Config>) {
  const current = store.get('config');
  
  // Sensitive fields will be automatically encrypted by electron-store
  // when encryptionKey is set in the store options
  store.set('config', { ...current, ...updates });
}

// Helper function to securely store sensitive credentials
export function setCredentials(clientId: string, clientSecret: string) {
  updateConfig({
    twitchClientId: clientId,
    twitchClientSecret: clientSecret
  });
}

// Helper function to get credentials
export function getCredentials(): { clientId: string; clientSecret: string } {
  const config = getConfig();
  return {
    clientId: config.twitchClientId || '',
    clientSecret: config.twitchClientSecret || ''
  };
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