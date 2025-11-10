
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Brain, 
  BarChart3, 
  MessageSquare,
  ArrowRight,
  Zap,
  Target,
  Trophy,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ScrollToTop } from '../ui/ScrollToTop';
import { RiotButton } from '../ui/RiotButton';
import { useMatchHistory } from '../../hooks/useMatchHistory';
import { useRankedInfo } from '../../hooks/useRankedInfo';
import { generateUserProfileFromCache } from '../../lib/profileGenerator';
import { setStoredUserProfile } from '../../lib/storage';
import type { UserProfile } from '../../types';
import { useEffect } from 'react';

interface DashboardProps {
  profile: UserProfile;
  onNavigateToChat: () => void;
}

const AGENT_CARDS = [
  {
    id: 'performance',
    title: 'Performance Analysis',
    description: 'Get detailed insights into your recent match performance and identify areas for improvement',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    examples: [
      'Analyze my last ranked game',
      'How did I perform in my recent matches?',
      'What should I focus on improving?'
    ]
  },
  {
    id: 'champion',
    title: 'Champion Expert',
    description: 'Get champion-specific advice, optimal builds, and matchup analysis',
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    examples: [
      'Best build for Jinx in current meta?',
      'How to play against Yasuo?',
      'Champion recommendations for my playstyle'
    ]
  },
  {
    id: 'comparison',
    title: 'Player Comparison',
    description: 'Compare your performance with friends and other players at your skill level',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    examples: [
      'Compare me with my duo partner',
      'How do I stack up against other Gold players?',
      'Analyze our team synergy'
    ]
  },
  {
    id: 'team',
    title: 'Team Synergy',
    description: 'Analyze team compositions, draft strategies, and player synergies',
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    examples: [
      'Analyze our team composition',
      'Best champions for our draft?',
      'How to improve team coordination?'
    ]
  },
  {
    id: 'summary',
    title: 'Match Summary',
    description: 'Get comprehensive match summaries, retrospectives, and achievement tracking',
    icon: Trophy,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    examples: [
      'Summarize my recent matches',
      'Create a season retrospective',
      'Show my achievements this month'
    ]
  }
];

// QUICK_STATS will be dynamically generated from match data

