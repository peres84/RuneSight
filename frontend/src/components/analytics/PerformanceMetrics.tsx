/**
 * PerformanceMetrics Component
 * Displays performance metrics with charts
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMatchHistory } from '../../hooks/useMatchHistory';
import { useProfile } from '../../hooks/useProfile';

export interface PerformanceMetricsProps {
  riotId?: string;
  region?: string;
  platform?: string;
  matchCount?: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  riotId: propRiotId,
  region = 'EUROPE',
  platform = 'EUW1',
  matchCount = 20,
}) => {
  const { profile } = useProfile();
  const riotId = propRiotId || profile?.riotId || '';

  const { data, isLoading, error } = useMatchHistory({
    riotId,
    region,
    platform,
    count: matchCount,
    enabled: !!riotId,
  });

  const metrics = useMemo(() => {
    if (!data || !data.matches.length) return null;

    const matches = data.matches;
    const totalMatches = matches.length;
    const wins = matches.filter((m) => m.win).length;

    // Calculate averages
    const avgKills = matches.reduce((sum, m) => sum + m.player_performance.kills, 0) / totalMatches;
    const avgDeaths = matches.reduce((sum, m) => sum + m.player_performance.deaths, 0) / totalMatches;
    const avgAssists = matches.reduce((sum, m) => sum + m.player_performance.assists, 0) / totalMatches;
    const avgCS = matches.reduce((sum, m) => sum + m.player_performance.cs_total, 0) / totalMatches;
    const avgDamage = matches.reduce((sum, m) => sum + m.player_performance.total_damage_dealt_to_champions, 0) / totalMatches;
    const avgVision = matches.reduce((sum, m) => sum + m.player_performance.vision_score, 0) / totalMatches;
    const avgGold = matches.reduce((sum, m) => sum + m.player_performance.gold_earned, 0) / totalMatches;

    // Prepare chart data
    const trendData = matches.slice(0, 10).reverse().map((match, index) => ({
      game: `Game ${index + 1}`,
      kda: match.player_performance.kda_ratio,
      cs: match.player_performance.cs_per_minute,
      damage: match.player_performance.damage_per_minute,
      vision: match.player_performance.vision_score,
    }));

    const radarData = [
      { stat: 'KDA', value: Math.min((avgKills + avgAssists) / Math.max(avgDeaths, 1) * 10, 100) },
      { stat: 'CS/min', value: Math.min((avgCS / 25) * 10, 100) },
      { stat: 'Damage', value: Math.min((avgDamage / 30000) * 100, 100) },
      { stat: 'Vision', value: Math.min((avgVision / 50) * 100, 100) },
      { stat: 'Gold', value: Math.min((avgGold / 15000) * 100, 100) },
    ];

    return {
      winRate: ((wins / totalMatches) * 100).toFixed(1),
      avgKDA: `${avgKills.toFixed(1)}/${avgDeaths.toFixed(1)}/${avgAssists.toFixed(1)}`,
      avgCS: avgCS.toFixed(0),
      avgDamage: avgDamage.toFixed(0),
      avgVision: avgVision.toFixed(1),
      trendData,
      radarData,
    };
  }, [data]);

  if (!riotId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Please set up your profile to view performance metrics
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 dark:text-red-400">
          Error loading performance metrics: {error.message}
        </p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No data available for performance metrics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Performance Metrics
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Win Rate" value={`${metrics.winRate}%`} />
        <StatCard label="Avg KDA" value={metrics.avgKDA} />
        <StatCard label="Avg CS" value={metrics.avgCS} />
        <StatCard label="Avg Vision" value={metrics.avgVision} />
      </div>

      {/* Performance Radar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={metrics.radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Performance Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="game" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#F3F4F6',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="kda"
              stroke="#3B82F6"
              strokeWidth={2}
              name="KDA Ratio"
            />
            <Line
              type="monotone"
              dataKey="cs"
              stroke="#10B981"
              strokeWidth={2}
              name="CS/min"
            />
            <Line
              type="monotone"
              dataKey="vision"
              stroke="#F59E0B"
              strokeWidth={2}
              name="Vision Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};
