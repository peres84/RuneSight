# RuneSight 🎮⚔️

> AI-powered League of Legends analytics platform using Strands agents and Amazon Bedrock

[![AWS](https://img.shields.io/badge/AWS-Amplify-orange)](https://aws.amazon.com/amplify/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)

**Legal Disclaimer:** RuneSight is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

---

## 📸 Screenshots

### Homepage
![Homepage](images/homepage.png)
*Clean, gaming-inspired landing page with dark mode support*

### Dashboard
![Dashboard](images/dashboard.png)
*Real-time match analytics with performance metrics*

### Match Analysis
![Match Scores](images/scores_match.png)
*Detailed match breakdown with KDA, CS, and damage statistics*

### AI-Powered Insights
![Weakness Analysis](images/weakness_analyse.png)
*Personalized improvement recommendations from AI agents*

---

## 🚀 Features

### 🤖 Multi-Agent AI System
- **Performance Analysis Agent** - Individual match performance and improvement areas
- **Comparison Agent** - Friend performance analysis and benchmarking
- **Champion Expert Agent** - Champion-specific advice, builds, and matchup analysis
- **Team Synergy Agent** - Team composition and player synergy evaluation
- **Match Summary Agent** - Comprehensive match summaries and retrospectives

### ⚡ Performance Optimizations
- **Progressive Loading** - Dashboard loads in 1-2 seconds with background data fetching
- **Smart Caching** - 80%+ cache hit rate reduces API calls by 50%
- **Instant Tab Switching** - Pre-fetched data for all queue types
- **Rate Limiting** - Intelligent Riot API call management

### 🎨 Modern UI/UX
- **Dark/Light Mode** - Full theme support with proper contrast
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Gaming Aesthetic** - League of Legends inspired design
- **Real-time Updates** - Live match data and statistics

### 🔒 Security & Reliability
- **Error Boundaries** - Graceful error handling and recovery
- **CORS Configuration** - Proper cross-origin resource sharing
- **Retry Logic** - Automatic retry with exponential backoff
- **Loading States** - Clear feedback for all operations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Amplify (Frontend)                   │
│                  React + TypeScript + Vite                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  AWS Lambda (Backend)                        │
│              FastAPI + Python 3.9 + Mangum                   │
└────────┬───────────────────────────────────┬────────────────┘
         │                                   │
         │ Riot API                          │ Bedrock API
         │                                   │
┌────────▼────────────┐           ┌─────────▼──────────────┐
│   Riot Games API    │           │   Amazon Bedrock       │
│   + Data Dragon     │           │   (Claude Sonnet)      │
└─────────────────────┘           └────────────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Query (data fetching)
- Framer Motion (animations)

**Backend:**
- FastAPI (Python web framework)
- Mangum (Lambda adapter)
- Strands Agents (AI orchestration)
- Amazon Bedrock (AI models)
- Boto3 (AWS SDK)

**Deployment:**
- AWS Amplify (frontend hosting)
- AWS Lambda (backend compute)
- AWS Lambda Function URL (API endpoint)
- CloudWatch (logging & monitoring)

---

## 📁 Project Structure

```
RuneSight/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── chat/          # Chat interface
│   │   │   └── layout/        # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useMatchHistory.ts
│   │   │   ├── useProgressiveMatchHistory.ts
│   │   │   └── useRankedInfo.ts
│   │   ├── lib/               # Utilities
│   │   │   ├── api.ts         # API client
│   │   │   ├── errors.ts      # Error handling
│   │   │   └── storage.ts     # Local storage
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── backend/                     # FastAPI application
│   ├── agents/                 # Strands AI agents
│   │   ├── base_agent.py
│   │   ├── performance_agent.py
│   │   ├── champion_agent.py
│   │   └── comparison_agent.py
│   ├── api/                    # API route handlers
│   │   ├── riot.py            # Riot API endpoints
│   │   └── analysis.py        # Analysis endpoints
│   ├── services/               # Business logic
│   │   ├── riot_api_client.py # Riot API client
│   │   ├── cache_service.py   # Caching service
│   │   └── data_processor.py  # Data processing
│   ├── models/                 # Pydantic models
│   ├── utils/                  # Utilities
│   ├── main.py                 # FastAPI app
│   ├── lambda_handler.py       # Lambda entry point
│   └── requirements.txt
│
├── deployment/                  # Deployment documentation
│   ├── 00-README.md            # Deployment overview
│   ├── 01-backend-deployment-guide.md
│   ├── 02-quick-deployment-steps.md
│   ├── 03-amplify-deployment-guide.md
│   ├── deploy-backend-lambda.ps1
│   └── deploy-amplify-frontend.ps1
│
├── images/                      # Screenshots
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **AWS CLI** configured
- **Riot Games API key** ([Get one here](https://developer.riotgames.com/))
- **AWS account** with Bedrock access

### Local Development

#### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
python main.py
```

Backend will be available at `http://localhost:8000`

#### 2. Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 🌐 Deployment

### Quick Deploy to AWS

```powershell
cd deployment
.\deploy-backend-lambda.ps1      # Deploy backend
.\deploy-amplify-frontend.ps1    # Deploy frontend
```

### Detailed Deployment Guides

- **[Backend Deployment](deployment/01-backend-deployment-guide.md)** - Complete Lambda deployment guide
- **[Quick Steps](deployment/02-quick-deployment-steps.md)** - Fast deployment reference
- **[Amplify Deployment](deployment/03-amplify-deployment-guide.md)** - Frontend deployment

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# Riot Games API
RIOT_API_KEY=your_riot_api_key

# AWS Bedrock
BEDROCK_REGION=eu-central-1
BEDROCK_MODEL_ID=your_bedrock_model_arn

# CORS Configuration
ALLOWED_ORIGINS=https://your-amplify-domain.amplifyapp.com

# Application
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO
```

### Frontend Environment Variables

```bash
# API Endpoint
VITE_API_URL=https://your-lambda-url.lambda-url.region.on.aws

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id
```

---

## 📊 API Endpoints

### Health & Status

- `GET /` - Root health check
- `GET /api/health` - Detailed health status
- `GET /api/riot/cache/stats` - Cache statistics

### Riot API Integration

- `POST /api/riot/validate` - Validate RiotID
- `GET /api/riot/matches/{riotId}` - Get match history
- `GET /api/riot/match/{matchId}` - Get match details
- `GET /api/riot/ranked/{riotId}` - Get ranked information

### AI Analysis

- `POST /api/analysis/performance` - Performance analysis
- `POST /api/analysis/champion` - Champion advice
- `POST /api/analysis/compare` - Player comparison

---

## 🧪 Testing

### Backend Tests

```powershell
cd backend
pytest
```

### Frontend Tests

```powershell
cd frontend
npm test
```

### Cache Service Test

```powershell
cd backend
python test_cache.py
```

---

## 📈 Performance Metrics

### Backend Performance

- **Cache Hit Rate**: 80%+
- **API Call Reduction**: 50%+
- **Response Time (cached)**: < 10ms
- **Response Time (uncached)**: 200-500ms

### Frontend Performance

- **Time to First Content**: 1-2 seconds
- **Tab Switch Time**: Instant (0ms)
- **Progressive Loading**: Background data fetching
- **Cache Strategy**: 5-minute TTL with localStorage

---

## 🛠️ Development

### Code Quality

**Backend:**
```powershell
# Format code
black .

# Lint
flake8 .

# Type checking
mypy .
```

**Frontend:**
```powershell
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

---

## 🐛 Troubleshooting

### CORS Errors

See [deployment/01-backend-deployment-guide.md](deployment/01-backend-deployment-guide.md#cors-configuration)

**Quick fix:**
1. Verify Lambda Function URL CORS is disabled
2. Check `ALLOWED_ORIGINS` environment variable
3. Redeploy backend

### Import Errors

Ensure all dependencies are installed:
```powershell
pip install -r requirements.txt
```

### Rate Limiting

The backend implements automatic rate limiting:
- 1.2s delay between Riot API requests
- Exponential backoff on errors
- Cache-first approach

---

## 📚 Documentation

- **[Deployment Guide](deployment/00-README.md)** - Complete deployment documentation
- **[Backend Guide](deployment/01-backend-deployment-guide.md)** - Backend deployment details
- **[Performance Docs](deployment/)** - Performance optimization guides
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when running locally)

---

## 🤝 Contributing

This is a hackathon project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **Riot Games** - For the League of Legends API and Data Dragon
- **AWS** - For Amplify, Lambda, and Bedrock services
- **Strands** - For the AI agents framework
- **shadcn/ui** - For the beautiful UI components
- **Anthropic** - For Claude AI models via Bedrock

---

## 📞 Support

For issues or questions:
1. Check [deployment documentation](deployment/)
2. Review CloudWatch Logs
3. Open an issue on GitHub

---

## 🎯 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Advanced champion statistics
- [ ] Team composition analyzer
- [ ] Match prediction system
- [ ] Mobile app (React Native)
- [ ] Discord bot integration

---

**Built with ❤️ for the League of Legends community**

*RuneSight - See beyond the Rift*
