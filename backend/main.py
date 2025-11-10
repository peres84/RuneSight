"""
RuneSight 2.0 - FastAPI Backend
Main application entry point with CORS middleware and route configuration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Replaces deprecated @app.on_event decorators.
    """
    # Startup
    from agents.base_agent import initialize_bedrock_session
    try:
        initialize_bedrock_session()
        logging.info("✅ Application startup complete - Bedrock ready")
    except Exception as e:
        logging.error(f"❌ Failed to initialize Bedrock: {e}")
        # Don't fail startup - allow app to run without AI features
        logging.warning("⚠️ Application running without AI capabilities")
    
    yield
    
    # Shutdown (if needed)
    logging.info("Application shutting down...")


# Initialize FastAPI application with lifespan
app = FastAPI(
    title="RuneSight API",
    version="2.0",
    description="AI-powered League of Legends analytics platform",
    lifespan=lifespan
)

# CORS configuration for Amplify frontend
# Get allowed origins from environment variable or use default
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://main.d2nnbamo017p3o.amplifyapp.com,http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "status": "healthy",
        "service": "RuneSight API",
        "version": "2.0"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Import and include routers
from api import riot, analysis, chat

app.include_router(riot.router, prefix="/api/riot", tags=["riot"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
