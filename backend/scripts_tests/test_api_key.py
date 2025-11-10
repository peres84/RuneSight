"""
Test Riot API key validity and authentication methods
"""
import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()


def test_api_key():
    """Test if the Riot API key is valid"""
    
    print("=" * 60)
    print("Riot API Key Validation Test")
    print("=" * 60)
    print()
    
    # Get API key
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        print("❌ ERROR: RIOT_API_KEY not set")
        print()
        print("Set it in your .env file:")
        print("  RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        return False
    
    print(f"✓ API Key found: {api_key[:20]}...")
    print(f"  Length: {len(api_key)} characters")
    print(f"  Format: {'✓ Valid' if api_key.startswith('RGAPI-') else '⚠ Unusual (should start with RGAPI-)'}")
    print()
    
    # Test endpoint - use a simple endpoint that should always work
    test_url = "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Doublelift/NA1"
    
    print("Testing API Key with Known Account:")
    print(f"  Account: Doublelift#NA1 (North America)")
    print(f"  URL: {test_url}")
    print()
    
    # Method 1: Header authentication (recommended)
    print("Method 1: X-Riot-Token Header (Recommended)")
    print("-" * 60)
    try:
        headers = {"X-Riot-Token": api_key}
        response = requests.get(test_url, headers=headers, timeout=10)
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ SUCCESS!")
            print(f"  PUUID: {data.get('puuid', 'N/A')[:20]}...")
            print(f"  Game Name: {data.get('gameName', 'N/A')}")
            print(f"  Tag Line: {data.get('tagLine', 'N/A')}")
            print()
            print("✓ API Key is VALID and working!")
            return True
        elif response.status_code == 403:
            print(f"  ❌ FORBIDDEN - API key is invalid or expired")
            print(f"  Response: {response.text[:200]}")
            print()
            print("Get a new API key from: https://developer.riotgames.com/")
            print("Note: Development keys expire every 24 hours")
            return False
        elif response.status_code == 404:
            print(f"  ⚠ Account not found (but API key works!)")
            print(f"  This means your API key is valid")
            print()
            print("✓ API Key is VALID!")
            return True
        elif response.status_code == 429:
            print(f"  ⚠ Rate limited")
            print(f"  Wait a moment and try again")
            print()
            print("✓ API Key is VALID (but rate limited)")
            return True
        else:
            print(f"  ❌ Unexpected status: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
    
    except requests.Timeout:
        print(f"  ❌ Request timeout")
        print(f"  Check your internet connection")
        return False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


def test_both_methods():
    """Test both authentication methods"""
    
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        return
    
    test_url = "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Doublelift/NA1"
    
    print()
    print("=" * 60)
    print("Comparing Authentication Methods")
    print("=" * 60)
    print()
    
    # Method 1: Header
    print("Method 1: X-Riot-Token Header")
    try:
        headers = {"X-Riot-Token": api_key}
        response = requests.get(test_url, headers=headers, timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print(f"  ✓ Works!")
        elif response.status_code == 404:
            print(f"  ✓ Works (account not found, but auth OK)")
        else:
            print(f"  ❌ Failed: {response.text[:100]}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    print()
    
    # Method 2: Query parameter
    print("Method 2: api_key Query Parameter")
    try:
        response = requests.get(f"{test_url}?api_key={api_key}", timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print(f"  ✓ Works!")
        elif response.status_code == 404:
            print(f"  ✓ Works (account not found, but auth OK)")
        else:
            print(f"  ❌ Failed: {response.text[:100]}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    print()
    print("Note: Both methods are valid. Header method is recommended.")
    print()


def test_all_regions():
    """Test API key against all regional endpoints"""
    
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        return
    
    print()
    print("=" * 60)
    print("Testing All Regional Endpoints")
    print("=" * 60)
    print()
    
    regions = {
        "AMERICAS": "americas.api.riotgames.com",
        "EUROPE": "europe.api.riotgames.com",
        "ASIA": "asia.api.riotgames.com",
        "SEA": "sea.api.riotgames.com"
    }
    
    for region_name, endpoint in regions.items():
        print(f"{region_name}: {endpoint}")
        try:
            # Use a simple test - just check if we can connect
            url = f"https://{endpoint}/riot/account/v1/accounts/by-riot-id/TestPlayer/TEST"
            headers = {"X-Riot-Token": api_key}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code in [200, 404]:
                print(f"  ✓ Accessible (status: {response.status_code})")
            elif response.status_code == 403:
                print(f"  ❌ Forbidden - API key issue")
            else:
                print(f"  ⚠ Status: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:50]}")
    
    print()


if __name__ == "__main__":
    success = test_api_key()
    
    if success:
        test_both_methods()
        test_all_regions()
    
    print("=" * 60)
    if success:
        print("✓ API Key is valid and working!")
    else:
        print("❌ API Key validation failed")
        print()
        print("Troubleshooting:")
        print("  1. Get a new key from: https://developer.riotgames.com/")
        print("  2. Development keys expire every 24 hours")
        print("  3. Make sure key is in .env file: RIOT_API_KEY=RGAPI-...")
        print("  4. Restart your backend after updating .env")
    print("=" * 60)
