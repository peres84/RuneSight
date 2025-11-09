# RuneSight 2.0 Backend

FastAPI backend for RuneSight League of Legends analytics platform with Strands AI agents.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `RIOT_API_KEY` - Get from https://developer.riotgames.com/
- `AWS_ACCESS_KEY_ID` - AWS credentials for Bedrock
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., eu-central-1)
- `BEDROCK_MODEL_ID` - Bedrock model ID (e.g., eu.amazon.nova-lite-v1:0)

### 3. Run the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 4. Test the Implementation

```bash
# Run manual test script
python test_riot_api.py
```

## API Documentation

Once the server is running, visit:
- **Interactive API docs:** http://localhost:8000/docs
- **Alternative docs:** http://localhost:8000/redoc

## Available Endpoints

### Health Check
- `GET /` - Root health check
- `GET /api/health` - API health check
- `GET /api/riot/health` - Riot API service health check

### Riot API Endpoints

#### Validate RiotID
```bash
POST /api/riot/validate
Content-Type: application/json

{
  "riot_id": "gameName#tagLine",
  "region": "EUROPE",
  "platform": "EUW1"
}
```

#### Get Match History
```bash
GET /api/riot/matches/{riot_id}?region=EUROPE&platform=EUW1&count=20
```

#### Get Match Details
```bash
GET /api/riot/match/{match_id}?region=EUROPE&puuid=optional_puuid
```

## Project Structure

```
backend/
├── api/                    # API route handlers
│   └── riot.py            # Riot API endpoints
├── agents/                # Strands AI agents (coming in task 3)
├── models/                # Pydantic data models
│   └── riot_models.py     # Riot API models
├── services/              # Business logic services
│   ├── riot_api_client.py # Riot API client with caching
│   └── data_processor.py  # Match data processing
├── utils/                 # Utility functions
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
└── .env.example         # Environment variables template
```

## Features

### Riot API Integration
- ✅ RiotID validation
- ✅ Match history retrieval
- ✅ Detailed match data
- ✅ In-memory caching with TTL
- ✅ Rate limiting
- ✅ Error handling

### Data Processing
- ✅ Match data normalization
- ✅ Performance metrics calculation
- ✅ Player statistics extraction
- ✅ Match history formatting

### Caching
- Account data: 24 hours
- Summoner data: 1 hour
- Match IDs: 5 minutes
- Match details: 1 hour

### Rate Limiting
- 20 requests per 60 seconds per client
- Prevents API abuse
- Respects Riot API limits

## Development

### Running Tests
```bash
# Manual test script
python test_riot_api.py

# Unit tests (when available)
pytest
```

### Code Quality
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

## Troubleshooting

### "RIOT_API_KEY not found"
Make sure you've created a `.env` file with your Riot API key.

### "Rate limit exceeded"
Wait 60 seconds before making more requests, or adjust the rate limit in `api/riot.py`.

### "Player not found"
- Check the RiotID format (must be `gameName#tagLine`)
- Verify the region and platform match the player's location
- Ensure the player exists in the specified region

## Next Steps

- [ ] Task 3: Implement Strands AI agents
- [ ] Task 4: Build frontend integration
- [ ] Task 5: Configure AWS Amplify deployment

## Resources

- [Riot Games API Documentation](https://developer.riotgames.com/docs/lol)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Strands Agents Documentation](https://github.com/strands-ai/strands)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
