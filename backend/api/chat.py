"""
Chat API Endpoints

Provides intelligent chat interface with agent orchestration and conversation memory.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging
import uuid

from agents.orchestrator import get_orchestrator

# Initialize router
router = APIRouter()

logger = logging.getLogger(__name__)


# ==================== Request/Response Models ====================

class ChatRequest(BaseModel):
    """Request model for chat messages"""
    message: str = Field(..., description="User's message/query")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    riot_id: Optional[str] = Field(None, description="Player's RiotID for context")
    match_data: Optional[List[dict]] = Field(None, description="Pre-fetched match data from frontend cache")
    ranked_data: Optional[dict] = Field(None, description="Pre-fetched ranked data from frontend cache")
    user_profile: Optional[dict] = Field(None, description="Pre-fetched user profile (rank, stats, champion pool) from frontend cache")
    force_agent: Optional[str] = Field(None, description="Force specific agent (performance, champion, comparison, team_synergy, match_summarizer)")


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str = Field(..., description="AI assistant's response")
    session_id: str = Field(..., description="Session ID for this conversation")
    agent_used: str = Field(..., description="Which specialized agent handled the query")
    confidence: float = Field(..., description="Confidence score for agent selection (0-1)")
    conversation_length: int = Field(..., description="Number of messages in conversation history")
    metadata: Dict = Field(default_factory=dict, description="Additional metadata")


class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history"""
    session_id: str
    messages: List[Dict]
    total_messages: int


class AgentInfoResponse(BaseModel):
    """Response model for agent information"""
    available_agents: List[Dict]
    conversation_memory: Dict


# ==================== Chat Endpoints ====================

@router.post(
    "/message",
    response_model=ChatResponse,
    summary="Send chat message",
    description="Send a message to the AI assistant. The orchestrator will automatically route to the best agent."
)
async def send_message(request: ChatRequest):
    """
    Send a chat message to the AI assistant.
    
    The orchestrator analyzes your query and routes it to the most appropriate specialized agent:
    - **Performance Analyst**: For match performance and improvement analysis
    - **Champion Expert**: For champion builds, matchups, and advice
    - **Team Synergy Specialist**: For team composition and draft analysis
    - **Comparison Analyst**: For comparing players and duo synergy
    - **Match Summarizer**: For game summaries and season reviews
    
    Conversation memory keeps track of the last 10 messages for context.
    
    **Tips:**
    - Provide `session_id` to maintain conversation context across requests
    - Include `match_data` from frontend cache for faster responses
    - Use `force_agent` to override automatic agent selection if needed
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get orchestrator
        orchestrator = get_orchestrator()
        
        # Route query to appropriate agent
        result = orchestrator.route_query(
            query=request.message,
            session_id=session_id,
            riot_id=request.riot_id,
            match_data=request.match_data,
            ranked_data=request.ranked_data,
            user_profile=request.user_profile,
            force_agent=request.force_agent
        )
        
        return ChatResponse(
            response=result["response"],
            session_id=result["session_id"],
            agent_used=result["agent_used"],
            confidence=result["confidence"],
            conversation_length=result["conversation_length"],
            metadata={
                "riot_id": request.riot_id,
                "used_cached_data": request.match_data is not None,
                "matches_provided": len(request.match_data) if request.match_data else 0
            }
        )
        
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )


@router.get(
    "/history/{session_id}",
    response_model=ConversationHistoryResponse,
    summary="Get conversation history",
    description="Retrieve conversation history for a session"
)
async def get_conversation_history(session_id: str):
    """
    Get conversation history for a specific session.
    
    Returns the last 10 messages (or fewer if conversation is shorter).
    """
    try:
        orchestrator = get_orchestrator()
        messages = orchestrator.get_conversation_history(session_id)
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            total_messages=len(messages)
        )
        
    except Exception as e:
        logger.error(f"Error in get_conversation_history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )


@router.delete(
    "/history/{session_id}",
    summary="Clear conversation history",
    description="Clear conversation history for a session"
)
async def clear_conversation_history(session_id: str):
    """
    Clear conversation history for a specific session.
    
    This removes all messages from memory for the given session.
    """
    try:
        orchestrator = get_orchestrator()
        orchestrator.clear_conversation(session_id)
        
        return {
            "status": "success",
            "message": f"Conversation history cleared for session {session_id}"
        }
        
    except Exception as e:
        logger.error(f"Error in clear_conversation_history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear history: {str(e)}"
        )


@router.get(
    "/agents",
    response_model=AgentInfoResponse,
    summary="Get agent information",
    description="Get information about available AI agents and their specialties"
)
async def get_agents_info():
    """
    Get information about all available AI agents.
    
    Returns details about each specialized agent including:
    - Agent name and description
    - Areas of expertise
    - When to use each agent
    """
    try:
        orchestrator = get_orchestrator()
        info = orchestrator.get_agent_info()
        
        return AgentInfoResponse(**info)
        
    except Exception as e:
        logger.error(f"Error in get_agents_info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent info: {str(e)}"
        )


@router.get(
    "/health",
    summary="Chat service health check",
    description="Check if chat service and orchestrator are ready"
)
async def chat_health():
    """Check health of chat service"""
    try:
        orchestrator = get_orchestrator()
        agent_info = orchestrator.get_agent_info()
        
        return {
            "status": "healthy",
            "orchestrator": "initialized",
            "available_agents": len(agent_info["available_agents"]),
            "conversation_memory": "enabled"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e)
        }
