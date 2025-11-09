/**
 * React Query hook for fetching match details
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MatchDetailsResponse } from '../types';

export interface UseMatchDataOptions {
  matchId: string;
  region?: string;
  puuid?: string;
  enabled?: boolean;
}

export function useMatchData({
  matchId,
  region = 'EUROPE',
  puuid,
  enabled = true,
}: UseMatchDataOptions): UseQueryResult<MatchDetailsResponse, Error> {
  return useQuery({
    queryKey: ['match', matchId, region, puuid],
    queryFn: () => api.riot.getMatchDetails(matchId, region, puuid),
    enabled: enabled && !!matchId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
