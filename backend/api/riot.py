"""
Riot API Endpoints
Handles RiotID validation, match history, and match details
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import os
import time
import requests
import logging
from collections import defaultdict

from models.riot_models import (
    RiotIDValidationRequest,
    RiotIDValidationResponse,
    MatchHistoryResponse,
    MatchDetailsResponse,
    ErrorResponse
)
from services.riot_api_client import RiotAPIClient
from services.data_processor import normalize_match_data, format_match_history

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory rate limiting
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 20  # requests per window

# Platform to Regional Routing mapping
PLATFORM_TO_REGION = {
    # Americas
    "BR1": "AMERICAS",
    "LA1": "AMERICAS",
    "LA2": "AMERICAS",
    "NA1": "AMERICAS",
    # Europe
    "EUN1": "EUROPE",
    "EUW1": "EUROPE",
    "TR1": "EUROPE",
    "RU": "EUROPE",
    # Asia
    "JP1": "ASIA",
    "KR": "ASIA",
    "OC1": "ASIA",
    # SEA
    "PH2": "SEA",
    "SG2": "SEA",
    "TH2": "SEA",
    "TW2": "SEA",
    "VN2": "SEA",
}


def get_player_platform(puuid: str) -> tuple[Optional[str], Optional[str]]:
    """
    Get the actual platform where a player plays using Riot's region detection API.
    Uses AMERICAS by default since account API is global and works regardless of region.

    Args:
        puuid: Player's PUUID

    Returns:
        Tuple of (platform_code, regional_routing) e.g., ("LA1", "AMERICAS") or (None, None)
    """
    try:
        # Use AMERICAS by default - account API is global, region doesn't matter for this call
        client = RiotAPIClient(region="AMERICAS", platform="NA1")
        active_region = client.get_active_region_by_puuid(puuid, game="lol")

        if active_region and "region" in active_region:
            # Riot returns platform code in lowercase (e.g., "la1", "euw1")
            platform = active_region["region"].upper()  # Convert to LA1, EUW1, etc.

            # Map platform to regional routing using our mapping
            regional_routing = PLATFORM_TO_REGION.get(platform)

            if not regional_routing:
                logger.warning(f"Unknown platform code: {platform}, cannot map to region")
                return None, None

            logger.info(f"✅ Detected platform: {platform}, region: {regional_routing}")
            return platform, regional_routing

        logger.warning(f"No region data returned for PUUID: {puuid}")
        return None, None
    except Exception as e:
        logger.error(f"Error detecting player platform: {e}")
        return None, None


def check_rate_limit(client_id: str) -> bool:
    """
    Simple rate limiting check.
    
    Args:
        client_id: Identifier for the client (IP address or user ID)
    
    Returns:
        True if request is allowed, False if rate limit exceeded
    """
    current_time = time.time()
    
    # Clean old requests outside the window
    rate_limit_store[client_id] = [
        req_time for req_time in rate_limit_store[client_id]
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if limit exceeded
    if len(rate_limit_store[client_id]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    # Add current request
    rate_limit_store[client_id].append(current_time)
    return True


@router.post("/validate", response_model=RiotIDValidationResponse)
async def validate_riot_id(request: RiotIDValidationRequest):
    """
    Validate a RiotID and return PUUID if valid.
    
    Args:
        request: RiotID validation request with riot_id, region, and platform
    
    Returns:
        Validation response with PUUID if valid
    
    Raises:
        HTTPException: If validation fails or rate limit exceeded
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Simple rate limiting based on riot_id
    if not check_rate_limit(request.riot_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    try:
        # Parse RiotID
        if "#" not in request.riot_id:
            return RiotIDValidationResponse(
                valid=False,
                error="Invalid format. Use 'gameName#tagLine' (e.g., Faker#T1)"
            )
        
        parts = request.riot_id.split("#")
        if len(parts) != 2:
            return RiotIDValidationResponse(
                valid=False,
                error="Invalid format. RiotID must have exactly one # separator"
            )
        
        game_name, tag_line = parts[0].strip(), parts[1].strip()
        
        if not game_name or not tag_line:
            return RiotIDValidationResponse(
                valid=False,
                error="Both username and tag are required (e.g., Faker#T1)"
            )
        
        logger.info(f"Validating RiotID: {game_name}#{tag_line}")

        # STEP 1: Validate account exists using AMERICAS (account API is global)
        client = RiotAPIClient(region="AMERICAS", platform="NA1")
        account_data = client.get_account_by_riot_id(game_name, tag_line, use_cache=False)

        if not account_data:
            logger.warning(f"Account not found: {game_name}#{tag_line}")
            return RiotIDValidationResponse(
                valid=False,
                error=f"Player not found. Please check your RiotID."
            )

        puuid = account_data.get("puuid")
        logger.info(f"✅ Account found: {account_data.get('gameName')}#{account_data.get('tagLine')} (PUUID: {puuid})")

        # STEP 2: Detect player's platform using region-by-puuid endpoint
        detected_platform, detected_region = get_player_platform(puuid)

        if not detected_platform or not detected_region:
            logger.warning(f"Could not detect platform for {game_name}#{tag_line}")
            return RiotIDValidationResponse(
                valid=True,
                puuid=puuid,
                game_name=account_data.get("gameName"),
                tag_line=account_data.get("tagLine"),
                region=None,
                error="Could not detect player's region/platform"
            )

        # STEP 3: Get summoner data using detected platform and region
        response_data = {
            "valid": True,
            "puuid": puuid,
            "game_name": account_data.get("gameName"),
            "tag_line": account_data.get("tagLine"),
            "region": detected_region
        }

        try:
            summoner_client = RiotAPIClient(region=detected_region, platform=detected_platform)
            summoner_data = summoner_client.get_summoner_by_puuid(puuid)

            if summoner_data:
                response_data["player_data"] = {
                    "summoner_name": summoner_data.get("name"),
                    "summoner_level": summoner_data.get("summonerLevel"),
                    "profile_icon_id": summoner_data.get("profileIconId"),
                    "platform": detected_platform  # CRITICAL: This is what frontend saves!
                }
                logger.info(f"✅ Summoner data: {summoner_data.get('name')} (Level {summoner_data.get('summonerLevel')})")
        except Exception as e:
            logger.warning(f"Could not fetch summoner data: {e}")

        return RiotIDValidationResponse(**response_data)
    
    except requests.HTTPError as e:
        logger.error(f"HTTP error during validation: {e.response.status_code if e.response else 'unknown'}")
        if e.response and e.response.status_code == 403:
            return RiotIDValidationResponse(
                valid=False,
                error="API authentication failed. Please contact support."
            )
        elif e.response and e.response.status_code == 429:
            return RiotIDValidationResponse(
                valid=False,
                error="Rate limit exceeded. Please wait a moment and try again."
            )
        else:
            return RiotIDValidationResponse(
                valid=False,
                error=f"API error: {str(e)}"
            )
    except Exception as e:
        logger.error(f"Unexpected error during validation: {str(e)}", exc_info=True)
        return RiotIDValidationResponse(
            valid=False,
            error=f"Validation error: {str(e)}"
        )


@router.get("/matches/{riot_id}", response_model=MatchHistoryResponse)
async def get_match_history(
    riot_id: str,
    region: str = Query(default="EUROPE", description="Regional routing"),
    platform: str = Query(default="EUW1", description="Platform routing"),
    count: int = Query(default=20, ge=1, le=100, description="Number of matches to fetch"),
    queue: Optional[int] = Query(default=None, description="Queue ID filter (420=Ranked Solo, 440=Ranked Flex, 450=ARAM)")
):
    """
    Get match history for a player by RiotID.
    
    Args:
        riot_id: RiotID in format 'gameName#tagLine'
        region: Regional routing (AMERICAS, EUROPE, ASIA, SEA)
        platform: Platform routing (NA1, EUW1, KR, etc.)
        count: Number of matches to return (1-100)
        queue: Optional queue ID filter (420=Ranked Solo, 440=Ranked Flex, 450=ARAM)
    
    Returns:
        Match history with formatted match data
    
    Raises:
        HTTPException: If player not found or API error
    """
    # Rate limiting
    if not check_rate_limit(riot_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    try:
        # Parse RiotID
        if "#" not in riot_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid RiotID format. Use 'gameName#tagLine'"
            )
        
        game_name, tag_line = riot_id.split("#", 1)
        
        # Initialize client
        client = RiotAPIClient(region=region, platform=platform)
        
        # Get PUUID
        puuid = client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            raise HTTPException(
                status_code=404,
                detail="Player not found. Check your RiotID and region."
            )
        
        # Get match IDs with optional queue filter
        match_ids = client.get_matches_by_puuid(puuid, count=count, queue=queue)
        
        if not match_ids:
            return MatchHistoryResponse(
                riot_id=riot_id,
                puuid=puuid,
                matches=[],
                total_matches=0
            )
        
        # Get match details for each match IN PARALLEL
        import asyncio
        from concurrent.futures import ThreadPoolExecutor
        
        def fetch_match(match_id):
            """Fetch a single match (runs in thread pool)"""
            try:
                return client.get_match_details(match_id)
            except Exception as e:
                print(f"Error fetching match {match_id}: {e}")
                return None
        
        # Fetch all matches in parallel using thread pool
        with ThreadPoolExecutor(max_workers=10) as executor:
            match_details_list = list(executor.map(fetch_match, match_ids))
        
        # Filter out None values
        match_details_list = [m for m in match_details_list if m is not None]
        
        # Format match history
        formatted_matches = format_match_history(
            match_ids,
            match_details_list,
            puuid
        )
        
        return MatchHistoryResponse(
            riot_id=riot_id,
            puuid=puuid,
            matches=formatted_matches,
            total_matches=len(formatted_matches)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching match history: {str(e)}"
        )


@router.get("/match/{match_id}", response_model=MatchDetailsResponse)
async def get_match_details(
    match_id: str,
    region: str = Query(default="EUROPE", description="Regional routing"),
    puuid: Optional[str] = Query(default=None, description="Optional PUUID to highlight specific player")
):
    """
    Get detailed match data by match ID.
    
    Args:
        match_id: Match identifier (format: REGION_MATCHID)
        region: Regional routing (AMERICAS, EUROPE, ASIA, SEA)
        puuid: Optional PUUID to highlight specific player
    
    Returns:
        Detailed match data with all participants
    
    Raises:
        HTTPException: If match not found or API error
    """
    # Rate limiting
    if not check_rate_limit(match_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    try:
        # Initialize client
        client = RiotAPIClient(region=region)
        
        # Get match details
        match_data = client.get_match_details(match_id)
        
        if not match_data:
            raise HTTPException(
                status_code=404,
                detail="Match not found"
            )
        
        # Normalize match data
        normalized = normalize_match_data(match_data, puuid)
        
        return MatchDetailsResponse(
            match_id=match_id,
            summary=normalized["summary"],
            participants=normalized["participants"],
            target_player=normalized["target_player"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching match details: {str(e)}"
        )


@router.get("/ranked/{riot_id}")
async def get_ranked_info(
    riot_id: str,
    region: str = Query(default="EUROPE", description="Regional routing"),
    platform: str = Query(default="EUW1", description="Platform routing")
):
    """
    Get ranked league information for a player by RiotID.
    
    Args:
        riot_id: RiotID in format 'gameName#tagLine'
        region: Regional routing (AMERICAS, EUROPE, ASIA, SEA)
        platform: Platform routing (NA1, EUW1, KR, etc.)
    
    Returns:
        Ranked league entries for all queues
    
    Raises:
        HTTPException: If player not found or API error
    """
    # Rate limiting
    if not check_rate_limit(riot_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    try:
        # Parse RiotID
        if "#" not in riot_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid RiotID format. Use 'gameName#tagLine'"
            )
        
        game_name, tag_line = riot_id.split("#", 1)
        
        # Initialize client
        client = RiotAPIClient(region=region, platform=platform)
        
        # Get PUUID
        puuid = client.get_puuid_by_riot_id(game_name, tag_line)
        if not puuid:
            raise HTTPException(
                status_code=404,
                detail="Player not found. Check your RiotID and region."
            )
        
        # Detect the actual platform and region where the player plays
        actual_platform, actual_region = get_player_platform(puuid)

        if not actual_platform or not actual_region:
            # Fallback to provided values
            actual_platform = platform
            actual_region = region
            logger.warning(f"Could not detect platform for {riot_id}, using provided: {platform}/{region}")
        else:
            logger.info(f"✅ Detected platform: {actual_platform}, region: {actual_region} for {riot_id}")

        # Use the detected platform and region
        client = RiotAPIClient(region=actual_region, platform=actual_platform)
        
        # Get summoner data
        summoner_data = client.get_summoner_by_puuid(puuid)
        
        # Get league entries
        league_entries = client.get_league_entries_by_puuid(puuid)
        
        return {
            "riot_id": riot_id,
            "puuid": puuid,
            "ranked_data": league_entries,
            "platform": actual_platform,
            "region": actual_region,
            "summoner_level": summoner_data.get("summonerLevel") if summoner_data else None,
            "summoner_name": summoner_data.get("name") if summoner_data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching ranked data: {str(e)}"
        )


@router.get("/health")
async def riot_api_health():
    """Health check for Riot API endpoints"""
    return {
        "status": "healthy",
        "service": "Riot API",
        "endpoints": [
            "/api/riot/validate",
            "/api/riot/matches/{riot_id}",
            "/api/riot/match/{match_id}",
            "/api/riot/ranked/{riot_id}",
            "/api/riot/cache/stats"
        ]
    }


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics for monitoring"""
    from services.cache_service import get_cache
    cache = get_cache()
    return cache.get_stats()


@router.post("/cache/clear")
async def clear_cache():
    """Clear all cache entries (admin endpoint)"""
    from services.cache_service import clear_cache
    clear_cache()
    return {"status": "success", "message": "Cache cleared"}


@router.post("/profile/generate")
async def generate_user_profile(
    riot_id: str = Query(..., description="RiotID in format 'gameName#tagLine'"),
    region: str = Query(default="EUROPE", description="Regional routing"),
    platform: str = Query(default="EUW1", description="Platform routing")
):
    """
    Generate a comprehensive user profile from cached match data.
    This endpoint should be called after fetching match history to create
    a profile that can be saved to localStorage.
    
    Args:
        riot_id: RiotID in format 'gameName#tagLine'
        region: Regional routing
        platform: Platform routing
    
    Returns:
        Comprehensive user profile with stats, rank, champions, etc.
    """
    # Rate limiting
    if not check_rate_limit(riot_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    try:
        from tools.user_profile_tool import get_user_profile
        
        # Generate profile (this will fetch fresh data)
        profile = get_user_profile(riot_id, match_count=50)
        
        if "error" in profile:
            raise HTTPException(
                status_code=404,
                detail=profile["error"]
            )
        
        return profile
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating profile: {str(e)}"
        )
