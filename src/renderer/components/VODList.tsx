import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { VOD, VideoQuality } from '../../shared/types';
import './VODList.css';

export function VODList() {
  const { selectedStreamer, vods, setVods } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVods, setSelectedVods] = useState<Set<string>>(new Set());
  const [quality, setQuality] = useState<VideoQuality>('source');

  useEffect(() => {
    if (selectedStreamer) {
      loadVODs();
    } else {
      setVods([]);
    }
  }, [selectedStreamer]);

  const loadVODs = async () => {
    if (!selectedStreamer) return;
    
    setLoading(true);
    setError('');
    
    try {
      const vodList = await api.getVODs(selectedStreamer.id);
      setVods(vodList);
    } catch (err: any) {
      setError(err.message || 'Failed to load VODs');
      setVods([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVodSelection = (vodId: string) => {
    const newSelection = new Set(selectedVods);
    if (newSelection.has(vodId)) {
      newSelection.delete(vodId);
    } else {
      newSelection.add(vodId);
    }
    setSelectedVods(newSelection);
  };

  const downloadSelected = async () => {
    if (!selectedStreamer) return;
    
    for (const vodId of selectedVods) {
      try {
        await api.downloadVOD({
          vodId,
          streamerId: selectedStreamer.id,
          streamerName: selectedStreamer.display_name,
          quality
        });
      } catch (err) {
        console.error(`Failed to queue download for VOD ${vodId}:`, err);
      }
    }
    
    setSelectedVods(new Set());
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/(\d+)h(\d+)m(\d+)s/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return duration;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (!selectedStreamer) {
    return (
      <div className="vod-list empty">
        <p>Select a streamer to view their VODs</p>
      </div>
    );
  }

  return (
    <div className="vod-list">
      <div className="vod-controls">
        <h3>VODs for {selectedStreamer.display_name}</h3>
        {selectedVods.size > 0 && (
          <div className="batch-controls">
            <select 
              value={quality} 
              onChange={(e) => setQuality(e.target.value as VideoQuality)}
              className="quality-select"
            >
              <option value="source">Source</option>
              <option value="1080p60">1080p60</option>
              <option value="1080p">1080p</option>
              <option value="720p60">720p60</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
              <option value="audio_only">Audio Only</option>
            </select>
            <button onClick={downloadSelected} className="primary">
              Backup {selectedVods.size} VOD{selectedVods.size > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading VODs...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && vods.length === 0 && (
        <div className="empty">No VODs found</div>
      )}
      
      {vods.length > 0 && (
        <div className="vod-grid">
          {vods.map(vod => (
            <div key={vod.id} className="vod-item">
              <input
                type="checkbox"
                checked={selectedVods.has(vod.id)}
                onChange={() => toggleVodSelection(vod.id)}
                className="vod-checkbox"
              />
              <div className="vod-thumbnail">
                <img 
                  src={vod.thumbnail_url.replace('%{width}', '320').replace('%{height}', '180')} 
                  alt={vod.title}
                />
                <span className="vod-duration">{formatDuration(vod.duration)}</span>
              </div>
              <div className="vod-info">
                <h4>{vod.title}</h4>
                <div className="vod-meta">
                  <span>{formatDate(vod.created_at)}</span>
                  <span>•</span>
                  <span>{vod.view_count?.toLocaleString() || '0'} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}