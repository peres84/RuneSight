"""
Pydantic models for Riot API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RiotIDValidationRequest(BaseModel):
    """Request model for RiotID validation"""
    riot_id: str = Field(..., description="RiotID in format 'gameName#tagLine'")
    region: str = Field(default="EUROPE", description="Regional routing")
    platform: str = Field(default="EUW1", description="Platform routing")


class RiotIDValidationResponse(BaseModel):
    """Response model for RiotID validation"""
    valid: bool
    puuid: Optional[str] = None
    game_name: Optional[str] = None
    tag_line: Optional[str] = None
    region: Optional[str] = None
    player_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class MatchHistoryResponse(BaseModel):
    """Response model for match history"""
    riot_id: str
    puuid: str
    matches: List[Dict[str, Any]]
    total_matches: int


class MatchDetailsResponse(BaseModel):
    """Response model for match details"""
    match_id: str
    summary: Dict[str, Any]
    participants: List[Dict[str, Any]]
    target_player: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    status_code: int
