"""
Knowledge Base Service

Provides store and retrieve functionality for the RuneSight knowledge base.
Allows agents to remember user preferences, insights, and historical context.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from strands_tools import memory

logger = logging.getLogger(__name__)

# Knowledge Base configuration
KB_ID = os.getenv("STRANDS_KNOWLEDGE_BASE_ID", "")
MIN_SCORE = float(os.getenv("KB_MIN_SCORE", "0.5"))
MAX_RESULTS = int(os.getenv("KB_MAX_RESULTS", "5"))


class KnowledgeBaseService:
    """
    Service for interacting with AWS Bedrock Knowledge Base.
    
    Provides methods to store and retrieve information for agents.
    """
    
    def __init__(self, kb_id: Optional[str] = None):
        """
        Initialize Knowledge Base service.
        
        Args:
            kb_id: Knowledge Base ID (uses env var if not provided)
        """
        self.kb_id = kb_id or KB_ID
        
        if not self.kb_id:
            logger.warning("STRANDS_KNOWLEDGE_BASE_ID not set. Knowledge base features disabled.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info(f"Knowledge Base initialized: {self.kb_id}")
    
    def store(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Store information in the knowledge base.
        
        Args:
            content: Text content to store
            metadata: Optional metadata to attach
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            logger.warning("Knowledge base not enabled")
            return False
        
        try:
            # Add metadata to content if provided
            if metadata:
                content_with_meta = f"{content}\n\nMetadata: {metadata}"
            else:
                content_with_meta = content
            
            result = memory(
                action="store",
                content=content_with_meta
            )
            
            logger.info(f"Stored to KB: {content[:100]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error storing to knowledge base: {e}")
            return False
    
    def retrieve(
        self,
        query: str,
        min_score: Optional[float] = None,
        max_results: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve information from the knowledge base.
        
        Args:
            query: Search query
            min_score: Minimum relevance score (0-1)
            max_results: Maximum number of results
            
        Returns:
            List of retrieved documents with scores
        """
        if not self.enabled:
            logger.warning("Knowledge base not enabled")
            return []
        
        try:
            min_score = min_score or MIN_SCORE
            max_results = max_results or MAX_RESULTS
            
            result = memory(
                action="retrieve",
                query=query,
                min_score=min_score,
                max_results=max_results
            )
            
            logger.info(f"Retrieved from KB: {query[:100]}...")
            
            # Parse result into structured format
            # The memory tool returns results as a string, we'll return it as-is
            # for the agents to process
            return [{"content": str(result), "query": query}]
            
        except Exception as e:
            logger.error(f"Error retrieving from knowledge base: {e}")
            return []
    
    def store_player_insight(
        self,
        riot_id: str,
        insight_type: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Store a player-specific insight.
        
        Args:
            riot_id: Player's RiotID
            insight_type: Type of insight (e.g., 'weakness', 'strength', 'goal')
            content: Insight content
            metadata: Additional metadata
            
        Returns:
            True if successful
        """
        full_metadata = {
            "riot_id": riot_id,
            "insight_type": insight_type,
            **(metadata or {})
        }
        
        formatted_content = f"[{riot_id}] [{insight_type}] {content}"
        
        return self.store(formatted_content, full_metadata)
    
    def retrieve_player_insights(
        self,
        riot_id: str,
        insight_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve insights for a specific player.
        
        Args:
            riot_id: Player's RiotID
            insight_type: Optional filter by insight type
            
        Returns:
            List of player insights
        """
        if insight_type:
            query = f"{riot_id} {insight_type}"
        else:
            query = riot_id
        
        return self.retrieve(query)
    
    def store_champion_tip(
        self,
        champion: str,
        tip_type: str,
        content: str
    ) -> bool:
        """
        Store a champion-specific tip or strategy.
        
        Args:
            champion: Champion name
            tip_type: Type of tip (e.g., 'build', 'matchup', 'combo')
            content: Tip content
            
        Returns:
            True if successful
        """
        metadata = {
            "champion": champion,
            "tip_type": tip_type
        }
        
        formatted_content = f"[{champion}] [{tip_type}] {content}"
        
        return self.store(formatted_content, metadata)
    
    def retrieve_champion_tips(
        self,
        champion: str,
        tip_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve tips for a specific champion.
        
        Args:
            champion: Champion name
            tip_type: Optional filter by tip type
            
        Returns:
            List of champion tips
        """
        if tip_type:
            query = f"{champion} {tip_type}"
        else:
            query = champion
        
        return self.retrieve(query)
    
    def store_match_lesson(
        self,
        riot_id: str,
        match_id: str,
        lesson: str
    ) -> bool:
        """
        Store a lesson learned from a specific match.
        
        Args:
            riot_id: Player's RiotID
            match_id: Match identifier
            lesson: Lesson learned
            
        Returns:
            True if successful
        """
        metadata = {
            "riot_id": riot_id,
            "match_id": match_id,
            "type": "match_lesson"
        }
        
        formatted_content = f"[{riot_id}] Match {match_id}: {lesson}"
        
        return self.store(formatted_content, metadata)
    
    def retrieve_match_lessons(
        self,
        riot_id: str
    ) -> List[Dict[str, Any]]:
        """
        Retrieve match lessons for a player.
        
        Args:
            riot_id: Player's RiotID
            
        Returns:
            List of match lessons
        """
        query = f"{riot_id} match lesson"
        return self.retrieve(query)


# Global service instance
_kb_service: Optional[KnowledgeBaseService] = None


def get_kb_service() -> KnowledgeBaseService:
    """Get or create the global knowledge base service instance"""
    global _kb_service
    if _kb_service is None:
        _kb_service = KnowledgeBaseService()
    return _kb_service
