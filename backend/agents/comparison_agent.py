"""
Comparison Agent

Specialized Strands agent for comparing player performance,
analyzing duo synergies, and providing comparative insights.
"""

import logging
from typing import Dict, Any, List, Optional
from strands import Agent, tool
from services.riot_api_client import RiotAPIClient
from agents.base_agent import create_bedrock_model
from tools.user_profile_tool import get_user_profile, get_user_profile_from_cache


# Initialize services
riot_client = RiotAPIClient()


@tool
def compare_players(riot_ids: List[str], match_count: int = 10) -> Dict[str, Any]:
    """
    Compare performance statistics between multiple players.
    
    Args:
        riot_ids: List of RiotIDs in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze per player (default: 10)
        
    Returns:
        Dictionary containing comparative statistics for all players
    """
    try:
        if not riot_ids or len(riot_ids) < 2:
            return {"error": "At least 2 RiotIDs are required for comparison"}
        
        if len(riot_ids) > 5:
            return {"error": "Maximum 5 players can be compared at once"}
        
        # Fetch all player profiles in parallel for maximum speed
        from concurrent.futures import ThreadPoolExecutor
        
        def fetch_player_profile(riot_id):
            """Fetch a single player profile (runs in thread pool)"""
            try:
                logging.info(f"Fetching profile for {riot_id}")
                profile = get_user_profile(riot_id, match_count=match_count)
                return profile
            except Exception as e:
                logging.error(f"Error fetching profile for {riot_id}: {e}")
                return {"riot_id": riot_id, "error": str(e)}
        
        # Fetch all profiles in parallel
        with ThreadPoolExecutor(max_workers=5) as executor:
            player_stats = list(executor.map(fetch_player_profile, riot_ids))
        
        # Filter out errors and format for comparison
        valid_players = []
        for profile in player_stats:
            if "error" in profile:
                valid_players.append(profile)
                continue
            
            # Extract key stats from profile for comparison
            avg_stats = profile.get('average_stats', {})
            ranked_solo = profile.get('ranked_solo', {})
            ranked_flex = profile.get('ranked_flex', {})
            most_played = profile.get('most_played_champions', [])
            preferred_roles = profile.get('preferred_roles', [])
            
            valid_players.append({
                "riot_id": profile.get('riot_id'),
                "summoner_level": profile.get('summoner_level', 0),
                "ranked_solo": f"{ranked_solo.get('tier', 'UNRANKED')} {ranked_solo.get('rank', '')}".strip(),
                "ranked_flex": f"{ranked_flex.get('tier', 'UNRANKED')} {ranked_flex.get('rank', '')}".strip(),
                "games_analyzed": profile.get('matches_analyzed', 0),
                "avg_kda": avg_stats.get('kda', 'N/A'),
                "avg_kda_ratio": avg_stats.get('kda_ratio', 0),
                "avg_cs": avg_stats.get('cs', 0),
                "avg_cs_per_minute": avg_stats.get('cs_per_minute', 0),
                "avg_gold": avg_stats.get('gold', 0),
                "avg_damage": avg_stats.get('damage', 0),
                "avg_vision_score": avg_stats.get('vision_score', 0),
                "most_played_champions": [c['champion'] for c in most_played[:3]],
                "preferred_roles": [r['role'] for r in preferred_roles[:2]],
                "queue_statistics": profile.get('queue_statistics', [])
            })
        
        player_stats = valid_players
        
        # OLD CODE REMOVED - Now using get_user_profile tool
        """
        for riot_id in riot_ids:
            # Parse RiotID
            if '#' not in riot_id:
                player_stats.append({
                    "riot_id": riot_id,
                    "error": "Invalid RiotID format"
                })
                continue
            
            game_name, tag_line = riot_id.split('#', 1)
            
            # Get PUUID
            puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line)
            if not puuid:
                player_stats.append({
                    "riot_id": riot_id,
                    "error": "Player not found"
                })
                continue
            
            # Get recent matches
            match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        """
        
        return {
            "comparison_type": "multi_player",
            "players_compared": len(player_stats),
            "match_count": match_count,
            "player_stats": player_stats
        }
        
    except Exception as e:
        logging.error(f"Error comparing players: {e}")
        return {"error": str(e)}


