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


class CacheEntry:
    """Simple cache entry with TTL support"""
    def __init__(self, data: Any, ttl_seconds: int):
        self.data = data
        self.expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
    
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


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

    # Cache TTL settings (in seconds)
    CACHE_TTL = {
        "account": 86400,      # 24 hours - account data rarely changes
        "summoner": 3600,      # 1 hour - summoner data changes occasionally
        "match_ids": 300,      # 5 minutes - match list updates frequently
        "match_details": 3600, # 1 hour - match details never change
        "league": 1800,        # 30 minutes - rank changes moderately
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        region: str = "EUROPE",
        platform: str = "EUW1"
    ):
        """
        Initialize Riot API client with caching.

        Args:
            api_key: Riot API key. If None, loads from RIOT_API_KEY env variable
            region: Regional routing (AMERICAS, EUROPE, ASIA, SEA)
            platform: Platform routing (NA1, EUW1, KR, etc.)

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
        self.cache: Dict[str, CacheEntry] = {}

    @property
    def headers(self) -> Dict[str, str]:
        """
        Get HTTP headers with API authentication.

        Returns:
            Dictionary containing X-Riot-Token header
        """
        return {"X-Riot-Token": self.api_key}

    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get data from cache if not expired"""
        if key in self.cache:
            entry = self.cache[key]
            if not entry.is_expired():
                return entry.data
            else:
                # Remove expired entry
                del self.cache[key]
        return None

    def _set_cache(self, key: str, data: Any, ttl_seconds: int):
        """Store data in cache with TTL"""
        self.cache[key] = CacheEntry(data, ttl_seconds)

    def _clean_expired_cache(self):
        """Remove all expired cache entries"""
        expired_keys = [
            key for key, entry in self.cache.items()
            if entry.is_expired()
        ]
        for key in expired_keys:
            del self.cache[key]

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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data.get("puuid")

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
            )
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Cache the account data
            self._set_cache(cache_key, data, self.CACHE_TTL["account"])
            
            return data.get("puuid")
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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
            )
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Cache the account data
            self._set_cache(cache_key, data, self.CACHE_TTL["account"])
            
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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data

        url = (
            f"https://{self.REGIONAL_ROUTING[self.region]}"
            f"/lol/match/v5/matches/by-puuid/{puuid}/ids"
        )

        params = {"start": start, "count": count}
        if queue:
            params["queue"] = queue

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Cache the match IDs list
        self._set_cache(cache_key, data, self.CACHE_TTL["match_ids"])
        
        return data

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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data

        try:
            url = (
                f"https://{self.REGIONAL_ROUTING[self.region]}"
                f"/lol/match/v5/matches/{match_id}"
            )
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Cache match details (they never change)
            self._set_cache(cache_key, data, self.CACHE_TTL["match_details"])
            
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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data

        try:
            url = (
                f"https://{self.PLATFORM_ROUTING[self.platform]}"
                f"/lol/summoner/v4/summoners/by-puuid/{puuid}"
            )
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Cache summoner data
            self._set_cache(cache_key, data, self.CACHE_TTL["summoner"])
            
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
        
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data

        try:
            url = (
                f"https://{self.PLATFORM_ROUTING[self.platform]}"
                f"/lol/league/v4/entries/by-puuid/{puuid}"
            )
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Cache league data
            self._set_cache(cache_key, data, self.CACHE_TTL.get("league", 1800))
            
            return data
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return []
            raise

    # ==================== Cache Management ====================

    def clear_cache(self):
        """Clear all cached data"""
        self.cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        self._clean_expired_cache()
        return {
            "total_entries": len(self.cache),
            "cache_keys": list(self.cache.keys())
        }