export function Dashboard({ profile, onNavigateToChat }: DashboardProps) {
  // Use region and platform from profile
  const regionForAPI = profile.region || 'AMERICAS';
  const platformForAPI = profile.platform;

  console.log('🎮 Dashboard - Profile data:', {
    riotId: profile.riotId,
    region: profile.region,
    platform: profile.platform,
    regionForAPI,
    platformForAPI
  });

  // Fetch match history
  const { data: matchHistory, isLoading, error } = useMatchHistory({
    riotId: profile.riotId,
    region: regionForAPI,
    platform: platformForAPI,
    count: 10,
    enabled: !!profile.riotId
  });

  // Fetch ranked info
  const { data: rankedInfo, isLoading: isLoadingRanked, error: rankedError } = useRankedInfo({
    riotId: profile.riotId,
    region: regionForAPI,
    platform: platformForAPI,
    enabled: !!profile.riotId
  });

  // Generate and cache user profile from match data (no additional API call needed)
  useEffect(() => {
    if (matchHistory?.matches && rankedInfo) {
      try {
        // Use summoner level from rankedInfo (always fresh from API)
        const summonerLevel = rankedInfo.summoner_level || profile.summonerLevel || 0;
        const profileIconId = profile.profileIconId || 0;
        
        console.log('🔄 Generating user profile from cached data...', {
          matches: matchHistory.matches.length,
          rankedData: rankedInfo.ranked_data || rankedInfo,
          summonerLevelFromRankedInfo: rankedInfo.summoner_level,
          summonerLevelFromProfile: profile.summonerLevel,
          summonerLevelUsed: summonerLevel,
          profileIconId
        });
        
        const userProfile = generateUserProfileFromCache(
          profile.riotId,
          matchHistory.matches as any,
          (rankedInfo.ranked_data || rankedInfo) as any,
          summonerLevel,
          profileIconId
        );
        
        if (userProfile) {
          setStoredUserProfile(profile.riotId, userProfile);
          console.log('✅ User profile generated and cached for AI agents');
          console.log('   Summoner Level:', userProfile.summoner_level);
          console.log('   Profile Icon:', userProfile.profile_icon_id);
        }
      } catch (error) {
        console.error('❌ Error generating user profile:', error);
      }
    }
  }, [matchHistory, rankedInfo, profile.riotId, profile.summonerLevel, profile.profileIconId]);

  // Debug logging
  console.log('Ranked Info:', rankedInfo);
  console.log('Ranked Loading:', isLoadingRanked);
  console.log('Ranked Error:', rankedError);

  const handleAgentClick = (_agentId: string, example?: string) => {
    // Navigate to chat with optional pre-filled message
    onNavigateToChat();
    
    // TODO: If example is provided, pre-fill the chat input
    if (example) {
      // This would be handled by the chat component
      console.log('Pre-fill chat with:', example);
    }
  };

  // Calculate stats from match history
  const stats = matchHistory?.matches ? {
    totalMatches: matchHistory.matches.length,
    wins: matchHistory.matches.filter(m => m.win).length,
    winRate: matchHistory.matches.length > 0 
      ? Math.round((matchHistory.matches.filter(m => m.win).length / matchHistory.matches.length) * 100)
      : 0,
    avgKDA: matchHistory.matches.length > 0
      ? (matchHistory.matches.reduce((sum, m) => sum + m.kda_ratio, 0) / matchHistory.matches.length).toFixed(2)
      : '0.00',
    favoriteChampion: matchHistory.matches.length > 0
      ? matchHistory.matches.reduce((acc, m) => {
          acc[m.champion_name] = (acc[m.champion_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : {}
  } : null;

  const favoriteChamp = stats?.favoriteChampion 
    ? Object.entries(stats.favoriteChampion).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-runesight-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-runesight-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 mb-12"
      >
        <div className="flex items-center justify-center space-x-4 mb-6">
          <img
            src="/logo-precision-dark-mode.png"
            alt="Precision"
            className="w-8 h-8"
          />
          <span className="text-runesight-accent font-bold uppercase tracking-wider">Command Center</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
          WELCOME BACK,
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-runesight-accent to-runesight-secondary">
            {profile.riotId.split('#')[0].toUpperCase()}
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Your AI coaching team is ready to analyze your gameplay and help you dominate the Rift.
        </p>
      </motion.div>

      {/* Ranked Info */}
      {isLoadingRanked ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-runesight-accent animate-spin" />
        </div>
      ) : rankedError ? (
        <div className="flex justify-center">
          <p className="text-red-400 text-sm">Failed to load ranked info: {rankedError.message}</p>
        </div>
      ) : rankedInfo && rankedInfo.ranked_data && rankedInfo.ranked_data.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center gap-4 flex-wrap"
        >
          {rankedInfo.ranked_data.map((entry, idx) => {
            const queueName = entry.queueType === 'RANKED_SOLO_5x5' ? 'Ranked Solo/Duo' : 
                             entry.queueType === 'RANKED_FLEX_SR' ? 'Ranked Flex' : entry.queueType;
            const totalGames = entry.wins + entry.losses;
            const winRate = totalGames > 0 ? Math.round((entry.wins / totalGames) * 100) : 0;
            
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-4 min-w-[200px]"
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }}
              >
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{queueName}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}>
                    <Trophy className="w-6 h-6 text-runesight-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{entry.tier} {entry.rank}</p>
                    <p className="text-sm text-slate-300">{entry.leaguePoints} LP</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs">
                  <span className="text-slate-400">{entry.wins}W {entry.losses}L</span>
                  <span className={`font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {winRate}% WR
                  </span>
                </div>
                {entry.hotStreak && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                    <Zap className="w-3 h-3" />
                    <span>Hot Streak!</span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex justify-center">
          <p className="text-slate-400 text-sm">No ranked data available</p>
        </div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {isLoading ? (
          // Loading state
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-6 animate-pulse"
              style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }}>
              <div className="h-12 bg-slate-700 rounded mb-3"></div>
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-700/50 p-6"
            style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)' }}>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-white font-bold">Failed to load match data</p>
                <p className="text-slate-300 text-sm">{error.message}</p>
              </div>
            </div>
          </div>
        ) : (
          // Display stats
          [
            {
              label: 'Recent Matches',
              value: stats?.totalMatches.toString() || '0',
              change: `${stats?.wins || 0} wins, ${(stats?.totalMatches || 0) - (stats?.wins || 0)} losses`,
              icon: BarChart3,
              color: 'text-blue-500'
            },
            {
              label: 'Win Rate',
              value: `${stats?.winRate || 0}%`,
              change: `${stats?.wins || 0}W ${(stats?.totalMatches || 0) - (stats?.wins || 0)}L`,
              icon: TrendingUp,
              color: stats && stats.winRate >= 50 ? 'text-green-500' : 'text-red-500'
            },
            {
              label: 'Average KDA',
              value: stats?.avgKDA || '0.00',
              change: 'Last 10 games',
              icon: Target,
              color: 'text-purple-500'
            },
            {
              label: 'Top Champion',
              value: favoriteChamp,
              change: stats?.favoriteChampion?.[favoriteChamp] ? `${stats.favoriteChampion[favoriteChamp]} games` : 'No data',
              icon: Trophy,
              color: 'text-orange-500'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:border-runesight-accent/50 transition-all duration-300 overflow-hidden p-6"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)'
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}>
                    <stat.icon className={`w-6 h-6 text-runesight-accent group-hover:text-runesight-secondary transition-colors duration-300`} />
                  </div>
                  <span className="text-3xl font-black text-white group-hover:text-runesight-accent transition-colors duration-300">{stat.value}</span>
                </div>
                <p className="text-sm font-bold text-white uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-xs text-slate-400">{stat.change}</p>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-gradient-to-br from-runesight-primary/20 via-runesight-primary/10 to-runesight-accent/20 backdrop-blur-sm border border-runesight-accent/30 overflow-hidden p-8"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)'
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-runesight-accent/5 via-transparent to-runesight-secondary/5" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-wide">
              INITIATE ANALYSIS
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              Deploy your AI coaching squad and unlock the secrets to climbing the ladder.
            </p>
          </div>
          <RiotButton
            onClick={() => onNavigateToChat()}
            variant="primary"
            size="lg"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start Chat</span>
            <ArrowRight className="w-4 h-4" />
          </RiotButton>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-runesight-accent" />
      </motion.div>

      {/* AI Agents */}
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img
              src="/logo-precision-dark-mode.png"
              alt="Precision"
              className="w-8 h-8"
            />
            <span className="text-runesight-accent font-bold uppercase tracking-wider">AI Squadron</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            YOUR ELITE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-runesight-accent to-runesight-secondary">
              COACHING TEAM
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Five specialized AI agents, each mastering different aspects of League of Legends strategy and analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {AGENT_CARDS.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:border-runesight-accent/50 transition-all duration-300 overflow-hidden cursor-pointer"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)'
              }}
              onClick={() => handleAgentClick(agent.id)}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-runesight-accent/5 via-transparent to-runesight-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Agent number */}
              <div className="absolute top-4 right-6 text-6xl font-black text-runesight-accent/20 group-hover:text-runesight-accent/40 transition-colors duration-300">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Content */}
              <div className="relative z-10 p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
                    <agent.icon className="w-8 h-8 text-runesight-accent group-hover:text-runesight-secondary transition-colors duration-300" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-black mb-3 text-white group-hover:text-runesight-accent transition-colors duration-300 uppercase tracking-wide">
                      {agent.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-6 text-base">
                      {agent.description}
                    </p>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-white uppercase tracking-wider">Quick Deploy:</p>
                      <div className="space-y-2">
                        {agent.examples.slice(0, 2).map((example, exampleIndex) => (
                          <div
                            key={exampleIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentClick(agent.id, example);
                            }}
                          >
                            <RiotButton
                              variant="secondary"
                              size="sm"
                              className="w-full text-left justify-start text-xs"
                            >
                              "{example}"
                            </RiotButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Border accent */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-runesight-accent/30 transition-colors duration-300"
                style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)' }} />

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-6 h-6 bg-runesight-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 overflow-hidden p-8"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 16px 100%)'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}>
              <BarChart3 className="w-6 h-6 text-runesight-accent" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-wide">Mission Log</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-runesight-primary/10 to-runesight-accent/10 border border-runesight-accent/20"
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-runesight-accent/30 to-runesight-secondary/30 flex items-center justify-center"
                style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 100%, 4px 100%)' }}>
                <Zap className="w-5 h-5 text-runesight-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wide">System Online</p>
                <p className="text-xs text-slate-400">AI coaching squad ready for deployment</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-runesight-accent animate-spin mx-auto mb-4" />
                <p className="text-slate-300 text-lg">Loading your match history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-slate-300 text-lg mb-2">Failed to load match history</p>
                <p className="text-slate-400 text-sm">{error.message}</p>
              </div>
            ) : matchHistory && matchHistory.matches && matchHistory.matches.length > 0 ? (
              <div className="space-y-3">
                {matchHistory.matches.slice(0, 5).map((match, index) => (
                  <div
                    key={match.match_id}
                    className={`flex items-center justify-between p-4 border transition-all duration-300 hover:scale-[1.02] ${
                      match.win
                        ? 'bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-700/30'
                        : 'bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-700/30'
                    }`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 flex items-center justify-center ${
                          match.win ? 'bg-green-700/30' : 'bg-red-700/30'
                        }`}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}
                      >
                        <span className="text-2xl font-black text-white">
                          {match.win ? 'W' : 'L'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wide">
                          {match.champion_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {match.kda_string} • {match.kda_ratio} KDA
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {match.game_duration_formatted}
                      </p>
                      <p className="text-xs text-slate-400">
                        {match.cs_total} CS • {match.vision_score} Vision
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center mx-auto mb-4"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)' }}>
                  <Brain className="w-8 h-8 text-runesight-accent" />
                </div>
                <p className="text-slate-300 text-lg mb-2">No Recent Battles</p>
                <p className="text-slate-400 text-sm">
                  Play some ranked games and they'll appear here!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-runesight-accent" />
      </motion.div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
      </div>
    </div>
  );
}