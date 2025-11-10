## RuneSight Knowledge Base Integration

AWS Bedrock Knowledge Base integration for storing and retrieving player insights, strategies, and historical context across conversations.

## 🎯 What It Does

The knowledge base allows agents to:
- **Remember player insights** - Weaknesses, strengths, goals, preferences
- **Store champion strategies** - Builds, matchups, tips
- **Save match lessons** - Key learnings from specific games
- **Retrieve context** - Provide personalized recommendations based on history

## 🚀 Quick Start

### 1. Create Knowledge Base

**On Linux/Mac:**
```bash
cd backend/knowledge_base
chmod +x create_kb.sh
./create_kb.sh
```

**On Windows (PowerShell):**
```powershell
cd backend/knowledge_base
.\create_kb.ps1
```

This script will:
- Create S3 bucket for storage
- Set up IAM roles and policies
- Create OpenSearch Serverless collection
- Create Bedrock Knowledge Base
- Save configuration

### 2. Configure Environment

Add to your `.env` file:

```bash
STRANDS_KNOWLEDGE_BASE_ID=your-kb-id-here
KB_MIN_SCORE=0.5
KB_MAX_RESULTS=5
```

### 3. Use in Agents

```python
from tools.kb_tool import (
    remember_player_insight,
    recall_player_insights
)
from strands import Agent

agent = Agent(
    model=model,
    tools=[remember_player_insight, recall_player_insights],
    system_prompt="You are a coach with memory..."
)
```

## 📚 Available Tools

### 1. `knowledge_base_action`

General-purpose tool for storing and retrieving any information.

```python
# Store information
knowledge_base_action(
    action="store",
    content="Player struggles with CS in early game",
    riot_id="Player#NA1",
    category="weakness"
)

# Retrieve information
knowledge_base_action(
    action="retrieve",
    query="Player#NA1 weaknesses"
)
```

### 2. `remember_player_insight`

Specialized tool for storing player insights.

```python
remember_player_insight(
    riot_id="Player#NA1",
    insight_type="weakness",  # weakness, strength, goal, preference
    insight="Tends to overextend without vision"
)
```

### 3. `recall_player_insights`

Retrieve stored insights about a player.

```python
recall_player_insights(
    riot_id="Player#NA1",
    insight_type="weakness"  # Optional filter
)
```

## 🎮 Example Usage

### Interactive Coaching Agent

```bash
cd backend/knowledge_base
python example_kb_agent.py
```

Try these commands:
- "I struggle with CS in early game"
- "What should I focus on to improve?"
- "I want to reach Diamond this season"
- "What do you remember about me?"

### Quick Demo

```bash
python example_kb_agent.py --demo
```

## 🔧 Integration with Existing Agents

### Performance Agent

```python
from tools.kb_tool import remember_player_insight, recall_player_insights

class PerformanceAgent:
    def __init__(self):
        self.agent = Agent(
            model=model,
            tools=[
                get_match_performance,
                remember_player_insight,  # ✅ Add KB tools
                recall_player_insights
            ],
            system_prompt="""...
            
            When you identify consistent weaknesses, use remember_player_insight to store them.
            Before providing advice, use recall_player_insights to check for known issues.
            """
        )
```

### Champion Agent

```python
# Store champion-specific tips
knowledge_base_action(
    action="store",
    content="Yasuo: Always save E dash for escaping ganks",
    category="champion_tip"
)

# Retrieve champion tips
knowledge_base_action(
    action="retrieve",
    query="Yasuo tips"
)
```

## 📊 What to Store

### Player Insights

**Weaknesses:**
- "Struggles with CS in early game"
- "Tends to overextend without vision"
- "Poor objective control"

**Strengths:**
- "Excellent team fighting"
- "Strong map awareness"
- "Good at playing from behind"

**Goals:**
- "Wants to reach Diamond by end of season"
- "Learning to play jungle role"
- "Expanding champion pool"

**Preferences:**
- "Prefers aggressive playstyle"
- "Likes playing assassins"
- "Enjoys split-pushing"

### Champion Strategies

```python
knowledge_base_action(
    action="store",
    content="Yasuo vs Malzahar: Rush QSS, avoid extended trades pre-6",
    category="matchup"
)
```

