"""
Match Data Analyzer

Pre-processes cached match data into structured analysis results
that can be easily consumed by AI agents.
"""

from typing import List, Dict, Any
from collections import Counter


def analyze_matches_by_queue(matches: List[Dict], queue_id: int = None, limit: int = None) -> Dict[str, Any]:
    """
    Analyze matches with optional filtering by queue and limit.
    
    Args:
        matches: List of match dictionaries
        queue_id: Optional queue filter (420=Ranked Solo, 440=Flex, 450=ARAM)
        limit: Optional limit on number of matches to analyze
        
    Returns:
        Structured analysis results
    """
    # Filter by queue if specified
    filtered_matches = matches
    if queue_id:
        filtered_matches = [m for m in matches if m.get('queueId') == queue_id or m.get('queue_id') == queue_id]
    
    # Limit matches if specified
    if limit:
        filtered_matches = filtered_matches[:limit]
    
    if not filtered_matches:
        return {
            "error": f"No matches found for queue {queue_id}" if queue_id else "No matches found",
            "matches_found": 0
        }
    
    # Helper function to get CS (handles both formats)
    def get_cs(match):
        # Try cs_total first (frontend cache format)
        if 'cs_total' in match:
            return match['cs_total']
        # Fall back to Riot API format
        return match.get('totalMinionsKilled', 0) + match.get('neutralMinionsKilled', 0)
    
    # Helper function to get gold (handles both formats)
    def get_gold(match):
        return match.get('gold_earned', match.get('goldEarned', 0))
    
    # Helper function to get damage (handles both formats)
    def get_damage(match):
        return match.get('total_damage_dealt_to_champions', match.get('totalDamageDealtToChampions', 0))
    
    # Helper function to get vision (handles both formats)
    def get_vision(match):
        return match.get('vision_score', match.get('visionScore', 0))
    
    # Helper function to get duration (handles both formats)
    def get_duration(match):
        return match.get('game_duration', match.get('gameDuration', 0))
    
    # Helper function to get champion name (handles both formats)
    def get_champion(match):
        return match.get('champion_name', match.get('championName', 'Unknown'))
    
    # Aggregate stats
    total_games = len(filtered_matches)
    wins = sum(1 for m in filtered_matches if m.get('win', False))
    losses = total_games - wins
    
    total_kills = sum(m.get('kills', 0) for m in filtered_matches)
    total_deaths = sum(m.get('deaths', 0) for m in filtered_matches)
    total_assists = sum(m.get('assists', 0) for m in filtered_matches)
    total_cs = sum(get_cs(m) for m in filtered_matches)
    total_gold = sum(get_gold(m) for m in filtered_matches)
    total_damage = sum(get_damage(m) for m in filtered_matches)
    total_vision = sum(get_vision(m) for m in filtered_matches)
    total_duration = sum(get_duration(m) for m in filtered_matches)
    
    # Champion stats
    champion_stats = Counter()
    champion_wins = Counter()
    for match in filtered_matches:
        champ = get_champion(match)
        champion_stats[champ] += 1
        if match.get('win', False):
            champion_wins[champ] += 1
    
    # Calculate averages
    avg_kills = round(total_kills / total_games, 1)
    avg_deaths = round(total_deaths / total_games, 1)
    avg_assists = round(total_assists / total_games, 1)
    avg_kda = round((total_kills + total_assists) / max(total_deaths, 1), 2)
    avg_cs = round(total_cs / total_games, 1)
    avg_gold = round(total_gold / total_games, 0)
    avg_damage = round(total_damage / total_games, 0)
    avg_vision = round(total_vision / total_games, 1)
    avg_duration = round(total_duration / total_games, 0)
    cs_per_min = round(avg_cs / (avg_duration / 60), 1) if avg_duration > 0 else 0
    
    # Build match-by-match breakdown
    match_breakdown = []
    for i, match in enumerate(filtered_matches, 1):
        cs = get_cs(match)
        duration = get_duration(match)
        match_breakdown.append({
            "game_number": i,
            "match_id": match.get('match_id', 'Unknown'),
            "champion": get_champion(match),
            "result": "WIN" if match.get('win', False) else "LOSS",
            "kda": f"{match.get('kills', 0)}/{match.get('deaths', 0)}/{match.get('assists', 0)}",
            "kda_ratio": round((match.get('kills', 0) + match.get('assists', 0)) / max(match.get('deaths', 1), 1), 2),
            "cs": cs,
            "cs_per_min": round(cs / (duration / 60), 1) if duration > 0 else 0,
            "gold": get_gold(match),
            "damage": get_damage(match),
            "vision_score": get_vision(match),
            "duration_min": round(duration / 60, 1)
        })
    
    # Top champions
    top_champions = []
    for champ, games in champion_stats.most_common(5):
        wins = champion_wins[champ]
        top_champions.append({
            "champion": champ,
            "games": games,
            "wins": wins,
            "losses": games - wins,
            "win_rate": round(wins / games * 100, 1)
        })
    
    queue_names = {
        420: "Ranked Solo/Duo",
        440: "Ranked Flex",
        450: "ARAM",
        0: "Normal"
    }
    
    return {
        "queue_type": queue_names.get(queue_id, "All Queues") if queue_id else "All Queues",
        "matches_analyzed": total_games,
        "record": {
            "wins": wins,
            "losses": losses,
            "win_rate": round(wins / total_games * 100, 1)
        },
        "averages": {
            "kda": f"{avg_kills}/{avg_deaths}/{avg_assists}",
            "kda_ratio": avg_kda,
            "cs": avg_cs,
            "cs_per_minute": cs_per_min,
            "gold": avg_gold,
            "damage": avg_damage,
            "vision_score": avg_vision,
            "game_duration_min": round(avg_duration / 60, 1)
        },
        "top_champions": top_champions,
        "match_breakdown": match_breakdown
    }


def get_queue_name(queue_id: int) -> str:
    """Get human-readable queue name"""
    queue_names = {
        420: "Ranked Solo/Duo",
        440: "Ranked Flex",
        450: "ARAM",
        400: "Normal Draft",
        430: "Normal Blind"
    }
    return queue_names.get(queue_id, f"Queue {queue_id}")