@tool
def analyze_duo_synergy(riot_id_1: str, riot_id_2: str, match_count: int = 20) -> Dict[str, Any]:
    """
    Analyze synergy and performance when two players play together.
    
    Args:
        riot_id_1: First player's RiotID in format 'gameName#tagLine'
        riot_id_2: Second player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to search (default: 20)
        
    Returns:
        Dictionary containing duo synergy statistics
    """
    try:
        # Parse RiotIDs
        if '#' not in riot_id_1 or '#' not in riot_id_2:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name_1, tag_line_1 = riot_id_1.split('#', 1)
        game_name_2, tag_line_2 = riot_id_2.split('#', 1)
        
        # Get PUUIDs
        puuid_1 = riot_client.get_puuid_by_riot_id(game_name_1, tag_line_1)
        puuid_2 = riot_client.get_puuid_by_riot_id(game_name_2, tag_line_2)
        
        if not puuid_1 or not puuid_2:
            return {"error": "One or both players not found"}
        
        # Get matches for player 1
        match_ids_1 = riot_client.get_matches_by_puuid(puuid_1, count=match_count)
        
        if not match_ids_1:
            return {"error": f"No matches found for {riot_id_1}"}
        
        # Find shared matches
        shared_matches = []
        
        for match_id in match_ids_1:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            puuids_in_match = [p.get('puuid') for p in participants]
            
            # Check if both players are in this match
            if puuid_1 in puuids_in_match and puuid_2 in puuids_in_match:
                # Get data for both players
                player_1_data = None
                player_2_data = None
                
                for participant in participants:
                    if participant.get('puuid') == puuid_1:
                        player_1_data = participant
                    elif participant.get('puuid') == puuid_2:
                        player_2_data = participant
                
                if player_1_data and player_2_data:
                    # Check if they were on the same team
                    same_team = player_1_data.get('teamId') == player_2_data.get('teamId')
                    
                    if same_team:
                        shared_matches.append({
                            "match_id": match_id,
                            "win": player_1_data.get('win', False),
                            "player_1": {
                                "champion": player_1_data.get('championName'),
                                "role": player_1_data.get('teamPosition'),
                                "kda": f"{player_1_data.get('kills', 0)}/{player_1_data.get('deaths', 0)}/{player_1_data.get('assists', 0)}"
                            },
                            "player_2": {
                                "champion": player_2_data.get('championName'),
                                "role": player_2_data.get('teamPosition'),
                                "kda": f"{player_2_data.get('kills', 0)}/{player_2_data.get('deaths', 0)}/{player_2_data.get('assists', 0)}"
                            }
                        })
        
        if not shared_matches:
            return {
                "riot_id_1": riot_id_1,
                "riot_id_2": riot_id_2,
                "shared_games": 0,
                "message": f"No shared games found between {riot_id_1} and {riot_id_2} in the last {match_count} matches"
            }
        
        # Calculate duo stats
        wins = sum(1 for match in shared_matches if match["win"])
        total_games = len(shared_matches)
        win_rate = (wins / total_games * 100) if total_games > 0 else 0
        
        return {
            "riot_id_1": riot_id_1,
            "riot_id_2": riot_id_2,
            "shared_games": total_games,
            "wins": wins,
            "losses": total_games - wins,
            "win_rate": round(win_rate, 1),
            "recent_matches": shared_matches[:5]
        }
        
    except Exception as e:
        logging.error(f"Error analyzing duo synergy: {e}")
        return {"error": str(e)}


