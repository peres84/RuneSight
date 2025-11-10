# RuneSight Agent Tools

This directory contains shared tools that can be used across multiple agents.

## User Profile Tool

The `user_profile_tool.py` provides comprehensive user statistics that all agents can access.

### Available Tools

#### `get_user_profile(riot_id: str, match_count: int = 20)`

Fetches complete user profile with statistics from recent matches via Riot API.

**Returns:**
- Summoner level
- Ranked information (Solo/Duo and Flex)
  - Tier, rank, LP
  - Wins, losses, win rate
- Average performance stats
  - KDA (kills/deaths/assists)
  - CS and CS per minute
  - Gold earned
  - Damage dealt
  - Vision score
- Most played champions (top 5)
  - Games played, wins, win rate per champion
- Preferred roles (top 3)
  - Games and percentage per role
- Queue statistics
  - Breakdown by queue type (Ranked, Normal, ARAM)
  - Win rates per queue
- Total playtime (hours)

**Example Usage:**
```python
from tools.user_profile_tool import get_user_profile

profile = get_user_profile("PlayerName#NA1", match_count=20)
print(f"Rank: {profile['ranked_solo']['tier']} {profile['ranked_solo']['rank']}")
print(f"Average KDA: {profile['average_stats']['kda_ratio']}")
print(f"Most played: {profile['most_played_champions'][0]['champion']}")
```

#### `get_user_profile_from_cache(riot_id: str, match_data: List[dict])`

Calculates user profile using cached match data from frontend (no API calls).

This is **much faster** and avoids rate limits since it uses data already loaded in the user's browser.

**Parameters:**
- `riot_id`: Player's RiotID
- `match_data`: List of match objects from frontend localStorage

**Returns:** Same structure as `get_user_profile` but with `"data_source": "frontend_cache"`

**Example Usage:**
```python
from tools.user_profile_tool import get_user_profile_from_cache

# Match data passed from frontend
profile = get_user_profile_from_cache("PlayerName#NA1", cached_matches)
```

### Integration with Agents

All agents now have access to these tools:

- **Performance Agent**: Can show user's overall stats when analyzing specific matches
- **Champion Agent**: Can compare champion-specific performance to overall averages
- **Comparison Agent**: Can use profile data for more detailed player comparisons

### Data Included

The tool focuses on **normal games and ranked games** as requested, filtering out special game modes when analyzing queue statistics.

**Queue Types Tracked:**
- Ranked Solo/Duo (420)
- Ranked Flex (440)
- Normal Draft (400)
- Normal Blind (430)
- ARAM (450)

### Performance Considerations

- Use `get_user_profile_from_cache` when match data is already available from the frontend
- The tool implements rate limiting and caching to avoid Riot API limits
- Default match count is 20, maximum is 100
- Cached data (summoner info, ranked data) is used when available to reduce API calls

---

## Knowledge Base Tools (Optional)

If AWS Bedrock Knowledge Base is configured, additional tools are available for storing and retrieving player insights.

### `knowledge_base_action(action, content, query, riot_id, category)`

General-purpose tool for knowledge base operations.

**Parameters:**
- `action`: "store" or "retrieve"
- `content`: Content to store (for store action)
- `query`: Search query (for retrieve action)
- `riot_id`: Optional player RiotID
- `category`: Optional category (weakness, strength, goal, etc.)

**Example:**
```python
from tools.kb_tool import knowledge_base_action

# Store insight
knowledge_base_action(
    action="store",
    content="Player struggles with CS in early game",
    riot_id="Player#NA1",
    category="weakness"
)

# Retrieve insights
knowledge_base_action(
    action="retrieve",
    query="Player#NA1 weaknesses"
)
```

### `remember_player_insight(riot_id, insight_type, insight)`

Store a specific player insight.

**Parameters:**
- `riot_id`: Player's RiotID
- `insight_type`: "weakness", "strength", "goal", or "preference"
- `insight`: The insight content

**Example:**
```python
from tools.kb_tool import remember_player_insight

remember_player_insight(
    riot_id="Player#NA1",
    insight_type="weakness",
    insight="Tends to overextend without vision in mid-game"
)
```

### `recall_player_insights(riot_id, insight_type)`

Retrieve stored insights about a player.

**Parameters:**
- `riot_id`: Player's RiotID
- `insight_type`: Optional filter by type

**Example:**
```python
from tools.kb_tool import recall_player_insights

insights = recall_player_insights(
    riot_id="Player#NA1",
    insight_type="weakness"
)
```

### Setup Knowledge Base

To enable knowledge base features:

1. Run the setup script:
```bash
cd backend/knowledge_base
./create_kb.sh
```

2. Add to `.env`:
```bash
STRANDS_KNOWLEDGE_BASE_ID=your-kb-id
KB_MIN_SCORE=0.5
KB_MAX_RESULTS=5
```

3. Import and use in agents:
```python
from tools.kb_tool import remember_player_insight, recall_player_insights

agent = Agent(
    model=model,
    tools=[
        get_user_profile,
        remember_player_insight,  # KB tool
        recall_player_insights     # KB tool
    ]
)
```

See `backend/knowledge_base/README.md` for detailed documentation.
