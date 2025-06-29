import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { Streamer } from '../../shared/types';
import './StreamerSearch.css';

export function StreamerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { selectedStreamer, setSelectedStreamer } = useStore();

  const search = useCallback(async () => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const streamers = await api.searchStreamer(query);
      setResults(streamers);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="streamer-search">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a streamer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {loading && <span className="loading">Searching...</span>}
      </div>
      
      {error && (
        <div className="error">{error}</div>
      )}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(streamer => (
            <div
              key={streamer.id}
              className={`streamer-item ${selectedStreamer?.id === streamer.id ? 'selected' : ''}`}
              onClick={() => setSelectedStreamer(streamer)}
            >
              <img 
                src={streamer.profile_image_url} 
                alt={streamer.display_name}
                className="streamer-avatar"
              />
              <div className="streamer-info">
                <div className="streamer-name">{streamer.display_name}</div>
                <div className="streamer-login">@{streamer.login}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedStreamer && (
        <div className="selected-streamer">
          <h3>Selected: {selectedStreamer.display_name}</h3>
          <button 
            onClick={() => setSelectedStreamer(null)}
            className="clear-btn"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}