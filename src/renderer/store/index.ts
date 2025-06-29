import { create } from 'zustand';
import type { Streamer, VOD, DownloadTask, ScheduledTask, Config } from '../../shared/types';

interface AppState {
  // UI State
  activeTab: 'search' | 'downloads' | 'scheduled' | 'settings';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Config
  config: Config | null;
  setConfig: (config: Config) => void;

  // Streamer & VODs
  selectedStreamer: Streamer | null;
  setSelectedStreamer: (streamer: Streamer | null) => void;
  vods: VOD[];
  setVods: (vods: VOD[]) => void;
  
  // Downloads
  downloads: DownloadTask[];
  setDownloads: (downloads: DownloadTask[]) => void;
  addDownload: (task: DownloadTask) => void;
  updateDownload: (id: string, update: Partial<DownloadTask>) => void;
  removeDownload: (id: string) => void;
  
  // Scheduled Tasks
  scheduledTasks: ScheduledTask[];
  setScheduledTasks: (tasks: ScheduledTask[]) => void;
  addScheduledTask: (task: ScheduledTask) => void;
  updateScheduledTask: (id: string, update: Partial<ScheduledTask>) => void;
  removeScheduledTask: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // UI State
  activeTab: 'search',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Config
  config: null,
  setConfig: (config) => set({ config }),

  // Streamer & VODs
  selectedStreamer: null,
  setSelectedStreamer: (streamer) => set({ selectedStreamer: streamer }),
  vods: [],
  setVods: (vods) => set({ vods }),
  
  // Downloads
  downloads: [],
  setDownloads: (downloads) => set({ downloads }),
  addDownload: (task) => set((state) => ({ downloads: [...state.downloads, task] })),
  updateDownload: (id, update) => set((state) => ({
    downloads: state.downloads.map(d => d.id === id ? { ...d, ...update } : d)
  })),
  removeDownload: (id) => set((state) => ({
    downloads: state.downloads.filter(d => d.id !== id)
  })),
  
  // Scheduled Tasks
  scheduledTasks: [],
  setScheduledTasks: (tasks) => set({ scheduledTasks: tasks }),
  addScheduledTask: (task) => set((state) => ({ scheduledTasks: [...state.scheduledTasks, task] })),
  updateScheduledTask: (id, update) => set((state) => ({
    scheduledTasks: state.scheduledTasks.map(t => t.id === id ? { ...t, ...update } : t)
  })),
  removeScheduledTask: (id) => set((state) => ({
    scheduledTasks: state.scheduledTasks.filter(t => t.id !== id)
  })),
}));