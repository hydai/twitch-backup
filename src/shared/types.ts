export type IpcChannels = 
  | 'get-config'
  | 'save-config'
  | 'search-streamer'
  | 'get-vods'
  | 'download-vod'
  | 'get-download-progress'
  | 'cancel-download'
  | 'get-scheduled-tasks'
  | 'add-scheduled-task'
  | 'remove-scheduled-task';

export interface Config {
  twitchClientId: string;
  twitchClientSecret: string;
  downloadPath: string;
  maxConcurrentDownloads: number;
  preferredQuality: VideoQuality;
}

export interface Streamer {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

export interface VOD {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string;
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  duration: string;
  type: string;
  view_count?: number;
}

export interface DownloadTask {
  id: string;
  vodId: string;
  streamerId: string;
  streamerName: string;
  title: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  totalSize?: number;
  downloadedSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScheduledTask {
  id: string;
  streamerId: string;
  streamerName: string;
  cronExpression: string;
  quality: VideoQuality;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export type VideoQuality = 'source' | '1080p60' | '1080p' | '720p60' | '720p' | '480p' | '360p' | 'audio_only';