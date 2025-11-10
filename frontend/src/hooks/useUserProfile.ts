/**
 * User Profile Hook
 * Generates and caches comprehensive user profile with stats, rank, champions
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface UserProfileData {
  riot_id: string;
  puuid: string;
  summoner_level: number;
  ranked_solo: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
  ranked_flex: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
  average_stats: {
    kda: string;
    kda_ratio: number;
    cs: number;
    cs_per_minute: number;
    gold: number;
    damage: number;
    vision_score: number;
  };
  most_played_champions: Array<{
    champion: string;
    games: number;
    wins: number;
    win_rate: number;
  }>;
  preferred_roles: Array<{
    role: string;
    games: number;
    percentage: number;
  }>;
  queue_statistics: Array<{
    queue_type: string;
    games: number;
    wins: number;
    losses: number;
    win_rate: number;
  }>;
}

// LocalStorage cache helpers
const getProfileCacheKey = (riotId: string) => {
  return `runesight_user_profile_${riotId}`;
};

const getCachedProfile = (riotId: string): UserProfileData | null => {
  try {
    const cacheKey = getProfileCacheKey(riotId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - (data.timestamp || 0);
      // Cache profile for 10 minutes
      if (cacheAge < 10 * 60 * 1000) {
        return data.profile;
      }
    }
  } catch (error) {
    console.error('Error reading profile from localStorage:', error);
  }
  return null;
};

const setCachedProfile = (riotId: string, profile: UserProfileData) => {
  try {
    const cacheKey = getProfileCacheKey(riotId);
    const dataToStore = {
      profile,
      timestamp: Date.now(),
    };
    const jsonString = JSON.stringify(dataToStore);
    console.log(`💾 Storing profile with key: ${cacheKey}, size: ${jsonString.length} bytes`);
    localStorage.setItem(cacheKey, jsonString);
    console.log('✅ User profile saved to localStorage');
  } catch (error) {
    console.error('❌ Error writing profile to localStorage:', error);
    throw error; // Re-throw to see the error in the query
  }
};

export interface UseUserProfileOptions {
  riotId: string;
  region?: string;
  platform?: string;
  enabled?: boolean;
}

/**
 * Hook to generate and cache user profile from cached match data + ranked info
 * Should be called after match history is loaded
 */
export function useUserProfile({
  riotId,
  region = 'EUROPE',
  platform = 'EUW1',
  enabled = true,
}: UseUserProfileOptions) {
  return useQuery({
    queryKey: ['userProfile', riotId, region, platform],
    queryFn: async () => {
      console.log('📥 Generating user profile from cached matches...');
      
      // Check cache first
      const cached = getCachedProfile(riotId);
      if (cached) {
        console.log('✅ Using cached user profile');
        return cached;
      }
      
      // Get cached matches from localStorage
      const matchCacheKey = `runesight_matches_${riotId}_all`;
      const cachedMatchesStr = localStorage.getItem(matchCacheKey);
      
      if (!cachedMatchesStr) {
        console.warn('⚠️ No cached matches found, cannot generate profile');
        throw new Error('No cached matches available');
      }
      
      const cachedMatchesData = JSON.parse(cachedMatchesStr);
      const matches = cachedMatchesData.matches?.matches || [];
      
      if (matches.length === 0) {
        console.warn('⚠️ No matches in cache');
        throw new Error('No matches available');
      }
      
      console.log(`📊 Generating profile from ${matches.length} cached matches...`);
      
      // Fetch ranked information from API (will be included in user profile)
      let rankedData = null;
      try {
        console.log('📥 Fetching ranked information from API...');
        rankedData = await api.riot.getRankedInfo(riotId, region, platform);
        console.log('✅ Ranked information fetched:', rankedData);
      } catch (error) {
        console.warn('⚠️ Could not fetch ranked data:', error);
      }
      
      // Generate profile from cached data (client-side calculation)
      console.log('🔧 Generating profile from matches and ranked data...');
      const profile = generateProfileFromMatches(riotId, matches, rankedData);
      console.log('✅ Profile generated:', profile);
      
      // Cache the profile
      console.log('💾 Saving profile to localStorage...');
      setCachedProfile(riotId, profile);
      console.log('✅ User profile generated and cached from local data');
      
      return profile;
    },
    enabled: enabled && !!riotId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    initialData: () => getCachedProfile(riotId) || undefined,
  });
}

/**
 * Generate user profile from cached match data (client-side)
 */
