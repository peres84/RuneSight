"""Test which platform has summoner data for Ricochet#LAG"""
import sys
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
load_dotenv()

from services.riot_api_client import RiotAPIClient

puuid = 'sKxqm7vlwVZO9XSuTDxjgTYyfEh9OFNvpnTYgntBPiZe0MGthaIqv_8QOA1gTX6aNaMJ7JJfUR8R1w'
platforms = ['LA2', 'LA1', 'NA1', 'BR1']

print("Testing summoner data across AMERICAS platforms:")
print("=" * 60)

for platform in platforms:
    try:
        client = RiotAPIClient(region='AMERICAS', platform=platform)
        summoner = client.get_summoner_by_puuid(puuid, use_cache=False)
        
        if summoner:
            print(f"✓ {platform}: FOUND")
            print(f"  Name: {summoner.get('name')}")
            print(f"  Level: {summoner.get('summonerLevel')}")
        else:
            print(f"✗ {platform}: Not found")
    except Exception as e:
        print(f"✗ {platform}: Error - {e}")

print("=" * 60)
