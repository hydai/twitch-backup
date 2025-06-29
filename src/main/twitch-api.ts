import axios from 'axios';
import type { Streamer, VOD } from '../shared/types';
import { getConfig } from './store';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (accessToken && tokenExpiry > now) {
    return accessToken;
  }

  const config = getConfig();
  
  if (!config.twitchClientId || !config.twitchClientSecret) {
    throw new Error('Twitch Client ID and Secret not configured');
  }

  try {
    const response = await axios.post<TokenResponse>(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: config.twitchClientId,
          client_secret: config.twitchClientSecret,
          grant_type: 'client_credentials'
        }
      }
    );

    accessToken = response.data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = now + (response.data.expires_in * 1000) - 300000;
    
    return accessToken;
  } catch (error) {
    throw new Error(`Failed to get Twitch access token: ${error}`);
  }
}

async function makeApiRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const token = await getAccessToken();
  const config = getConfig();

  try {
    const response = await axios.get<T>(`${TWITCH_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': config.twitchClientId
      },
      params
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired, reset and retry once
      accessToken = null;
      tokenExpiry = 0;
      
      const newToken = await getAccessToken();
      const retryResponse = await axios.get<T>(`${TWITCH_API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Client-Id': config.twitchClientId
        },
        params
      });
      
      return retryResponse.data;
    }
    
    throw new Error(`Twitch API request failed: ${error.response?.data?.message || error.message}`);
  }
}

export async function searchStreamers(query: string): Promise<Streamer[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const response = await makeApiRequest<{ data: Streamer[] }>('/search/channels', {
    query,
    first: 10,
    live_only: false
  });

  return response.data;
}

export async function getStreamerInfo(streamerId: string): Promise<Streamer | null> {
  const response = await makeApiRequest<{ data: Streamer[] }>('/users', {
    id: streamerId
  });

  return response.data[0] || null;
}

export async function getVODs(streamerId: string, first: number = 20): Promise<VOD[]> {
  const response = await makeApiRequest<{ data: VOD[], pagination?: { cursor?: string } }>('/videos', {
    user_id: streamerId,
    first,
    type: 'archive' // Only get past broadcasts
  });

  return response.data;
}

export async function getVODInfo(vodId: string): Promise<VOD | null> {
  const response = await makeApiRequest<{ data: VOD[] }>('/videos', {
    id: vodId
  });

  return response.data[0] || null;
}