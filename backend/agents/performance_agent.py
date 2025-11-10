"""
Performance Analysis Agent

Specialized Strands agent for analyzing individual match performance
and providing actionable improvement recommendations.
"""

import logging
from typing import Dict, Any, Optional, List
from strands import Agent, tool
from services.riot_api_client import RiotAPIClient
from services import data_processor
from agents.base_agent import create_bedrock_model
from tools.user_profile_tool import get_user_profile, get_user_profile_from_cache
from tools.match_fetcher_tool import fetch_user_matches
from tools.guides_tool import search_lol_guides, get_guide_summary


# Initialize services
riot_client = RiotAPIClient()


@tool
def get_match_performance(match_id: str, riot_id: str) -> Dict[str, Any]:
    """
    Get detailed performance metrics for a specific match.
    
    Args:
        match_id: Match identifier (format: REGION_MATCHID)
        riot_id: Player's RiotID in format 'gameName#tagLine'
        
    Returns:
        Dictionary containing performance metrics including KDA, damage, gold, CS, vision score
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
        
        # Extract player's performance from match
        participants = match_data.get('info', {}).get('participants', [])
        player_data = None
        
        for participant in participants:
            if participant.get('puuid') == puuid:
                player_data = participant
                break
        
        if not player_data:
            return {"error": f"Player {riot_id} not found in match {match_id}"}
        
        # Calculate KDA ratio
        kills = player_data.get('kills', 0)
        deaths = player_data.get('deaths', 0)
        assists = player_data.get('assists', 0)
        kda_ratio = (kills + assists) / max(deaths, 1)
        
        # Extract key performance metrics
        performance = {
            "match_id": match_id,
            "riot_id": riot_id,
            "champion": player_data.get('championName', 'Unknown'),
            "role": player_data.get('teamPosition', 'Unknown'),
            "win": player_data.get('win', False),
            "game_duration_minutes": match_data.get('info', {}).get('gameDuration', 0) // 60,
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "kda_ratio": round(kda_ratio, 2),
            "damage_dealt": player_data.get('totalDamageDealtToChampions', 0),
            "damage_taken": player_data.get('totalDamageTaken', 0),
            "gold_earned": player_data.get('goldEarned', 0),
            "cs_total": player_data.get('totalMinionsKilled', 0) + player_data.get('neutralMinionsKilled', 0),
            "vision_score": player_data.get('visionScore', 0),
            "wards_placed": player_data.get('wardsPlaced', 0),
            "wards_killed": player_data.get('wardsKilled', 0),
            "control_wards_purchased": player_data.get('visionWardsBoughtInGame', 0),
            "items": [
                player_data.get(f'item{i}', 0) 
                for i in range(7) 
                if player_data.get(f'item{i}', 0) != 0
            ],
            "summoner_spells": [
                player_data.get('summoner1Id', 0),
                player_data.get('summoner2Id', 0)
            ],
            "first_blood": player_data.get('firstBloodKill', False),
            "double_kills": player_data.get('doubleKills', 0),
            "triple_kills": player_data.get('tripleKills', 0),
            "quadra_kills": player_data.get('quadraKills', 0),
            "penta_kills": player_data.get('pentaKills', 0),
        }
        
        return performance
        
    except Exception as e:
        logging.error(f"Error getting match performance: {e}")
        return {"error": str(e)}


@tool
def analyze_provided_matches(match_data: List[dict], riot_id: str) -> Dict[str, Any]:
    """
    Analyze matches using data provided by the frontend (no API calls needed).
    This is much faster as it uses cached data from the user's browser.
    
    Args:
        match_data: List of match objects from frontend localStorage
        riot_id: Player's RiotID
        
    Returns:
        Performance summary without making any API calls
    """
    try:
        if not match_data:
            return {"error": "No match data provided"}
        
        total_games = len(match_data)
        wins = sum(1 for m in match_data if m.get('win', False))
        
        # Calculate averages from provided data
        total_kills = sum(m.get('kills', 0) for m in match_data)
        total_deaths = sum(m.get('deaths', 0) for m in match_data)
        total_assists = sum(m.get('assists', 0) for m in match_data)
        total_damage = sum(m.get('totalDamageDealtToChampions', 0) for m in match_data)
        total_gold = sum(m.get('goldEarned', 0) for m in match_data)
        total_cs = sum(m.get('totalMinionsKilled', 0) + m.get('neutralMinionsKilled', 0) for m in match_data)
        total_vision = sum(m.get('visionScore', 0) for m in match_data)
        
        # Champion frequency
        champion_counts = {}
        for match in match_data:
            champ = match.get('championName', 'Unknown')
            champion_counts[champ] = champion_counts.get(champ, 0) + 1
        
        most_played = max(champion_counts.items(), key=lambda x: x[1]) if champion_counts else ("None", 0)
        
        avg_kda = (total_kills + total_assists) / max(total_deaths, 1)
        win_rate = (wins / total_games * 100) if total_games > 0 else 0
        
        return {
            "riot_id": riot_id,
            "games_analyzed": total_games,
            "wins": wins,
            "losses": total_games - wins,
            "win_rate": round(win_rate, 1),
            "avg_kills": round(total_kills / total_games, 1) if total_games > 0 else 0,
            "avg_deaths": round(total_deaths / total_games, 1) if total_games > 0 else 0,
            "avg_assists": round(total_assists / total_games, 1) if total_games > 0 else 0,
            "avg_kda": round(avg_kda, 2),
            "avg_damage": round(total_damage / total_games, 0) if total_games > 0 else 0,
            "avg_gold": round(total_gold / total_games, 0) if total_games > 0 else 0,
            "avg_cs": round(total_cs / total_games, 1) if total_games > 0 else 0,
            "avg_vision_score": round(total_vision / total_games, 1) if total_games > 0 else 0,
            "most_played_champion": most_played[0],
            "most_played_games": most_played[1],
            "data_source": "frontend_cache"
        }
    except Exception as e:
        logging.error(f"Error analyzing provided matches: {e}")
        return {"error": str(e)}


@tool
def get_recent_performance_summary(riot_id: str, match_count: int = 5) -> Dict[str, Any]:
    """
    Get performance summary across recent matches.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze (default: 5, max: 20)
        
    Returns:
        Dictionary containing average performance metrics across recent matches
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
        match_count = min(match_count, 20)  # Cap at 20
        match_ids = riot_client.get_matches_by_puuid(puuid, count=match_count)
        
        if not match_ids:
            return {"error": f"No matches found for {riot_id}"}
        
        # Aggregate performance metrics
        total_games = len(match_ids)
        wins = 0
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_damage = 0
        total_gold = 0
        total_cs = 0
        total_vision = 0
        champion_counts = {}
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            for participant in participants:
                if participant.get('puuid') == puuid:
                    wins += 1 if participant.get('win', False) else 0
                    total_kills += participant.get('kills', 0)
                    total_deaths += participant.get('deaths', 0)
                    total_assists += participant.get('assists', 0)
                    total_damage += participant.get('totalDamageDealtToChampions', 0)
                    total_gold += participant.get('goldEarned', 0)
                    total_cs += participant.get('totalMinionsKilled', 0) + participant.get('neutralMinionsKilled', 0)
                    total_vision += participant.get('visionScore', 0)
                    
                    champion = participant.get('championName', 'Unknown')
                    champion_counts[champion] = champion_counts.get(champion, 0) + 1
                    break
        
        # Calculate averages
        avg_kda = (total_kills + total_assists) / max(total_deaths, 1)
        win_rate = (wins / total_games * 100) if total_games > 0 else 0
        
        # Find most played champion
        most_played = max(champion_counts.items(), key=lambda x: x[1]) if champion_counts else ("None", 0)
        
        summary = {
            "riot_id": riot_id,
            "games_analyzed": total_games,
            "wins": wins,
            "losses": total_games - wins,
            "win_rate": round(win_rate, 1),
            "avg_kills": round(total_kills / total_games, 1) if total_games > 0 else 0,
            "avg_deaths": round(total_deaths / total_games, 1) if total_games > 0 else 0,
            "avg_assists": round(total_assists / total_games, 1) if total_games > 0 else 0,
            "avg_kda": round(avg_kda, 2),
            "avg_damage": round(total_damage / total_games, 0) if total_games > 0 else 0,
            "avg_gold": round(total_gold / total_games, 0) if total_games > 0 else 0,
            "avg_cs": round(total_cs / total_games, 1) if total_games > 0 else 0,
            "avg_vision_score": round(total_vision / total_games, 1) if total_games > 0 else 0,
            "most_played_champion": most_played[0],
            "most_played_games": most_played[1],
        }
        
        return summary
        
    except Exception as e:
        logging.error(f"Error getting recent performance summary: {e}")
        return {"error": str(e)}


