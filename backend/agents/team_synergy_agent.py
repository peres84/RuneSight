"""
Team Synergy Specialist Agent

Specialized Strands agent for evaluating team compositions, draft analysis,
and player role synergies.
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
def analyze_team_composition(match_id: str, riot_id: str) -> Dict[str, Any]:
    """
    Analyze team composition and synergies in a specific match.
    
    Args:
        match_id: Match identifier (format: REGION_MATCHID)
        riot_id: Player's RiotID in format 'gameName#tagLine'
        
    Returns:
        Dictionary containing team composition analysis
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
        
        # Extract team compositions
        participants = match_data.get('info', {}).get('participants', [])
        
        # Find player's team
        player_team_id = None
        for participant in participants:
            if participant.get('puuid') == puuid:
                player_team_id = participant.get('teamId')
                break
        
        if player_team_id is None:
            return {"error": f"Player {riot_id} not found in match {match_id}"}
        
        # Separate teams
        player_team = []
        enemy_team = []
        
        for participant in participants:
            team_data = {
                "champion": participant.get('championName', 'Unknown'),
                "role": participant.get('teamPosition', 'Unknown'),
                "summoner_name": participant.get('summonerName', 'Unknown'),
                "kills": participant.get('kills', 0),
                "deaths": participant.get('deaths', 0),
                "assists": participant.get('assists', 0),
                "damage": participant.get('totalDamageDealtToChampions', 0),
                "gold": participant.get('goldEarned', 0),
                "is_player": participant.get('puuid') == puuid
            }
            
            if participant.get('teamId') == player_team_id:
                player_team.append(team_data)
            else:
                enemy_team.append(team_data)
        
        # Calculate team stats
        player_team_win = any(p.get('is_player') and participants[i].get('win', False) 
                              for i, p in enumerate(participants) 
                              if p.get('puuid') == puuid)
        
        player_team_total_damage = sum(p['damage'] for p in player_team)
        enemy_team_total_damage = sum(p['damage'] for p in enemy_team)
        
        player_team_total_gold = sum(p['gold'] for p in player_team)
        enemy_team_total_gold = sum(p['gold'] for p in enemy_team)
        
        return {
            "match_id": match_id,
            "riot_id": riot_id,
            "player_team_win": player_team_win,
            "player_team": {
                "composition": player_team,
                "total_damage": player_team_total_damage,
                "total_gold": player_team_total_gold,
                "avg_damage": round(player_team_total_damage / 5, 0),
                "avg_gold": round(player_team_total_gold / 5, 0)
            },
            "enemy_team": {
                "composition": enemy_team,
                "total_damage": enemy_team_total_damage,
                "total_gold": enemy_team_total_gold,
                "avg_damage": round(enemy_team_total_damage / 5, 0),
                "avg_gold": round(enemy_team_total_gold / 5, 0)
            }
        }
        
    except Exception as e:
        logging.error(f"Error analyzing team composition: {e}")
        return {"error": str(e)}


@tool
def analyze_role_synergy(riot_id: str, match_count: int = 10) -> Dict[str, Any]:
    """
    Analyze how well a player synergizes with different roles.
    
    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine'
        match_count: Number of recent matches to analyze (default: 10)
        
    Returns:
        Dictionary containing role synergy statistics
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
        
        # Track role synergies
        role_stats = {}  # {player_role: {teammate_role: {wins, games}}}
        
        for match_id in match_ids:
            match_data = riot_client.get_match_details(match_id)
            if not match_data:
                continue
            
            participants = match_data.get('info', {}).get('participants', [])
            
            # Find player and their team
            player_data = None
            player_team_id = None
            
            for participant in participants:
                if participant.get('puuid') == puuid:
                    player_data = participant
                    player_team_id = participant.get('teamId')
                    break
            
            if not player_data:
                continue
            
            player_role = player_data.get('teamPosition', 'Unknown')
            player_win = player_data.get('win', False)
            
            if player_role not in role_stats:
                role_stats[player_role] = {}
            
            # Analyze teammates
            for participant in participants:
                if (participant.get('teamId') == player_team_id and 
                    participant.get('puuid') != puuid):
                    
                    teammate_role = participant.get('teamPosition', 'Unknown')
                    
                    if teammate_role not in role_stats[player_role]:
                        role_stats[player_role][teammate_role] = {"wins": 0, "games": 0}
                    
                    role_stats[player_role][teammate_role]["games"] += 1
                    if player_win:
                        role_stats[player_role][teammate_role]["wins"] += 1
        
        # Calculate win rates
        synergy_analysis = []
        for player_role, teammates in role_stats.items():
            for teammate_role, stats in teammates.items():
                win_rate = (stats["wins"] / stats["games"] * 100) if stats["games"] > 0 else 0
                synergy_analysis.append({
                    "player_role": player_role,
                    "teammate_role": teammate_role,
                    "games": stats["games"],
                    "wins": stats["wins"],
                    "win_rate": round(win_rate, 1)
                })
        
        # Sort by games played
        synergy_analysis.sort(key=lambda x: x["games"], reverse=True)
        
        return {
            "riot_id": riot_id,
            "matches_analyzed": len(match_ids),
            "role_synergies": synergy_analysis
        }
        
    except Exception as e:
        logging.error(f"Error analyzing role synergy: {e}")
        return {"error": str(e)}


class TeamSynergyAgent:
    """
    AI agent specialized in team composition and synergy analysis.
    
    Provides insights on draft quality, team compositions, and role synergies.
    """
    
    SYSTEM_PROMPT = """You are a League of Legends team composition and synergy expert AI assistant.

