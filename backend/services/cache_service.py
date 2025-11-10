"""
Enhanced Cache Service with TTL and Statistics
Provides in-memory caching with automatic expiration and performance monitoring
"""

import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class CacheEntry:
    """Cache entry with TTL and access tracking"""
    def __init__(self, data: Any, ttl_seconds: int):
        self.data = data
        self.created_at = datetime.now()
        self.expires_at = self.created_at + timedelta(seconds=ttl_seconds)
        self.access_count = 0
        self.last_accessed = self.created_at
    
    def is_expired(self) -> bool:
        """Check if cache entry has expired"""
        return datetime.now() > self.expires_at
    
    def access(self) -> Any:
        """Record access and return data"""
        self.access_count += 1
        self.last_accessed = datetime.now()
        return self.data


class CacheService:
    """
    Enhanced in-memory cache service with TTL, statistics, and automatic cleanup.
    
    Features:
    - Automatic expiration based on TTL
    - Access statistics and hit/miss tracking
    - Periodic cleanup of expired entries
    - Cache size limits with LRU eviction
    """
    
    # Default TTL values (in seconds)
    DEFAULT_TTL = {
        "account": 86400,      # 24 hours - account data rarely changes
        "summoner": 3600,      # 1 hour - summoner data changes occasionally
        "match_ids": 300,      # 5 minutes - match list updates frequently
        "match_details": 3600, # 1 hour - match details never change
        "league": 1800,        # 30 minutes - rank changes moderately
        "analysis": 1800,      # 30 minutes - AI analysis can be cached
        "default": 600,        # 10 minutes - default for unknown types
    }
    
    def __init__(self, max_size: int = 1000):
        """
        Initialize cache service.
        
        Args:
            max_size: Maximum number of cache entries before LRU eviction
        """
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "expirations": 0,
        }
        self.last_cleanup = datetime.now()
        logger.info(f"Cache service initialized with max_size={max_size}")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get data from cache if not expired.
        
        Args:
            key: Cache key
        
        Returns:
            Cached data or None if not found/expired
        """
        if key in self.cache:
            entry = self.cache[key]
            if not entry.is_expired():
                self.stats["hits"] += 1
                return entry.access()
            else:
                # Remove expired entry
                del self.cache[key]
                self.stats["expirations"] += 1
        
        self.stats["misses"] += 1
        return None
    
    def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None, cache_type: str = "default"):
        """
        Store data in cache with TTL.
        
        Args:
            key: Cache key
            data: Data to cache
            ttl_seconds: Time to live in seconds (uses default if None)
            cache_type: Type of cache entry for default TTL lookup
        """
        # Determine TTL
        if ttl_seconds is None:
            ttl_seconds = self.DEFAULT_TTL.get(cache_type, self.DEFAULT_TTL["default"])
        
        # Check if we need to evict entries
        if len(self.cache) >= self.max_size:
            self._evict_lru()
        
        # Store entry
        self.cache[key] = CacheEntry(data, ttl_seconds)
        
        # Periodic cleanup
        self._periodic_cleanup()
    
    def delete(self, key: str) -> bool:
        """
        Delete a specific cache entry.
        
        Args:
            key: Cache key to delete
        
        Returns:
            True if entry was deleted, False if not found
        """
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def _evict_lru(self):
        """Evict least recently used entry"""
        if not self.cache:
            return
        
        # Find LRU entry
        lru_key = min(
            self.cache.keys(),
            key=lambda k: self.cache[k].last_accessed
        )
        
        del self.cache[lru_key]
        self.stats["evictions"] += 1
        logger.debug(f"Evicted LRU entry: {lru_key}")
    
    def _periodic_cleanup(self):
        """Clean up expired entries periodically"""
        now = datetime.now()
        
        # Only cleanup every 5 minutes
        if (now - self.last_cleanup).total_seconds() < 300:
            return
        
        expired_keys = [
            key for key, entry in self.cache.items()
            if entry.is_expired()
        ]
        
        for key in expired_keys:
            del self.cache[key]
            self.stats["expirations"] += 1
        
        self.last_cleanup = now
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        # Calculate cache size by type
        type_counts = defaultdict(int)
        for key in self.cache.keys():
            cache_type = key.split(":")[0] if ":" in key else "unknown"
            type_counts[cache_type] += 1
        
        return {
            "total_entries": len(self.cache),
            "max_size": self.max_size,
            "utilization_percent": round((len(self.cache) / self.max_size) * 100, 2),
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate_percent": round(hit_rate, 2),
            "evictions": self.stats["evictions"],
            "expirations": self.stats["expirations"],
            "entries_by_type": dict(type_counts),
            "last_cleanup": self.last_cleanup.isoformat(),
        }
    
    def get_keys_by_pattern(self, pattern: str) -> List[str]:
        """
        Get all cache keys matching a pattern.
        
        Args:
            pattern: Pattern to match (simple substring match)
        
        Returns:
            List of matching keys
        """
        return [key for key in self.cache.keys() if pattern in key]
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all cache entries matching a pattern.
        
        Args:
            pattern: Pattern to match (simple substring match)
        
        Returns:
            Number of entries invalidated
        """
        keys_to_delete = self.get_keys_by_pattern(pattern)
        for key in keys_to_delete:
            del self.cache[key]
        
        if keys_to_delete:
            logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching '{pattern}'")
        
        return len(keys_to_delete)


# Global cache instance
_cache_instance: Optional[CacheService] = None


def get_cache() -> CacheService:
    """
    Get global cache instance (singleton pattern).
    
    Returns:
        Global CacheService instance
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService(max_size=1000)
    return _cache_instance


def clear_cache():
    """Clear the global cache"""
    cache = get_cache()
    cache.clear()
