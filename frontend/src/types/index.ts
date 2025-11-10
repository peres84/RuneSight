// Core type definitions for RuneSight frontend

export interface UserProfile {
  riotId: string;
  region: string; // Regional routing: AMERICAS, EUROPE, ASIA, SEA
  platform?: string; // Platform code: NA1, LA1, LA2, BR1, EUW1, EUN1, KR, JP1, etc.
  puuid?: string;
  displayName?: string;
  summonerLevel?: number;
  profileIconId?: number;
  favoriteChampions?: string[];
  preferredAnalysisDepth?: 'basic' | 'detailed' | 'expert';
  lastActive: number;
  schemaVersion?: number; // For profile migration support
}

export interface MatchData {
  match_id: string;
  game_creation: string;
  game_duration: number;
  game_duration_formatted: string;
  game_mode: string;
  queue_id: number;
  map_id: number;
  win: boolean;
  champion_name: string;
  champion_id: number;
  kills: number;
  deaths: number;
  assists: number;
  kda_ratio: number;
  kda_string: string;
  total_damage_dealt_to_champions: number;
  damage_per_minute: number;
  gold_earned: number;
  cs_total: number;
  cs_per_minute: number;
  vision_score: number;
  team_position: string;
  items: number[];
  all_participants?: ParticipantData[];
  player_performance?: PlayerPerformance;
  teams?: TeamData[];
}

export interface PlayerPerformance {
  kills: number;
  deaths: number;
  assists: number;
  kda_string: string;
  kda_ratio: number;
  champion_name: string;
  champion_id: number;
  team_position: string;
  total_damage_dealt: number;
  total_damage_dealt_to_champions: number;
  total_damage_dealt_formatted: string;
  damage_per_minute: number;
  gold_earned: number;
  gold_earned_formatted: string;
  cs_total: number;
  cs_per_minute: number;
  vision_score: number;
  items: number[];
  summoner_spells: number[];
  runes: RuneData;
}

export interface RuneData {
  primary_style: number;
  sub_style: number;
  perks: number[];
}

export interface TeamData {
  team_id: number;
  win: boolean;
  is_player_team: boolean;
  objectives: {
    baron: number;
    dragon: number;
    tower: number;
    inhibitor: number;
    rift_herald: number;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'error';
  content: string;
  agentType?: 'performance' | 'champion_expert' | 'comparison' | 'team_synergy' | 'summary';
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  primaryRiotId: string;
  messages: ChatMessage[];
  context?: Record<string, any>;
  createdAt: number;
  lastActivity: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RiotIdValidationResponse {
  valid: boolean;
  puuid?: string;
  riotId?: string;
  region?: string;
  playerData?: any;
  cached?: boolean;
  error?: string;
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface FormValidation {
  riotId: ValidationResult;
  region: ValidationResult;
}

export interface AgentResponse {
  agentType: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: number;
}

// Match History API Response Types
export interface MatchHistoryResponse {
  riot_id: string;
  region: string;
  player_profile: PlayerProfile;
  matches: MatchData[];
  total_matches: number;
  start: number;
  count: number;
  cache_performance: CachePerformance;
}

export interface PlayerProfile {
  summoner_name: string;
  summoner_level: number;
  profile_icon_id: number;
  ranked_data: RankedData[];
}

export interface RankedData {
  tier: string;
  rank: string;
  league_points: number;
  wins: number;
  losses: number;
  queue_type: string;
}

export interface CachePerformance {
  cache_hits: number;
  api_calls: number;
  cache_hit_rate: number;
}

// Match Analysis Types
export interface PerformanceMetrics {
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  average_kda: {
    kills: number;
    deaths: number;
    assists: number;
    kda_string: string;
    kda_ratio: number;
  };
  average_damage: number;
  average_damage_formatted: string;
  average_gold: number;
  average_gold_formatted: string;
  average_cs: number;
  average_vision_score: number;
}

// API Request Types
export interface MatchHistoryRequest {
  riotId: string;
  region?: string;
  count?: number;
  start?: number;
}

// Error Types
export interface ApiError {
  type: string;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

// Match Details Response Types
export interface MatchDetailsResponse {
  match_id: string;
  summary: MatchSummary;
  participants: ParticipantData[];
  target_player?: ParticipantData;
}

export interface MatchSummary {
  game_creation: string;
  game_duration: number;
  game_mode: string;
  queue_id: number;
  map_id: number;
  winning_team: number;
}

export interface ParticipantData {
  puuid: string;
  summoner_name: string;
  champion_name: string;
  champion_id: number;
  team_id: number;
  team_position: string;
  kills: number;
  deaths: number;
  assists: number;
  kda_ratio: number;
  total_damage_dealt_to_champions: number;
  gold_earned: number;
  cs_total: number;
  cs_per_minute?: number;
  vision_score: number;
  items: number[];
  win: boolean;
  is_target_player?: boolean;
  damage_share?: number;
  kill_participation?: number;
}

// Analysis Response Types
export interface AnalysisResponse {
  analysis: string;
  riot_id: string;
  analysis_type: string;
  metadata: Record<string, any>;
}

// Champion and Game Data Types
export interface ChampionData {
  id: number;
  name: string;
  key: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface SummonerSpellData {
  id: number;
  name: string;
  description: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ItemData {
  id: number;
  name: string;
  description: string;
  plaintext: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  gold: {
    base: number;
    purchasable: boolean;
    total: number;
    sell: number;
  };
}





