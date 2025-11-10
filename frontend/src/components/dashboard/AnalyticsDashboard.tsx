import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sword,
  Shield,
  Eye,
  Coins,
  Target,
  Users,
  Trophy,
  Zap,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { useProgressiveMatchHistory, useQueueMatches } from '../../hooks/useProgressiveMatchHistory';
import { useProfile } from '../../hooks/useProfile';
import { useRankedInfo } from '../../hooks/useRankedInfo';
import { useUserProfile } from '../../hooks/useUserProfile';
import { RiotButton } from '../ui/RiotButton';
import { InlineLoading } from '../LoadingState';
import { generateUserProfileFromCache } from '../../lib/profileGenerator';
import { setStoredUserProfile } from '../../lib/storage';
import type { MatchData } from '../../types';

// Queue ID to game mode mapping
const QUEUE_TYPES: Record<number, { name: string; shortName: string }> = {
  420: { name: 'Ranked Solo/Duo', shortName: 'Ranked Solo' },
  440: { name: 'Ranked Flex', shortName: 'Ranked Flex' },
  450: { name: 'ARAM', shortName: 'ARAM' },
  400: { name: 'Normal Draft', shortName: 'Normal' },
  430: { name: 'Normal Blind', shortName: 'Normal' },
  490: { name: 'Normal Quickplay', shortName: 'Normal' },
  1700: { name: 'Arena', shortName: 'Arena' },
  1710: { name: 'Arena', shortName: 'Arena' },
  // Add more queue types as needed
};

const getGameMode = (queueId: number): string => {
  return QUEUE_TYPES[queueId]?.shortName || 'Custom';
};

// Queue filter tabs
const QUEUE_FILTERS = [
  { id: 'all', name: 'All', queueId: null, queueType: null },
  { id: 'ranked_solo', name: 'Ranked Solo/Duo', queueId: 420, queueType: 'RANKED_SOLO_5x5' },
  { id: 'ranked_flex', name: 'Ranked Flex', queueId: 440, queueType: 'RANKED_FLEX_SR' },
  { id: 'normal', name: 'Normal Games', queueId: 400, queueType: null },
  { id: 'aram', name: 'ARAM', queueId: 450, queueType: null },
];

