"""
User Profile Tool

Shared tool for all agents to get comprehensive user statistics including:
- Rank and league information
- Average performance metrics (KDA, CS, gold, damage)
- Most played champions and roles
- Playtime and game counts
- Win rates across different queues
"""

import logging
from typing import Dict, Any, List, Optional
from collections import Counter
from strands import tool
from services.riot_api_client import RiotAPIClient

logger = logging.getLogger(__name__)

# Initialize Riot API client
riot_client = RiotAPIClient()

# Queue type mappings
QUEUE_TYPES = {
    420: "Ranked Solo/Duo",
    440: "Ranked Flex",
    400: "Normal Draft",
    430: "Normal Blind",
    450: "ARAM",
}

# Role/position mappings
ROLE_NAMES = {
    "TOP": "Top",
    "JUNGLE": "Jungle",
    "MIDDLE": "Mid",
    "BOTTOM": "ADC",
    "UTILITY": "Support",
    "": "Fill"
}


@tool
def get_user_profile(riot_id: str, match_count: int = 20) -> Dict[str, Any]:
    """
    Get comprehensive user profile with statistics from recent matches.
    
    This tool provides a complete overview of a player's League of Legends profile including:
    - Current rank and league information (Solo/Duo and Flex)
    - Summoner level
    - Average performance metrics (KDA, CS, gold, damage, vision)
    - Most played champions (top 5)
    - Preferred roles/lanes
    - Win rates for different queue types
    - Total playtime estimate
    - Game counts (ranked vs normal)
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze (default: 20, max: 100)
        
    Returns:
        Dictionary containing comprehensive user profile data
    """
    logger.info("🔧 TOOL CALLED: get_user_profile")
    logger.info(f"   RiotID: {riot_id}")
    logger.info(f"   Match Count: {match_count}")
    
    try:
        # Parse RiotID
        if '#' not in riot_id:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name, tag_line = riot_id.split('#', 1)
        
        # Get PUUID
        puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            return {"error": f"Player {riot_id} not found"}
        
        # Get summoner data for level
        summoner_data = riot_client.get_summoner_by_puuid(puuid)
        summoner_level = summoner_data.get('summonerLevel', 0) if summoner_data else 0
        
        # Get ranked league data
        league_entries = riot_client.get_league_entries_by_puuid(puuid)
        
        # Parse ranked data
        ranked_solo = None
        ranked_flex = None
        for entry in league_entries:
            queue_type = entry.get('queueType', '')
            if queue_type == 'RANKED_SOLO_5x5':
                ranked_solo = {
                    "tier": entry.get('tier', 'UNRANKED'),
                    "rank": entry.get('rank', ''),
                    "lp": entry.get('leaguePoints', 0),
                    "wins": entry.get('wins', 0),
                    "losses": entry.get('losses', 0),
                    "win_rate": round(entry.get('wins', 0) / max(entry.get('wins', 0) + entry.get('losses', 0), 1) * 100, 1)
                }
            elif queue_type == 'RANKED_FLEX_SR':
                ranked_flex = {
                    "tier": entry.get('tier', 'UNRANKED'),
                    "rank": entry.get('rank', ''),
                    "lp": entry.get('leaguePoints', 0),
                    "wins": entry.get('wins', 0),
                    "losses": entry.get('losses', 0),
                    "win_rate": round(entry.get('wins', 0) / max(entry.get('wins', 0) + entry.get('losses', 0), 1) * 100, 1)
                }
        
        # Get recent matches
        match_count = min(match_count, 100)  # Cap at 100
        match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        
        if not match_ids:
            return {
                "riot_id": riot_id,
                "puuid": puuid,
                "summoner_level": summoner_level,
                "ranked_solo": ranked_solo,
                "ranked_flex": ranked_flex,
                "error": "No match history found"
            }
        
        # Initialize aggregation variables
        total_games = 0
        total_playtime_seconds = 0
        
        # Queue-specific stats
        queue_stats = {}  # {queue_id: {wins, losses, games}}
        
        # Performance metrics
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_cs = 0
        total_gold = 0
        total_damage = 0
        total_vision = 0
        
        # Champion and role tracking
        champion_stats = {}  # {champion: {games, wins}}
        role_counter = Counter()
        
        # Fetch all matches IN PARALLEL
        from concurrent.futures import ThreadPoolExecutor
        
        def fetch_match(match_id):
            """Fetch a single match (runs in thread pool)"""
            try:
                return riot_client.get_match_details(match_id)
            except Exception as e:
                logger.error(f"Error fetching match {match_id}: {e}")
                return None
        
        # Fetch all matches in parallel using thread pool
        with ThreadPoolExecutor(max_workers=10) as executor:
            match_data_list = list(executor.map(fetch_match, match_ids))
        
        # Process each match
        for match_data in match_data_list:
            if not match_data:
                continue
            
            # Get match info
            info = match_data.get('info', {})
            queue_id = info.get('queueId', 0)
            game_duration = info.get('gameDuration', 0)
            
            # Find player's data in participants
            participants = info.get('participants', [])
            player_data = None
            for participant in participants:
                if participant.get('puuid') == puuid:
                    player_data = participant
                    break
            
            if not player_data:
                continue
            
            total_games += 1
            total_playtime_seconds += game_duration
            
            # Queue stats
            if queue_id not in queue_stats:
                queue_stats[queue_id] = {"wins": 0, "losses": 0, "games": 0}
            
            queue_stats[queue_id]["games"] += 1
            if player_data.get('win', False):
                queue_stats[queue_id]["wins"] += 1
            else:
                queue_stats[queue_id]["losses"] += 1
            
            # Performance metrics
            total_kills += player_data.get('kills', 0)
            total_deaths += player_data.get('deaths', 0)
            total_assists += player_data.get('assists', 0)
            total_cs += player_data.get('totalMinionsKilled', 0) + player_data.get('neutralMinionsKilled', 0)
            total_gold += player_data.get('goldEarned', 0)
            total_damage += player_data.get('totalDamageDealtToChampions', 0)
            total_vision += player_data.get('visionScore', 0)
            
            # Champion stats
            champion = player_data.get('championName', 'Unknown')
            if champion not in champion_stats:
                champion_stats[champion] = {"games": 0, "wins": 0}
            champion_stats[champion]["games"] += 1
            if player_data.get('win', False):
                champion_stats[champion]["wins"] += 1
            
            # Role tracking
            role = player_data.get('teamPosition', '')
            if role:
                role_counter[role] += 1
        
        # Calculate averages
        avg_kills = round(total_kills / total_games, 1) if total_games > 0 else 0
        avg_deaths = round(total_deaths / total_games, 1) if total_games > 0 else 0
        avg_assists = round(total_assists / total_games, 1) if total_games > 0 else 0
        avg_kda = round((total_kills + total_assists) / max(total_deaths, 1), 2)
        avg_cs = round(total_cs / total_games, 1) if total_games > 0 else 0
        avg_gold = round(total_gold / total_games, 0) if total_games > 0 else 0
        avg_damage = round(total_damage / total_games, 0) if total_games > 0 else 0
        avg_vision = round(total_vision / total_games, 1) if total_games > 0 else 0
        
        # CS per minute (estimate based on average game duration)
        avg_game_duration_minutes = (total_playtime_seconds / total_games / 60) if total_games > 0 else 30
        cs_per_minute = round(avg_cs / avg_game_duration_minutes, 1) if avg_game_duration_minutes > 0 else 0
        
        # Get top 5 most played champions
        top_champions = sorted(
            champion_stats.items(),
            key=lambda x: x[1]["games"],
            reverse=True
        )[:5]
        
        most_played_champions = [
            {
                "champion": champ,
                "games": stats["games"],
                "wins": stats["wins"],
                "win_rate": round(stats["wins"] / stats["games"] * 100, 1) if stats["games"] > 0 else 0
            }
            for champ, stats in top_champions
        ]
        
        # Get preferred roles (top 3)
        preferred_roles = [
            {
                "role": ROLE_NAMES.get(role, role),
                "games": count,
                "percentage": round(count / total_games * 100, 1) if total_games > 0 else 0
            }
            for role, count in role_counter.most_common(3)
        ]
        
        # Format queue statistics
        queue_breakdown = []
        for queue_id, stats in queue_stats.items():
            queue_name = QUEUE_TYPES.get(queue_id, f"Queue {queue_id}")
            win_rate = round(stats["wins"] / stats["games"] * 100, 1) if stats["games"] > 0 else 0
            queue_breakdown.append({
                "queue_type": queue_name,
                "games": stats["games"],
                "wins": stats["wins"],
                "losses": stats["losses"],
                "win_rate": win_rate
            })
        
        # Sort by games played
        queue_breakdown.sort(key=lambda x: x["games"], reverse=True)
        
        # Calculate total playtime
        hours_played = round(total_playtime_seconds / 3600, 1)
        
        # Build comprehensive profile
        profile = {
            "riot_id": riot_id,
            "puuid": puuid,
            "summoner_level": summoner_level,
            
            # Ranked information
            "ranked_solo": ranked_solo or {"tier": "UNRANKED", "rank": "", "lp": 0, "wins": 0, "losses": 0, "win_rate": 0},
            "ranked_flex": ranked_flex or {"tier": "UNRANKED", "rank": "", "lp": 0, "wins": 0, "losses": 0, "win_rate": 0},
            
            # Match history summary
            "matches_analyzed": total_games,
            "total_playtime_hours": hours_played,
            
            # Average performance
            "average_stats": {
                "kda": f"{avg_kills}/{avg_deaths}/{avg_assists}",
                "kda_ratio": avg_kda,
                "cs": avg_cs,
                "cs_per_minute": cs_per_minute,
                "gold": avg_gold,
                "damage": avg_damage,
                "vision_score": avg_vision
            },
            
            # Champion pool
            "most_played_champions": most_played_champions,
            
            # Role preferences
            "preferred_roles": preferred_roles,
            
            # Queue breakdown
            "queue_statistics": queue_breakdown,
        }
        
        return profile
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return {"error": str(e)}


