/**
 * React Query hook for fetching player match history with localStorage caching
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MatchHistoryResponse } from '../types';

export interface UseMatchHistoryOptions {
  riotId: string;
  region?: string;
  platform?: string;
  count?: number;
  queue?: number;
  enabled?: boolean;
}

// LocalStorage cache key generator
const getCacheKey = (riotId: string, queue?: number) => {
  return `runesight_matches_${riotId}_${queue || 'all'}`;
};

// Get cached data from localStorage
const getCachedMatches = (riotId: string, queue?: number): MatchHistoryResponse | null => {
  try {
    const cacheKey = getCacheKey(riotId, queue);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (less than 5 minutes old)
      const cacheAge = Date.now() - (data.timestamp || 0);
      if (cacheAge < 5 * 60 * 1000) {
        return data.matches;
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage cache:', error);
  }
  return null;
};

// Save data to localStorage
const setCachedMatches = (riotId: string, queue: number | undefined, data: MatchHistoryResponse) => {
  try {
    const cacheKey = getCacheKey(riotId, queue);
    localStorage.setItem(cacheKey, JSON.stringify({
      matches: data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error writing to localStorage cache:', error);
  }
};

// Check if there are new matches by comparing match IDs
const hasNewMatches = (cached: MatchHistoryResponse, fresh: MatchHistoryResponse): boolean => {
  if (!cached.matches || cached.matches.length === 0) return true;
  if (!fresh.matches || fresh.matches.length === 0) return false;
  
  // Check if the first match ID is different (newest match)
  return cached.matches[0].match_id !== fresh.matches[0].match_id;
};

export function useMatchHistory({
  riotId,
  region = 'AMERICAS',
  platform,
  count = 20,
  queue,
  enabled = true,
}: UseMatchHistoryOptions): UseQueryResult<MatchHistoryResponse, Error> {
  console.log('📊 useMatchHistory - Called with:', { riotId, region, platform, count, queue });

  return useQuery({
    queryKey: ['matchHistory', riotId, region, platform, count, queue], // Include platform in cache key
    queryFn: async () => {
      console.log('📊 useMatchHistory - queryFn executing with:', { riotId, region, platform, count, queue });

      // Try to get cached data first
      const cached = getCachedMatches(riotId, queue);

      // Fetch fresh data - pass platform if available, backend will use it or auto-detect
      const freshData = await api.riot.getMatchHistory(riotId, region, platform, count, queue);
      
      // If we have cached data and no new matches, return cached data
      if (cached && !hasNewMatches(cached, freshData)) {
        console.log('Using cached match data - no new matches');
        return cached;
      }
      
      // Save fresh data to cache
      setCachedMatches(riotId, queue, freshData);
      
      if (cached && hasNewMatches(cached, freshData)) {
        console.log('New matches detected - updating cache');
      }
      
      return freshData;
    },
    enabled: enabled && !!riotId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Use cached data as initial data for instant display
    initialData: () => getCachedMatches(riotId, queue) || undefined,
    initialDataUpdatedAt: () => {
      try {
        const cacheKey = getCacheKey(riotId, queue);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          return data.timestamp || 0;
        }
      } catch (error) {
        // Ignore errors
      }
      return 0;
    },
  });
}
