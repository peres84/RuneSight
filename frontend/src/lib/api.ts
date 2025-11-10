// API client configuration for RuneSight

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import type {
  RiotIdValidationResponse,
  MatchHistoryResponse,
  MatchDetailsResponse,
  AnalysisResponse,
  ApiErrorResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8000';

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Track retry attempts per request
const retryAttempts = new Map<string, number>();
const MAX_RETRIES = 3;

// Response interceptor for error handling and retry logic
apiClient.interceptors.response.use(
  (response) => {
    // Clear retry count on success
    if (response.config.url) {
      retryAttempts.delete(response.config.url);
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    
    if (!config) {
      return Promise.reject(error);
    }
    
    // Initialize retry count
    config._retryCount = config._retryCount || 0;
    
    // Handle rate limiting with exponential backoff
    if (error.response?.status === 429) {
      if (config._retryCount < MAX_RETRIES) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
        const delay = Math.min(retryAfter * 1000, 30000); // Max 30 seconds
        
        console.log(`Rate limited. Retrying after ${delay}ms (attempt ${config._retryCount + 1}/${MAX_RETRIES})`);
        
        config._retryCount++;
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient.request(config);
      }
    }
    
    // Handle server errors (5xx) with exponential backoff
    if (error.response?.status && error.response.status >= 500) {
      if (config._retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, config._retryCount), 10000); // Exponential backoff, max 10s
        
        console.log(`Server error. Retrying after ${delay}ms (attempt ${config._retryCount + 1}/${MAX_RETRIES})`);
        
        config._retryCount++;
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient.request(config);
      }
    }
    
    // Handle network errors with retry
    if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
      if (config._retryCount < MAX_RETRIES) {
        const delay = 2000 * (config._retryCount + 1); // Linear backoff
        
        console.log(`Network timeout. Retrying after ${delay}ms (attempt ${config._retryCount + 1}/${MAX_RETRIES})`);
        
        config._retryCount++;
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient.request(config);
      }
    }
    
    // Format error for user
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

// ==================== Riot API Functions ====================

// Region mapping helper - Maps frontend region codes to backend REGIONAL_ROUTING and PLATFORM_ROUTING
const mapRegionToBackend = (region: string): { region: string; platform: string } => {
  const regionLower = region.toLowerCase();
  
  const regionMap: Record<string, { region: string; platform: string }> = {
    // Europe
    'europe': { region: 'EUROPE', platform: 'EUW1' },
    'euw': { region: 'EUROPE', platform: 'EUW1' },
    'euw1': { region: 'EUROPE', platform: 'EUW1' },
    'eune': { region: 'EUROPE', platform: 'EUN1' },
    'eun1': { region: 'EUROPE', platform: 'EUN1' },
    'tr': { region: 'EUROPE', platform: 'TR1' },
    'tr1': { region: 'EUROPE', platform: 'TR1' },
    'ru': { region: 'EUROPE', platform: 'RU' },
    
    // Americas
    'americas': { region: 'AMERICAS', platform: 'NA1' },
    'na': { region: 'AMERICAS', platform: 'NA1' },
    'na1': { region: 'AMERICAS', platform: 'NA1' },
    'br': { region: 'AMERICAS', platform: 'BR1' },
    'br1': { region: 'AMERICAS', platform: 'BR1' },
    'lan': { region: 'AMERICAS', platform: 'LA1' }, // Latin America North
    'la1': { region: 'AMERICAS', platform: 'LA1' },
    'las': { region: 'AMERICAS', platform: 'LA2' }, // Latin America South
    'la2': { region: 'AMERICAS', platform: 'LA2' },
    
    // Asia
    'asia': { region: 'ASIA', platform: 'KR' },
    'kr': { region: 'ASIA', platform: 'KR' },
    'jp': { region: 'ASIA', platform: 'JP1' },
    'jp1': { region: 'ASIA', platform: 'JP1' },
    'oce': { region: 'ASIA', platform: 'OC1' }, // Oceania
    'oc1': { region: 'ASIA', platform: 'OC1' },
    
    // SEA (Southeast Asia)
    'sea': { region: 'SEA', platform: 'SG2' },
    'ph': { region: 'SEA', platform: 'PH2' }, // Philippines
    'ph2': { region: 'SEA', platform: 'PH2' },
    'sg': { region: 'SEA', platform: 'SG2' }, // Singapore
    'sg2': { region: 'SEA', platform: 'SG2' },
    'th': { region: 'SEA', platform: 'TH2' }, // Thailand
    'th2': { region: 'SEA', platform: 'TH2' },
    'tw': { region: 'SEA', platform: 'TW2' }, // Taiwan
    'tw2': { region: 'SEA', platform: 'TW2' },
    'vn': { region: 'SEA', platform: 'VN2' }, // Vietnam
    'vn2': { region: 'SEA', platform: 'VN2' },
  };
  
  return regionMap[regionLower] || { region: 'EUROPE', platform: 'EUW1' };
};