export interface AnalyticsDashboardProps {
  onOpenChat?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onOpenChat }) => {
  const { profile } = useProfile();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [visibleMatches, setVisibleMatches] = useState(4);
  const [selectedQueue, setSelectedQueue] = useState<number | null>(null);

  console.log('📊 AnalyticsDashboard - Profile:', {
    riotId: profile?.riotId,
    region: profile?.region,
    platform: profile?.platform
  });

  // Progressive loading: loads first 5 matches immediately, then fetches rest in background
  const progressiveData = useProgressiveMatchHistory({
    riotId: profile?.riotId || '',
    region: profile?.region || 'AMERICAS',
    platform: profile?.platform, // ← PASS PLATFORM!
    enabled: !!profile?.riotId,
  });

  // Get matches for selected queue (uses pre-fetched data if available)
  const { data: queueMatchHistory } = useQueueMatches(
    profile?.riotId || '',
    selectedQueue,
    profile?.region || 'AMERICAS',
    profile?.platform, // ← PASS PLATFORM!
    !!profile?.riotId && selectedQueue !== null
  );

  // Fetch ranked information
  const { data: rankedInfo } = useRankedInfo({
    riotId: profile?.riotId || '',
    region: profile?.region || 'europe',
    platform: profile?.platform, // ← PASS PLATFORM!
    enabled: !!profile?.riotId,
  });

  // Generate and cache user profile (runs after matches are loaded)
  const { data: userProfile } = useUserProfile({
    riotId: profile?.riotId || '',
    region: profile?.region || 'europe',
    platform: profile?.platform, // ← PASS PLATFORM!
    enabled: !!profile?.riotId && !!progressiveData.all,
  });

  // Auto-generate user profile from match data when available
  useEffect(() => {
    if (progressiveData.all?.matches && rankedInfo && profile?.riotId) {
      try {
        // Get summoner level from ranked info (always fresh from API)
        const summonerLevel = rankedInfo.summoner_level || profile.summonerLevel || 0;
        const profileIconId = profile.profileIconId || 0;

        console.log('🔄 Auto-generating user profile from match data...', {
          matches: progressiveData.all.matches.length,
          rankedData: rankedInfo.ranked_data || rankedInfo,
          summonerLevel,
          profileIconId,
          riotId: profile.riotId
        });

        const generatedProfile = generateUserProfileFromCache(
          profile.riotId,
          progressiveData.all.matches as any,
          (rankedInfo.ranked_data || rankedInfo) as any,
          summonerLevel,
          profileIconId
        );

        if (generatedProfile) {
          setStoredUserProfile(profile.riotId, generatedProfile);
          console.log('✅ User profile auto-generated and cached for AI agents');
          console.log('   Summoner Level:', generatedProfile.summoner_level);
          console.log('   Ranked Solo:', generatedProfile.ranked_solo);
          console.log('   Ranked Flex:', generatedProfile.ranked_flex);
        }
      } catch (error) {
        console.error('❌ Error auto-generating user profile:', error);
      }
    }
  }, [progressiveData.all, rankedInfo, profile?.riotId, profile?.summonerLevel, profile?.profileIconId]);

  // Determine which matches to display based on selected queue
  const getMatchesForQueue = () => {
    if (selectedQueue === null) {
      return progressiveData.all?.matches || [];
    }
    
    // Use pre-fetched data if available
    switch (selectedQueue) {
      case 420:
        return progressiveData.rankedSolo?.matches || queueMatchHistory?.matches || [];
      case 440:
        return progressiveData.rankedFlex?.matches || queueMatchHistory?.matches || [];
      case 400:
        return progressiveData.normal?.matches || queueMatchHistory?.matches || [];
      case 450:
        return progressiveData.aram?.matches || queueMatchHistory?.matches || [];
      default:
        return queueMatchHistory?.matches || [];
    }
  };

  const filteredMatches = getMatchesForQueue();
  const isLoading = progressiveData.isInitialLoading;
  const isBackgroundLoading = progressiveData.isBackgroundLoading;

  const handleLoadMore = () => {
    setVisibleMatches(prev => Math.min(prev + 4, filteredMatches.length));
  };

  const hasMoreMatches = filteredMatches && visibleMatches < filteredMatches.length;

  if (!profile?.riotId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-runesight-accent mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Please set up your profile first</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-runesight-accent border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Loading your match data...</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Fetching initial matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 dark:opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-runesight-accent/10 dark:bg-runesight-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Background Loading Indicator */}
        {isBackgroundLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-runesight-accent/10 border border-runesight-accent/30 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <InlineLoading />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Loading additional match data in background... ({progressiveData.progress}%)
              </span>
            </div>
            <div className="w-32 h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-runesight-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressiveData.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src="/logo-precision-dark-mode.png"
                  alt="Precision"
                  className="w-6 h-6 md:w-8 md:h-8"
                />
                <span className="text-runesight-accent font-bold uppercase tracking-wider text-sm md:text-base">
                  Battle Analysis
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">
                RECENT GAMES
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg">
                {profile.riotId.split('#')[0]} • {filteredMatches.length} {selectedQueue ? QUEUE_FILTERS.find(f => f.queueId === selectedQueue)?.name : 'All Queues'} Matches
              </p>
            </div>
            <RiotButton
              onClick={() => onOpenChat?.()}
              variant="primary"
              size="md"
              className="w-full md:w-auto"
            >
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Deploy AI</span>
            </RiotButton>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {QUEUE_FILTERS.map((filter) => {
              // Find ranked data for this queue type
              const rankedData = filter.queueType 
                ? rankedInfo?.ranked_data?.find(r => r.queueType === filter.queueType)
                : null;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSelectedQueue(filter.queueId);
                    setVisibleMatches(4); // Reset visible matches when changing filter
                  }}
                  className={`px-4 md:px-6 py-2 md:py-3 font-bold uppercase tracking-wider text-xs md:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    selectedQueue === filter.queueId
                      ? 'bg-runesight-accent text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 hover:bg-slate-300/80 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700/50'
                  }`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}
                >
                  <div className="flex flex-col items-center">
                    <span>{filter.name}</span>
                    {rankedData && (
                      <span className="text-[10px] md:text-xs mt-0.5 md:mt-1 opacity-80">
                        {rankedData.tier} {rankedData.rank} • {rankedData.leaguePoints} LP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredMatches.length > 0 && <QuickStatsSummary matches={filteredMatches} />}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {filteredMatches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 overflow-hidden p-12 text-center"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 16px 100%)',
                }}
              >
                <Trophy className="w-16 h-16 text-runesight-accent/50 mx-auto mb-4" />
                <p className="text-slate-300 text-xl font-bold mb-2">No Recent Battles</p>
                <p className="text-slate-500">
                  Enter the Rift and return for AI-powered analysis!
                </p>
              </motion.div>
            ) : (
              <>
                {filteredMatches.slice(0, visibleMatches).map((match, index) => (
                  <MatchCard
                    key={match.match_id}
                    match={match}
                    index={index}
                    isExpanded={expandedMatch === match.match_id}
                    onToggleExpand={() =>
                      setExpandedMatch(expandedMatch === match.match_id ? null : match.match_id)
                    }
                  />
                ))}
                
                {/* Load More Button */}
                {hasMoreMatches && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mt-6"
                  >
                    <RiotButton
                      onClick={handleLoadMore}
                      variant="secondary"
                      size="md"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Load More Matches ({filteredMatches.length - visibleMatches} remaining)</span>
                    </RiotButton>
                  </motion.div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-4 relative bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/60 dark:to-slate-900/60 backdrop-blur-sm border border-slate-300 dark:border-slate-700/50 overflow-hidden p-8 shadow-sm dark:shadow-none"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-accent/5" />
              <div className="relative z-10 text-center">
                <div
                  className="w-16 h-16 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center mx-auto mb-4"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}
                >
                  <Brain className="w-8 h-8 text-runesight-accent" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-wide">
                  AI Squadron
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Deploy your elite coaching team for deep tactical analysis
                </p>
                <RiotButton onClick={() => onOpenChat?.()} variant="primary" size="md">
                  <Zap className="w-4 h-4" />
                  <span>Initiate Analysis</span>
                </RiotButton>
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-runesight-accent" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStatsSummary: React.FC<{ matches: MatchData[] }> = ({ matches }) => {
  const wins = matches.filter((m) => m.win).length;
  const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
  const avgKDA = matches.length > 0 ? matches.reduce((sum, m) => sum + (m.kda_ratio || 0), 0) / matches.length : 0;
  const avgCS = matches.length > 0 ? matches.reduce((sum, m) => sum + (m.cs_total || 0), 0) / matches.length : 0;
  const avgDamage = matches.length > 0 ? matches.reduce((sum, m) => sum + (m.total_damage_dealt_to_champions || 0), 0) / matches.length : 0;

  const stats = [
    { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, subtext: `${wins}W ${matches.length - wins}L`, icon: Trophy, color: winRate >= 50 ? 'text-green-500' : 'text-red-500' },
    { label: 'Avg KDA', value: avgKDA.toFixed(2), subtext: 'Kill/Death/Assist', icon: Sword, color: avgKDA >= 3 ? 'text-green-500' : avgKDA >= 2 ? 'text-yellow-500' : 'text-red-500' },
    { label: 'Avg CS', value: avgCS.toFixed(0), subtext: 'Creep Score', icon: Target, color: 'text-blue-500' },
    { label: 'Avg Damage', value: `${(avgDamage / 1000).toFixed(1)}k`, subtext: 'To Champions', icon: Sword, color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-700/50 hover:border-runesight-accent/50 transition-all duration-300 overflow-hidden p-6 shadow-sm dark:shadow-none"
          style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}>
                <stat.icon className="w-6 h-6 text-runesight-accent group-hover:text-runesight-secondary transition-colors duration-300" />
              </div>
              <span className={`text-3xl font-black ${stat.color} group-hover:text-runesight-accent transition-colors duration-300`}>{stat.value}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{stat.subtext}</p>
          </div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      ))}
    </div>
  );
};

