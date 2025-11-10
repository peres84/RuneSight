/**
 * Match data validation utilities for RuneSight frontend
 */

import type { 
  MatchData, 
  PlayerPerformance, 
  TeamData, 
  MatchHistoryResponse,
  PerformanceMetrics,
  RuneData
} from '../types';

/**
 * Validate match data structure
 */
export function validateMatchData(data: any): data is MatchData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const required = [
    'match_id',
    'game_creation',
    'game_duration',
    'game_mode',
    'queue_id',
    'map_id',
    'player_performance',
    'teams'
  ];

  return required.every(field => field in data) &&
    typeof data.match_id === 'string' &&
    typeof data.game_creation === 'string' &&
    typeof data.game_duration === 'number' &&
    typeof data.game_mode === 'string' &&
    typeof data.queue_id === 'number' &&
    typeof data.map_id === 'number' &&
    typeof data.win === 'boolean' &&
    validatePlayerPerformance(data.player_performance) &&
    Array.isArray(data.teams) &&
    data.teams.every(validateTeamData);
}

/**
 * Validate player performance data
 */
export function validatePlayerPerformance(data: any): data is PlayerPerformance {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const required = [
    'kills',
    'deaths',
    'assists',
    'kda_string',
    'kda_ratio',
    'champion_name',
    'champion_id',
    'team_position',
    'total_damage_dealt',
    'gold_earned',
    'cs_total',
    'vision_score',
    'items',
    'summoner_spells'
  ];

  return required.every(field => field in data) &&
    typeof data.kills === 'number' &&
    typeof data.deaths === 'number' &&
    typeof data.assists === 'number' &&
    typeof data.kda_string === 'string' &&
    typeof data.kda_ratio === 'number' &&
    typeof data.champion_name === 'string' &&
    typeof data.champion_id === 'number' &&
    typeof data.team_position === 'string' &&
    typeof data.total_damage_dealt === 'number' &&
    typeof data.gold_earned === 'number' &&
    typeof data.cs_total === 'number' &&
    typeof data.vision_score === 'number' &&
    Array.isArray(data.items) &&
    Array.isArray(data.summoner_spells) &&
    data.items.every((item: any) => typeof item === 'number') &&
    data.summoner_spells.every((spell: any) => typeof spell === 'number');
}

/**
 * Validate team data
 */
export function validateTeamData(data: any): data is TeamData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.team_id === 'number' &&
    typeof data.win === 'boolean' &&
    typeof data.is_player_team === 'boolean' &&
    data.objectives &&
    typeof data.objectives === 'object' &&
    typeof data.objectives.baron === 'number' &&
    typeof data.objectives.dragon === 'number' &&
    typeof data.objectives.tower === 'number' &&
    typeof data.objectives.inhibitor === 'number' &&
    typeof data.objectives.rift_herald === 'number';
}

/**
 * Validate match history response
 */
export function validateMatchHistoryResponse(data: any): data is MatchHistoryResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.riot_id === 'string' &&
    typeof data.region === 'string' &&
    data.player_profile &&
    typeof data.player_profile === 'object' &&
    Array.isArray(data.matches) &&
    data.matches.every(validateMatchData) &&
    typeof data.total_matches === 'number' &&
    typeof data.start === 'number' &&
    typeof data.count === 'number';
}

/**
 * Validate rune data
 */
export function validateRuneData(data: any): data is RuneData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.primary_style === 'number' &&
    typeof data.sub_style === 'number' &&
    Array.isArray(data.perks) &&
    data.perks.every((perk: any) => typeof perk === 'number');
}

/**
 * Transform match data to ensure consistent format
 */