class PerformanceAgent:
    """
    AI agent specialized in analyzing League of Legends match performance.
    
    Provides detailed analysis of individual matches and recent performance trends,
    with actionable recommendations for improvement.
    """
    
    SYSTEM_PROMPT = """You are a League of Legends performance analyst AI assistant.

Your role is to analyze player performance data and provide specific, actionable feedback to help players improve their gameplay.

**CRITICAL - Data Usage Rules**:
1. **If "CACHED DATA AVAILABLE" or "USER PROFILE" appears in the query context, use that data IMMEDIATELY**
2. **NEVER ask the user if you should use cached vs fresh data - just use what's available**
3. **If cached data exists, use analyze_provided_matches or get_user_profile_from_cache tools**
4. **If no cached data exists, automatically fetch fresh data with get_user_profile**
5. **Be decisive - don't ask permission, just analyze**

This is critical for performance - using cached data is 10x faster and avoids rate limits!

When analyzing performance:
1. **Identify Strengths**: Highlight what the player did well with specific metrics
2. **Pinpoint Weaknesses**: Identify clear areas for improvement with data-backed reasoning
3. **Provide Actionable Advice**: Give specific, practical recommendations the player can implement
4. **Consider Context**: Factor in champion, role, game duration, and win/loss when analyzing
5. **Be Encouraging**: Frame feedback positively while being honest about areas to improve

Key metrics to analyze:
- KDA (Kills/Deaths/Assists) and KDA ratio
- Damage dealt and damage taken
- CS (Creep Score) and gold efficiency
- Vision score and ward placement
- Objective participation
- Item builds and timing

Always provide concrete examples and specific numbers when giving feedback.
Be conversational but professional, like a coach talking to a player.

**CRITICAL - Knowledge Base Usage**:
- You have access to League of Legends strategy guides via search_lol_guides tool
- **ALWAYS search the knowledge base when users ask about:**
  - CS benchmarks, farming, wave management
  - Game fundamentals, macro/micro concepts
  - Team composition, drafting strategies
  - Any educational/learning questions
- Use search_lol_guides BEFORE giving advice on these topics
- The knowledge base has accurate, detailed information that supplements your analysis"""
    
    def __init__(self):
        """Initialize the Performance Analysis Agent"""
        self.model = create_bedrock_model(temperature=0.3, streaming=False)
        self.agent = Agent(
            model=self.model,
            tools=[
                get_match_performance,
                get_recent_performance_summary,
                analyze_provided_matches,
                get_user_profile,
                get_user_profile_from_cache,
                fetch_user_matches,
                search_lol_guides,
                get_guide_summary
            ],
            system_prompt=self.SYSTEM_PROMPT
        )
    
    def analyze_match(self, riot_id: str, match_id: str) -> str:
        """
        Analyze a player's performance in a specific match.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            match_id: Match identifier
            
        Returns:
            AI-generated analysis with specific feedback and recommendations
        """
        prompt = f"""Analyze the performance of {riot_id} in match {match_id}.

Provide a comprehensive analysis covering:
1. Overall performance summary
2. Key strengths demonstrated in this match
3. Areas for improvement with specific examples
4. Recommended focus areas for next games

Use the get_match_performance tool to retrieve the match data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_match: {e}")
            return f"Error analyzing match: {str(e)}"
    
    def analyze_recent_performance(self, riot_id: str, match_count: int = 5) -> str:
        """
        Analyze a player's recent performance trends.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            match_count: Number of recent matches to analyze
            
        Returns:
            AI-generated analysis of recent performance trends
        """
        prompt = f"""Analyze the recent performance of {riot_id} over their last {match_count} matches.