interface MatchCardProps {
  match: MatchData;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, index, isExpanded, onToggleExpand }) => {
  const isWin = match.win;
  const championName = match.champion_name || 'Unknown';
  const gameMode = getGameMode(match.queue_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group relative bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-700/50 hover:border-runesight-accent/50 transition-all duration-300 overflow-hidden shadow-sm dark:shadow-none"
      style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)' }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-700 group-hover:border-runesight-accent transition-colors">
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${championName}.png`}
                alt={championName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center"><span class="text-2xl font-black text-runesight-accent">${championName.substring(0, 2).toUpperCase()}</span></div>`;
                  }
                }}
              />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2 uppercase tracking-wide">
                <span>{championName}</span>
                <span className={`text-xs px-3 py-1 font-bold uppercase tracking-wider ${isWin ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'}`} style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 100%, 4px 100%)' }}>
                  {isWin ? 'Victory' : 'Defeat'}
                </span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{gameMode} • {match.game_duration_formatted}</p>
            </div>
          </div>
          <button onClick={onToggleExpand} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-runesight-accent" /> : <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-runesight-accent transition-colors" />}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatItem icon={Sword} label="KDA" value={match.kda_string || 'N/A'} subtext={`${(match.kda_ratio || 0).toFixed(2)} ratio`} color={(match.kda_ratio || 0) >= 3 ? 'green' : (match.kda_ratio || 0) >= 2 ? 'yellow' : 'red'} />
          <StatItem icon={Target} label="CS" value={(match.cs_total || 0).toString()} subtext={`${(match.cs_per_minute || 0).toFixed(1)}/min`} color="blue" />
          <StatItem icon={Sword} label="Damage" value={`${(match.total_damage_dealt_to_champions / 1000).toFixed(1)}k` || '0'} subtext={`${(match.damage_per_minute || 0).toFixed(0)}/min`} color="orange" />
          <StatItem icon={Coins} label="Gold" value={`${(match.gold_earned / 1000).toFixed(1)}k` || '0'} subtext="Earned" color="yellow" />
          <StatItem icon={Eye} label="Vision" value={(match.vision_score || 0).toString()} subtext="Score" color="purple" />
        </div>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-slate-700/50">
            <MatchDetails match={match} />
          </motion.div>
        )}
      </div>
      <div className="absolute top-0 right-0 w-6 h-6 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple';
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, subtext, color }) => {
  const colorClasses = { green: 'text-green-500', red: 'text-red-500', blue: 'text-blue-500', yellow: 'text-yellow-500', orange: 'text-orange-500', purple: 'text-purple-500' };
  return (
    <div className="text-center">
      <Icon className={`w-5 h-5 ${colorClasses[color]} mx-auto mb-1`} />
      <p className="text-xs text-slate-600 dark:text-slate-500 mb-1 uppercase tracking-wide font-bold">{label}</p>
      <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{subtext}</p>
    </div>
  );
};

