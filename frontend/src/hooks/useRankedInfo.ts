/**
 * React Query hook for fetching ranked league information
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface RankedInfoResponse {
  riot_id: string;
  puuid: string;
  ranked_data: RankedEntry[];
}

export interface UseRankedInfoOptions {
  riotId: string;
  region?: string;
  platform?: string;
  enabled?: boolean;
}

export function useRankedInfo({
  riotId,
  region = 'EUROPE',
  platform,
  enabled = true,
}: UseRankedInfoOptions): UseQueryResult<RankedInfoResponse, Error> {
  return useQuery({
    queryKey: ['rankedInfo', riotId, region, platform],
    queryFn: () => api.riot.getRankedInfo(riotId, region, platform),
    enabled: enabled && !!riotId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