export function normalizeMatchData(data: any): MatchData | null {
  if (!validateMatchData(data)) {
    console.warn('Invalid match data structure:', data);
    return null;
  }

  // Ensure all optional fields have default values
  return {
    ...data,
    game_duration_formatted: data.game_duration_formatted || formatGameDuration(data.game_duration),
    player_performance: {
      ...data.player_performance,
      total_damage_dealt_to_champions: data.player_performance.total_damage_dealt_to_champions || 0,
      total_damage_dealt_formatted: data.player_performance.total_damage_dealt_formatted || formatDamage(data.player_performance.total_damage_dealt),
      gold_earned_formatted: data.player_performance.gold_earned_formatted || formatGold(data.player_performance.gold_earned),
      cs_per_minute: data.player_performance.cs_per_minute || calculateCSPerMinute(data.player_performance.cs_total, data.game_duration),
      damage_per_minute: data.player_performance.damage_per_minute || calculateDamagePerMinute(data.player_performance.total_damage_dealt, data.game_duration),
      runes: data.player_performance.runes || { primary_style: 0, sub_style: 0, perks: [] }
    }
  };
}

/**
 * Calculate performance metrics from match list
 */
export function calculatePerformanceMetrics(matches: MatchData[]): PerformanceMetrics {
  if (matches.length === 0) {
    return {
      total_matches: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      average_kda: { kills: 0, deaths: 0, assists: 0, kda_string: '0/0/0', kda_ratio: 0 },
      average_damage: 0,
      average_damage_formatted: '0',
      average_gold: 0,
      average_gold_formatted: '0',
      average_cs: 0,
      average_vision_score: 0
    };
  }

  const totalMatches = matches.length;
  const wins = matches.filter(match => match.win).length;
  const losses = totalMatches - wins;

  // Calculate averages
  const totalKills = matches.reduce((sum, match) => sum + match.player_performance.kills, 0);
  const totalDeaths = matches.reduce((sum, match) => sum + match.player_performance.deaths, 0);
  const totalAssists = matches.reduce((sum, match) => sum + match.player_performance.assists, 0);
  const totalDamage = matches.reduce((sum, match) => sum + match.player_performance.total_damage_dealt, 0);
  const totalGold = matches.reduce((sum, match) => sum + match.player_performance.gold_earned, 0);
  const totalCS = matches.reduce((sum, match) => sum + match.player_performance.cs_total, 0);
  const totalVision = matches.reduce((sum, match) => sum + match.player_performance.vision_score, 0);

  const avgKills = Math.round(totalKills / totalMatches * 10) / 10;
  const avgDeaths = Math.round(totalDeaths / totalMatches * 10) / 10;
  const avgAssists = Math.round(totalAssists / totalMatches * 10) / 10;
  const avgKDA = avgDeaths > 0 ? Math.round((avgKills + avgAssists) / avgDeaths * 100) / 100 : avgKills + avgAssists;

  const avgDamage = Math.round(totalDamage / totalMatches);
  const avgGold = Math.round(totalGold / totalMatches);
  const avgCS = Math.round(totalCS / totalMatches * 10) / 10;
  const avgVision = Math.round(totalVision / totalMatches * 10) / 10;

  return {
    total_matches: totalMatches,
    wins,
    losses,
    win_rate: Math.round((wins / totalMatches) * 100 * 10) / 10,
    average_kda: {
      kills: avgKills,
      deaths: avgDeaths,
      assists: avgAssists,
      kda_string: `${avgKills}/${avgDeaths}/${avgAssists}`,
      kda_ratio: avgKDA
    },
    average_damage: avgDamage,
    average_damage_formatted: formatDamage(avgDamage),
    average_gold: avgGold,
    average_gold_formatted: formatGold(avgGold),
    average_cs: avgCS,
    average_vision_score: avgVision
  };
}

// Helper formatting functions
function formatGameDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDamage(damage: number): string {
  if (damage >= 1000) {
    return `${Math.round(damage / 100) / 10}K`;
  }
  return damage.toString();
}

function formatGold(gold: number): string {
  if (gold >= 1000) {
    return `${Math.round(gold / 100) / 10}K`;
  }
  return gold.toString();
}

function calculateCSPerMinute(cs: number, gameDuration: number): number {
  if (gameDuration <= 0) return 0;
  const minutes = gameDuration / 60;
  return Math.round((cs / minutes) * 10) / 10;
}

function calculateDamagePerMinute(damage: number, gameDuration: number): number {
  if (gameDuration <= 0) return 0;
  const minutes = gameDuration / 60;
  return Math.round(damage / minutes);
}