/**
 * Generate comprehensive user profile from cached match data
 * This avoids making additional API calls
 */

interface MatchData {
  match_id: string;
  win: boolean;
  champion_name: string;
  kills: number;
  deaths: number;
  assists: number;
  cs_total: number;
  gold_earned: number;
  total_damage_dealt_to_champions: number;
  vision_score: number;
  team_position: string;
  game_duration: number;
  queue_id?: number;
}

interface RankedData {
  tier: string;
  rank: string;
  league_points: number;
  wins: number;
  losses: number;
  queue_type: string;
}

export function generateUserProfileFromCache(
  riotId: string,
  matches: MatchData[],
  rankedData: RankedData[]
) {
  if (!matches || matches.length === 0) {
    return null;
  }

  // Aggregate stats
  const totalGames = matches.length;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCS = 0;
  let totalGold = 0;
  let totalDamage = 0;
  let totalVision = 0;
  let totalGameDuration = 0;
  let wins = 0;

  const championStats: Record<string, { games: number; wins: number }> = {};
  const roleStats: Record<string, number> = {};
  const queueStats: Record<number, { games: number; wins: number; losses: number }> = {};

  matches.forEach(match => {
    if (match.win) wins++;
    totalKills += match.kills || 0;
    totalDeaths += match.deaths || 0;
    totalAssists += match.assists || 0;
    totalCS += match.cs_total || 0;
    totalGold += match.gold_earned || 0;
    totalDamage += match.total_damage_dealt_to_champions || 0;
    totalVision += match.vision_score || 0;
    totalGameDuration += match.game_duration || 0;

    // Champion stats
    const champ = match.champion_name || 'Unknown';
    if (!championStats[champ]) {
      championStats[champ] = { games: 0, wins: 0 };
    }
    championStats[champ].games++;
    if (match.win) championStats[champ].wins++;

    // Role stats
    const role = match.team_position || 'UNKNOWN';
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
  });

  // Calculate averages
  const avgKills = totalKills / totalGames;
  const avgDeaths = totalDeaths / totalGames;
  const avgAssists = totalAssists / totalGames;
  const avgKDA = (totalKills + totalAssists) / Math.max(totalDeaths, 1);
  const avgCS = totalCS / totalGames;
  const avgGameDuration = totalGameDuration / totalGames;
  const csPerMinute = avgCS / (avgGameDuration / 60);

  // Top 5 champions
  const mostPlayedChampions = Object.entries(championStats)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([champion, stats]) => ({
      champion,
      games: stats.games,
      wins: stats.wins,
      win_rate: Math.round((stats.wins / stats.games) * 100 * 10) / 10
    }));

  // Top 3 roles
  const preferredRoles = Object.entries(roleStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([role, games]) => ({
      role,
      games,
      percentage: Math.round((games / totalGames) * 100 * 10) / 10
    }));

  // Queue statistics
  const queueNames: Record<number, string> = {
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',
    450: 'ARAM',
    0: 'Normal'
  };

  const queueStatistics = Object.entries(queueStats)
    .map(([queueId, stats]) => ({
      queue_type: queueNames[Number(queueId)] || `Queue ${queueId}`,
      games: stats.games,
      wins: stats.wins,
      losses: stats.losses,
      win_rate: Math.round((stats.wins / stats.games) * 100 * 10) / 10
    }))
    .sort((a, b) => b.games - a.games);

  // Parse ranked data (handle both camelCase and snake_case)
  const rankedSolo = rankedData?.find((r: any) => 
    r.queue_type === 'RANKED_SOLO_5x5' || r.queueType === 'RANKED_SOLO_5x5'
  );
  const rankedFlex = rankedData?.find((r: any) => 
    r.queue_type === 'RANKED_FLEX_SR' || r.queueType === 'RANKED_FLEX_SR'
  );

  return {
    riot_id: riotId,
    puuid: 'cached',
    summoner_level: 0, // Not available from match data
    ranked_solo: rankedSolo ? {
      tier: (rankedSolo as any).tier,
      rank: (rankedSolo as any).rank,
      lp: (rankedSolo as any).league_points || (rankedSolo as any).leaguePoints,
      wins: (rankedSolo as any).wins,
      losses: (rankedSolo as any).losses,
      win_rate: Math.round(((rankedSolo as any).wins / ((rankedSolo as any).wins + (rankedSolo as any).losses)) * 100 * 10) / 10
    } : { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0, win_rate: 0 },
    ranked_flex: rankedFlex ? {
      tier: (rankedFlex as any).tier,
      rank: (rankedFlex as any).rank,
      lp: (rankedFlex as any).league_points || (rankedFlex as any).leaguePoints,
      wins: (rankedFlex as any).wins,
      losses: (rankedFlex as any).losses,
      win_rate: Math.round(((rankedFlex as any).wins / ((rankedFlex as any).wins + (rankedFlex as any).losses)) * 100 * 10) / 10
    } : { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0, win_rate: 0 },
    matches_analyzed: totalGames,
    total_playtime_hours: Math.round((totalGameDuration / 3600) * 10) / 10,
    average_stats: {
      kda: `${avgKills.toFixed(1)}/${avgDeaths.toFixed(1)}/${avgAssists.toFixed(1)}`,
      kda_ratio: Math.round(avgKDA * 100) / 100,
      cs: Math.round(avgCS * 10) / 10,
      cs_per_minute: Math.round(csPerMinute * 10) / 10,
      gold: Math.round(totalGold / totalGames),
      damage: Math.round(totalDamage / totalGames),
      vision_score: Math.round((totalVision / totalGames) * 10) / 10
    },
    most_played_champions: mostPlayedChampions,
    preferred_roles: preferredRoles,
    queue_statistics: queueStatistics,
    data_source: 'generated_from_cache'
  };
}
