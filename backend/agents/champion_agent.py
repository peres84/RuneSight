"""
Champion Expert Agent

Specialized Strands agent for champion-specific advice, builds, matchups,
and strategic recommendations.
"""

import logging
from typing import Dict, Any, List, Optional
from strands import Agent, tool
from services.riot_api_client import RiotAPIClient
from agents.base_agent import create_bedrock_model
from tools.user_profile_tool import get_user_profile, get_user_profile_from_cache
from tools.match_fetcher_tool import fetch_user_matches


# Initialize services
riot_client = RiotAPIClient()


@tool
def get_champion_performance(riot_id: str, champion_name: str, match_count: int = 10) -> Dict[str, Any]:
    """
    Get performance statistics for a specific champion played by a player.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        champion_name: Name of the champion to analyze
        match_count: Number of recent matches to analyze (default: 10, max: 20)
        
    Returns:
        Dictionary containing champion-specific performance metrics
    """
    try:
        # Parse RiotID
        if '#' not in riot_id:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name, tag_line = riot_id.split('#', 1)
        
        # Get PUUID
        puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            return {"error": f"Player {riot_id} not found"}
        
        # Get recent matches
        match_count = min(match_count, 20)
        match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        
        if not match_ids:
            return {"error": f"No matches found for {riot_id}"}
        
        # Filter matches for specific champion
        champion_matches = []
        total_games = 0
        wins = 0
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_damage = 0
        total_cs = 0
        total_gold = 0
        total_vision = 0
        item_builds = []
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            for participant in participants:
                if participant.get('puuid') == puuid:
                    # Check if this match was with the specified champion
                    if participant.get('championName', '').lower() == champion_name.lower():
                        total_games += 1
                        wins += 1 if participant.get('win', False) else 0
                        total_kills += participant.get('kills', 0)
                        total_deaths += participant.get('deaths', 0)
                        total_assists += participant.get('assists', 0)
                        total_damage += participant.get('totalDamageDealtToChampions', 0)
                        total_cs += participant.get('totalMinionsKilled', 0) + participant.get('neutralMinionsKilled', 0)
                        total_gold += participant.get('goldEarned', 0)
                        total_vision += participant.get('visionScore', 0)
                        
                        # Collect item builds
                        items = [
                            participant.get(f'item{i}', 0)
                            for i in range(6)
                            if participant.get(f'item{i}', 0) != 0
                        ]
                        if items:
                            item_builds.append(items)
                        
                        champion_matches.append({
                            "match_id": match_id,
                            "win": participant.get('win', False),
                            "kda": f"{participant.get('kills', 0)}/{participant.get('deaths', 0)}/{participant.get('assists', 0)}",
                            "role": participant.get('teamPosition', 'Unknown')
                        })
                    break
        
        if total_games == 0:
            return {
                "champion": champion_name,
                "riot_id": riot_id,
                "games_found": 0,
                "message": f"No matches found with {champion_name} in the last {match_count} games"
            }
        
        # Calculate averages
        avg_kda = (total_kills + total_assists) / max(total_deaths, 1)
        win_rate = (wins / total_games * 100) if total_games > 0 else 0
        
        return {
            "champion": champion_name,
            "riot_id": riot_id,
            "games_played": total_games,
            "wins": wins,
            "losses": total_games - wins,
            "win_rate": round(win_rate, 1),
            "avg_kills": round(total_kills / total_games, 1),
            "avg_deaths": round(total_deaths / total_games, 1),
            "avg_assists": round(total_assists / total_games, 1),
            "avg_kda": round(avg_kda, 2),
            "avg_damage": round(total_damage / total_games, 0),
            "avg_cs": round(total_cs / total_games, 1),
            "avg_gold": round(total_gold / total_games, 0),
            "avg_vision_score": round(total_vision / total_games, 1),
            "recent_matches": champion_matches[:5],  # Last 5 matches with this champion
            "item_builds_used": len(item_builds)
        }
        
    except Exception as e:
        logging.error(f"Error getting champion performance: {e}")
        return {"error": str(e)}


