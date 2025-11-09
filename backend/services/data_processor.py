"""
Data Processing Utilities - Extract and normalize match data

Transforms raw match API responses into structured, organized data.
Based on working examples from backend/tests/riot_api/extractors.py
"""

from typing import Dict, Any, List, Optional


def extract_participant_info(participant_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract participant profile info - player details, items, spells, runes.
    Returns organized raw data without calculations.

    Args:
        participant_json: Single participant object from match['info']['participants']

    Returns:
        Dictionary with organized participant profile data
    """
    return {
        # Player identification
        "profile": {
            "riotIdGameName": participant_json.get("riotIdGameName", ""),
            "riotIdTagline": participant_json.get("riotIdTagline", ""),
            "summonerName": participant_json.get("summonerName", ""),
            "summonerId": participant_json.get("summonerId", ""),
            "puuid": participant_json.get("puuid", ""),
            "summonerLevel": participant_json.get("summonerLevel", 0),
            "profileIcon": participant_json.get("profileIcon", 0),
        },
        # Champion information
        "champion": {
            "championId": participant_json.get("championId", 0),
            "championName": participant_json.get("championName", ""),
            "champLevel": participant_json.get("champLevel", 0),
            "champExperience": participant_json.get("champExperience", 0),
        },
        # Items (0-6, where 6 is trinket)
        "items": {
            "item0": participant_json.get("item0", 0),
            "item1": participant_json.get("item1", 0),
            "item2": participant_json.get("item2", 0),
            "item3": participant_json.get("item3", 0),
            "item4": participant_json.get("item4", 0),
            "item5": participant_json.get("item5", 0),
            "item6": participant_json.get("item6", 0),  # Trinket slot
            "itemsPurchased": participant_json.get("itemsPurchased", 0),
            "consumablesPurchased": participant_json.get("consumablesPurchased", 0),
        },
        # Summoner spells
        "summoner_spells": {
            "summoner1Id": participant_json.get("summoner1Id", 0),
            "summoner1Casts": participant_json.get("summoner1Casts", 0),
            "summoner2Id": participant_json.get("summoner2Id", 0),
            "summoner2Casts": participant_json.get("summoner2Casts", 0),
        },
        # Runes/Perks
        "perks": participant_json.get("perks", {}),
        # Position and team
        "position": {
            "individualPosition": participant_json.get("individualPosition", ""),
            "lane": participant_json.get("lane", ""),
            "role": participant_json.get("role", ""),
            "teamPosition": participant_json.get("teamPosition", ""),
            "teamId": participant_json.get("teamId", 0),
        },
    }


def calculate_performance_metrics(
    participant_json: Dict[str, Any],
    match_id: str = None,
    game_duration: int = None
) -> Dict[str, Any]:
    """
    Calculate performance statistics from participant data.
    Includes KDA, economy, damage, objectives, vision, and combat stats.

    Args:
        participant_json: Single participant object from match['info']['participants']
        match_id: Optional match ID for reference
        game_duration: Optional game duration in seconds

    Returns:
        Dictionary with organized performance statistics
    """
    # Calculate game duration
    if game_duration is None:
        game_duration = participant_json.get("timePlayed", 0)

    game_duration_minutes = max(game_duration / 60, 1)  # Prevent division by zero
    challenges = participant_json.get("challenges", {})

    # Calculate KDA ratio
    kills = participant_json.get("kills", 0)
    deaths = participant_json.get("deaths", 0)
    assists = participant_json.get("assists", 0)
    kda_ratio = (kills + assists) / max(deaths, 1)

    # Calculate CS
    minion_kills = participant_json.get("totalMinionsKilled", 0)
    neutral_kills = participant_json.get("neutralMinionsKilled", 0)
    total_cs = minion_kills + neutral_kills

    return {
        # Match context
        "match_info": {
            "match_id": match_id or "N/A",
            "player_name": participant_json.get("riotIdGameName", ""),
            "player_puuid": participant_json.get("puuid", ""),
            "champion": participant_json.get("championName", ""),
            "lane": participant_json.get("lane", ""),
            "role": participant_json.get("role", ""),
            "result": "WIN" if participant_json.get("win") else "LOSS",
            "game_duration_seconds": game_duration,
            "game_duration_formatted": f"{int(game_duration_minutes)}m {int(game_duration % 60)}s",
        },
        # KDA statistics
        "kda": {
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "kda_ratio": round(kda_ratio, 2),
            "kill_participation_percent": round(
                challenges.get("killParticipation", 0) * 100, 1
            ),
        },
        # Economy metrics
        "economy": {
            "cs": total_cs,
            "minion_kills": minion_kills,
            "neutral_minion_kills": neutral_kills,
            "cs_per_minute": round(total_cs / game_duration_minutes, 2),
            "gold_earned": participant_json.get("goldEarned", 0),
            "gold_per_minute": round(
                participant_json.get("goldEarned", 0) / game_duration_minutes, 1
            ),
        },
        # Damage statistics
        "damage": {
            "damage_to_champions": participant_json.get("totalDamageDealtToChampions", 0),
            "damage_per_minute": round(
                participant_json.get("totalDamageDealtToChampions", 0) / game_duration_minutes, 1
            ),
            "damage_taken": participant_json.get("totalDamageTaken", 0),
            "damage_mitigated": participant_json.get("damageSelfMitigated", 0),
            "team_damage_percentage": round(
                challenges.get("teamDamagePercentage", 0) * 100, 1
            ),
        },
        # Objective participation
        "objectives": {
            "dragon_kills": participant_json.get("dragonKills", 0),
            "baron_kills": participant_json.get("baronKills", 0),
            "turret_kills": participant_json.get("turretKills", 0),
            "inhibitor_kills": participant_json.get("inhibitorKills", 0),
        },
        # Vision control
        "vision": {
            "vision_score": participant_json.get("visionScore", 0),
            "vision_score_per_minute": round(
                participant_json.get("visionScore", 0) / game_duration_minutes, 2
            ),
            "wards_placed": participant_json.get("wardsPlaced", 0),
            "wards_killed": participant_json.get("wardsKilled", 0),
            "control_wards_purchased": participant_json.get("detectorWardsPlaced", 0),
        },
        # Combat achievements
        "combat": {
            "largest_killing_spree": participant_json.get("largestKillingSpree", 0),
            "largest_multi_kill": participant_json.get("largestMultiKill", 0),
            "solo_kills": challenges.get("soloKills", 0),
            "double_kills": participant_json.get("doubleKills", 0),
            "triple_kills": participant_json.get("tripleKills", 0),
            "quadra_kills": participant_json.get("quadraKills", 0),
            "penta_kills": participant_json.get("pentaKills", 0),
        },
        # Playstyle metrics
        "playstyle": {
            "ability_uses": challenges.get("abilityUses", 0),
            "skillshots_hit": challenges.get("skillshotsHit", 0),
            "skillshots_dodged": challenges.get("skillshotsDodged", 0),
            "time_cc_ing_others": participant_json.get("timeCCingOthers", 0),
            "outnumbered_kills": challenges.get("outnumberedKills", 0),
            "pick_kills_with_ally": challenges.get("pickKillWithAlly", 0),
        },
    }


def extract_match_summary(match_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract high-level match summary information.

    Args:
        match_json: Complete match data from get_match_details()

    Returns:
        Dictionary with match summary
    """
    metadata = match_json.get("metadata", {})
    info = match_json.get("info", {})
    teams = info.get("teams", [])

    # Find winning team
    blue_team = next((t for t in teams if t.get("teamId") == 100), {})
    red_team = next((t for t in teams if t.get("teamId") == 200), {})

    return {
        "match_id": metadata.get("matchId", ""),
        "game_mode": info.get("queueId", 0),
        "game_type": info.get("gameMode", ""),
        "game_duration_seconds": info.get("gameDuration", 0),
        "game_creation": info.get("gameCreation", 0),
        "game_version": info.get("gameVersion", ""),
        "teams": {
            "blue": {
                "teamId": 100,
                "win": blue_team.get("win", False),
                "firstBlood": blue_team.get("objectives", {}).get("champion", {}).get("first", False),
                "firstTower": blue_team.get("objectives", {}).get("tower", {}).get("first", False),
                "firstDragon": blue_team.get("objectives", {}).get("dragon", {}).get("first", False),
                "firstBaron": blue_team.get("objectives", {}).get("baron", {}).get("first", False),
            },
            "red": {
                "teamId": 200,
                "win": red_team.get("win", False),
                "firstBlood": red_team.get("objectives", {}).get("champion", {}).get("first", False),
                "firstTower": red_team.get("objectives", {}).get("tower", {}).get("first", False),
                "firstDragon": red_team.get("objectives", {}).get("dragon", {}).get("first", False),
                "firstBaron": red_team.get("objectives", {}).get("baron", {}).get("first", False),
            },
        },
    }


def normalize_match_data(
    match_json: Dict[str, Any],
    target_puuid: Optional[str] = None
) -> Dict[str, Any]:
    """
    Normalize complete match data into a structured format.

    Args:
        match_json: Complete match data from get_match_details()
        target_puuid: Optional PUUID to highlight specific player

    Returns:
        Normalized match data with summary, participants, and target player info
    """
    info = match_json.get("info", {})
    participants = info.get("participants", [])
    game_duration = info.get("gameDuration", 0)
    match_id = match_json.get("metadata", {}).get("matchId", "")

    # Extract summary
    summary = extract_match_summary(match_json)

    # Process all participants
    normalized_participants = []
    target_player_data = None

    for participant in participants:
        participant_data = {
            "info": extract_participant_info(participant),
            "performance": calculate_performance_metrics(
                participant,
                match_id=match_id,
                game_duration=game_duration
            )
        }
        normalized_participants.append(participant_data)

        # Check if this is the target player
        if target_puuid and participant.get("puuid") == target_puuid:
            target_player_data = participant_data

    return {
        "summary": summary,
        "participants": normalized_participants,
        "target_player": target_player_data,
        "game_duration": game_duration,
    }


def format_match_history(
    match_ids: List[str],
    match_details_list: List[Dict[str, Any]],
    target_puuid: str
) -> List[Dict[str, Any]]:
    """
    Format match history for a specific player.
    Returns data in the format expected by the frontend.

    Args:
        match_ids: List of match IDs
        match_details_list: List of match detail responses
        target_puuid: PUUID of the target player

    Returns:
        List of formatted match history entries matching frontend MatchData interface
    """
    formatted_matches = []

    for match_id, match_data in zip(match_ids, match_details_list):
        if not match_data:
            continue

        info = match_data.get("info", {})
        participants = info.get("participants", [])
        
        # Find the target player's data
        player_data = None
        for participant in participants:
            if participant.get("puuid") == target_puuid:
                player_data = participant
                break
        
        if not player_data:
            continue

        # Calculate game duration
        game_duration = info.get("gameDuration", 0)
        game_duration_minutes = max(game_duration / 60, 1)
        
        # Calculate KDA
        kills = player_data.get("kills", 0)
        deaths = player_data.get("deaths", 0)
        assists = player_data.get("assists", 0)
        kda_ratio = round((kills + assists) / max(deaths, 1), 2)
        
        # Calculate CS
        minion_kills = player_data.get("totalMinionsKilled", 0)
        neutral_kills = player_data.get("neutralMinionsKilled", 0)
        total_cs = minion_kills + neutral_kills
        
        # Calculate team totals for percentages
        team_totals = {}
        for participant in participants:
            team_id = participant.get("teamId", 0)
            if team_id not in team_totals:
                team_totals[team_id] = {
                    "kills": 0,
                    "damage": 0,
                    "gold": 0
                }
            team_totals[team_id]["kills"] += participant.get("kills", 0)
            team_totals[team_id]["damage"] += participant.get("totalDamageDealtToChampions", 0)
            team_totals[team_id]["gold"] += participant.get("goldEarned", 0)
        
        # Format all participants data
        all_participants = []
        player_team_id = player_data.get("teamId", 0)
        
        for participant in participants:
            p_kills = participant.get("kills", 0)
            p_deaths = participant.get("deaths", 0)
            p_assists = participant.get("assists", 0)
            p_kda_ratio = round((p_kills + p_assists) / max(p_deaths, 1), 2)
            p_minion_kills = participant.get("totalMinionsKilled", 0)
            p_neutral_kills = participant.get("neutralMinionsKilled", 0)
            p_total_cs = p_minion_kills + p_neutral_kills
            p_damage = participant.get("totalDamageDealtToChampions", 0)
            p_gold = participant.get("goldEarned", 0)
            p_team_id = participant.get("teamId", 0)
            
            # Calculate percentages
            team_kills = team_totals.get(p_team_id, {}).get("kills", 1)
            team_damage = team_totals.get(p_team_id, {}).get("damage", 1)
            team_gold = team_totals.get(p_team_id, {}).get("gold", 1)
            
            kill_participation = round(((p_kills + p_assists) / max(team_kills, 1)) * 100, 1)
            damage_share = round((p_damage / max(team_damage, 1)) * 100, 1)
            gold_share = round((p_gold / max(team_gold, 1)) * 100, 1)
            
            participant_formatted = {
                "puuid": participant.get("puuid", ""),
                "summoner_name": participant.get("riotIdGameName", ""),
                "champion_name": participant.get("championName", ""),
                "champion_id": participant.get("championId", 0),
                "team_id": p_team_id,
                "team_position": participant.get("teamPosition", ""),
                "kills": p_kills,
                "deaths": p_deaths,
                "assists": p_assists,
                "kda_ratio": p_kda_ratio,
                "total_damage_dealt_to_champions": p_damage,
                "gold_earned": p_gold,
                "cs_total": p_total_cs,
                "cs_per_minute": round(p_total_cs / game_duration_minutes, 2),
                "vision_score": participant.get("visionScore", 0),
                "kill_participation": kill_participation,
                "damage_share": damage_share,
                "gold_share": gold_share,
                "damage_per_minute": round(p_damage / game_duration_minutes, 1),
                "items": [
                    participant.get("item0", 0),
                    participant.get("item1", 0),
                    participant.get("item2", 0),
                    participant.get("item3", 0),
                    participant.get("item4", 0),
                    participant.get("item5", 0),
                    participant.get("item6", 0),
                ],
                "win": participant.get("win", False),
                "is_target_player": participant.get("puuid") == target_puuid,
            }
            all_participants.append(participant_formatted)
        
        # Get team data
        teams_data = info.get("teams", [])
        teams_formatted = []
        for team in teams_data:
            team_formatted = {
                "team_id": team.get("teamId", 0),
                "win": team.get("win", False),
                "is_player_team": team.get("teamId") == player_team_id,
                "objectives": {
                    "baron": team.get("objectives", {}).get("baron", {}).get("kills", 0),
                    "dragon": team.get("objectives", {}).get("dragon", {}).get("kills", 0),
                    "tower": team.get("objectives", {}).get("tower", {}).get("kills", 0),
                    "inhibitor": team.get("objectives", {}).get("inhibitor", {}).get("kills", 0),
                    "rift_herald": team.get("objectives", {}).get("riftHerald", {}).get("kills", 0),
                }
            }
            teams_formatted.append(team_formatted)
        
        # Format match data to match frontend interface
        formatted_match = {
            "match_id": match_id,
            "game_creation": str(info.get("gameCreation", 0)),
            "game_duration": game_duration,
            "game_duration_formatted": f"{int(game_duration_minutes)}m {int(game_duration % 60)}s",
            "game_mode": str(info.get("queueId", 0)),
            "queue_id": info.get("queueId", 0),
            "map_id": info.get("mapId", 0),
            "win": player_data.get("win", False),
            "champion_name": player_data.get("championName", ""),
            "champion_id": player_data.get("championId", 0),
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "kda_ratio": kda_ratio,
            "kda_string": f"{kills}/{deaths}/{assists}",
            "total_damage_dealt_to_champions": player_data.get("totalDamageDealtToChampions", 0),
            "damage_per_minute": round(player_data.get("totalDamageDealtToChampions", 0) / game_duration_minutes, 1),
            "gold_earned": player_data.get("goldEarned", 0),
            "cs_total": total_cs,
            "cs_per_minute": round(total_cs / game_duration_minutes, 2),
            "vision_score": player_data.get("visionScore", 0),
            "team_position": player_data.get("teamPosition", ""),
            "items": [
                player_data.get("item0", 0),
                player_data.get("item1", 0),
                player_data.get("item2", 0),
                player_data.get("item3", 0),
                player_data.get("item4", 0),
                player_data.get("item5", 0),
                player_data.get("item6", 0),
            ],
            "all_participants": all_participants,
            "teams": teams_formatted,
        }
        
        formatted_matches.append(formatted_match)

    return formatted_matches
