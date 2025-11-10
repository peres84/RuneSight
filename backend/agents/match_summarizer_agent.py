"""
Match Summarizer Agent

Specialized Strands agent for creating comprehensive match summaries,
season reviews, and achievement tracking.
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
def get_match_summary(match_id: str, riot_id: str) -> Dict[str, Any]:
    """
    Get comprehensive match summary with all key events and statistics.
    
    Args:
        match_id: Match identifier (format: REGION_MATCHID)
        riot_id: Player's RiotID in format 'gameName#tagLine'
        
    Returns:
        Dictionary containing comprehensive match summary
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
        
        # Get match details
        match_data = riot_client.get_match_details(match_id)
        if not match_data:
            return {"error": f"Match {match_id} not found"}
        
        info = match_data.get('info', {})
        participants = info.get('participants', [])
        
        # Find player's data
        player_data = None
        player_team_id = None
        
        for participant in participants:
            if participant.get('puuid') == puuid:
                player_data = participant
                player_team_id = participant.get('teamId')
                break
        
        if not player_data:
            return {"error": f"Player {riot_id} not found in match {match_id}"}
        
        # Game info
        game_duration_minutes = info.get('gameDuration', 0) // 60
        game_mode = info.get('gameMode', 'Unknown')
        queue_id = info.get('queueId', 0)
        
        # Player performance
        player_performance = {
            "champion": player_data.get('championName', 'Unknown'),
            "role": player_data.get('teamPosition', 'Unknown'),
            "level": player_data.get('champLevel', 0),
            "kills": player_data.get('kills', 0),
            "deaths": player_data.get('deaths', 0),
            "assists": player_data.get('assists', 0),
            "kda_ratio": round((player_data.get('kills', 0) + player_data.get('assists', 0)) / max(player_data.get('deaths', 0), 1), 2),
            "cs": player_data.get('totalMinionsKilled', 0) + player_data.get('neutralMinionsKilled', 0),
            "gold": player_data.get('goldEarned', 0),
            "damage_dealt": player_data.get('totalDamageDealtToChampions', 0),
            "damage_taken": player_data.get('totalDamageTaken', 0),
            "vision_score": player_data.get('visionScore', 0),
            "win": player_data.get('win', False)
        }
        
        # Achievements/highlights
        achievements = []
        if player_data.get('firstBloodKill', False):
            achievements.append("First Blood")
        if player_data.get('pentaKills', 0) > 0:
            achievements.append(f"{player_data.get('pentaKills')} Penta Kill(s)")
        if player_data.get('quadraKills', 0) > 0:
            achievements.append(f"{player_data.get('quadraKills')} Quadra Kill(s)")
        if player_data.get('tripleKills', 0) > 0:
            achievements.append(f"{player_data.get('tripleKills')} Triple Kill(s)")
        if player_data.get('doubleKills', 0) > 0:
            achievements.append(f"{player_data.get('doubleKills')} Double Kill(s)")
        
        # Team summary
        team_stats = {"player_team": [], "enemy_team": []}
        
        for participant in participants:
            team_key = "player_team" if participant.get('teamId') == player_team_id else "enemy_team"
            team_stats[team_key].append({
                "champion": participant.get('championName', 'Unknown'),
                "role": participant.get('teamPosition', 'Unknown'),
                "kda": f"{participant.get('kills', 0)}/{participant.get('deaths', 0)}/{participant.get('assists', 0)}",
                "damage": participant.get('totalDamageDealtToChampions', 0),
                "gold": participant.get('goldEarned', 0)
            })
        
        return {
            "match_id": match_id,
            "riot_id": riot_id,
            "game_info": {
                "duration_minutes": game_duration_minutes,
                "mode": game_mode,
                "queue_id": queue_id
            },
            "player_performance": player_performance,
            "achievements": achievements,
            "team_stats": team_stats
        }
        
    except Exception as e:
        logging.error(f"Error getting match summary: {e}")
        return {"error": str(e)}


