"""
Knowledge Base Tool for Strands Agents

Provides @tool decorated functions for agents to interact with the knowledge base.
"""

import logging
from typing import Dict, Any, List, Literal
from strands import tool
from services.kb_service import get_kb_service

logger = logging.getLogger(__name__)


@tool
def knowledge_base_action(
    action: Literal["store", "retrieve"],
    content: str = None,
    query: str = None,
    riot_id: str = None,
    category: str = None
) -> Dict[str, Any]:
    """
    Interact with the knowledge base to store or retrieve information.
    
    This tool allows agents to remember user preferences, insights, and context
    across conversations. Use it to:
    - Store player weaknesses, strengths, and goals
    - Remember champion preferences and strategies
    - Save match lessons and insights
    - Retrieve historical context for better recommendations
    
    Args:
        action: Either "store" to save information or "retrieve" to search
        content: Content to store (required for store action)
        query: Search query (required for retrieve action)
        riot_id: Optional player RiotID for context
        category: Optional category (e.g., 'weakness', 'strength', 'goal', 'champion_tip')
        
    Returns:
        Dictionary with action result and any retrieved data
        
    Examples:
        # Store a player weakness
        knowledge_base_action(
            action="store",
            content="Player struggles with CS in early game",
            riot_id="Player#NA1",
            category="weakness"
        )
        
        # Retrieve player insights
        knowledge_base_action(
            action="retrieve",
            query="Player#NA1 weaknesses",
            riot_id="Player#NA1"
        )
        
        # Store a champion tip
        knowledge_base_action(
            action="store",
            content="Yasuo: Always save E dash for escaping ganks",
            category="champion_tip"
        )
    """
    try:
        kb_service = get_kb_service()
        
        if not kb_service.enabled:
            return {
                "success": False,
                "error": "Knowledge base not enabled. Set STRANDS_KNOWLEDGE_BASE_ID environment variable."
            }
        
        if action == "store":
            if not content:
                return {
                    "success": False,
                    "error": "Content is required for store action"
                }
            
            # Build metadata
            metadata = {}
            if riot_id:
                metadata["riot_id"] = riot_id
            if category:
                metadata["category"] = category
            
            # Format content with context
            formatted_content = content
            if riot_id:
                formatted_content = f"[{riot_id}] {content}"
            if category:
                formatted_content = f"[{category}] {formatted_content}"
            
            success = kb_service.store(formatted_content, metadata)
            
            return {
                "success": success,
                "action": "store",
                "message": "Information stored successfully" if success else "Failed to store information"
            }
        
        elif action == "retrieve":
            if not query:
                return {
                    "success": False,
                    "error": "Query is required for retrieve action"
                }
            
            # Enhance query with context
            enhanced_query = query
            if riot_id and riot_id not in query:
                enhanced_query = f"{riot_id} {query}"
            
            results = kb_service.retrieve(enhanced_query)
            
            return {
                "success": True,
                "action": "retrieve",
                "query": query,
                "results": results,
                "count": len(results)
            }
        
        else:
            return {
                "success": False,
                "error": f"Invalid action: {action}. Must be 'store' or 'retrieve'"
            }
    
    except Exception as e:
        logger.error(f"Error in knowledge_base_action: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@tool
def remember_player_insight(
    riot_id: str,
    insight_type: Literal["weakness", "strength", "goal", "preference"],
    insight: str
) -> Dict[str, Any]:
    """
    Remember a specific insight about a player.
    
    Use this to store important observations that should be remembered
    across conversations for personalized coaching.
    
    Args:
        riot_id: Player's RiotID
        insight_type: Type of insight
        insight: The insight content
        
    Returns:
        Dictionary with success status
        
    Examples:
        remember_player_insight(
            riot_id="Player#NA1",
            insight_type="weakness",
            insight="Tends to overextend without vision in mid-game"
        )
        
        remember_player_insight(
            riot_id="Player#NA1",
            insight_type="goal",
            insight="Wants to reach Diamond by end of season"
        )
    """
    try:
        kb_service = get_kb_service()
        
        if not kb_service.enabled:
            return {
                "success": False,
                "error": "Knowledge base not enabled"
            }
        
        success = kb_service.store_player_insight(
            riot_id=riot_id,
            insight_type=insight_type,
            content=insight
        )
        
        return {
            "success": success,
            "message": f"Remembered {insight_type} for {riot_id}" if success else "Failed to store insight"
        }
    
    except Exception as e:
        logger.error(f"Error in remember_player_insight: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@tool
def recall_player_insights(
    riot_id: str,
    insight_type: str = None
) -> Dict[str, Any]:
    """
    Recall previously stored insights about a player.
    
    Use this to retrieve context about a player's weaknesses, strengths,
    goals, or preferences to provide more personalized recommendations.
    
    Args:
        riot_id: Player's RiotID
        insight_type: Optional filter by insight type
        
    Returns:
        Dictionary with retrieved insights
        
    Example:
        recall_player_insights(
            riot_id="Player#NA1",
            insight_type="weakness"
        )
    """
    try:
        kb_service = get_kb_service()
        
        if not kb_service.enabled:
            return {
                "success": False,
                "error": "Knowledge base not enabled",
                "insights": []
            }
        
        insights = kb_service.retrieve_player_insights(riot_id, insight_type)
        
        return {
            "success": True,
            "riot_id": riot_id,
            "insight_type": insight_type,
            "insights": insights,
            "count": len(insights)
        }
    
    except Exception as e:
        logger.error(f"Error in recall_player_insights: {e}")
        return {
            "success": False,
            "error": str(e),
            "insights": []
        }
