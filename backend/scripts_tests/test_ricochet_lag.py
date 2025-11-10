"""
Test script specifically for Ricochet#LAG account validation
This tests the exact scenario from the screenshot
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


def test_ricochet_lag():
    """Test the specific account from the screenshot: Ricochet#LAG in LAS"""
    
    print("=" * 60)
    print("Testing: Ricochet#LAG in Latin America South (LAS)")
    print("=" * 60)
    print()
    
    # Check API key
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        print("❌ ERROR: RIOT_API_KEY not set")
        print()
        print("Set it in your .env file:")
        print("  RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        return False
    
    print(f"✓ API Key: {api_key[:15]}...")
    print()
    
    # Test configuration
    game_name = "Ricochet"
    tag_line = "LAG"
    region = "AMERICAS"  # LAS uses AMERICAS regional routing
    platform = "LA2"     # LAS platform code
    
    print("Configuration:")
    print(f"  Game Name: {game_name}")
    print(f"  Tag Line: {tag_line}")
    print(f"  Regional Routing: {region}")
    print(f"  Platform: {platform}")
    print()
    
    try:
        # Initialize client
        print("Initializing Riot API client...")
        client = RiotAPIClient(
            region=region,
            platform=platform,
            use_global_cache=False
        )
        print("✓ Client initialized")
        print()
        
        # Build the URL that will be called
        from urllib.parse import quote
        encoded_name = quote(game_name)
        encoded_tag = quote(tag_line)
        url = f"https://{client.REGIONAL_ROUTING[region]}/riot/account/v1/accounts/by-riot-id/{encoded_name}/{encoded_tag}"
        
        print("API Request:")
        print(f"  URL: {url}")
        print(f"  Headers: X-Riot-Token: {api_key[:15]}...")
        print(f"  Method: GET")
        print()
        print("Note: Riot API accepts authentication via:")
        print("  1. X-Riot-Token header (recommended, used here)")
        print("  2. api_key query parameter (alternative)")
        print()
        
        print("Test manually with curl:")
        print(f"  curl -H 'X-Riot-Token: {api_key}' '{url}'")
        print()
        print("Or with query parameter:")
        print(f"  curl '{url}?api_key={api_key}'")
        print()
        
        # Make the request
        print("Fetching account data...")
        account_data = client.get_account_by_riot_id(
            game_name,
            tag_line,
            use_cache=False
        )
        
        if account_data:
            print("✓ SUCCESS! Account found!")
            print()
            print("Account Details:")
            print(f"  PUUID: {account_data.get('puuid', 'N/A')}")
            print(f"  Game Name: {account_data.get('gameName', 'N/A')}")
            print(f"  Tag Line: {account_data.get('tagLine', 'N/A')}")
            print()
            
            # Try to get summoner data
            print("Fetching summoner data...")
            try:
                summoner_data = client.get_summoner_by_puuid(account_data['puuid'])
                if summoner_data:
                    print("✓ Summoner data found!")
                    print(f"  Summoner Name: {summoner_data.get('name', 'N/A')}")
                    print(f"  Summoner Level: {summoner_data.get('summonerLevel', 'N/A')}")
                    print(f"  Profile Icon ID: {summoner_data.get('profileIconId', 'N/A')}")
                else:
                    print("⚠ Summoner data not found (account might not have played on this server)")
            except Exception as e:
                print(f"⚠ Could not fetch summoner data: {e}")
            
            print()
            print("=" * 60)
            print("✓ VALIDATION SUCCESSFUL")
            print("=" * 60)
            return True
        else:
            print("❌ Account not found")
            print()
            print("Possible reasons:")
            print("  1. Account doesn't exist")
            print("  2. Wrong region (account might be in different region)")
            print("  3. Typo in Riot ID")
            print()
            print("Try searching on op.gg to verify:")
            print(f"  https://www.op.gg/summoners/las/{game_name}-{tag_line}")
            print()
            print("=" * 60)
            print("❌ VALIDATION FAILED")
            print("=" * 60)
            return False
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
        print("Error details:")
        import traceback
        traceback.print_exc()
        print()
        print("=" * 60)
        print("❌ VALIDATION FAILED WITH ERROR")
        print("=" * 60)
        return False


def test_alternative_regions():
    """Test if the account exists in other regions"""
    
    print()
    print("=" * 60)
    print("Searching for Ricochet#LAG in other regions...")
    print("=" * 60)
    print()
    
    regions_to_test = [
        ("AMERICAS", "NA1", "North America"),
        ("AMERICAS", "BR1", "Brazil"),
        ("AMERICAS", "LA1", "Latin America North"),
        ("EUROPE", "EUW1", "Europe West"),
        ("ASIA", "KR", "Korea"),
    ]
    
    for region, platform, name in regions_to_test:
        print(f"Testing {name} ({region}/{platform})...", end=" ")
        try:
            client = RiotAPIClient(region=region, platform=platform, use_global_cache=False)
            account_data = client.get_account_by_riot_id("Ricochet", "LAG", use_cache=False)
            if account_data:
                print(f"✓ FOUND!")
                print(f"  → Account exists in {name}")
                return True
            else:
                print("Not found")
        except Exception as e:
            print(f"Error: {e}")
    
    print()
    print("Account not found in any tested region")
    return False


if __name__ == "__main__":
    # Test the specific account
    success = test_ricochet_lag()
    
    # If not found, try other regions
    if not success:
        test_alternative_regions()
    
    print()
