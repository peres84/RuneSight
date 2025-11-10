// API client configuration for RuneSight

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import type {
  RiotIdValidationResponse,
  MatchHistoryResponse,
  MatchDetailsResponse,
  AnalysisResponse,
  ApiErrorResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8000';

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

// Response interceptor for error handling and retry logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    console.error('API Response Error:', error);
    
    // Handle rate limiting with retry
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
      console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiClient.request(error.config as AxiosRequestConfig);
    }
    
    // Handle network errors with retry
    if (!error.response && error.code === 'ECONNABORTED') {
      console.log('Request timeout. Retrying once...');
      return apiClient.request(error.config as AxiosRequestConfig);
    }
    
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

// Region mapping helper
const mapRegionToBackend = (region: string): { region: string; platform: string } => {
  const regionLower = region.toLowerCase();
  
  const regionMap: Record<string, { region: string; platform: string }> = {
    'europe': { region: 'EUROPE', platform: 'EUW1' },
    'euw': { region: 'EUROPE', platform: 'EUW1' },
    'euw1': { region: 'EUROPE', platform: 'EUW1' },
    'eune': { region: 'EUROPE', platform: 'EUN1' },
    'eune1': { region: 'EUROPE', platform: 'EUN1' },
    'americas': { region: 'AMERICAS', platform: 'NA1' },
    'na': { region: 'AMERICAS', platform: 'NA1' },
    'na1': { region: 'AMERICAS', platform: 'NA1' },
    'br': { region: 'AMERICAS', platform: 'BR1' },
    'br1': { region: 'AMERICAS', platform: 'BR1' },
    'asia': { region: 'ASIA', platform: 'KR' },
    'kr': { region: 'ASIA', platform: 'KR' },
    'jp': { region: 'ASIA', platform: 'JP1' },
    'jp1': { region: 'ASIA', platform: 'JP1' },
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

// ==================== Combined API Export ====================

export const api = {
  riot: riotApi,
  analysis: analysisApi,
  
  /**
   * General health check
   */
  healthCheck: async (): Promise<any> => {
    const [riotHealth, analysisHealth] = await Promise.all([
      riotApi.healthCheck(),
      analysisApi.healthCheck(),
    ]);
    return {
      riot: riotHealth,
      analysis: analysisHealth,
    };
  },
};
