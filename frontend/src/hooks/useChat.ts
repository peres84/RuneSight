/**
 * React Query hooks for AI chat with automatic cache integration
 */

import { useMutation, useQuery, type UseMutationResult } from '@tanstack/react-query';
import { api, type ChatMessage, type ChatResponse } from '../lib/api';
import { getStoredMatchHistory, getStoredRankedInfo, getStoredUserProfile } from '../lib/storage';

export interface UseChatMessageOptions extends Omit<ChatMessage, 'match_data' | 'ranked_data'> {
  useCache?: boolean; // Whether to include cached data
}

/**
 * Hook for sending chat messages with automatic cache integration
 * 
 * This hook automatically loads match and ranked data from localStorage
 * and passes it to the backend, avoiding redundant API calls.
 */
export function useChatMessage(): UseMutationResult<
  ChatResponse,
  Error,
  UseChatMessageOptions
> {
  return useMutation({
    mutationFn: async ({ useCache = true, riot_id, ...options }) => {
      let match_data = undefined;
      let user_profile = undefined;
      
      if (useCache && riot_id) {
        try {
          // Load all queue types and combine them
          const allQueues = [
            { queue: undefined, name: 'all' },
            { queue: 420, name: 'ranked_solo' },
            { queue: 440, name: 'ranked_flex' },
            { queue: 450, name: 'aram' }
          ];
          
          const allMatches: any[] = [];
          
          for (const { queue, name } of allQueues) {
            const queueMatches = getStoredMatchHistory(riot_id, queue);
            if (queueMatches && queueMatches.length > 0) {
              console.log(`📦 Found ${queueMatches.length} cached ${name} matches`);
              // Add queue info to each match if not present
              queueMatches.forEach(match => {
                if (!match.queueId && queue) {
                  match.queueId = queue;
                }
              });
              allMatches.push(...queueMatches);
            }
          }
          
          // Remove duplicates based on match_id
          const uniqueMatches = Array.from(
            new Map(allMatches.map(m => [m.match_id, m])).values()
          );
          
          if (uniqueMatches.length > 0) {
            match_data = uniqueMatches;
            console.log(`📦 Using ${uniqueMatches.length} total cached matches for ${riot_id}`);
          }
          
          // Load user profile (contains ranked data, stats, champions, etc.)
          const cachedProfile = getStoredUserProfile(riot_id);
          if (cachedProfile) {
            user_profile = cachedProfile;
            console.log(`📦 Using cached user profile for ${riot_id}:`, {
              rank_solo: `${cachedProfile.ranked_solo?.tier} ${cachedProfile.ranked_solo?.rank}`,
              rank_flex: `${cachedProfile.ranked_flex?.tier} ${cachedProfile.ranked_flex?.rank}`,
              level: cachedProfile.summoner_level,
              avg_cs: cachedProfile.average_stats?.cs,
              avg_kda: cachedProfile.average_stats?.kda_ratio,
              top_champions: cachedProfile.most_played_champions?.slice(0, 3).map(c => c.champion).join(', ')
            });
          } else {
            console.warn(`⚠️ No cached user profile found for ${riot_id}`);
          }
        } catch (error) {
          console.warn('Failed to load cached data:', error);
        }
      }

      return api.chat.sendMessage({
        ...options,
        riot_id,
        match_data,
        user_profile,
      });
    },
    retry: 1,
  });
}

/**
 * Hook for getting conversation history
 */
export function useChatHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => sessionId ? api.chat.getHistory(sessionId) : null,
    enabled: !!sessionId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for clearing conversation
 */
export function useClearChat(): UseMutationResult<any, Error, string> {
  return useMutation({
    mutationFn: (sessionId: string) => api.chat.clearHistory(sessionId),
  });
}

/**
 * Hook for getting available agents
 */
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => api.chat.getAgents(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
