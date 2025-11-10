"""Test the validation endpoint to see what it returns"""
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests

sys.path.insert(0, str(Path(__file__).parent.parent))
load_dotenv()

print("=" * 60)
print("Testing Validation Endpoint")
print("=" * 60)
print()

# Test validation endpoint
url = "http://localhost:8000/api/riot/validate"
data = {
    "riot_id": "Ricochet#LAG",
    "region": "AMERICAS",
    "platform": "LA2"
}

print(f"POST {url}")
print(f"Data: {data}")
print()

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print()
    
    if response.status_code == 200:
        result = response.json()
        print("Response:")
        import json
        print(json.dumps(result, indent=2))
        print()
        
        if result.get("valid"):
            print("✓ Validation successful!")
            player_data = result.get("player_data", {})
            print(f"  Summoner Level: {player_data.get('summoner_level', 'NOT FOUND')}")
            print(f"  Summoner Name: {player_data.get('summoner_name', 'NOT FOUND')}")
            print(f"  Platform: {player_data.get('platform', 'NOT FOUND')}")
        else:
            print("✗ Validation failed")
            print(f"  Error: {result.get('error')}")
    else:
        print(f"✗ HTTP Error: {response.status_code}")
        print(response.text)
        
except requests.ConnectionError:
    print("✗ Could not connect to backend")
    print("  Make sure the backend is running on http://localhost:8000")
except Exception as e:
    print(f"✗ Error: {e}")

print()
print("=" * 60)
