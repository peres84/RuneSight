/**
 * MatchDetails Component
 * Displays full match breakdown with all participants
 */

import React from 'react';
import { useMatchData } from '../../hooks/useMatchData';
import type { ParticipantData } from '../../types';

export interface MatchDetailsProps {
  matchId: string;
  region?: string;
  puuid?: string;
  onClose?: () => void;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({
  matchId,
  region = 'EUROPE',
  puuid,
  onClose,
}) => {
  const { data, isLoading, error } = useMatchData({
    matchId,
    region,
    puuid,
    enabled: !!matchId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 dark:text-red-400">
          Error loading match details: {error.message}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No match data available</p>
      </div>
    );
  }

  const blueTeam = data.participants.filter((p) => p.team_id === 100);
  const redTeam = data.participants.filter((p) => p.team_id === 200);
  const winningTeam = data.summary.winning_team;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.summary.game_mode} • {Math.floor(data.summary.game_duration / 60)}m {data.summary.game_duration % 60}s
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        )}
      </div>

      {/* Target Player Highlight */}
      {data.target_player && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your Performance
          </h3>
          <ParticipantRow participant={data.target_player} isHighlighted />
        </div>
      )}

      {/* Teams */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Blue Team */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${winningTeam === 100 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Blue Team
            </h3>
            {winningTeam === 100 && (
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                Victory
              </span>
            )}
          </div>
          <div className="space-y-2">
            {blueTeam.map((participant) => (
              <ParticipantRow
                key={participant.puuid}
                participant={participant}
                isHighlighted={participant.puuid === puuid}
              />
            ))}
          </div>
        </div>

        {/* Red Team */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${winningTeam === 200 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Red Team
            </h3>
            {winningTeam === 200 && (
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                Victory
              </span>
            )}
          </div>
          <div className="space-y-2">
            {redTeam.map((participant) => (
              <ParticipantRow
                key={participant.puuid}
                participant={participant}
                isHighlighted={participant.puuid === puuid}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ParticipantRowProps {
  participant: ParticipantData;
  isHighlighted?: boolean;
}

const ParticipantRow: React.FC<ParticipantRowProps> = ({
  participant,
  isHighlighted = false,
}) => {
  const bgColor = isHighlighted
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  return (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className="flex items-center justify-between">
        {/* Champion and Player */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">
              {participant.champion_name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {participant.summoner_name}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {participant.kills}/{participant.deaths}/{participant.assists}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {participant.kda_ratio.toFixed(2)} KDA
            </p>
          </div>

          <div className="hidden md:block text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {participant.cs_total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">CS</p>
          </div>

          <div className="hidden md:block text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {(participant.total_damage_dealt_to_champions / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Damage</p>
          </div>

          <div className="hidden lg:block text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {participant.vision_score}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vision</p>
          </div>
        </div>
      </div>
    </div>
  );
};