export const riotApi = {
  /**
   * Validate a RiotID and return PUUID if valid
   */
  validateRiotId: async (
    riotId: string,
    region: string = 'europe',
    platform?: string
  ): Promise<RiotIdValidationResponse> => {
    const { region: backendRegion, platform: backendPlatform } = mapRegionToBackend(region);
    
    const response = await apiClient.post<RiotIdValidationResponse>('/api/riot/validate', {
      riot_id: riotId,
      region: backendRegion,
      platform: platform || backendPlatform,
    });
    return response.data;
  },

  /**
   * Get match history for a player
   */
  getMatchHistory: async (
    riotId: string,
    region: string = 'europe',
    platform?: string,
    count: number = 20,
    queue?: number
  ): Promise<MatchHistoryResponse> => {
    const { region: backendRegion, platform: backendPlatform } = mapRegionToBackend(region);
    
    const params: any = { 
      region: backendRegion, 
      platform: platform || backendPlatform, 
      count 
    };
    
    if (queue) {
      params.queue = queue;
    }
    
    const response = await apiClient.get<MatchHistoryResponse>(
      `/api/riot/matches/${encodeURIComponent(riotId)}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get detailed match data by match ID
   */
  getMatchDetails: async (
    matchId: string,
    region: string = 'europe',
    puuid?: string
  ): Promise<MatchDetailsResponse> => {
    const { region: backendRegion } = mapRegionToBackend(region);
    
    const response = await apiClient.get<MatchDetailsResponse>(
      `/api/riot/match/${matchId}`,
      {
        params: { region: backendRegion, puuid },
      }
    );
    return response.data;
  },

  /**
   * Get ranked league information for a player
   */
  getRankedInfo: async (
    riotId: string,
    region: string = 'europe',
    platform?: string
  ): Promise<any> => {
    const { region: backendRegion, platform: backendPlatform } = mapRegionToBackend(region);
    
    const response = await apiClient.get(
      `/api/riot/ranked/${encodeURIComponent(riotId)}`,
      {
        params: { 
          region: backendRegion, 
          platform: platform || backendPlatform
        },
      }
    );
    return response.data;
  },

  /**
   * Health check for Riot API endpoints
   */
  healthCheck: async (): Promise<any> => {
    const response = await apiClient.get('/api/riot/health');
    return response.data;
  },

  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<any> => {
    const response = await apiClient.get('/api/riot/cache/stats');
    return response.data;
  },

  /**
   * Clear cache (admin endpoint)
   */
  clearCache: async (): Promise<any> => {
    const response = await apiClient.post('/api/riot/cache/clear');
    return response.data;
  },
};

// ==================== Analysis API Functions ====================

export const analysisApi = {
  /**
   * Analyze player performance in a match or recent matches
   */
  analyzePerformance: async (
    riotId: string,
    matchId?: string,
    matchCount?: number,
    analysisType: 'match' | 'recent' = 'match'
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/performance', {
      riot_id: riotId,
      match_id: matchId,
      match_count: matchCount,
      analysis_type: analysisType,
    });
    return response.data;
  },

  /**
   * Custom performance query
   */
  customPerformanceQuery: async (
    query: string,
    riotId?: string
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/performance/query', {
      query,
      riot_id: riotId,
    });
    return response.data;
  },

  /**
   * Analyze champion performance
   */
  analyzeChampion: async (
    riotId: string,
    championName?: string,
    enemyChampion?: string,
    analysisType: 'champion' | 'pool' | 'matchup' = 'champion'
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/champion', {
      riot_id: riotId,
      champion_name: championName,
      enemy_champion: enemyChampion,
      analysis_type: analysisType,
    });
    return response.data;
  },

  /**
   * Custom champion query
   */
  customChampionQuery: async (
    query: string,
    riotId?: string
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/champion/query', {
      query,
      riot_id: riotId,
    });
    return response.data;
  },

  /**
   * Compare multiple players
   */
  comparePlayers: async (
    riotIds: string[],
    analysisType: 'compare' | 'duo' | 'head_to_head' = 'compare'
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/compare', {
      riot_ids: riotIds,
      analysis_type: analysisType,
    });
    return response.data;
  },

  /**
   * Custom comparison query
   */
  customComparisonQuery: async (
    query: string,
    riotId?: string
  ): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>('/api/analysis/compare/query', {
      query,
      riot_id: riotId,
    });
    return response.data;
  },

  /**
   * Health check for analysis service
   */
  healthCheck: async (): Promise<any> => {
    const response = await apiClient.get('/api/analysis/health');
    return response.data;
  },
};

// ==================== Chat API Functions ====================

export interface ChatMessage {
  message: string;
  session_id?: string;
  riot_id?: string;
  match_data?: any[];
  ranked_data?: any;
  user_profile?: any;
  force_agent?: 'performance' | 'champion' | 'comparison' | 'team_synergy' | 'match_summarizer';
}

export interface ChatResponse {
  response: string;
  session_id: string;
  agent_used: string;
  confidence: number;
  conversation_length: number;
  metadata: Record<string, any>;
}

export const chatApi = {
  /**
   * Send a message to the AI chat assistant
   * Automatically routes to the best agent based on query
   */
  sendMessage: async (options: ChatMessage): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/chat/message', options);
    return response.data;
  },

  /**
   * Get conversation history for a session
   */
  getHistory: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/api/chat/history/${sessionId}`);
    return response.data;
  },

  /**
   * Clear conversation history
   */
  clearHistory: async (sessionId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/chat/history/${sessionId}`);
    return response.data;
  },

  /**
   * Get available agents info
   */
  getAgents: async (): Promise<any> => {
    const response = await apiClient.get('/api/chat/agents');
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<any> => {
    const response = await apiClient.get('/api/chat/health');
    return response.data;
  },
};

// ==================== Combined API Export ====================

export const api = {
  baseURL: API_BASE_URL,
  riot: riotApi,
  analysis: analysisApi,
  chat: chatApi,
  
  /**
   * General health check
   */
  healthCheck: async (): Promise<any> => {
    const [riotHealth, analysisHealth, chatHealth] = await Promise.all([
      riotApi.healthCheck(),
      analysisApi.healthCheck(),
      chatApi.healthCheck(),
    ]);
    return {
      riot: riotHealth,
      analysis: analysisHealth,
      chat: chatHealth,
    };
  },
};
