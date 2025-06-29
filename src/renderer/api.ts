import type { Config, Streamer, VOD, DownloadTask, ScheduledTask } from '../shared/types';

const { electronAPI } = window;

export const api = {
  // Config
  getConfig: () => electronAPI.invoke('get-config'),
  saveConfig: (updates: Partial<Config>) => electronAPI.invoke('save-config', updates),
  
  // Streamers & VODs
  searchStreamer: (query: string) => electronAPI.invoke('search-streamer', query),
  getVODs: (streamerId: string) => electronAPI.invoke('get-vods', streamerId),
  
  // Downloads
  downloadVOD: (params: {
    vodId: string;
    streamerId: string;
    streamerName: string;
    quality?: string;
  }) => electronAPI.invoke('download-vod', params),
  
  getDownloadProgress: () => electronAPI.invoke('get-download-progress'),
  cancelDownload: (taskId: string) => electronAPI.invoke('cancel-download', taskId),
  
  // Scheduled tasks
  getScheduledTasks: () => electronAPI.invoke('get-scheduled-tasks'),
  addScheduledTask: (task: ScheduledTask) => electronAPI.invoke('add-scheduled-task', task),
  removeScheduledTask: (taskId: string) => electronAPI.invoke('remove-scheduled-task', taskId),
  
  // Utils
  openDownloadFolder: () => electronAPI.invoke('open-download-folder'),
  checkYtDlp: () => electronAPI.invoke('check-ytdlp'),
  
  // Progress listener
  onDownloadProgress: (callback: (data: any) => void) => {
    electronAPI.on('download-progress', callback);
  },
  
  removeProgressListener: () => {
    electronAPI.removeAllListeners('download-progress');
  }
};