@tool
def get_user_profile_from_cache(riot_id: str, match_data: List[dict]) -> Dict[str, Any]:
    """
    Get user profile using cached match data from frontend (no API calls).
    This is much faster and avoids rate limits.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_data: List of match objects from frontend localStorage
        
    Returns:
        Dictionary containing user profile data calculated from cached matches
    """
    logger.info("🔧 TOOL CALLED: get_user_profile_from_cache")
    logger.info(f"   RiotID: {riot_id}")
    logger.info(f"   Cached Matches: {len(match_data) if match_data else 0}")
    
    try:
        if not match_data:
            return {"error": "No match data provided"}
        
        # Parse RiotID
        if '#' not in riot_id:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name, tag_line = riot_id.split('#', 1)
        
        # Try to get PUUID and summoner data (quick cache lookup)
        puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line, use_cache=True)
        summoner_level = 0
        ranked_solo = None
        ranked_flex = None
        
        if puuid:
            summoner_data = riot_client.get_summoner_by_puuid(puuid, use_cache=True)
            summoner_level = summoner_data.get('summonerLevel', 0) if summoner_data else 0
            
            league_entries = riot_client.get_league_entries_by_puuid(puuid, use_cache=True)
            for entry in league_entries:
                queue_type = entry.get('queueType', '')
                if queue_type == 'RANKED_SOLO_5x5':
                    ranked_solo = {
                        "tier": entry.get('tier', 'UNRANKED'),
                        "rank": entry.get('rank', ''),
                        "lp": entry.get('leaguePoints', 0),
                        "wins": entry.get('wins', 0),
                        "losses": entry.get('losses', 0),
                        "win_rate": round(entry.get('wins', 0) / max(entry.get('wins', 0) + entry.get('losses', 0), 1) * 100, 1)
                    }
                elif queue_type == 'RANKED_FLEX_SR':
                    ranked_flex = {
                        "tier": entry.get('tier', 'UNRANKED'),
                        "rank": entry.get('rank', ''),
                        "lp": entry.get('leaguePoints', 0),
                        "wins": entry.get('wins', 0),
                        "losses": entry.get('losses', 0),
                        "win_rate": round(entry.get('wins', 0) / max(entry.get('wins', 0) + entry.get('losses', 0), 1) * 100, 1)
                    }
        
        # Process cached match data
        total_games = len(match_data)
        total_playtime_seconds = 0
        
        queue_stats = {}
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_cs = 0
        total_gold = 0
        total_damage = 0
        total_vision = 0
        
        champion_stats = {}
        role_counter = Counter()
        
        for match in match_data:
            # Game duration (handle both formats)
            game_duration = match.get('game_duration', match.get('gameDuration', 0))
            total_playtime_seconds += game_duration
            
            # Queue stats (handle both formats)
            queue_id = match.get('queue_id', match.get('queueId', 0))
            if queue_id not in queue_stats:
                queue_stats[queue_id] = {"wins": 0, "losses": 0, "games": 0}
            
            queue_stats[queue_id]["games"] += 1
            if match.get('win', False):
                queue_stats[queue_id]["wins"] += 1
            else:
                queue_stats[queue_id]["losses"] += 1
            
            # Performance metrics (handle both cache and API formats)
            total_kills += match.get('kills', 0)
            total_deaths += match.get('deaths', 0)
            total_assists += match.get('assists', 0)
            # Try cs_total first (cache format), fall back to API format
            total_cs += match.get('cs_total', match.get('totalMinionsKilled', 0) + match.get('neutralMinionsKilled', 0))
            total_gold += match.get('gold_earned', match.get('goldEarned', 0))
            total_damage += match.get('total_damage_dealt_to_champions', match.get('totalDamageDealtToChampions', 0))
            total_vision += match.get('vision_score', match.get('visionScore', 0))
            
            # Champion stats (handle both formats)
            champion = match.get('champion_name', match.get('championName', 'Unknown'))
            if champion not in champion_stats:
                champion_stats[champion] = {"games": 0, "wins": 0}
            champion_stats[champion]["games"] += 1
            if match.get('win', False):
                champion_stats[champion]["wins"] += 1
            
            # Role tracking (handle both formats)
            role = match.get('team_position', match.get('teamPosition', ''))
            if role:
                role_counter[role] += 1
        
        # Calculate averages
        avg_kills = round(total_kills / total_games, 1) if total_games > 0 else 0
        avg_deaths = round(total_deaths / total_games, 1) if total_games > 0 else 0
        avg_assists = round(total_assists / total_games, 1) if total_games > 0 else 0
        avg_kda = round((total_kills + total_assists) / max(total_deaths, 1), 2)
        avg_cs = round(total_cs / total_games, 1) if total_games > 0 else 0
        avg_gold = round(total_gold / total_games, 0) if total_games > 0 else 0
        avg_damage = round(total_damage / total_games, 0) if total_games > 0 else 0
        avg_vision = round(total_vision / total_games, 1) if total_games > 0 else 0
        
        # CS per minute
        avg_game_duration_minutes = (total_playtime_seconds / total_games / 60) if total_games > 0 else 30
        cs_per_minute = round(avg_cs / avg_game_duration_minutes, 1) if avg_game_duration_minutes > 0 else 0
        
        # Top 5 champions
        top_champions = sorted(
            champion_stats.items(),
            key=lambda x: x[1]["games"],
            reverse=True
        )[:5]
        
        most_played_champions = [
            {
                "champion": champ,
                "games": stats["games"],
                "wins": stats["wins"],
                "win_rate": round(stats["wins"] / stats["games"] * 100, 1) if stats["games"] > 0 else 0
            }
            for champ, stats in top_champions
        ]
        
        # Preferred roles
        preferred_roles = [
            {
                "role": ROLE_NAMES.get(role, role),
                "games": count,
                "percentage": round(count / total_games * 100, 1) if total_games > 0 else 0
            }
            for role, count in role_counter.most_common(3)
        ]
        
        # Queue breakdown
        queue_breakdown = []
        for queue_id, stats in queue_stats.items():
            queue_name = QUEUE_TYPES.get(queue_id, f"Queue {queue_id}")
            win_rate = round(stats["wins"] / stats["games"] * 100, 1) if stats["games"] > 0 else 0
            queue_breakdown.append({
                "queue_type": queue_name,
                "games": stats["games"],
                "wins": stats["wins"],
                "losses": stats["losses"],
                "win_rate": win_rate
            })
        
        queue_breakdown.sort(key=lambda x: x["games"], reverse=True)
        
        hours_played = round(total_playtime_seconds / 3600, 1)
        
        profile = {
            "riot_id": riot_id,
            "puuid": puuid or "unknown",
            "summoner_level": summoner_level,
            "ranked_solo": ranked_solo or {"tier": "UNRANKED", "rank": "", "lp": 0, "wins": 0, "losses": 0, "win_rate": 0},
            "ranked_flex": ranked_flex or {"tier": "UNRANKED", "rank": "", "lp": 0, "wins": 0, "losses": 0, "win_rate": 0},
            "matches_analyzed": total_games,
            "total_playtime_hours": hours_played,
            "average_stats": {
                "kda": f"{avg_kills}/{avg_deaths}/{avg_assists}",
                "kda_ratio": avg_kda,
                "cs": avg_cs,
                "cs_per_minute": cs_per_minute,
                "gold": avg_gold,
                "damage": avg_damage,
                "vision_score": avg_vision
            },
            "most_played_champions": most_played_champions,
            "preferred_roles": preferred_roles,
            "queue_statistics": queue_breakdown,
            "data_source": "frontend_cache"
        }
        
        return profile
        
    except Exception as e:
        logger.error(f"Error getting user profile from cache: {e}")
        return {"error": str(e)}
