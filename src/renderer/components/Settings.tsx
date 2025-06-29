import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { Config } from '../../shared/types';
import './Settings.css';

export function Settings() {
  const { config, setConfig } = useStore();
  const [formData, setFormData] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [ytdlpInstalled, setYtdlpInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    loadConfig();
    checkYtDlp();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await api.getConfig();
      setConfig(cfg);
      setFormData(cfg);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const checkYtDlp = async () => {
    try {
      const installed = await api.checkYtDlp();
      setYtdlpInstalled(installed);
    } catch (err) {
      setYtdlpInstalled(false);
    }
  };

  const saveSettings = async () => {
    if (!formData) return;
    
    setSaving(true);
    try {
      const updated = await api.saveConfig(formData);
      setConfig(updated);
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return <div className="settings loading">Loading settings...</div>;
  }

  return (
    <div className="settings">
      <h3>Settings</h3>
      
      <div className="settings-section">
        <h4>Twitch API Configuration</h4>
        <div className="form-group">
          <label>Client ID</label>
          <input
            type="text"
            value={formData.twitchClientId}
            onChange={(e) => setFormData({ ...formData, twitchClientId: e.target.value })}
            placeholder="Your Twitch Client ID"
          />
        </div>
        <div className="form-group">
          <label>Client Secret</label>
          <input
            type="password"
            value={formData.twitchClientSecret}
            onChange={(e) => setFormData({ ...formData, twitchClientSecret: e.target.value })}
            placeholder="Your Twitch Client Secret"
          />
        </div>
        <p className="help-text">
          Get your credentials from{' '}
          <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener noreferrer">
            Twitch Developer Console
          </a>
        </p>
      </div>

      <div className="settings-section">
        <h4>Backup Settings</h4>
        <div className="form-group">
          <label>Backup Path</label>
          <input
            type="text"
            value={formData.downloadPath}
            onChange={(e) => setFormData({ ...formData, downloadPath: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Max Concurrent Backups</label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.maxConcurrentDownloads}
            onChange={(e) => setFormData({ ...formData, maxConcurrentDownloads: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Default Quality</label>
          <select
            value={formData.preferredQuality}
            onChange={(e) => setFormData({ ...formData, preferredQuality: e.target.value as any })}
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
        </div>
      </div>

      <div className="settings-section">
        <h4>System Status</h4>
        <div className="status-item">
          <span>yt-dlp:</span>
          <span className={ytdlpInstalled ? 'status-ok' : 'status-error'}>
            {ytdlpInstalled === null ? 'Checking...' : ytdlpInstalled ? 'Installed' : 'Not Found'}
          </span>
        </div>
        {ytdlpInstalled === false && (
          <p className="help-text error">
            yt-dlp is required. Install it from{' '}
            <a href="https://github.com/yt-dlp/yt-dlp#installation" target="_blank" rel="noopener noreferrer">
              here
            </a>
          </p>
        )}
      </div>

      <div className="settings-actions">
        <button onClick={saveSettings} disabled={saving} className="primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}