@tool
def get_head_to_head(riot_id_1: str, riot_id_2: str, match_count: int = 20) -> Dict[str, Any]:
    """
    Get head-to-head statistics when two players face each other.
    
    Args:
        riot_id_1: First player's RiotID in format 'gameName#tagLine'
        riot_id_2: Second player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to search (default: 20)
        
    Returns:
        Dictionary containing head-to-head statistics
    """
    try:
        # Parse RiotIDs
        if '#' not in riot_id_1 or '#' not in riot_id_2:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name_1, tag_line_1 = riot_id_1.split('#', 1)
        game_name_2, tag_line_2 = riot_id_2.split('#', 1)
        
        # Get PUUIDs
        puuid_1 = riot_client.get_puuid_by_riot_id(game_name_1, tag_line_1)
        puuid_2 = riot_client.get_puuid_by_riot_id(game_name_2, tag_line_2)
        
        if not puuid_1 or not puuid_2:
            return {"error": "One or both players not found"}
        
        # Get matches for player 1
        match_ids_1 = riot_client.get_matches_by_puuid(puuid_1, count=match_count)
        
        if not match_ids_1:
            return {"error": f"No matches found for {riot_id_1}"}
        
        # Find head-to-head matches
        h2h_matches = []
        
        for match_id in match_ids_1:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            puuids_in_match = [p.get('puuid') for p in participants]
            
            # Check if both players are in this match
            if puuid_1 in puuids_in_match and puuid_2 in puuids_in_match:
                # Get data for both players
                player_1_data = None
                player_2_data = None
                
                for participant in participants:
                    if participant.get('puuid') == puuid_1:
                        player_1_data = participant
                    elif participant.get('puuid') == puuid_2:
                        player_2_data = participant
                
                if player_1_data and player_2_data:
                    # Check if they were on opposite teams
                    opposite_teams = player_1_data.get('teamId') != player_2_data.get('teamId')
                    
                    if opposite_teams:
                        h2h_matches.append({
                            "match_id": match_id,
                            "player_1_win": player_1_data.get('win', False),
                            "player_1": {
                                "champion": player_1_data.get('championName'),
                                "kda": f"{player_1_data.get('kills', 0)}/{player_1_data.get('deaths', 0)}/{player_1_data.get('assists', 0)}",
                                "damage": player_1_data.get('totalDamageDealtToChampions', 0)
                            },
                            "player_2": {
                                "champion": player_2_data.get('championName'),
                                "kda": f"{player_2_data.get('kills', 0)}/{player_2_data.get('deaths', 0)}/{player_2_data.get('assists', 0)}",
                                "damage": player_2_data.get('totalDamageDealtToChampions', 0)
                            }
                        })
        
        if not h2h_matches:
            return {
                "riot_id_1": riot_id_1,
                "riot_id_2": riot_id_2,
                "head_to_head_games": 0,
                "message": f"No head-to-head games found between {riot_id_1} and {riot_id_2}"
            }
        
        # Calculate head-to-head stats
        player_1_wins = sum(1 for match in h2h_matches if match["player_1_win"])
        total_games = len(h2h_matches)
        player_2_wins = total_games - player_1_wins
        
        return {
            "riot_id_1": riot_id_1,
            "riot_id_2": riot_id_2,
            "head_to_head_games": total_games,
            "player_1_wins": player_1_wins,
            "player_2_wins": player_2_wins,
            "player_1_win_rate": round((player_1_wins / total_games * 100), 1) if total_games > 0 else 0,
            "recent_matches": h2h_matches[:5]
        }
        
    except Exception as e:
        logging.error(f"Error getting head-to-head: {e}")
        return {"error": str(e)}


class ComparisonAgent:
    """
    AI agent specialized in comparing player performance and analyzing synergies.
    
    Provides comparative analysis between players, duo synergy insights,
    and head-to-head statistics.
    """
    
    SYSTEM_PROMPT = """You are a League of Legends comparative analysis AI assistant.

Your role is to compare player performance, analyze duo synergies, and provide insights on player matchups.

**CRITICAL - Automatic Data Fetching**:
- When a user provides a RiotID (format: gameName#tagLine), **IMMEDIATELY use compare_players or get_user_profile tool** to fetch their data
- **NEVER ask the user if you should fetch data or use cache** - just do it automatically
- **Be decisive**: If cached data exists, use it. If not, fetch fresh data. Don't ask permission.
- If cached data is available for one player but not another, fetch the missing player's data
- You have the tools to get any player's data - use them proactively without asking

When comparing players:
1. **Fair Comparison**: Consider context like role, champion pool, and playstyle
2. **Strengths & Weaknesses**: Identify what each player excels at
3. **Learning Opportunities**: Suggest what players can learn from each other
4. **Duo Synergy**: Analyze how well players work together
5. **Head-to-Head**: Provide insights on direct matchups

Key areas to analyze:
- Overall performance metrics (KDA, win rate, damage, CS, vision)
- Champion pools and role preferences
- Playstyle differences (aggressive vs. passive, carry vs. support)
- Duo synergy and win rates when playing together
- Head-to-head records and matchup dynamics
- Complementary strengths and weaknesses

Always be respectful and constructive. Focus on growth and improvement rather than just declaring winners.
Provide specific, actionable insights that help players understand their relative performance."""
    
    def __init__(self):
        """Initialize the Comparison Agent"""
        self.model = create_bedrock_model(temperature=0.3, streaming=False)
        self.agent = Agent(
            model=self.model,
            tools=[
                compare_players, 
                analyze_duo_synergy, 
                get_head_to_head,
                get_user_profile,
                get_user_profile_from_cache
            ],
            system_prompt=self.SYSTEM_PROMPT
        )
    
    def compare_multiple_players(self, riot_ids: List[str]) -> str:
        """
        Compare performance between multiple players.
        
        Args:
            riot_ids: List of RiotIDs in format 'gameName#tagLine'
            
        Returns:
            AI-generated comparative analysis
        """
        riot_ids_str = ", ".join(riot_ids)
        prompt = f"""Compare the performance of these players: {riot_ids_str}

Provide comprehensive comparison covering:
1. Overall performance rankings
2. Individual strengths and specialties
3. Areas where each player excels
4. Opportunities for improvement for each player
5. What players can learn from each other
6. Playstyle differences and similarities

Use the compare_players tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in compare_multiple_players: {e}")
            return f"Error comparing players: {str(e)}"
    
    def analyze_duo(self, riot_id_1: str, riot_id_2: str) -> str:
        """
        Analyze duo synergy between two players.
        
        Args:
            riot_id_1: First player's RiotID
            riot_id_2: Second player's RiotID
            
        Returns:
            AI-generated duo synergy analysis
        """
        prompt = f"""Analyze the duo synergy between {riot_id_1} and {riot_id_2}.

