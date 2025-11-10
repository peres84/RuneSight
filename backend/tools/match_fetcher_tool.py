"""
Match Fetcher Tool

Shared tool for all agents to fetch user matches efficiently with automatic region detection.
"""

import logging
from typing import Dict, Any, List, Optional
from strands import tool
from services.riot_api_client import RiotAPIClient

logger = logging.getLogger(__name__)

# Platform to Regional Routing mapping
PLATFORM_TO_REGION = {
    # Americas
    "br1": "AMERICAS", "la1": "AMERICAS", "la2": "AMERICAS", "na1": "AMERICAS",
    # Europe
    "eun1": "EUROPE", "euw1": "EUROPE", "tr1": "EUROPE", "ru": "EUROPE",
    # Asia
    "jp1": "ASIA", "kr": "ASIA", "oc1": "ASIA",
    # SEA
    "ph2": "SEA", "sg2": "SEA", "th2": "SEA", "tw2": "SEA", "vn2": "SEA",
}


@tool
def fetch_user_matches(
    riot_id: str,
    match_count: int = 20,
    region: Optional[str] = None,
    queue: Optional[int] = None
) -> Dict[str, Any]:
    """
    Fetch match history for a player with automatic region detection.

    This tool efficiently retrieves match data for any player worldwide:
    - Automatically detects player's region if not provided
    - Fetches matches in parallel for maximum speed
    - Returns detailed match information
    - Handles cross-region queries seamlessly

    Args:
        riot_id: Player's RiotID in format 'gameName#tagLine' (e.g., "Faker#T1", "Ricochet#LAG")
        match_count: Number of recent matches to fetch (default: 20, max: 100)
        region: Optional regional routing (AMERICAS, EUROPE, ASIA, SEA). Auto-detected if not provided.
        queue: Optional queue filter (420=Ranked Solo, 440=Ranked Flex, 450=ARAM)

    Returns:
        Dictionary containing:
        - riot_id: Player's RiotID
        - puuid: Player's unique identifier
        - region: Regional routing used
        - platform: Platform code (e.g., LA1, EUW1, KR)
        - matches: List of match details
        - total_matches: Number of matches retrieved

    Example:
        >>> result = fetch_user_matches("Ricochet#LAG", match_count=5)
        >>> print(f"Found {result['total_matches']} matches for {result['riot_id']}")
        >>> print(f"Player region: {result['region']}, platform: {result['platform']}")
    """
    logger.info("🔧 TOOL CALLED: fetch_user_matches")
    logger.info(f"   RiotID: {riot_id}")
    logger.info(f"   Match Count: {match_count}")
    logger.info(f"   Region: {region or 'AUTO-DETECT'}")
    logger.info(f"   Queue: {queue or 'ALL'}")

    try:
        # Validate RiotID format
        if '#' not in riot_id:
            return {
                "error": "Invalid RiotID format. Use 'gameName#tagLine'",
                "riot_id": riot_id
            }

        game_name, tag_line = riot_id.split('#', 1)

        # Cap match count
        match_count = min(match_count, 100)

        # Initialize default client (for account lookup)
        default_client = RiotAPIClient(region=region or "EUROPE", platform="EUW1")

        # Get PUUID (account API is global, works from any region)
        logger.info(f"🔍 Looking up PUUID for {riot_id}...")
        puuid = default_client.get_puuid_by_riot_id(game_name, tag_line)

        if not puuid:
            return {
                "error": f"Player {riot_id} not found",
                "riot_id": riot_id,
                "suggestions": [
                    "Verify the RiotID format is correct (gameName#tagLine)",
                    "Check spelling and capitalization",
                    "Make sure the tagline is correct (case-sensitive)"
                ]
            }

        logger.info(f"✅ Found PUUID: {puuid[:20]}...")

        # Detect player's actual region/platform if not provided
        if region:
            # User provided region, use it directly
            region_client = RiotAPIClient(region=region, platform="EUW1")  # Platform doesn't matter for match API
            detected_platform = "MANUAL"
            logger.info(f"📍 Using provided region: {region}")
        else:
            # Auto-detect region
            logger.info(f"🌍 Auto-detecting region for {riot_id}...")
            active_region_data = default_client.get_active_region_by_puuid(puuid, game="lol")

            if active_region_data and "region" in active_region_data:
                detected_platform = active_region_data["region"].lower()  # e.g., "la1", "euw1"
                region = PLATFORM_TO_REGION.get(detected_platform, "EUROPE")
                logger.info(f"✅ Detected platform: {detected_platform.upper()}, region: {region}")

                # Create region-specific client
                region_client = RiotAPIClient(region=region, platform=detected_platform.upper())
            else:
                # Fallback to default region
                logger.warning(f"⚠️ Could not detect region for {riot_id}, using EUROPE")
                region = "EUROPE"
                detected_platform = "euw1"
                region_client = default_client

        # Fetch match IDs
        logger.info(f"📥 Fetching {match_count} match IDs from {region}...")
        match_ids = region_client.get_matches_by_puuid(puuid, count=match_count, queue=queue)

        if not match_ids:
            return {
                "riot_id": riot_id,
                "puuid": puuid,
                "region": region,
                "platform": detected_platform.upper() if isinstance(detected_platform, str) else "UNKNOWN",
                "matches": [],
                "total_matches": 0,
                "message": f"No matches found for {riot_id} in region {region}"
            }

        logger.info(f"✅ Found {len(match_ids)} match IDs, fetching details in parallel...")

        # Fetch all match details in parallel for maximum speed
        from concurrent.futures import ThreadPoolExecutor

        def fetch_match(match_id):
            """Fetch a single match (runs in thread pool)"""
            try:
                match_data = region_client.get_match_details(match_id)
                if not match_data:
                    return None

                # Extract player-specific data from match
                info = match_data.get('info', {})
                participants = info.get('participants', [])

                # Find this player's data
                player_data = None
                for participant in participants:
                    if participant.get('puuid') == puuid:
                        player_data = participant
                        break

                if not player_data:
                    logger.warning(f"Player {riot_id} not found in match {match_id}")
                    return None

                # Format match data with player-specific stats
                return {
                    "match_id": match_id,
                    "game_mode": info.get('gameMode', 'UNKNOWN'),
                    "game_type": info.get('gameType', 'UNKNOWN'),
                    "queue_id": info.get('queueId', 0),
                    "game_duration": info.get('gameDuration', 0),
                    "game_creation": info.get('gameCreation', 0),
                    "game_version": info.get('gameVersion', 'UNKNOWN'),

                    # Player-specific data
                    "champion_name": player_data.get('championName', 'Unknown'),
                    "champion_id": player_data.get('championId', 0),
                    "team_position": player_data.get('teamPosition', ''),
                    "win": player_data.get('win', False),

                    # Performance stats
                    "kills": player_data.get('kills', 0),
                    "deaths": player_data.get('deaths', 0),
                    "assists": player_data.get('assists', 0),
                    "kda": f"{player_data.get('kills', 0)}/{player_data.get('deaths', 0)}/{player_data.get('assists', 0)}",

                    # Farming stats
                    "total_minions_killed": player_data.get('totalMinionsKilled', 0),
                    "neutral_minions_killed": player_data.get('neutralMinionsKilled', 0),
                    "cs_total": player_data.get('totalMinionsKilled', 0) + player_data.get('neutralMinionsKilled', 0),

                    # Economic stats
                    "gold_earned": player_data.get('goldEarned', 0),
                    "gold_spent": player_data.get('goldSpent', 0),

                    # Combat stats
                    "total_damage_dealt_to_champions": player_data.get('totalDamageDealtToChampions', 0),
                    "total_damage_taken": player_data.get('totalDamageTaken', 0),
                    "physical_damage_dealt": player_data.get('physicalDamageDealt', 0),
                    "magic_damage_dealt": player_data.get('magicDamageDealt', 0),

                    # Vision stats
                    "vision_score": player_data.get('visionScore', 0),
                    "wards_placed": player_data.get('wardsPlaced', 0),
                    "wards_killed": player_data.get('wardsKilled', 0),

                    # Items
                    "items": [
                        player_data.get('item0', 0),
                        player_data.get('item1', 0),
                        player_data.get('item2', 0),
                        player_data.get('item3', 0),
                        player_data.get('item4', 0),
                        player_data.get('item5', 0),
                        player_data.get('item6', 0),  # Trinket
                    ],

                    # Team info
                    "team_id": player_data.get('teamId', 0),
                }

            except Exception as e:
                logger.error(f"Error fetching match {match_id}: {e}")
                return None

        # Fetch all matches in parallel (max 10 concurrent requests)
        with ThreadPoolExecutor(max_workers=10) as executor:
            matches = list(executor.map(fetch_match, match_ids))

        # Filter out None values
        matches = [m for m in matches if m is not None]

        logger.info(f"✅ Successfully fetched {len(matches)}/{len(match_ids)} matches for {riot_id}")

        return {
            "riot_id": riot_id,
            "puuid": puuid,
            "region": region,
            "platform": detected_platform.upper() if isinstance(detected_platform, str) else "UNKNOWN",
            "matches": matches,
            "total_matches": len(matches),
            "requested_count": match_count,
            "queue_filter": queue
        }

    except Exception as e:
        logger.error(f"Error in fetch_user_matches: {e}")
        return {
            "error": str(e),
            "riot_id": riot_id
        }