@tool
def get_champion_pool(riot_id: str, match_count: int = 20) -> Dict[str, Any]:
    """
    Get a player's champion pool and play rates.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze (default: 20)
        
    Returns:
        Dictionary containing champion pool statistics
    """
    try:
        # Parse RiotID
        if '#' not in riot_id:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name, tag_line = riot_id.split('#', 1)
        
        # Get PUUID
        puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            return {"error": f"Player {riot_id} not found"}
        
        # Get recent matches
        match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        
        if not match_ids:
            return {"error": f"No matches found for {riot_id}"}
        
        # Analyze champion pool
        champion_stats = {}
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            for participant in participants:
                if participant.get('puuid') == puuid:
                    champion = participant.get('championName', 'Unknown')
                    
                    if champion not in champion_stats:
                        champion_stats[champion] = {
                            "games": 0,
                            "wins": 0,
                            "kills": 0,
                            "deaths": 0,
                            "assists": 0
                        }
                    
                    champion_stats[champion]["games"] += 1
                    champion_stats[champion]["wins"] += 1 if participant.get('win', False) else 0
                    champion_stats[champion]["kills"] += participant.get('kills', 0)
                    champion_stats[champion]["deaths"] += participant.get('deaths', 0)
                    champion_stats[champion]["assists"] += participant.get('assists', 0)
                    break
        
        # Calculate stats for each champion
        champion_pool = []
        for champion, stats in champion_stats.items():
            games = stats["games"]
            win_rate = (stats["wins"] / games * 100) if games > 0 else 0
            avg_kda = (stats["kills"] + stats["assists"]) / max(stats["deaths"], 1)
            
            champion_pool.append({
                "champion": champion,
                "games": games,
                "wins": stats["wins"],
                "losses": games - stats["wins"],
                "win_rate": round(win_rate, 1),
                "avg_kda": round(avg_kda, 2),
                "play_rate": round((games / len(match_ids) * 100), 1)
            })
        
        # Sort by games played
        champion_pool.sort(key=lambda x: x["games"], reverse=True)
        
        return {
            "riot_id": riot_id,
            "matches_analyzed": len(match_ids),
            "unique_champions": len(champion_pool),
            "champion_pool": champion_pool
        }
        
    except Exception as e:
        logging.error(f"Error getting champion pool: {e}")
        return {"error": str(e)}


@tool
def get_matchup_history(riot_id: str, champion_name: str, enemy_champion: str) -> Dict[str, Any]:
    """
    Get historical performance in a specific champion matchup.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        champion_name: Player's champion
        enemy_champion: Enemy champion in the matchup
        
    Returns:
        Dictionary containing matchup performance history
    """
    try:
        # Parse RiotID
        if '#' not in riot_id:
            return {"error": "Invalid RiotID format. Use 'gameName#tagLine'"}
        
        game_name, tag_line = riot_id.split('#', 1)
        
        # Get PUUID
        puuid = riot_client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            return {"error": f"Player {riot_id} not found"}
        
        # Get recent matches (search more to find matchup)
        match_ids = riot_client.get_matches_by_puuid(puuid, count=50)
        
        if not match_ids:
            return {"error": f"No matches found for {riot_id}"}
        
        # Find matchup games
        matchup_games = []
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            
            # Find player and check champion
            player_data = None
            player_team = None
            for participant in participants:
                if participant.get('puuid') == puuid:
                    if participant.get('championName', '').lower() == champion_name.lower():
                        player_data = participant
                        player_team = participant.get('teamId')
                    break
            
            if not player_data:
                continue
            
            # Check if enemy team has the matchup champion
            enemy_found = False
            for participant in participants:
                if (participant.get('teamId') != player_team and
                    participant.get('championName', '').lower() == enemy_champion.lower()):
                    enemy_found = True
                    break
            
            if enemy_found:
                matchup_games.append({
                    "match_id": match_id,
                    "win": player_data.get('win', False),
                    "kills": player_data.get('kills', 0),
                    "deaths": player_data.get('deaths', 0),
                    "assists": player_data.get('assists', 0),
                    "damage": player_data.get('totalDamageDealtToChampions', 0),
                    "cs": player_data.get('totalMinionsKilled', 0) + player_data.get('neutralMinionsKilled', 0)
                })
        
        if not matchup_games:
            return {
                "matchup": f"{champion_name} vs {enemy_champion}",
                "games_found": 0,
                "message": f"No recent games found with {champion_name} against {enemy_champion}"
            }
        
        # Calculate matchup stats
        wins = sum(1 for game in matchup_games if game["win"])
        total_games = len(matchup_games)
        
        return {
            "matchup": f"{champion_name} vs {enemy_champion}",
            "riot_id": riot_id,
            "games_played": total_games,
            "wins": wins,
            "losses": total_games - wins,
            "win_rate": round((wins / total_games * 100), 1),
            "recent_games": matchup_games[:5]
        }
        
    except Exception as e:
        logging.error(f"Error getting matchup history: {e}")
        return {"error": str(e)}