const MatchDetails: React.FC<{ match: MatchData }> = ({ match }) => {
  const blueTeam = match.all_participants?.filter(p => p.team_id === 100) || [];
  const redTeam = match.all_participants?.filter(p => p.team_id === 200) || [];
  
  return (
    <div className="space-y-6">
      {/* All Players */}
      {match.all_participants && match.all_participants.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-runesight-accent" />
            <span>All Players</span>
          </h4>
          
          {/* Blue Team */}
          <div className="mb-4">
            <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">Blue Team</p>
            <div className="space-y-1">
              {blueTeam.map((player, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-2 border ${
                    player.is_target_player 
                      ? 'bg-runesight-accent/10 border-runesight-accent/30' 
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}
                >
                  {/* Champion Icon */}
                  <div className="w-8 h-8 rounded overflow-hidden border border-slate-600 flex-shrink-0">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${player.champion_name}.png`}
                      alt={player.champion_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Player Name */}
                  <div className="min-w-[100px] flex-shrink-0">
                    <p className="text-xs font-bold text-white truncate">{player.champion_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{player.summoner_name || 'Unknown'}</p>
                  </div>
                  
                  {/* Items */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    {player.items.slice(0, 6).map((item, itemIdx) => (
                      <div key={itemIdx} className="w-6 h-6 bg-slate-900/80 border border-slate-700 rounded overflow-hidden">
                        {item > 0 ? (
                          <img 
                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item}.png`}
                            alt={`Item ${item}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800/50" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Stats - Horizontal */}
                  <div className="flex items-center gap-4 ml-auto text-[11px]">
                    <div className="text-center min-w-[55px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">KDA</p>
                      <p className="text-white font-bold">{player.kills}/{player.deaths}/{player.assists}</p>
                      <p className="text-slate-400 text-[9px]">{player.kda_ratio.toFixed(2)}</p>
                    </div>
                    <div className="text-center min-w-[50px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">DMG</p>
                      <p className="text-white font-bold">{(player.total_damage_dealt_to_champions / 1000).toFixed(1)}k</p>
                      {player.damage_share && <p className="text-blue-400 text-[9px]">{player.damage_share.toFixed(1)}%</p>}
                    </div>
                    <div className="text-center min-w-[45px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">CS</p>
                      <p className="text-white font-bold">{player.cs_total}</p>
                      {player.cs_per_minute && <p className="text-slate-400 text-[9px]">{player.cs_per_minute.toFixed(1)}/m</p>}
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">KP</p>
                      <p className="text-purple-400 font-bold">{player.kill_participation?.toFixed(0) || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Red Team */}
          <div>
            <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">Red Team</p>
            <div className="space-y-1">
              {redTeam.map((player, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-2 border ${
                    player.is_target_player 
                      ? 'bg-runesight-accent/10 border-runesight-accent/30' 
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}
                >
                  {/* Champion Icon */}
                  <div className="w-8 h-8 rounded overflow-hidden border border-slate-600 flex-shrink-0">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${player.champion_name}.png`}
                      alt={player.champion_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Player Name */}
                  <div className="min-w-[100px] flex-shrink-0">
                    <p className="text-xs font-bold text-white truncate">{player.champion_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{player.summoner_name || 'Unknown'}</p>
                  </div>
                  
                  {/* Items */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    {player.items.slice(0, 6).map((item, itemIdx) => (
                      <div key={itemIdx} className="w-6 h-6 bg-slate-900/80 border border-slate-700 rounded overflow-hidden">
                        {item > 0 ? (
                          <img 
                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item}.png`}
                            alt={`Item ${item}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800/50" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Stats - Horizontal */}
                  <div className="flex items-center gap-4 ml-auto text-[11px]">
                    <div className="text-center min-w-[55px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">KDA</p>
                      <p className="text-white font-bold">{player.kills}/{player.deaths}/{player.assists}</p>
                      <p className="text-slate-400 text-[9px]">{player.kda_ratio.toFixed(2)}</p>
                    </div>
                    <div className="text-center min-w-[50px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">DMG</p>
                      <p className="text-white font-bold">{(player.total_damage_dealt_to_champions / 1000).toFixed(1)}k</p>
                      {player.damage_share && <p className="text-blue-400 text-[9px]">{player.damage_share.toFixed(1)}%</p>}
                    </div>
                    <div className="text-center min-w-[45px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">CS</p>
                      <p className="text-white font-bold">{player.cs_total}</p>
                      {player.cs_per_minute && <p className="text-slate-400 text-[9px]">{player.cs_per_minute.toFixed(1)}/m</p>}
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-slate-500 text-[9px] uppercase mb-0.5">KP</p>
                      <p className="text-purple-400 font-bold">{player.kill_participation?.toFixed(0) || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Equipment */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2 uppercase tracking-wider">
          <Shield className="w-4 h-4 text-runesight-accent" />
          <span>Your Equipment</span>
        </h4>
        <div className="flex space-x-2">
          {match.items.map((item, idx) => (
            <div key={idx} className="w-12 h-12 bg-slate-900/80 border border-slate-700 rounded overflow-hidden hover:border-runesight-accent/50 transition-colors">
              {item > 0 ? (
                <img 
                  src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item}.png`}
                  alt={`Item ${item}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-xs text-slate-500">${item}</span></div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-600 text-xl">-</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Team Performance */}
      {match.teams && match.teams.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-runesight-accent" />
            <span>Team Objectives</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {match.teams.map((team) => (
              <div key={team.team_id} className={`p-4 border ${team.win ? 'bg-green-900/10 border-green-700/50' : 'bg-red-900/10 border-red-700/50'}`} style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
                <p className="text-sm font-bold text-white mb-2 uppercase tracking-wide">{team.team_id === 100 ? 'Blue Team' : 'Red Team'}{team.is_player_team && ' (Your Team)'}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-slate-400 uppercase tracking-wide">Barons</p><p className="text-white font-bold text-lg">{team.objectives.baron}</p></div>
                  <div><p className="text-slate-400 uppercase tracking-wide">Dragons</p><p className="text-white font-bold text-lg">{team.objectives.dragon}</p></div>
                  <div><p className="text-slate-400 uppercase tracking-wide">Towers</p><p className="text-white font-bold text-lg">{team.objectives.tower}</p></div>
                  <div><p className="text-slate-400 uppercase tracking-wide">Inhibitors</p><p className="text-white font-bold text-lg">{team.objectives.inhibitor}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tactical Assessment */}
      <div className="bg-slate-700/30 border border-slate-600/50 p-4" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-runesight-accent" />
          <span>Your Performance</span>
        </h4>
        <div className="space-y-2 text-sm">
          <InsightItem positive={(match.kda_ratio || 0) >= 3} text={(match.kda_ratio || 0) >= 3 ? `Excellent KDA of ${(match.kda_ratio || 0).toFixed(2)}` : `KDA could be improved (${(match.kda_ratio || 0).toFixed(2)})`} />
          <InsightItem positive={(match.cs_per_minute || 0) >= 6} text={(match.cs_per_minute || 0) >= 6 ? `Good CS/min at ${(match.cs_per_minute || 0).toFixed(1)}` : `CS/min needs work (${(match.cs_per_minute || 0).toFixed(1)})`} />
          <InsightItem positive={(match.vision_score || 0) >= 30} text={(match.vision_score || 0) >= 30 ? `Strong vision control (${match.vision_score || 0})` : `Vision score could be higher (${match.vision_score || 0})`} />
        </div>
      </div>
    </div>
  );
};

const InsightItem: React.FC<{ positive: boolean; text: string }> = ({ positive, text }) => {
  return (
    <div className="flex items-center space-x-2">
      {positive ? <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
      <span className={positive ? 'text-green-400' : 'text-yellow-400'}>{text}</span>
    </div>
  );
};

