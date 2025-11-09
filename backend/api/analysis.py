"""
Analysis API Endpoints

Provides REST API endpoints for AI-powered match and player analysis.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
import logging

from agents.performance_agent import PerformanceAgent
from agents.champion_agent import ChampionAgent
from agents.comparison_agent import ComparisonAgent

# Initialize router
router = APIRouter()

# Initialize agents (lazy loading to avoid startup issues)
_performance_agent: Optional[PerformanceAgent] = None
_champion_agent: Optional[ChampionAgent] = None
_comparison_agent: Optional[ComparisonAgent] = None


def get_performance_agent() -> PerformanceAgent:
    """Get or create Performance Agent instance"""
    global _performance_agent
    if _performance_agent is None:
        _performance_agent = PerformanceAgent()
    return _performance_agent


def get_champion_agent() -> ChampionAgent:
    """Get or create Champion Agent instance"""
    global _champion_agent
    if _champion_agent is None:
        _champion_agent = ChampionAgent()
    return _champion_agent


def get_comparison_agent() -> ComparisonAgent:
    """Get or create Comparison Agent instance"""
    global _comparison_agent
    if _comparison_agent is None:
        _comparison_agent = ComparisonAgent()
    return _comparison_agent


# ==================== Request/Response Models ====================

class PerformanceAnalysisRequest(BaseModel):
    """Request model for performance analysis"""
    riot_id: str = Field(..., description="RiotID in format 'gameName#tagLine'")
    match_id: Optional[str] = Field(None, description="Specific match ID to analyze")
    match_count: Optional[int] = Field(5, ge=1, le=20, description="Number of recent matches to analyze")
    analysis_type: Literal["match", "recent"] = Field("match", description="Type of analysis to perform")


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    analysis: str = Field(..., description="AI-generated analysis text")
    riot_id: str = Field(..., description="Player's RiotID")
    analysis_type: str = Field(..., description="Type of analysis performed")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")


class CustomQueryRequest(BaseModel):
    """Request model for custom queries"""
    query: str = Field(..., description="Natural language query")
    riot_id: Optional[str] = Field(None, description="Optional RiotID for context")


# ==================== Performance Analysis Endpoints ====================

@router.post(
    "/performance",
    response_model=AnalysisResponse,
    summary="Analyze player performance",
    description="Analyze a player's performance in a specific match or across recent matches"
)
async def analyze_performance(request: PerformanceAnalysisRequest):
    """
    Analyze player performance using AI.
    
    - **match**: Analyze a specific match by providing match_id
    - **recent**: Analyze recent performance trends across multiple matches
    """
    try:
        agent = get_performance_agent()
        
        if request.analysis_type == "match":
            if not request.match_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="match_id is required for match analysis"
                )
            
            analysis = agent.analyze_match(request.riot_id, request.match_id)
            metadata = {
                "match_id": request.match_id,
                "analysis_type": "single_match"
            }
            
        elif request.analysis_type == "recent":
            analysis = agent.analyze_recent_performance(
                request.riot_id,
                request.match_count or 5
            )
            metadata = {
                "match_count": request.match_count or 5,
                "analysis_type": "recent_performance"
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis_type: {request.analysis_type}"
            )
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=request.riot_id,
            analysis_type=request.analysis_type,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in analyze_performance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post(
    "/performance/query",
    response_model=AnalysisResponse,
    summary="Custom performance query",
    description="Ask custom questions about player performance"
)
async def custom_performance_query(request: CustomQueryRequest):
    """
    Handle custom natural language queries about player performance.
    
    Examples:
    - "How did I perform in my last game?"
    - "What should I focus on to improve my CS?"
    - "Analyze my vision score trends"
    """
    try:
        agent = get_performance_agent()
        
        # Add RiotID context to query if provided
        query = request.query
        if request.riot_id:
            query = f"For player {request.riot_id}: {query}"
        
        analysis = agent.custom_query(query)
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=request.riot_id or "N/A",
            analysis_type="custom_query",
            metadata={"query": request.query}
        )
        
    except Exception as e:
        logging.error(f"Error in custom_performance_query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


# ==================== Champion Analysis Endpoints ====================

class ChampionAnalysisRequest(BaseModel):
    """Request model for champion analysis"""
    riot_id: str = Field(..., description="RiotID in format 'gameName#tagLine'")
    champion_name: Optional[str] = Field(None, description="Specific champion to analyze")
    enemy_champion: Optional[str] = Field(None, description="Enemy champion for matchup analysis")
    analysis_type: Literal["champion", "pool", "matchup"] = Field("champion", description="Type of analysis")


@router.post(
    "/champion",
    response_model=AnalysisResponse,
    summary="Analyze champion performance",
    description="Analyze champion-specific performance, champion pool, or matchups"
)
async def analyze_champion(request: ChampionAnalysisRequest):
    """
    Analyze champion performance using AI.
    
    - **champion**: Analyze performance on a specific champion
    - **pool**: Analyze entire champion pool
    - **matchup**: Analyze specific champion matchup
    """
    try:
        agent = get_champion_agent()
        
        if request.analysis_type == "champion":
            if not request.champion_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="champion_name is required for champion analysis"
                )
            
            analysis = agent.analyze_champion_performance(request.riot_id, request.champion_name)
            metadata = {
                "champion": request.champion_name,
                "analysis_type": "champion_performance"
            }
            
        elif request.analysis_type == "pool":
            analysis = agent.analyze_champion_pool(request.riot_id)
            metadata = {
                "analysis_type": "champion_pool"
            }
            
        elif request.analysis_type == "matchup":
            if not request.champion_name or not request.enemy_champion:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="champion_name and enemy_champion are required for matchup analysis"
                )
            
            analysis = agent.analyze_matchup(
                request.riot_id,
                request.champion_name,
                request.enemy_champion
            )
            metadata = {
                "champion": request.champion_name,
                "enemy_champion": request.enemy_champion,
                "analysis_type": "matchup"
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis_type: {request.analysis_type}"
            )
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=request.riot_id,
            analysis_type=request.analysis_type,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in analyze_champion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post(
    "/champion/query",
    response_model=AnalysisResponse,
    summary="Custom champion query",
    description="Ask custom questions about champions"
)
async def custom_champion_query(request: CustomQueryRequest):
    """
    Handle custom natural language queries about champions.
    
    Examples:
    - "What's the best build for Akali?"
    - "How do I play Yasuo into Malzahar?"
    - "Should I add Zed to my champion pool?"
    """
    try:
        agent = get_champion_agent()
        
        # Add RiotID context to query if provided
        query = request.query
        if request.riot_id:
            query = f"For player {request.riot_id}: {query}"
        
        analysis = agent.custom_query(query)
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=request.riot_id or "N/A",
            analysis_type="custom_query",
            metadata={"query": request.query}
        )
        
    except Exception as e:
        logging.error(f"Error in custom_champion_query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


# ==================== Comparison Analysis Endpoints ====================

class ComparisonRequest(BaseModel):
    """Request model for player comparison"""
    riot_ids: List[str] = Field(..., min_items=2, max_items=5, description="List of RiotIDs to compare")
    analysis_type: Literal["compare", "duo", "head_to_head"] = Field("compare", description="Type of comparison")


@router.post(
    "/compare",
    response_model=AnalysisResponse,
    summary="Compare players",
    description="Compare multiple players, analyze duo synergy, or head-to-head matchups"
)
async def compare_players_endpoint(request: ComparisonRequest):
    """
    Compare players using AI.
    
    - **compare**: Compare performance between 2-5 players
    - **duo**: Analyze synergy when two players play together
    - **head_to_head**: Analyze direct matchups between two players
    """
    try:
        agent = get_comparison_agent()
        
        if request.analysis_type == "compare":
            if len(request.riot_ids) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least 2 RiotIDs are required for comparison"
                )
            
            analysis = agent.compare_multiple_players(request.riot_ids)
            metadata = {
                "players": request.riot_ids,
                "analysis_type": "multi_player_comparison"
            }
            
        elif request.analysis_type == "duo":
            if len(request.riot_ids) != 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Exactly 2 RiotIDs are required for duo analysis"
                )
            
            analysis = agent.analyze_duo(request.riot_ids[0], request.riot_ids[1])
            metadata = {
                "player_1": request.riot_ids[0],
                "player_2": request.riot_ids[1],
                "analysis_type": "duo_synergy"
            }
            
        elif request.analysis_type == "head_to_head":
            if len(request.riot_ids) != 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Exactly 2 RiotIDs are required for head-to-head analysis"
                )
            
            analysis = agent.analyze_head_to_head(request.riot_ids[0], request.riot_ids[1])
            metadata = {
                "player_1": request.riot_ids[0],
                "player_2": request.riot_ids[1],
                "analysis_type": "head_to_head"
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis_type: {request.analysis_type}"
            )
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=", ".join(request.riot_ids),
            analysis_type=request.analysis_type,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in compare_players_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(e)}"
        )


@router.post(
    "/compare/query",
    response_model=AnalysisResponse,
    summary="Custom comparison query",
    description="Ask custom questions about player comparisons"
)
async def custom_comparison_query(request: CustomQueryRequest):
    """
    Handle custom natural language queries about player comparisons.
    
    Examples:
    - "Compare me with my friend John#NA1"
    - "How well do I synergize with Sarah#EUW?"
    - "Who's better at CS, me or Mike#KR?"
    """
    try:
        agent = get_comparison_agent()
        
        # Add RiotID context to query if provided
        query = request.query
        if request.riot_id:
            query = f"For player {request.riot_id}: {query}"
        
        analysis = agent.custom_query(query)
        
        return AnalysisResponse(
            analysis=analysis,
            riot_id=request.riot_id or "N/A",
            analysis_type="custom_query",
            metadata={"query": request.query}
        )
        
    except Exception as e:
        logging.error(f"Error in custom_comparison_query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


# ==================== Health Check ====================

@router.get(
    "/health",
    summary="Analysis service health check",
    description="Check if analysis agents are initialized and ready"
)
async def analysis_health():
    """Check health of analysis service"""
    try:
        # Try to get agents (will initialize if needed)
        perf_agent = get_performance_agent()
        champ_agent = get_champion_agent()
        comp_agent = get_comparison_agent()
        
        return {
            "status": "healthy",
            "agents": {
                "performance": "initialized",
                "champion": "initialized",
                "comparison": "initialized"
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "agents": {
                "performance": "unknown",
                "champion": "unknown",
                "comparison": "unknown"
            }
        }
