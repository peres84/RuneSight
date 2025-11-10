"""Test the new region detection API"""
import sys
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
load_dotenv()

from services.riot_api_client import RiotAPIClient

print("=" * 60)
print("Testing Region Detection API")
print("=" * 60)
print()

# Test with Ricochet#LAG
puuid = 'sKxqm7vlwVZO9XSuTDxjgTYyfEh9OFNvpnTYgntBPiZe0MGthaIqv_8QOA1gTX6aNaMJ7JJfUR8R1w'

print("Testing: Ricochet#LAG")
print(f"PUUID: {puuid[:20]}...")
print()

# Test region detection
client = RiotAPIClient(region='AMERICAS', platform='LA2')
active_region = client.get_active_region_by_puuid(puuid, game='lol', use_cache=False)

if active_region:
    print("✓ Region Detection Successful!")
    print(f"  Game: {active_region.get('game')}")
    print(f"  Region: {active_region.get('region')}")
    print()
    
    # Now get summoner data from the correct platform
    detected_platform = active_region.get('region').upper()
    print(f"Fetching summoner data from {detected_platform}...")
    
    summoner_client = RiotAPIClient(region='AMERICAS', platform=detected_platform)
    summoner = summoner_client.get_summoner_by_puuid(puuid, use_cache=False)
    
    if summoner:
        print("✓ Summoner Data Found!")
        print(f"  Name: {summoner.get('name')}")
        print(f"  Level: {summoner.get('summonerLevel')}")
        print(f"  Profile Icon: {summoner.get('profileIconId')}")
    else:
        print("✗ Summoner data not found")
else:
    print("✗ Region detection failed")

print()
print("=" * 60)