Your role is to analyze team compositions, evaluate draft quality, and provide insights on player synergies.

When analyzing teams:
1. **Draft Analysis**: Evaluate team composition strengths and weaknesses
2. **Role Synergy**: Identify how well different roles work together
3. **Win Conditions**: Explain team win conditions and power spikes
4. **Matchup Dynamics**: Analyze team vs team matchups
5. **Strategic Advice**: Provide team-focused strategic recommendations

Key areas to cover:
- Team composition balance (damage types, engage, peel, etc.)
- Role synergies and anti-synergies
- Draft phase recommendations
- Team fighting vs split pushing compositions
- Early, mid, and late game team strengths
- Objective control potential
- Team coordination requirements

Always provide actionable insights that help players understand how to play with their team composition.
Be specific about win conditions and strategic approaches."""
    
    def __init__(self):
        """Initialize the Team Synergy Specialist Agent"""
        self.model = create_bedrock_model(temperature=0.3, streaming=False)
        self.agent = Agent(
            model=self.model,
            tools=[
                analyze_team_composition,
                analyze_role_synergy,
                get_user_profile,
                get_user_profile_from_cache
            ],
            system_prompt=self.SYSTEM_PROMPT
        )
    
    def analyze_match_composition(self, riot_id: str, match_id: str) -> str:
        """
        Analyze team composition in a specific match.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            match_id: Match identifier
            
        Returns:
            AI-generated team composition analysis
        """
        prompt = f"""Analyze the team composition for {riot_id} in match {match_id}.

Provide analysis covering:
1. Team composition strengths and weaknesses
2. Enemy team composition analysis
3. Draft advantages and disadvantages
4. Win conditions for both teams
5. How the player's team should have played the game
6. Key strategic recommendations

Use the analyze_team_composition tool to retrieve the match data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_match_composition: {e}")
            return f"Error analyzing team composition: {str(e)}"
    
    def analyze_player_synergies(self, riot_id: str) -> str:
        """
        Analyze how well a player synergizes with different roles.
        
        Args:
            riot_id: Player's RiotID in format 'gameName#tagLine'
            
        Returns:
            AI-generated role synergy analysis
        """
        prompt = f"""Analyze role synergies for {riot_id}.

Provide analysis covering:
1. Which roles the player synergizes best with
2. Win rates when playing with different role combinations
3. Playstyle compatibility with different roles
4. Recommendations for duo queue partners
5. Areas to improve team coordination

Use the analyze_role_synergy tool to retrieve the data."""
        
        try:
            result = self.agent(prompt)
            return result.message['content'][0]['text']
        except Exception as e:
            logging.error(f"Error in analyze_player_synergies: {e}")
            return f"Error analyzing role synergies: {str(e)}"
    
    def custom_query(self, query: str, match_data: Optional[List[dict]] = None) -> str:
        """
        Handle custom team synergy queries.
        
        Args:
            query: Natural language query
            match_data: Optional pre-fetched match data
            
        Returns:
            AI-generated response
        """
        import sys
        import io
        
        try:
            # Suppress stdout during agent execution to prevent Strands SDK from printing
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