function generateProfileFromMatches(riotId: string, matches: any[], rankedData?: any): UserProfileData {
  // Initialize counters
  let totalGames = matches.length;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCs = 0;
  let totalGold = 0;
  let totalDamage = 0;
  let totalVision = 0;
  let totalDuration = 0;
  
  const championStats: Record<string, { games: number; wins: number }> = {};
  const roleStats: Record<string, number> = {};
  const queueStats: Record<number, { games: number; wins: number; losses: number }> = {};
  
  // Process each match
  for (const match of matches) {
    totalKills += match.kills || 0;
    totalDeaths += match.deaths || 0;
    totalAssists += match.assists || 0;
    totalCs += match.cs_total || 0;
    totalGold += match.gold_earned || 0;
    totalDamage += match.total_damage_dealt_to_champions || 0;
    totalVision += match.vision_score || 0;
    totalDuration += match.game_duration || 0;
    
    // Champion stats
    const champion = match.champion_name || 'Unknown';
    if (!championStats[champion]) {
      championStats[champion] = { games: 0, wins: 0 };
    }
    championStats[champion].games++;
    if (match.win) {
      championStats[champion].wins++;
    }
    
    // Role stats
    const role = match.team_position || 'FILL';
    roleStats[role] = (roleStats[role] || 0) + 1;
    
    // Queue stats
    const queueId = match.queue_id || 0;
    if (!queueStats[queueId]) {
      queueStats[queueId] = { games: 0, wins: 0, losses: 0 };
    }
    queueStats[queueId].games++;
    if (match.win) {
      queueStats[queueId].wins++;
    } else {
      queueStats[queueId].losses++;
    }
  }
  
  // Calculate averages
  const avgKills = totalGames > 0 ? (totalKills / totalGames).toFixed(1) : '0';
  const avgDeaths = totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : '0';
  const avgAssists = totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : '0';
  const kdaRatio = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths) : (totalKills + totalAssists);
  const avgCs = totalGames > 0 ? Math.round(totalCs / totalGames) : 0;
  const avgDurationMin = totalGames > 0 ? totalDuration / totalGames / 60 : 30;
  const csPerMin = avgDurationMin > 0 ? (avgCs / avgDurationMin) : 0;
  
  // Top 5 champions
  const topChampions = Object.entries(championStats)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([champion, stats]) => ({
      champion,
      games: stats.games,
      wins: stats.wins,
      win_rate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100 * 10) / 10 : 0,
    }));
  
  // Top 3 roles
  const topRoles = Object.entries(roleStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([role, games]) => ({
      role: role === 'MIDDLE' ? 'Mid' : role === 'BOTTOM' ? 'ADC' : role === 'UTILITY' ? 'Support' : role.charAt(0) + role.slice(1).toLowerCase(),
      games,
      percentage: totalGames > 0 ? Math.round((games / totalGames) * 100 * 10) / 10 : 0,
    }));
  
  // Queue breakdown
  const queueNames: Record<number, string> = {
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',
    450: 'ARAM',
    400: 'Normal Draft',
    430: 'Normal Blind',
  };
  
  const queueBreakdown = Object.entries(queueStats)
    .sort((a, b) => b[1].games - a[1].games)
    .map(([queueId, stats]) => ({
      queue_type: queueNames[Number(queueId)] || `Queue ${queueId}`,
      games: stats.games,
      wins: stats.wins,
      losses: stats.losses,
      win_rate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100 * 10) / 10 : 0,
    }));
  
  // Parse ranked data from API if available
  let rankedSoloInfo = {
    tier: 'UNRANKED',
    rank: '',
    lp: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
  };
  
  let rankedFlexInfo = {
    tier: 'UNRANKED',
    rank: '',
    lp: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
  };
  
  let summonerLevel = 0;
  let puuid = 'cached';
  
  if (rankedData) {
    puuid = rankedData.puuid || 'cached';
    
    // Parse ranked entries
    if (rankedData.ranked_data && Array.isArray(rankedData.ranked_data)) {
      for (const entry of rankedData.ranked_data) {
        const wins = entry.wins || 0;
        const losses = entry.losses || 0;
        const totalGames = wins + losses;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100 * 10) / 10 : 0;
        
        if (entry.queueType === 'RANKED_SOLO_5x5') {
          rankedSoloInfo = {
            tier: entry.tier || 'UNRANKED',
            rank: entry.rank || '',
            lp: entry.leaguePoints || 0,
            wins,
            losses,
            win_rate: winRate,
          };
        } else if (entry.queueType === 'RANKED_FLEX_SR') {
          rankedFlexInfo = {
            tier: entry.tier || 'UNRANKED',
            rank: entry.rank || '',
            lp: entry.leaguePoints || 0,
            wins,
            losses,
            win_rate: winRate,
          };
        }
      }
    }
  }
  
  return {
    riot_id: riotId,
    puuid,
    summoner_level: summonerLevel,
    ranked_solo: rankedSoloInfo,
    ranked_flex: rankedFlexInfo,
    average_stats: {
      kda: `${avgKills}/${avgDeaths}/${avgAssists}`,
      kda_ratio: Math.round(kdaRatio * 100) / 100,
      cs: avgCs,
      cs_per_minute: Math.round(csPerMin * 10) / 10,
      gold: totalGames > 0 ? Math.round(totalGold / totalGames) : 0,
      damage: totalGames > 0 ? Math.round(totalDamage / totalGames) : 0,
      vision_score: totalGames > 0 ? Math.round((totalVision / totalGames) * 10) / 10 : 0,
    },
    most_played_champions: topChampions,
    preferred_roles: topRoles,
    queue_statistics: queueBreakdown,
  };
}
