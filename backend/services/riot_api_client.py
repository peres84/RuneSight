"""
RiotAPIClient - Core API interaction class with caching

Handles all HTTP requests to Riot Games API endpoints with in-memory caching.
Based on working examples from backend/tests/riot_api/client.py
"""

import os
import time
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

from services.cache_service import get_cache

logger = logging.getLogger(__name__)


class RiotAPIClient:
    """
    Client for interacting with Riot Games League of Legends API with caching.

    Attributes:
        api_key (str): Riot API key for authentication
        region (str): Regional routing (AMERICAS, EUROPE, ASIA, SEA)
        platform (str): Platform routing (NA1, EUW1, KR, etc.)
        cache (Dict): In-memory cache with TTL
    """

    # Regional routing endpoints for account and match data
    REGIONAL_ROUTING = {
        "AMERICAS": "americas.api.riotgames.com",
        "ASIA": "asia.api.riotgames.com",
        "EUROPE": "europe.api.riotgames.com",
        "SEA": "sea.api.riotgames.com",
    }

    # Platform routing endpoints for summoner, league, and spectator data
    PLATFORM_ROUTING = {
        "BR1": "br1.api.riotgames.com",
        "EUN1": "eun1.api.riotgames.com",
        "EUW1": "euw1.api.riotgames.com",
        "JP1": "jp1.api.riotgames.com",
        "KR": "kr.api.riotgames.com",
        "LA1": "la1.api.riotgames.com",
        "LA2": "la2.api.riotgames.com",
        "NA1": "na1.api.riotgames.com",
        "OC1": "oc1.api.riotgames.com",
        "TR1": "tr1.api.riotgames.com",
        "RU": "ru.api.riotgames.com",
        "PH2": "ph2.api.riotgames.com",
        "SG2": "sg2.api.riotgames.com",
        "TH2": "th2.api.riotgames.com",
        "TW2": "tw2.api.riotgames.com",
        "VN2": "vn2.api.riotgames.com",
    }

    # Rate limiting settings
    RATE_LIMIT_DELAY = 1.2  # Seconds between requests to avoid rate limiting
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        region: str = "EUROPE",
        platform: str = "EUW1",
        use_global_cache: bool = True
    ):
        """
        Initialize Riot API client with caching.

        Args:
            api_key: Riot API key. If None, loads from RIOT_API_KEY env variable
            region: Regional routing (AMERICAS, EUROPE, ASIA, SEA)
            platform: Platform routing (NA1, EUW1, KR, etc.)
            use_global_cache: Whether to use global cache service

        Raises:
            ValueError: If API key is not provided and not found in environment
        """
        self.api_key = api_key or os.getenv("RIOT_API_KEY")
        if not self.api_key:
            raise ValueError(
                "RIOT_API_KEY must be provided via parameter or environment variable"
            )

        self.region = region
        self.platform = platform
        self.use_global_cache = use_global_cache
        self.cache = get_cache() if use_global_cache else None
        self.last_request_time = 0

    @property
    def headers(self) -> Dict[str, str]:
        """
        Get HTTP headers with API authentication.

        Returns:
            Dictionary containing X-Riot-Token header
        """
        return {"X-Riot-Token": self.api_key}

    def _rate_limit_delay(self):
        """Implement rate limiting delay between requests"""
        if self.last_request_time > 0:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.RATE_LIMIT_DELAY:
                sleep_time = self.RATE_LIMIT_DELAY - elapsed
                logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f}s")
                time.sleep(sleep_time)
        self.last_request_time = time.time()

    def _make_request(self, url: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """
        Make HTTP request with rate limiting and error handling.
        
        Args:
            url: API endpoint URL
            params: Optional query parameters
        
        Returns:
            JSON response or None if request fails
        """
        self._rate_limit_delay()
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.Timeout:
            logger.error(f"Request timeout: {url}")
            return None
        except requests.HTTPError as e:
            if e.response.status_code == 429:
                logger.warning("Rate limit exceeded, backing off...")
                time.sleep(5)  # Back off for 5 seconds
            elif e.response.status_code != 404:
                logger.error(f"HTTP error {e.response.status_code}: {url}")
            raise
        except Exception as e:
            logger.error(f"Request error: {e}")
            return None

    # ==================== Account API ====================

    def get_puuid_by_riot_id(
        self,
        game_name: str,
        tag_line: str,
        use_cache: bool = True
    ) -> Optional[str]:
        """
        Get PUUID from RiotID (game name + tag).

        Args:
            game_name: Player's in-game name
            tag_line: Player's tag (e.g., "NA1", "EUW")
            use_cache: Whether to use cached data

        Returns:
            Player's PUUID or None if not found

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"account:{self.region}:{game_name}#{tag_line}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data.get("puuid")

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
            )
            data = self._make_request(url)
            
            if data and self.cache:
                # Cache the account data
                self.cache.set(cache_key, data, cache_type="account")
                logger.debug(f"Cached: {cache_key}")
            
            return data.get("puuid") if data else None
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise

    def get_account_by_riot_id(
        self,
        game_name: str,
        tag_line: str,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """
        Get full account data by Riot ID (game name + tag).

        Args:
            game_name: Player's in-game name
            tag_line: Player's tag (e.g., "NA1", "EUW")
            use_cache: Whether to use cached data

        Returns:
            JSON response with account data including puuid or None if not found

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"account:{self.region}:{game_name}#{tag_line}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
            )
            data = self._make_request(url)
            
            if data and self.cache:
                # Cache the account data
                self.cache.set(cache_key, data, cache_type="account")
                logger.debug(f"Cached: {cache_key}")
            
            return data
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise

    # ==================== Match API ====================

    def get_matches_by_puuid(
        self,
        puuid: str,
        start: int = 0,
        count: int = 20,
        queue: Optional[int] = None,
        use_cache: bool = True
    ) -> List[str]:
        """
        Get list of match IDs for a player.

        Args:
            puuid: Player's encrypted PUUID
            start: Starting index (for pagination)
            count: Number of matches to return (max 100)
            queue: Queue ID filter (e.g., 420 for Ranked Solo)
            use_cache: Whether to use cached data

        Returns:
            List of match ID strings

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"match_ids:{self.region}:{puuid}:{start}:{count}:{queue}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data

        url = (
            f"https://{self.REGIONAL_ROUTING[self.region]}"
            f"/lol/match/v5/matches/by-puuid/{puuid}/ids"
        )

        params = {"start": start, "count": count}
        if queue:
            params["queue"] = queue

        data = self._make_request(url, params=params)
        
        if data and self.cache:
            # Cache the match IDs list
            self.cache.set(cache_key, data, cache_type="match_ids")
            logger.debug(f"Cached: {cache_key}")
        
        return data if data else []

    def get_match_details(
        self,
        match_id: str,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """
        Get detailed match data by match ID.

        Args:
            match_id: Match identifier (format: REGION_MATCHID)
            use_cache: Whether to use cached data

        Returns:
            Complete match JSON including metadata and info sections or None if not found

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"match_details:{match_id}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/lol/match/v5/matches/{match_id}"
            )
            data = self._make_request(url)
            
            if data and self.cache:
                # Cache match details (they never change)
                self.cache.set(cache_key, data, cache_type="match_details")
                logger.debug(f"Cached: {cache_key}")
            
            return data
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise

    # ==================== Summoner API ====================

    def get_summoner_by_puuid(
        self,
        puuid: str,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """
        Get summoner data by encrypted PUUID.

        Args:
            puuid: Player's encrypted PUUID from account data
            use_cache: Whether to use cached data

        Returns:
            JSON response with summoner data or None if not found

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"summoner:{self.platform}:{puuid}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data

        try:
            url = (
                f"https://{self.PLATFORM_ROUTING[self.platform]}"
                f"/lol/summoner/v4/summoners/by-puuid/{puuid}"
            )
            data = self._make_request(url)
            
            if data and self.cache:
                # Cache summoner data
                self.cache.set(cache_key, data, cache_type="summoner")
                logger.debug(f"Cached: {cache_key}")
            
            return data
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise

    # ==================== League API ====================

    def get_league_entries_by_puuid(
        self,
        puuid: str,
        use_cache: bool = True
    ) -> List[Dict]:
        """
        Get ranked league entries for a summoner by PUUID.

        Args:
            puuid: Player's encrypted PUUID
            use_cache: Whether to use cached data

        Returns:
            List of league entries (one per queue type)

        Raises:
            requests.HTTPError: If API request fails
        """
        cache_key = f"league:{self.platform}:{puuid}"
        
        if use_cache and self.cache:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_data

        try:
            url = (
                f"https://{self.PLATFORM_ROUTING[self.platform]}"
                f"/lol/league/v4/entries/by-puuid/{puuid}"
            )
            data = self._make_request(url)
            
            if data and self.cache:
                # Cache league data
                self.cache.set(cache_key, data, cache_type="league")
                logger.debug(f"Cached: {cache_key}")
            
            return data if data else []
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return []
            raise

    # ==================== Cache Management ====================

    def clear_cache(self):
        """Clear all cached data"""
        if self.cache:
            self.cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if self.cache:
            return self.cache.get_stats()
        return {"message": "Cache not enabled"}