Provide analysis covering:
1. Win rate and performance when playing together
2. Champion combinations and role synergies
3. Strengths of the duo
4. Areas for improvement as a duo
5. Recommendations for better coordination
6. Best champion combinations for this duo

Use the analyze_duo_synergy tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_duo: {e}")
            return f"Error analyzing duo: {str(e)}"
    
    def analyze_head_to_head(self, riot_id_1: str, riot_id_2: str) -> str:
        """
        Analyze head-to-head matchup between two players.
        
        Args:
            riot_id_1: First player's RiotID
            riot_id_2: Second player's RiotID
            
        Returns:
            AI-generated head-to-head analysis
        """
        prompt = f"""Analyze the head-to-head matchup between {riot_id_1} and {riot_id_2}.

Provide analysis covering:
1. Overall head-to-head record
2. Performance comparison in direct matchups
3. Champion matchups and strategies used
4. What gives each player an edge
5. Key factors that determine outcomes
6. Recommendations for future matchups

Use the get_head_to_head tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_head_to_head: {e}")
            return f"Error analyzing head-to-head: {str(e)}"
    
    def custom_query(self, query: str, match_data: Optional[List[dict]] = None) -> str:
        """
        Handle custom comparison-related queries.
        
        Args:
            query: Natural language query about player comparisons
            match_data: Optional pre-fetched match data from frontend (avoids API calls)
            
        Returns:
            AI-generated response to the query
        """
        try:
            # If match data is provided, analyze it directly
            if match_data and len(match_data) > 0:
                # Extract riot_id from first match if available
                riot_id = match_data[0].get('riot_id') or match_data[0].get('riotId') or "the player"
                
                # Call analyze_provided_matches to get stats
                from tools.user_profile_tool import get_user_profile_from_cache
                
                # Try to get cached profile first
                profile_data = get_user_profile_from_cache(riot_id, match_data)
                
                # Build enhanced query with the data
                enhanced_query = f"""{query}

CACHED DATA FOR {riot_id}:
- Games Analyzed: {profile_data.get('matches_analyzed', 0)}
- Win Rate: {profile_data.get('queue_statistics', [{}])[0].get('win_rate', 0) if profile_data.get('queue_statistics') else 0}%
- Average KDA: {profile_data.get('average_stats', {}).get('kda_ratio', 0)}
- Average CS: {profile_data.get('average_stats', {}).get('cs', 0)}
- Rank: {profile_data.get('ranked_solo', {}).get('tier', 'UNRANKED')} {profile_data.get('ranked_solo', {}).get('rank', '')}

Use this data to answer the user's question. If comparing with another player, fetch their data using compare_players or get_user_profile tools."""
                
                # Suppress stdout during agent execution to prevent Strands SDK from printing
                import sys
                import io
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                try:
                    result = self.agent(enhanced_query)
                finally:
                    sys.stdout = old_stdout
            else:
                # Suppress stdout during agent execution
                import sys
                import io
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                try:
                    result = self.agent(query)
                finally:
                    sys.stdout = old_stdout
            
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in custom_query: {e}")
            raise Exception(f"AI analysis failed: {str(e)}")
