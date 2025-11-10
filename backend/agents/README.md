# RuneSight AI Agents System

Complete AI agent system with intelligent orchestration and conversation memory.

## Architecture Overview

```
User Query
    ↓
Agent Orchestrator (Intent Analysis)
    ↓
┌─────────────────────────────────────┐
│  Specialized Agents (Auto-Selected) │
├─────────────────────────────────────┤
│ 1. Performance Analyst              │
│ 2. Champion Expert                  │
│ 3. Team Synergy Specialist          │
│ 4. Comparison Analyst               │
│ 5. Match Summarizer                 │
└─────────────────────────────────────┘
    ↓
Conversation Memory (Last 10 messages)
    ↓
AI Response
```

## Available Agents

### 1. Performance Analyst
**ID:** `performance`  
**Description:** Analyzes individual match performance and identifies improvement areas

**Specialties:**
- KDA Analysis
- Damage Patterns
- Objective Control
- CS and gold efficiency
- Vision score analysis

**Example Queries:**
- "How did I perform in my last game?"
- "What should I improve to climb?"
- "Analyze my recent performance"
- "Why do I keep dying so much?"

**Tools:**
- `get_match_performance` - Single match analysis
- `get_recent_performance_summary` - Multi-match trends
- `analyze_provided_matches` - Fast analysis with cached data
- `get_user_profile` - Complete player statistics
- `get_user_profile_from_cache` - Fast profile from cache

---

### 2. Champion Expert
**ID:** `champion`  
**Description:** Provides champion-specific advice, builds, and matchup analysis

**Specialties:**
- Build Optimization
- Matchup Analysis
- Meta Insights
- Champion pool recommendations
- Rune selections

**Example Queries:**
- "What's the best build for Yasuo?"
- "How do I play Zed into Malzahar?"
- "Should I add Akali to my champion pool?"
- "What champions counter Darius?"

**Tools:**
- `get_champion_performance` - Champion-specific stats
- `get_champion_pool` - Full champion pool analysis
- `get_matchup_history` - Historical matchup data
- `get_user_profile` - Player context
- `get_user_profile_from_cache` - Fast profile from cache

---

### 3. Team Synergy Specialist
**ID:** `team_synergy`  
**Description:** Evaluates team compositions and player synergies

**Specialties:**
- Draft Analysis
- Team Compositions
- Role Synergy
- Win conditions
- Team fighting strategies

**Example Queries:**
- "Was our team comp good?"
- "How should we have played with this draft?"
- "What roles do I synergize best with?"
- "Analyze our team composition"

**Tools:**
- `analyze_team_composition` - Full team comp analysis
- `analyze_role_synergy` - Role compatibility stats
- `get_user_profile` - Player context
- `get_user_profile_from_cache` - Fast profile from cache

---

### 4. Comparison Analyst
**ID:** `comparison`  
**Description:** Compares performance with friends and other players

**Specialties:**
- Friend Analysis
- Benchmarking
- Duo Synergy
- Head-to-head matchups
- Performance comparisons

**Example Queries:**
- "Compare me with my friend John#NA1"
- "How well do I synergize with Sarah#EUW?"
- "Who's better at CS, me or Mike#KR?"
- "Analyze our duo performance"

**Tools:**
- `compare_players` - Multi-player comparison
- `analyze_duo_synergy` - Duo performance analysis
- `get_head_to_head` - Direct matchup stats
- `get_user_profile` - Player context
- `get_user_profile_from_cache` - Fast profile from cache

---

### 5. Match Summarizer
**ID:** `match_summarizer`  
**Description:** Creates comprehensive match summaries and retrospectives

**Specialties:**
- Game Summaries
- Season Reviews
- Achievement Tracking
- Progress analysis
- Highlight reels

**Example Queries:**
- "Summarize my last game"
- "Give me a season review"
- "What are my best achievements?"
- "How have I improved over time?"

**Tools:**
- `get_match_summary` - Detailed match recap
- `get_season_review` - Long-term analysis
- `get_user_profile` - Player context
- `get_user_profile_from_cache` - Fast profile from cache

---

## Agent Orchestrator

The orchestrator automatically analyzes user queries and routes them to the most appropriate agent.

### How It Works

1. **Intent Analysis**: Analyzes query keywords and patterns
2. **Agent Selection**: Chooses best agent based on confidence scores
3. **Context Injection**: Adds conversation history to query
4. **Response Generation**: Agent processes query with full context
5. **Memory Update**: Stores message in conversation history

### Keyword-Based Routing

The orchestrator uses keyword matching and pattern recognition:

