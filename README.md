# RuneSight

AI-powered League of Legends analytics platform using Strands agents and Amazon Bedrock.

## Overview

RuneSight is a simplified, production-ready League of Legends analytics platform that provides personalized gameplay insights through specialized AI agents. Built with FastAPI backend and React frontend, deployed on AWS Amplify.

**Legal Disclaimer:** RuneSight is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python 3.9+
- **AI**: Strands Agents + Amazon Bedrock (Nova Lite)
- **Deployment**: AWS Amplify
- **External APIs**: Riot Games API + Data Dragon CDN

## Project Structure

```
RuneSight/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── package.json
├── backend/              # FastAPI application
│   ├── api/             # API route handlers
│   ├── agents/          # Strands AI agents
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── utils/           # Utilities
│   ├── main.py          # Application entry point
│   └── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Riot Games API key ([Get one here](https://developer.riotgames.com/))
- AWS account with Bedrock access

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

5. Run the development server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)

```bash
# Riot Games API
RIOT_API_KEY=your_riot_api_key

# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1

# Bedrock Model
BEDROCK_MODEL_ID=eu.amazon.nova-lite-v1:0

# Application
ENVIRONMENT=development
PORT=8000
```

## API Endpoints

### Health Check

- `GET /` - Root health check
- `GET /api/health` - Detailed health status

### Riot API (Coming in Task 2)

- `POST /api/riot/validate` - Validate RiotID
- `GET /api/riot/matches/{riotId}` - Get match history
- `GET /api/riot/match/{matchId}` - Get match details

### Analysis (Coming in Task 3)

- `POST /api/analysis/performance` - Performance analysis
- `POST /api/analysis/champion` - Champion advice
- `POST /api/analysis/compare` - Player comparison

## Development

### Running Tests

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm test
```

### Code Quality

Backend:

```bash
# Format code
black .

# Lint
flake8 .
```

Frontend:

```bash
# Lint
npm run lint

# Format
npm run format
```

## Deployment

### AWS Amplify Deployment (AWS CLI)

Deploy to AWS Amplify in ~5 minutes using the deployment script:

**Windows**:
```powershell
.\deploy.ps1
```

**Linux/Mac**:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Check your AWS credentials
- Prompt for Riot API key and GitHub token
- Create/update Amplify app
- Deploy and give you the URL

See **[DEPLOY-README.md](DEPLOY-README.md)** for details.

### Prerequisites

- AWS CLI installed and configured (`aws configure`)
- GitHub Personal Access Token (repo access)
- Riot API key from [developer.riotgames.com](https://developer.riotgames.com/)
- Bedrock model access enabled in AWS Console

## Features

- **Multi-Agent AI System**: Specialized agents for different analysis types
- **Real-time Analysis**: Fast insights powered by Amazon Bedrock
- **Simple Authentication**: RiotID-based user identification
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Theme support with proper contrast

## Contributing

This is a hackathon project. Contributions are welcome!

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Riot Games for the League of Legends API
- AWS for Bedrock and Amplify services
- Strands framework for agent orchestration
