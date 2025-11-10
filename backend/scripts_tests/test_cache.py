"""
Quick test script for cache service
Run with: python test_cache.py
"""

import time
from services.cache_service import get_cache

def test_cache_basic():
    """Test basic cache operations"""
    print("Testing basic cache operations...")
    cache = get_cache()
    cache.clear()
    
    # Test set and get
    cache.set("test_key", {"data": "test_value"}, cache_type="default")
    result = cache.get("test_key")
    assert result == {"data": "test_value"}, "Cache get failed"
    print("✓ Basic set/get works")
    
    # Test cache hit
    result2 = cache.get("test_key")
    assert result2 == {"data": "test_value"}, "Cache hit failed"
    print("✓ Cache hit works")
    
    # Test cache miss
    result3 = cache.get("nonexistent_key")
    assert result3 is None, "Cache miss should return None"
    print("✓ Cache miss works")
    
    # Test expiration
    cache.set("expire_key", "expire_value", ttl_seconds=1, cache_type="default")
    time.sleep(1.5)
    result4 = cache.get("expire_key")
    assert result4 is None, "Expired entry should return None"
    print("✓ Cache expiration works")
    
    # Test statistics
    stats = cache.get_stats()
    assert "hits" in stats, "Stats should include hits"
    assert "misses" in stats, "Stats should include misses"
    assert stats["hits"] > 0, "Should have cache hits"
    assert stats["misses"] > 0, "Should have cache misses"
    print(f"✓ Cache statistics: {stats['hits']} hits, {stats['misses']} misses, {stats['hit_rate_percent']}% hit rate")
    
    print("\n✅ All cache tests passed!")

def test_cache_types():
    """Test different cache types with appropriate TTLs"""
    print("\nTesting cache types...")
    cache = get_cache()
    cache.clear()
    
    # Test different cache types
    cache.set("account:test", {"puuid": "123"}, cache_type="account")
    cache.set("match:test", {"matchId": "456"}, cache_type="match_details")
    cache.set("league:test", {"tier": "GOLD"}, cache_type="league")
    
    stats = cache.get_stats()
    print(f"✓ Cached {stats['total_entries']} entries")
    print(f"  Entries by type: {stats['entries_by_type']}")
    
    print("\n✅ Cache type tests passed!")

def test_cache_eviction():
    """Test LRU eviction"""
    print("\nTesting cache eviction...")
    from services.cache_service import CacheService
    
    # Create small cache for testing
    small_cache = CacheService(max_size=3)
    
    # Fill cache
    small_cache.set("key1", "value1")
    small_cache.set("key2", "value2")
    small_cache.set("key3", "value3")
    
    assert small_cache.get("key1") is not None, "Key1 should exist"
    
    # Add one more to trigger eviction
    small_cache.set("key4", "value4")
    
    stats = small_cache.get_stats()
    assert stats["total_entries"] == 3, "Should have 3 entries after eviction"
    assert stats["evictions"] > 0, "Should have evictions"
    print(f"✓ LRU eviction works ({stats['evictions']} evictions)")
    
    print("\n✅ Cache eviction tests passed!")

if __name__ == "__main__":
    try:
        test_cache_basic()
        test_cache_types()
        test_cache_eviction()
        print("\n" + "="*50)
        print("🎉 All tests passed successfully!")
        print("="*50)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