@tool
def get_season_review(riot_id: str, match_count: int = 50) -> Dict[str, Any]:
    """
    Get comprehensive season review with statistics and trends.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze (default: 50, max: 100)
        
    Returns:
        Dictionary containing season review statistics
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
        
        # Get matches
        match_count = min(match_count, 100)
        match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        
        if not match_ids:
            return {"error": f"No matches found for {riot_id}"}
        
        # Aggregate statistics
        total_games = 0
        wins = 0
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_playtime = 0
        
        champion_stats = {}
        role_stats = {}
        queue_stats = {}
        
        # Track achievements
        total_pentas = 0
        total_quadras = 0
        total_triples = 0
        first_bloods = 0
        
        # Track best performances
        best_kda_game = None
        best_kda_value = 0
        highest_damage_game = None
        highest_damage = 0
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            info = match_data.get('info', {})
            participants = info.get('participants', [])
            
            # Find player
            player_data = None
            for participant in participants:
                if participant.get('puuid') == puuid:
                    player_data = participant
                    break
            
            if not player_data:
                continue
            
            total_games += 1
            wins += 1 if player_data.get('win', False) else 0
            
            kills = player_data.get('kills', 0)
            deaths = player_data.get('deaths', 0)
            assists = player_data.get('assists', 0)
            damage = player_data.get('totalDamageDealtToChampions', 0)
            
            total_kills += kills
            total_deaths += deaths
            total_assists += assists
            total_playtime += info.get('gameDuration', 0)
            
            # Champion stats
            champion = player_data.get('championName', 'Unknown')
            if champion not in champion_stats:
                champion_stats[champion] = {"games": 0, "wins": 0}
            champion_stats[champion]["games"] += 1
            if player_data.get('win', False):
                champion_stats[champion]["wins"] += 1
            
            # Role stats
            role = player_data.get('teamPosition', 'Unknown')
            if role not in role_stats:
                role_stats[role] = {"games": 0, "wins": 0}
            role_stats[role]["games"] += 1
            if player_data.get('win', False):
                role_stats[role]["wins"] += 1
            
            # Queue stats
            queue_id = info.get('queueId', 0)
            if queue_id not in queue_stats:
                queue_stats[queue_id] = {"games": 0, "wins": 0}
            queue_stats[queue_id]["games"] += 1
            if player_data.get('win', False):
                queue_stats[queue_id]["wins"] += 1
            
            # Achievements
            total_pentas += player_data.get('pentaKills', 0)
            total_quadras += player_data.get('quadraKills', 0)
            total_triples += player_data.get('tripleKills', 0)
            if player_data.get('firstBloodKill', False):
                first_bloods += 1
            
            # Best performances
            kda = (kills + assists) / max(deaths, 1)
            if kda > best_kda_value:
                best_kda_value = kda
                best_kda_game = {
                    "match_id": match_id,
                    "champion": champion,
                    "kda": f"{kills}/{deaths}/{assists}",
                    "kda_ratio": round(kda, 2)
                }
            
            if damage > highest_damage:
                highest_damage = damage
                highest_damage_game = {
                    "match_id": match_id,
                    "champion": champion,
                    "damage": damage
                }
        
        # Calculate overall stats
        win_rate = (wins / total_games * 100) if total_games > 0 else 0
        avg_kda = (total_kills + total_assists) / max(total_deaths, 1)
        hours_played = round(total_playtime / 3600, 1)
        
        # Top champions
        top_champions = sorted(
            champion_stats.items(),
            key=lambda x: x[1]["games"],
            reverse=True
        )[:5]
        
        return {
            "riot_id": riot_id,
            "matches_analyzed": total_games,
            "overall_stats": {
                "wins": wins,
                "losses": total_games - wins,
                "win_rate": round(win_rate, 1),
                "avg_kda": round(avg_kda, 2),
                "total_kills": total_kills,
                "total_deaths": total_deaths,
                "total_assists": total_assists,
                "hours_played": hours_played
            },
            "achievements": {
                "penta_kills": total_pentas,
                "quadra_kills": total_quadras,
                "triple_kills": total_triples,
                "first_bloods": first_bloods
            },
            "best_performances": {
                "best_kda_game": best_kda_game,
                "highest_damage_game": highest_damage_game
            },
            "top_champions": [
                {
                    "champion": champ,
                    "games": stats["games"],
                    "wins": stats["wins"],
                    "win_rate": round(stats["wins"] / stats["games"] * 100, 1)
                }
                for champ, stats in top_champions
            ]
        }
        
    except Exception as e:
        logging.error(f"Error getting season review: {e}")
        return {"error": str(e)}


class MatchSummarizerAgent:
    """
    AI agent specialized in creating match summaries and season reviews.
    
    Provides comprehensive retrospectives, achievement tracking, and progress analysis.
    """
    
    SYSTEM_PROMPT = """You are a League of Legends match summarizer and achievement tracker AI assistant.

