import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { ScheduledTask, VideoQuality } from '../../shared/types';
import './ScheduledTasks.css';

const CRON_EXAMPLES = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 6 AM', value: '0 6 * * *' },
  { label: 'Weekly on Sunday', value: '0 0 * * 0' },
];

export function ScheduledTasks() {
  const { scheduledTasks, setScheduledTasks } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    streamerId: '',
    streamerName: '',
    cronExpression: '0 * * * *',
    quality: 'source' as VideoQuality
  });

  useEffect(() => {
    loadScheduledTasks();
  }, []);

  const loadScheduledTasks = async () => {
    try {
      const tasks = await api.getScheduledTasks();
      useStore.setState({ scheduledTasks: tasks });
    } catch (err) {
      console.error('Failed to load scheduled tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!formData.streamerId || !formData.streamerName) {
      alert('Please select a streamer first');
      return;
    }

    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      ...formData,
      enabled: true
    };

    try {
      const tasks = await api.addScheduledTask(newTask);
      setScheduledTasks(tasks);
      setShowAddForm(false);
      setFormData({
        streamerId: '',
        streamerName: '',
        cronExpression: '0 * * * *',
        quality: 'source'
      });
    } catch (err) {
      console.error('Failed to add scheduled task:', err);
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      const tasks = await api.removeScheduledTask(taskId);
      setScheduledTasks(tasks);
    } catch (err) {
      console.error('Failed to remove scheduled task:', err);
    }
  };

  const formatNextRun = (nextRun?: Date) => {
    if (!nextRun) return 'N/A';
    return new Date(nextRun).toLocaleString();
  };

  if (loading) {
    return <div className="scheduled-tasks loading">Loading scheduled tasks...</div>;
  }

  return (
    <div className="scheduled-tasks">
      <div className="tasks-header">
        <h3>Scheduled Backups</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="primary">
          {showAddForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <div className="form-group">
            <label>Streamer</label>
            <input
              type="text"
              placeholder="Search and select a streamer first"
              value={formData.streamerName}
              readOnly
            />
            <small>Go to Search tab to select a streamer</small>
          </div>
          
          <div className="form-group">
            <label>Schedule (Cron Expression)</label>
            <input
              type="text"
              value={formData.cronExpression}
              onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
            />
            <div className="cron-examples">
              {CRON_EXAMPLES.map(example => (
                <button
                  key={example.value}
                  onClick={() => setFormData({ ...formData, cronExpression: example.value })}
                  className="example-btn"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Quality</label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value as VideoQuality })}
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
          
          <button onClick={addTask} className="primary">
            Create Scheduled Task
          </button>
        </div>
      )}

      {scheduledTasks.length === 0 && !showAddForm && (
        <div className="empty">
          <p>No scheduled tasks yet</p>
          <p className="hint">Create tasks to automatically backup new VODs</p>
        </div>
      )}

      {scheduledTasks.length > 0 && (
        <div className="task-list">
          {scheduledTasks.map(task => (
            <div key={task.id} className={`task-item ${task.enabled ? 'enabled' : 'disabled'}`}>
              <div className="task-info">
                <h4>{task.streamerName}</h4>
                <div className="task-meta">
                  <span>Schedule: {task.cronExpression}</span>
                  <span>•</span>
                  <span>Quality: {task.quality}</span>
                  <span>•</span>
                  <span>Next run: {formatNextRun(task.nextRun)}</span>
                </div>
              </div>
              <button
                onClick={() => removeTask(task.id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}