```python
# Performance keywords
"performance", "kda", "improve", "stats", "damage", "cs"

# Champion keywords
"champion", "build", "item", "matchup", "counter"

# Comparison keywords
"compare", "vs", "better than", "friend", "duo"

# Team Synergy keywords
"team", "composition", "draft", "synergy", "role"

# Match Summarizer keywords
"summary", "recap", "review", "season", "achievement"
```

### Confidence Scoring

- **High confidence (>0.7)**: Strong keyword matches, clear intent
- **Medium confidence (0.3-0.7)**: Some matches, reasonable guess
- **Low confidence (<0.3)**: Defaults to Performance Analyst

---

## Conversation Memory

Maintains context from the last **10 messages** per session.

### Features

- **Sliding Window**: Keeps most recent 10 messages
- **Session-Based**: Each user session has independent memory
- **Context Injection**: Automatically adds history to queries
- **Metadata Tracking**: Stores agent used and confidence scores

### Usage

```python
# Memory is automatic - just provide session_id
orchestrator.route_query(
    query="How did I do?",
    session_id="user-123",
    riot_id="Player#NA1"
)

# Get conversation history
history = orchestrator.get_conversation_history("user-123")

# Clear memory
orchestrator.clear_conversation("user-123")
```

---

## API Integration

### Chat Endpoint (Recommended)

```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "How did I perform in my last game?",
  "session_id": "optional-session-id",
  "riot_id": "PlayerName#NA1",
  "match_data": [...],  // Optional cached data
  "force_agent": null   // Optional: force specific agent
}
```

**Response:**
```json
{
  "response": "AI-generated analysis...",
  "session_id": "abc-123",
  "agent_used": "performance",
  "confidence": 0.85,
  "conversation_length": 3,
  "metadata": {...}
}
```

### Direct Agent Endpoints (Legacy)

Still available for specific use cases:
- `POST /api/analysis/performance`
- `POST /api/analysis/champion`
- `POST /api/analysis/compare`

---

## Performance Optimization

### Use Cached Data

Always pass `match_data` from frontend when available:

```javascript
// Frontend: Load matches once
const matches = await loadMatchHistory(riotId);

// Pass to all queries
const response = await fetch('/api/chat/message', {
  method: 'POST',
  body: JSON.stringify({
    message: query,
    riot_id: riotId,
    match_data: matches  // ✅ Avoids API calls!
  })
});
```

### Benefits

- **10x faster** responses (no Riot API calls)
- **No rate limiting** issues
- **Better user experience**
- **Lower AWS costs**

---

## Development

### Adding a New Agent

1. Create agent file in `agents/` directory
2. Implement required methods:
   - `__init__()` - Initialize with tools
   - `custom_query()` - Handle natural language queries
3. Add to orchestrator's `AGENT_KEYWORDS`
4. Update `_get_agent()` method
5. Export in `agents/__init__.py`

### Adding a New Tool

1. Create tool in `tools/` directory
2. Use `@tool` decorator from Strands
3. Add to relevant agent's tool list
4. Document in tool's docstring

---

## Testing

```python
# Test orchestrator routing
from agents.orchestrator import get_orchestrator

orchestrator = get_orchestrator()

# Test intent analysis
agent_type, confidence = orchestrator._analyze_query_intent(
    "How did I perform in my last game?"
)
print(f"Selected: {agent_type} (confidence: {confidence})")

# Test full routing
result = orchestrator.route_query(
    query="Compare me with my friend",
    session_id="test-session",
    riot_id="Test#NA1"
)
print(result["response"])
```

---

## Monitoring

### Agent Usage Stats

Track which agents are used most:
- Check `agent_used` field in responses
- Monitor `confidence` scores
- Analyze conversation lengths

### Memory Management

- Each session uses ~1KB per message
- 10 messages = ~10KB per session
- Memory auto-clears when session ends
- Manual clear available via API

---

## Best Practices

1. **Always provide session_id** for conversation continuity
2. **Pass cached match_data** when available
3. **Use chat endpoint** instead of direct agent calls
4. **Monitor confidence scores** to improve routing
5. **Clear old sessions** to free memory
6. **Let orchestrator choose agent** (don't force unless needed)

---

## Troubleshooting

### Agent Selection Issues

If wrong agent is selected:
- Check query keywords
- Add more specific terms
- Use `force_agent` parameter temporarily
- Report issue to improve routing

### Memory Issues

If context seems lost:
- Verify session_id is consistent
- Check conversation_length in response
- Clear and restart if needed

### Performance Issues

If responses are slow:
- Always pass cached match_data
- Reduce match_count in queries
- Check Riot API rate limits
- Monitor Lambda timeout settings