Your role is to create engaging match summaries, season reviews, and track player achievements.

When creating summaries:
1. **Match Summaries**: Provide comprehensive game recaps with key moments
2. **Season Reviews**: Analyze long-term trends and progress
3. **Achievement Tracking**: Highlight notable accomplishments and milestones
4. **Storytelling**: Make summaries engaging and narrative-driven
5. **Progress Analysis**: Show improvement over time

Key areas to cover:
- Game flow and key turning points
- Individual performance highlights
- Team contributions and impact
- Notable achievements (pentas, first bloods, etc.)
- Comparison to previous performances
- Areas of improvement and growth
- Season-long trends and patterns

Always make summaries engaging and celebratory while being honest about areas for improvement.
Focus on the player's journey and progress over time."""
    
    def __init__(self):
        """Initialize the Match Summarizer Agent"""
        self.model = create_bedrock_model(temperature=0.4, streaming=False)  # Slightly higher temp for creative summaries
        self.agent = Agent(
            model=self.model,
            tools=[
                get_match_summary,
                get_season_review,
                get_user_profile,
                get_user_profile_from_cache
            ],
            system_prompt=self.SYSTEM_PROMPT
        )
    
    def summarize_match(self, riot_id: str, match_id: str) -> str:
        """
        Create comprehensive match summary.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            match_id: Match identifier
            
        Returns:
            AI-generated match summary
        """
        prompt = f"""Create a comprehensive match summary for {riot_id} in match {match_id}.

Provide a narrative summary covering:
1. Game overview and outcome
2. Player's performance highlights
3. Key moments and turning points
4. Team contributions
5. Notable achievements
6. Areas for improvement
7. Overall assessment

Use the get_match_summary tool to retrieve the match data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in summarize_match: {e}")
            return f"Error creating match summary: {str(e)}"
    
    def create_season_review(self, riot_id: str, match_count: int = 50) -> str:
        """
        Create comprehensive season review.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            match_count: Number of matches to analyze
            
        Returns:
            AI-generated season review
        """
        prompt = f"""Create a comprehensive season review for {riot_id} based on their last {match_count} matches.

Provide an engaging review covering:
1. Overall season performance and win rate
2. Most played champions and success rates
3. Notable achievements and highlights
4. Best performances and memorable games
5. Growth areas and improvements made
6. Trends and patterns over the season
7. Goals and recommendations for next season

Use the get_season_review tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in create_season_review: {e}")
            return f"Error creating season review: {str(e)}"
    
    def custom_query(self, query: str, match_data: List[dict] = None) -> str:
        """
        Handle custom summary queries.
        
        Args:
            query: Natural language query about match summaries
            match_data: Optional pre-fetched match data from frontend
            
        Returns:
            AI-generated response to the query
        """
        try:
            result = self.agent(query)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in custom_query: {e}")
            raise Exception(f"AI analysis failed: {str(e)}")

    
    def custom_query(self, query: str, match_data: Optional[List[dict]] = None) -> str:
        """
        Handle custom match summary queries.
        
        Args:
            query: Natural language query
            match_data: Optional pre-fetched match data
            
        Returns:
            AI-generated response
        """
        try:
            result = self.agent(query)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in custom_query: {e}")
            raise Exception(f"AI analysis failed: {str(e)}")