### Match Lessons

```python
from services.kb_service import get_kb_service

kb = get_kb_service()
kb.store_match_lesson(
    riot_id="Player#NA1",
    match_id="EUW1_123456",
    lesson="Learned to ward deeper when ahead to track enemy jungler"
)
```

## 🎯 Best Practices

### 1. Store Actionable Insights

✅ **Good:**
- "Player struggles with CS under tower - needs to practice last-hitting"
- "Player excels at roaming mid-game - should prioritize this strength"

❌ **Bad:**
- "Player played a game"
- "Match happened"

### 2. Use Consistent Formatting

```python
# Use structured format
f"[{riot_id}] [{category}] {insight}"

# Example
"[Player#NA1] [weakness] Poor CS in early game"
```

### 3. Retrieve Before Storing

```python
# Check existing insights first
existing = recall_player_insights(riot_id, "weakness")

# Then provide context-aware advice
if existing["count"] > 0:
    # Reference previous insights
    pass
```

### 4. Clean Up Old Data

Periodically review and update stored insights as players improve.

## 🔍 Monitoring

### Check KB Status

```python
from services.kb_service import get_kb_service

kb = get_kb_service()
print(f"KB Enabled: {kb.enabled}")
print(f"KB ID: {kb.kb_id}")
```

### Test Storage and Retrieval

```python
# Test store
success = kb.store("Test content")
print(f"Store successful: {success}")

# Test retrieve
results = kb.retrieve("Test")
print(f"Retrieved {len(results)} results")
```

## 📁 File Structure

```
backend/
├── knowledge_base/
│   ├── __init__.py              # Convenience imports
│   ├── README.md                # This file
│   ├── create_kb.sh             # Setup script
│   └── example_kb_agent.py      # Example usage
├── services/
│   └── kb_service.py            # Core KB service
└── tools/
    └── kb_tool.py               # Strands tools (@tool decorators)
```

## 🐛 Troubleshooting

### KB Not Enabled

**Error:** "Knowledge base not enabled"

**Solution:**
```bash
# Check environment variable
echo $STRANDS_KNOWLEDGE_BASE_ID

# If empty, set it
export STRANDS_KNOWLEDGE_BASE_ID=your-kb-id
```

### No Results Retrieved

**Issue:** Queries return empty results

**Solutions:**
1. Lower `KB_MIN_SCORE` threshold
2. Use broader search terms
3. Check if data was actually stored
4. Verify KB ID is correct

### Permission Errors

**Error:** "Access denied" or "Unauthorized"

**Solution:**
- Check IAM role has correct permissions
- Verify Bedrock access is enabled
- Ensure OpenSearch Serverless collection is accessible

## 🚀 Advanced Features

### Custom Metadata

```python
kb.store(
    content="Advanced insight",
    metadata={
        "riot_id": "Player#NA1",
        "category": "advanced",
        "confidence": 0.9,
        "source": "performance_agent",
        "timestamp": "2024-01-15"
    }
)
```

### Filtered Retrieval

```python
# Retrieve with custom parameters
results = kb.retrieve(
    query="Player#NA1",
    min_score=0.7,  # Higher threshold
    max_results=10   # More results
)
```

### Batch Operations

```python
# Store multiple insights
insights = [
    ("weakness", "Poor CS"),
    ("weakness", "Overextends"),
    ("strength", "Good team fighting")
]

for insight_type, content in insights:
    kb.store_player_insight(riot_id, insight_type, content)
```

## 📈 Performance Tips

1. **Cache frequently accessed data** - Don't query KB for every request
2. **Use specific queries** - More specific = better results
3. **Limit result count** - Only retrieve what you need
4. **Batch similar operations** - Reduce API calls

## 🎓 Next Steps

1. ✅ Create knowledge base with `create_kb.sh`
2. ✅ Configure environment variables
3. ✅ Test with example agent
4. ✅ Integrate into existing agents
5. ✅ Start storing player insights
6. ✅ Provide personalized coaching!

## 📞 Support

For issues or questions:
- Check CloudWatch logs for errors
- Verify KB configuration in AWS console
- Test with example agent first
- Review AWS Bedrock Knowledge Base documentation
