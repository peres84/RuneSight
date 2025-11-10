"""
Riot API Endpoints
Handles RiotID validation, match history, and match details
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import os
import time
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

router = APIRouter()

# Simple in-memory rate limiting
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 20  # requests per window


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
                error="Invalid format. Use 'gameName#tagLine'"
            )
        
        game_name, tag_line = request.riot_id.split("#", 1)
        
        # Initialize client
        client = RiotAPIClient(
            region=request.region,
            platform=request.platform
        )
        
        # Get account data
        account_data = client.get_account_by_riot_id(game_name, tag_line)
        
        if account_data:
            return RiotIDValidationResponse(
                valid=True,
                puuid=account_data.get("puuid"),
                game_name=account_data.get("gameName"),
                tag_line=account_data.get("tagLine")
            )
        else:
            return RiotIDValidationResponse(
                valid=False,
                error="Player not found. Check your RiotID and region."
            )
    
    except Exception as e:
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
        
        # Get league entries
        league_entries = client.get_league_entries_by_puuid(puuid)
        
        return {
            "riot_id": riot_id,
            "puuid": puuid,
            "ranked_data": league_entries
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
