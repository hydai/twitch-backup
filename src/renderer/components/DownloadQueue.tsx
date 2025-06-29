import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { DownloadTask } from '../../shared/types';
import './DownloadQueue.css';

export function DownloadQueue() {
  const { downloads, setDownloads } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
    
    // Listen for progress updates
    api.onDownloadProgress((data) => {
      useStore.getState().updateDownload(data.taskId, {
        progress: data.progress,
        downloadedSize: data.downloaded,
        totalSize: data.total
      });
    });

    return () => {
      api.removeProgressListener();
    };
  }, []);

  const loadDownloads = async () => {
    try {
      const tasks = await api.getDownloadProgress();
      useStore.setState({ downloads: tasks });
    } catch (err) {
      console.error('Failed to load downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelDownload = async (taskId: string) => {
    try {
      await api.cancelDownload(taskId);
      useStore.getState().removeDownload(taskId);
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const getStatusColor = (status: DownloadTask['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'downloading': return 'active';
      default: return 'pending';
    }
  };

  const sortedDownloads = [...downloads].sort((a, b) => {
    // Active downloads first
    if (a.status === 'downloading' && b.status !== 'downloading') return -1;
    if (b.status === 'downloading' && a.status !== 'downloading') return 1;
    // Then by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return <div className="download-queue loading">Loading downloads...</div>;
  }

  if (downloads.length === 0) {
    return (
      <div className="download-queue empty">
        <p>No backups in progress</p>
        <button onClick={() => useStore.getState().setActiveTab('search')}>
          Search for VODs to Backup
        </button>
      </div>
    );
  }

  return (
    <div className="download-queue">
      <div className="queue-header">
        <h3>Backup Queue</h3>
        <button onClick={() => api.openDownloadFolder()} className="folder-btn">
          Open Backup Folder
        </button>
      </div>
      
      <div className="download-list">
        {sortedDownloads.map(task => (
          <div key={task.id} className={`download-item ${getStatusColor(task.status)}`}>
            <div className="download-info">
              <h4>{task.title}</h4>
              <div className="download-meta">
                <span className="streamer-name">{task.streamerName}</span>
                <span>•</span>
                <span className="status">{task.status}</span>
                {task.error && (
                  <>
                    <span>•</span>
                    <span className="error-msg">{task.error}</span>
                  </>
                )}
              </div>
            </div>
            
            {task.status === 'downloading' && (
              <div className="download-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${task.progress || 0}%` }}
                  />
                </div>
                <div className="progress-info">
                  <span>{task.progress?.toFixed(1) || 0}%</span>
                  <span>
                    {formatSize(task.downloadedSize)} / {formatSize(task.totalSize)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="download-actions">
              {(task.status === 'downloading' || task.status === 'pending') && (
                <button 
                  onClick={() => cancelDownload(task.id)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
              {task.status === 'failed' && (
                <button 
                  onClick={() => cancelDownload(task.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}