/**
 * React Query hooks for AI agent analysis
 */

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AnalysisResponse } from '../types';

// ==================== Performance Analysis ====================

export interface UsePerformanceAnalysisOptions {
  riotId: string;
  matchId?: string;
  matchCount?: number;
  analysisType?: 'match' | 'recent';
}

export function usePerformanceAnalysis(): UseMutationResult<
  AnalysisResponse,
  Error,
  UsePerformanceAnalysisOptions
> {
  return useMutation({
    mutationFn: ({ riotId, matchId, matchCount, analysisType = 'match' }) =>
      api.analysis.analyzePerformance(riotId, matchId, matchCount, analysisType),
    retry: 1,
  });
}

export interface UseCustomPerformanceQueryOptions {
  query: string;
  riotId?: string;
}

export function useCustomPerformanceQuery(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseCustomPerformanceQueryOptions
> {
  return useMutation({
    mutationFn: ({ query, riotId }) =>
      api.analysis.customPerformanceQuery(query, riotId),
    retry: 1,
  });
}

// ==================== Champion Analysis ====================

export interface UseChampionAnalysisOptions {
  riotId: string;
  championName?: string;
  enemyChampion?: string;
  analysisType?: 'champion' | 'pool' | 'matchup';
}

export function useChampionAnalysis(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseChampionAnalysisOptions
> {
  return useMutation({
    mutationFn: ({ riotId, championName, enemyChampion, analysisType = 'champion' }) =>
      api.analysis.analyzeChampion(riotId, championName, enemyChampion, analysisType),
    retry: 1,
  });
}

export interface UseCustomChampionQueryOptions {
  query: string;
  riotId?: string;
}

export function useCustomChampionQuery(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseCustomChampionQueryOptions
> {
  return useMutation({
    mutationFn: ({ query, riotId }) =>
      api.analysis.customChampionQuery(query, riotId),
    retry: 1,
  });
}

// ==================== Comparison Analysis ====================

export interface UseComparePlayersOptions {
  riotIds: string[];
  analysisType?: 'compare' | 'duo' | 'head_to_head';
}

export function useComparePlayers(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseComparePlayersOptions
> {
  return useMutation({
    mutationFn: ({ riotIds, analysisType = 'compare' }) =>
      api.analysis.comparePlayers(riotIds, analysisType),
    retry: 1,
  });
}

export interface UseCustomComparisonQueryOptions {
  query: string;
  riotId?: string;
}

export function useCustomComparisonQuery(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseCustomComparisonQueryOptions
> {
  return useMutation({
    mutationFn: ({ query, riotId }) =>
      api.analysis.customComparisonQuery(query, riotId),
    retry: 1,
  });
}

// ==================== General Analysis Hook ====================

/**
 * General-purpose analysis hook that can handle any type of query
 */
export interface UseAnalysisOptions {
  type: 'performance' | 'champion' | 'comparison';
  query: string;
  riotId?: string;
}

export function useAnalysis(): UseMutationResult<
  AnalysisResponse,
  Error,
  UseAnalysisOptions
> {
  return useMutation({
    mutationFn: async ({ type, query, riotId }) => {
      switch (type) {
        case 'performance':
          return api.analysis.customPerformanceQuery(query, riotId);
        case 'champion':
          return api.analysis.customChampionQuery(query, riotId);
        case 'comparison':
          return api.analysis.customComparisonQuery(query, riotId);
        default:
          throw new Error(`Unknown analysis type: ${type}`);
      }
    },
    retry: 1,
  });
}

// ==================== Health Check ====================

export function useAnalysisHealth(): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['analysisHealth'],
    queryFn: () => api.analysis.healthCheck(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
