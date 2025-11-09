/**
 * MatchHistory Component
 * Displays a list of recent matches with key stats
 */

import React from 'react';
import { useMatchHistory } from '../../hooks/useMatchHistory';
import { useProfile } from '../../hooks/useProfile';
import type { MatchData } from '../../types';

export interface MatchHistoryProps {
  riotId?: string;
  region?: string;
  platform?: string;
  count?: number;
  onMatchClick?: (matchId: string) => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  riotId: propRiotId,
  region = 'EUROPE',
  platform = 'EUW1',
  count = 20,
  onMatchClick,
}) => {
  const { profile } = useProfile();
  const riotId = propRiotId || profile?.riotId || '';

  const { data, isLoading, error } = useMatchHistory({
    riotId,
    region,
    platform,
    count,
    enabled: !!riotId,
  });

  if (!riotId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Please set up your profile to view match history
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 dark:text-red-400">
          Error loading match history: {error.message}
        </p>
      </div>
    );
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No matches found for {riotId}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Match History
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.total_matches} matches
        </p>
      </div>

      <div className="space-y-3">
        {data.matches.map((match) => (
          <MatchCard
            key={match.match_id}
            match={match}
            onClick={() => onMatchClick?.(match.match_id)}
          />
        ))}
      </div>
    </div>
  );
};

interface MatchCardProps {
  match: MatchData;
  onClick?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  const winColor = match.win
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${winColor}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {/* Champion and Result */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {match.player_performance.champion_name}
            </span>
            <span className={`text-sm font-semibold ${match.win ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {match.win ? 'Victory' : 'Defeat'}
            </span>
          </div>
        </div>

        {/* KDA */}
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">KDA</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {match.player_performance.kda_string}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {match.player_performance.kda_ratio.toFixed(2)} ratio
          </span>
        </div>

        {/* Stats */}
        <div className="hidden md:flex md:space-x-6">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">CS</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {match.player_performance.cs_total}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {match.player_performance.cs_per_minute.toFixed(1)}/min
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Damage</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {match.player_performance.total_damage_dealt_formatted}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {match.player_performance.damage_per_minute.toFixed(0)}/min
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Vision</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {match.player_performance.vision_score}
            </span>
          </div>
        </div>

        {/* Game Info */}
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {match.game_mode}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {match.game_duration_formatted}
          </span>
        </div>
      </div>
    </div>
  );
};