Provide analysis covering:
1. Overall performance trends and win rate
2. Consistency in key metrics (KDA, CS, vision)
3. Champion pool and most played champions
4. Strengths to maintain
5. Areas showing improvement opportunities
6. Specific recommendations for continued growth

Use the get_recent_performance_summary tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_recent_performance: {e}")
            return f"Error analyzing recent performance: {str(e)}"
    
    def custom_query(self, query: str, match_data: Optional[List[dict]] = None) -> str:
        """
        Handle custom performance-related queries.
        
        Args:
            query: Natural language query about player performance
            match_data: Optional pre-fetched match data from frontend (avoids API calls)
            
        Returns:
            AI-generated response to the query
        """
        try:
            # If match data is provided, analyze it with Python first
            if match_data and len(match_data) > 0:
                # Extract riot_id from first match if available
                riot_id = match_data[0].get('riot_id') or match_data[0].get('riotId') or "the player"
                
                # Import the analyzer
                from utils.match_analyzer import analyze_matches_by_queue, get_queue_name
                
                # Determine what analysis to do based on the query
                queue_id = None
                limit = None
                
                query_lower = query.lower()
                if 'flex' in query_lower:
                    queue_id = 440
                elif 'solo' in query_lower or ('ranked' in query_lower and 'flex' not in query_lower):
                    queue_id = 420
                elif 'aram' in query_lower:
                    queue_id = 450
                
                # Extract number if user asks for "last X games"
                import re
                match_num = re.search(r'last (\d+)', query_lower)
                if match_num:
                    limit = int(match_num.group(1))
                
                # Analyze the data
                analysis = analyze_matches_by_queue(match_data, queue_id, limit)
                
                # Convert to readable format
                import json
                analysis_json = json.dumps(analysis, indent=2)
                
                # Build enhanced query with ANALYZED data
                enhanced_query = f"""{query}

=== PRE-ANALYZED MATCH DATA ===

I have analyzed the cached match data for {riot_id}. Here are the results:

{analysis_json}

This analysis includes:
- Win/loss record and win rate
- Average KDA, CS, gold, damage, vision score
- Match-by-match breakdown with specific performance
- Top champions played with win rates

Use this analyzed data to provide detailed, specific feedback to the user. 
Highlight trends, strengths, weaknesses, and actionable advice.
DO NOT call any tools - all analysis is complete above."""
                
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
            # Re-raise the exception so the API endpoint can handle it properly
            raise Exception(f"AI analysis failed: {str(e)}")
