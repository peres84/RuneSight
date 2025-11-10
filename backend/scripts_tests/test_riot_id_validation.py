"""
Test script for Riot ID validation
Run this to test if your Riot API key and validation logic works correctly
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

from services.riot_api_client import RiotAPIClient


def test_riot_id_validation():
    """Test Riot ID validation with various inputs"""
    
    # Check if API key is set
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        print("❌ ERROR: RIOT_API_KEY environment variable not set")
        print("Please set it in your .env file or export it:")
        print("  export RIOT_API_KEY='your-api-key-here'")
        return False
    
    print(f"✓ API Key found: {api_key[:10]}...")
    print()
    
    # Test cases
    test_cases = [
        {
            "name": "Latin America South - Ricochet#LAG",
            "game_name": "Ricochet",
            "tag_line": "LAG",
            "region": "AMERICAS",
            "platform": "LA2"
        },
        {
            "name": "Europe West - Example",
            "game_name": "Hide on bush",  # Faker's account
            "tag_line": "KR1",
            "region": "ASIA",
            "platform": "KR"
        },
        {
            "name": "Invalid Account",
            "game_name": "ThisAccountDoesNotExist",
            "tag_line": "XXXX",
            "region": "EUROPE",
            "platform": "EUW1"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"Test {i}: {test['name']}")
        print(f"  RiotID: {test['game_name']}#{test['tag_line']}")
        print(f"  Region: {test['region']} / Platform: {test['platform']}")
        
        try:
            # Initialize client
            client = RiotAPIClient(
                region=test['region'],
                platform=test['platform'],
                use_global_cache=False  # Disable cache for testing
            )
            
            # Get account data
            account_data = client.get_account_by_riot_id(
                test['game_name'],
                test['tag_line'],
                use_cache=False
            )
            
            if account_data:
                print(f"  ✓ SUCCESS: Account found!")
                print(f"    PUUID: {account_data.get('puuid', 'N/A')[:20]}...")
                print(f"    Game Name: {account_data.get('gameName', 'N/A')}")
                print(f"    Tag Line: {account_data.get('tagLine', 'N/A')}")
            else:
                print(f"  ⚠ NOT FOUND: Account does not exist or wrong region")
        
        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
        
        print()
    
    return True


def test_region_mapping():
    """Test that all region mappings are correct"""
    print("Testing Region Mappings:")
    print("-" * 50)
    
    regions = {
        "AMERICAS": ["NA1", "BR1", "LA1", "LA2"],
        "EUROPE": ["EUW1", "EUN1", "TR1", "RU"],
        "ASIA": ["KR", "JP1", "OC1"],
        "SEA": ["PH2", "SG2", "TH2", "TW2", "VN2"]
    }
    
    for region, platforms in regions.items():
        print(f"\n{region}:")
        for platform in platforms:
            try:
                client = RiotAPIClient(region=region, platform=platform)
                print(f"  ✓ {platform}: {client.REGIONAL_ROUTING[region]}")
            except Exception as e:
                print(f"  ❌ {platform}: ERROR - {e}")


def test_url_encoding():
    """Test URL encoding for special characters"""
    print("\nTesting URL Encoding:")
    print("-" * 50)
    
    from urllib.parse import quote
    
    test_names = [
        "Simple Name",
        "Name With Spaces",
        "Special#Characters",
        "Ñoño",  # Spanish characters
        "한글",  # Korean characters
    ]
    
    for name in test_names:
        encoded = quote(name)
        print(f"  '{name}' → '{encoded}'")


if __name__ == "__main__":
    print("=" * 50)
    print("Riot ID Validation Test Script")
    print("=" * 50)
    print()
    
    # Test region mapping
    test_region_mapping()
    print()
    
    # Test URL encoding
    test_url_encoding()
    print()
    
    # Test actual validation
    print("=" * 50)
    print("Testing Riot ID Validation")
    print("=" * 50)
    print()
    
    success = test_riot_id_validation()
    
    if success:
        print("=" * 50)
        print("Tests completed!")
        print("=" * 50)
    else:
        print("=" * 50)
        print("Tests failed - check configuration")
        print("=" * 50)
        sys.exit(1)