class ChampionAgent:
    """
    AI agent specialized in champion-specific advice and analysis.
    
    Provides insights on champion performance, builds, matchups,
    and strategic recommendations.
    """
    
    SYSTEM_PROMPT = """You are a League of Legends champion expert AI assistant.

Your role is to provide champion-specific advice, analyze champion performance, and help players master their champion pool.

**CRITICAL - Be Decisive**:
- **NEVER ask the user if you should use cached vs fresh data**
- If "CACHED DATA AVAILABLE" or "USER PROFILE" appears in context, use it immediately
- If no cached data exists, automatically fetch fresh data
- Be proactive - analyze and provide insights without asking permission

When providing champion advice:
1. **Champion Mastery**: Analyze player's performance on specific champions
2. **Build Recommendations**: Suggest optimal item builds based on game context
3. **Matchup Knowledge**: Provide insights on champion matchups and counter-play
4. **Strategic Advice**: Offer champion-specific strategies and tips
5. **Champion Pool**: Help players expand or optimize their champion pool

Key areas to cover:
- Champion mechanics and combos
- Power spikes and win conditions
- Itemization and build paths
- Rune selections
- Matchup advantages and disadvantages
- Role-specific champion strategies
- Meta relevance and tier positioning

Always provide specific, actionable advice tailored to the player's skill level and playstyle.
Be encouraging and help players feel confident in their champion choices."""
    
    def __init__(self):
        """Initialize the Champion Expert Agent"""
        self.model = create_bedrock_model(temperature=0.3, streaming=False)
        self.agent = Agent(
            model=self.model,
            tools=[
                get_champion_performance,
                get_champion_pool,
                get_matchup_history,
                get_user_profile,
                get_user_profile_from_cache,
                fetch_user_matches
            ],
            system_prompt=self.SYSTEM_PROMPT
        )
    
    def analyze_champion_performance(self, riot_id: str, champion_name: str) -> str:
        """
        Analyze a player's performance on a specific champion.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            champion_name: Name of the champion to analyze
            
        Returns:
            AI-generated analysis of champion performance
        """
        prompt = f"""Analyze {riot_id}'s performance on {champion_name}.

Provide analysis covering:
1. Overall performance and win rate with this champion
2. Strengths and areas for improvement
3. Comparison to their other champions
4. Specific tips for mastering {champion_name}
5. Recommended focus areas for improvement

Use the get_champion_performance tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_champion_performance: {e}")
            return f"Error analyzing champion performance: {str(e)}"
    
    def analyze_champion_pool(self, riot_id: str) -> str:
        """
        Analyze a player's champion pool and provide recommendations.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            
        Returns:
            AI-generated analysis of champion pool
        """
        prompt = f"""Analyze {riot_id}'s champion pool.

Provide analysis covering:
1. Champion pool diversity and size
2. Most played champions and their performance
3. Champion pool strengths and weaknesses
4. Recommendations for champion pool optimization
5. Suggestions for new champions to learn

Use the get_champion_pool tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_champion_pool: {e}")
            return f"Error analyzing champion pool: {str(e)}"
    
    def analyze_matchup(self, riot_id: str, champion_name: str, enemy_champion: str) -> str:
        """
        Analyze a specific champion matchup.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            champion_name: Player's champion
            enemy_champion: Enemy champion in the matchup
            
        Returns:
            AI-generated matchup analysis and advice
        """
        prompt = f"""Analyze the matchup: {champion_name} vs {enemy_champion} for player {riot_id}.

Provide analysis covering:
1. Historical performance in this matchup
2. Key matchup dynamics and power spikes
3. How to play the early, mid, and late game
4. Itemization recommendations for this matchup
5. Common mistakes to avoid
6. Win conditions and strategic approach

Use the get_matchup_history tool to retrieve historical data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_matchup: {e}")
            return f"Error analyzing matchup: {str(e)}"
    
    def custom_query(self, query: str, match_data: Optional[List[dict]] = None) -> str:
        """
        Handle custom champion-related queries.
        
        Args:
            query: Natural language query about champions
            match_data: Optional pre-fetched match data from frontend (avoids API calls)
            
        Returns:
            AI-generated response to the query
        """
        import sys
        import io
        
        try:
            # If match data is provided, analyze it directly
            if match_data and len(match_data) > 0:
                # Extract riot_id and champion data
                riot_id = match_data[0].get('riot_id') or match_data[0].get('riotId') or "the player"
                
                # Get champion pool from match data
                champion_counts = {}
                for match in match_data:
                    champ = match.get('championName') or match.get('champion_name', 'Unknown')
                    if champ not in champion_counts:
                        champion_counts[champ] = {'games': 0, 'wins': 0}
                    champion_counts[champ]['games'] += 1
                    if match.get('win', False):
                        champion_counts[champ]['wins'] += 1
                
                # Build champion summary
                champ_summary = []
                for champ, stats in sorted(champion_counts.items(), key=lambda x: x[1]['games'], reverse=True)[:5]:
                    wr = round(stats['wins'] / stats['games'] * 100, 1) if stats['games'] > 0 else 0
                    champ_summary.append(f"{champ}: {stats['games']} games, {wr}% WR")
                
                enhanced_query = f"""{query}

CACHED CHAMPION DATA FOR {riot_id}:
Top Champions:
{chr(10).join(f'- {s}' for s in champ_summary)}

Use this data to answer the user's question. DO NOT call tools - all data is provided above."""
                
                # Suppress stdout during agent execution to prevent Strands SDK from printing
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                try:
                    result = self.agent(enhanced_query)
                finally:
                    sys.stdout = old_stdout
            else:
                # Suppress stdout during agent execution
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
