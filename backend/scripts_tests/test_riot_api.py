"""
Manual test script for Riot API service layer
Run this to verify the implementation works correctly
"""
import os
from dotenv import load_dotenv
from services.riot_api_client import RiotAPIClient
from services.data_processor import normalize_match_data, format_match_history

# Load environment variables
load_dotenv()

def test_riot_api_client():
    """Test RiotAPIClient basic functionality"""
    print("=" * 60)
    print("Testing RiotAPIClient")
    print("=" * 60)
    
    # Initialize client
    client = RiotAPIClient(region="EUROPE", platform="EUW1")
    print("✓ Client initialized successfully")
    
    # Test 1: Get PUUID by RiotID
    print("\n[Test 1] Getting PUUID by RiotID...")
    test_riot_id = "Faker#T1"  # Famous player
    game_name, tag_line = test_riot_id.split("#")
    
    try:
        puuid = client.get_puuid_by_riot_id(game_name, tag_line)
        if puuid:
            print(f"✓ Found PUUID: {puuid[:20]}...")
        else:
            print("✗ PUUID not found (player might not exist in this region)")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Get match IDs
    print("\n[Test 2] Getting match IDs...")
    try:
        if puuid:
            match_ids = client.get_matches_by_puuid(puuid, count=5)
            print(f"✓ Found {len(match_ids)} matches")
            if match_ids:
                print(f"  First match ID: {match_ids[0]}")
        else:
            print("⊘ Skipped (no PUUID)")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 3: Get match details
    print("\n[Test 3] Getting match details...")
    try:
        if match_ids and len(match_ids) > 0:
            match_data = client.get_match_details(match_ids[0])
            if match_data:
                print(f"✓ Retrieved match details")
                print(f"  Game mode: {match_data['info'].get('gameMode')}")
                print(f"  Duration: {match_data['info'].get('gameDuration')}s")
                print(f"  Participants: {len(match_data['info'].get('participants', []))}")
            else:
                print("✗ Match details not found")
        else:
            print("⊘ Skipped (no match IDs)")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 4: Cache functionality
    print("\n[Test 4] Testing cache...")
    cache_stats = client.get_cache_stats()
    print(f"✓ Cache entries: {cache_stats['total_entries']}")
    
    # Test 5: Data processing
    print("\n[Test 5] Testing data processing...")
    try:
        if match_ids and len(match_ids) > 0 and match_data:
            normalized = normalize_match_data(match_data, puuid)
            print(f"✓ Normalized match data")
            print(f"  Match ID: {normalized['summary']['match_id']}")
            print(f"  Participants: {len(normalized['participants'])}")
            if normalized['target_player']:
                perf = normalized['target_player']['performance']
                print(f"  Target player KDA: {perf['kda']['kills']}/{perf['kda']['deaths']}/{perf['kda']['assists']}")
        else:
            print("⊘ Skipped (no match data)")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)


if __name__ == "__main__":
    # Check if API key is set
    if not os.getenv("RIOT_API_KEY"):
        print("ERROR: RIOT_API_KEY not found in environment variables")
        print("Please create a .env file with your Riot API key")
        exit(1)
    
    test_riot_api_client()
