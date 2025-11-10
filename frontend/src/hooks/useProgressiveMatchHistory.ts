/**
 * Progressive Match History Hook
 * Loads first 5 matches immediately, then fetches remaining matches in background
 * Pre-fetches all queue types for instant tab switching
 */

import { useQuery, useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import type { MatchHistoryResponse } from '../types';

export interface UseProgressiveMatchHistoryOptions {
  riotId: string;
  region?: string;
  platform?: string;
  enabled?: boolean;
}

interface ProgressiveMatchData {
  all: MatchHistoryResponse | undefined;
  rankedSolo: MatchHistoryResponse | undefined;
  rankedFlex: MatchHistoryResponse | undefined;
  aram: MatchHistoryResponse | undefined;
  isInitialLoading: boolean;
  isBackgroundLoading: boolean;
  progress: number;
}

// Queue configurations
const QUEUE_CONFIGS = [
  { key: 'all', queueId: undefined, priority: 1 },
  { key: 'rankedSolo', queueId: 420, priority: 2 },
  { key: 'rankedFlex', queueId: 440, priority: 3 },
  { key: 'aram', queueId: 450, priority: 4 },
] as const;

// LocalStorage cache helpers
const getCacheKey = (riotId: string, queue?: number) => {
  return `runesight_matches_${riotId}_${queue || 'all'}`;
};

const getCachedMatches = (riotId: string, queue?: number): MatchHistoryResponse | null => {
  try {
    const cacheKey = getCacheKey(riotId, queue);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - (data.timestamp || 0);
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        return data.matches;
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage cache:', error);
  }
  return null;
};

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

/**
 * Progressive loading strategy:
 * 1. Load first 5 matches immediately (or from cache)
 * 2. Show dashboard as soon as first 5 are loaded
 * 3. Continue loading remaining 15 matches in background
 * 4. Pre-fetch all queue types in parallel
 */
export function useProgressiveMatchHistory({
  riotId,
  region = 'EUROPE',
  platform = 'EUW1',
  enabled = true,
}: UseProgressiveMatchHistoryOptions): ProgressiveMatchData {


  // Fetch initial 5 matches for quick display
  const initialQuery = useQuery({
    queryKey: ['matchHistory', 'initial', riotId, region, platform],
    queryFn: async () => {
      console.log('📥 Fetching initial 5 matches...');
      const cached = getCachedMatches(riotId);
      
      // If we have cached data with at least 5 matches, use it immediately
      if (cached && cached.matches && cached.matches.length >= 5) {
        console.log('✅ Using cached initial matches');
        return cached;
      }
      
      // Fetch first 5 matches
      const data = await api.riot.getMatchHistory(riotId, region, platform, 5);
      console.log('✅ Initial 5 matches loaded');
      return data;
    },
    enabled: enabled && !!riotId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    initialData: () => {
      const cached = getCachedMatches(riotId);
      if (cached && cached.matches && cached.matches.length >= 5) {
        return {
          ...cached,
          matches: cached.matches.slice(0, 5),
        };
      }
      return undefined;
    },
  });

  // Fetch all 20 matches in background (starts after initial load)
  const fullQuery = useQuery({
    queryKey: ['matchHistory', 'full', riotId, region, platform],
    queryFn: async () => {
      console.log('📥 Fetching full 20 matches in background...');
      const data = await api.riot.getMatchHistory(riotId, region, platform, 20);
      setCachedMatches(riotId, undefined, data);
      console.log('✅ Full 20 matches loaded');
      return data;
    },
    enabled: enabled && !!riotId && !!initialQuery.data,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    initialData: () => getCachedMatches(riotId) || undefined,
  });

  // Pre-fetch queue-specific matches in parallel
  const queueQueries = useQueries({
    queries: QUEUE_CONFIGS.filter(config => config.queueId !== undefined).map(config => ({
      queryKey: ['matchHistory', 'queue', riotId, region, platform, config.queueId],
      queryFn: async () => {
        console.log(`📥 Pre-fetching ${config.key} matches...`);
        const data = await api.riot.getMatchHistory(riotId, region, platform, 20, config.queueId);
        setCachedMatches(riotId, config.queueId, data);
        console.log(`✅ ${config.key} matches loaded`);
        return data;
      },
      enabled: enabled && !!riotId && !!initialQuery.data,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      retry: 1,
      initialData: () => getCachedMatches(riotId, config.queueId) || undefined,
    })),
  });

  // Calculate loading progress
  const totalQueries = 1 + queueQueries.length; // full query + queue queries
  const completedQueries = [fullQuery, ...queueQueries].filter(q => q.isSuccess).length;
  const progress = Math.round((completedQueries / totalQueries) * 100);

  // Log progress
  useEffect(() => {
    if (progress > 0 && progress < 100) {
      console.log(`⏳ Background loading progress: ${progress}%`);
    }
    if (progress === 100) {
      console.log('🎉 All match data loaded!');
    }
  }, [progress]);

  const isInitialLoading = initialQuery.isLoading;
  const isBackgroundLoading = fullQuery.isLoading || queueQueries.some(q => q.isLoading);

  return {
    all: fullQuery.data || initialQuery.data,
    rankedSolo: queueQueries[0]?.data,
    rankedFlex: queueQueries[1]?.data,
    aram: queueQueries[2]?.data,
    isInitialLoading,
    isBackgroundLoading,
    progress,
  };
}

/**
 * Hook for getting matches by specific queue
 * Uses pre-fetched data if available, otherwise fetches on demand
 */
export function useQueueMatches(
  riotId: string,
  queueId: number | null,
  region = 'EUROPE',
  platform = 'EUW1',
  enabled = true
): UseQueryResult<MatchHistoryResponse, Error> {
  return useQuery({
    queryKey: ['matchHistory', 'queue', riotId, region, platform, queueId],
    queryFn: async () => {
      const cached = getCachedMatches(riotId, queueId || undefined);
      if (cached) {
        console.log(`✅ Using cached ${queueId || 'all'} matches`);
        return cached;
      }
      
      console.log(`📥 Fetching ${queueId || 'all'} matches on demand...`);
      const data = await api.riot.getMatchHistory(riotId, region, platform, 20, queueId || undefined);
      setCachedMatches(riotId, queueId || undefined, data);
      return data;
    },
    enabled: enabled && !!riotId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    initialData: () => getCachedMatches(riotId, queueId || undefined) || undefined,
  });
}
