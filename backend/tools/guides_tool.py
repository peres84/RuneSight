"""
League of Legends Guides Tool

Provides agents with access to LoL strategy guides via simple RAG.
"""

import logging
from typing import Dict, Any
from strands import tool
from services.guides_service import get_guides_service

logger = logging.getLogger(__name__)


@tool
def search_lol_guides(query: str) -> Dict[str, Any]:
    """
    Search League of Legends strategy guides for relevant information.
    
    Use this tool when users ask about:
    - Game fundamentals and mechanics
    - Farming, CS, and wave management
    - Team composition and synergies
    - Drafting and champion selection
    - Micro and macro gameplay
    - Professional strategies and tips
    
    Args:
        query: Search query (e.g., "wave management", "team composition", "farming tips")
        
    Returns:
        Dictionary with relevant guide sections and content
        
    Examples:
        search_lol_guides("How do I improve my CS?")
        search_lol_guides("What is wave management?")
        search_lol_guides("Team composition basics")
    """
    logger.info("🔧 TOOL CALLED: search_lol_guides")
    logger.info(f"   Query: {query}")
    
    try:
        guides_service = get_guides_service()
        
        if not guides_service.config:
            return {
                "success": False,
                "message": "Guides not available. Using general League of Legends knowledge.",
                "results": []
            }
        
        # Search all guides
        results = guides_service.search_guides(query)
        
        if not results:
            logger.info(f"   ❌ No results found for: {query}")
            return {
                "success": True,
                "message": f"No specific guide content found for '{query}'. Using general knowledge.",
                "results": []
            }
        
        # Format results for agent consumption
        formatted_results = []
        for result in results[:5]:  # Limit to top 5 results
            formatted_results.append({
                "guide": result["guide"].replace(".md", "").replace("_", " "),
                "content": result["content"],
                "relevance": "high" if query.lower() in result["content"].lower() else "medium"
            })
        
        logger.info(f"   ✅ Found {len(formatted_results)} results")
        for i, result in enumerate(formatted_results, 1):
            logger.info(f"      {i}. {result['guide']} ({result['relevance']} relevance)")
        
        return {
            "success": True,
            "query": query,
            "results_count": len(formatted_results),
            "results": formatted_results,
            "message": f"Found {len(formatted_results)} relevant sections in LoL guides"
        }
        
    except Exception as e:
        logger.error(f"Error searching guides: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error accessing guides. Using general knowledge.",
            "results": []
        }


@tool
def get_guide_summary() -> Dict[str, Any]:
    """
    Get a summary of available League of Legends strategy guides.
    
    Use this to understand what topics are covered in the guides.
    
    Returns:
        Dictionary with guide information and available topics
    """
    try:
        guides_service = get_guides_service()
        
        if not guides_service.config:
            return {
                "success": False,
                "message": "Guides not available"
            }
        
        summary = guides_service.get_guide_summary()
        
        return {
            "success": True,
            "summary": summary,
            "topics": [
                "Game Fundamentals - Core mechanics and game structure",
                "Farming & Economy - CS, wave management, gold generation",
                "Micro vs Macro - Individual mechanics vs map strategy",
                "Team Composition - Building balanced teams and synergies",
                "Professional Drafting - Pick/ban strategies and meta",
                "Advanced Strategies - Pro-level decision making"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting guide summary: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@tool
def get_specific_guide(guide_name: str) -> Dict[str, Any]:
    """
    Load a specific League of Legends strategy guide by name.
    
    Available guides:
    - "master" or "01" - Complete learning guide overview
    - "fundamentals" or "02" - Core mechanics and game structure
    - "farming" or "03" - CS, wave management, gold generation
    - "micro_macro" or "04" - Individual mechanics vs map strategy
    - "team_comp" or "05" - Building balanced teams
    - "drafting" or "06" - Professional pick/ban strategies
    
    Args:
        guide_name: Name or number of the guide to load
        
    Returns:
        Dictionary with guide content
        
    Examples:
        get_specific_guide("farming")
        get_specific_guide("03")
        get_specific_guide("team_comp")
    """
    try:
        guides_service = get_guides_service()
        
        if not guides_service.config:
            return {
                "success": False,
                "message": "Guides not available"
            }
        
        # Map friendly names to file names
        guide_map = {
            "master": "01_LoL_Master_Guide.md",
            "01": "01_LoL_Master_Guide.md",
            "fundamentals": "02_Game_Fundamentals.md",
            "02": "02_Game_Fundamentals.md",
            "farming": "03_Farming_and_Economy.md",
            "economy": "03_Farming_and_Economy.md",
            "03": "03_Farming_and_Economy.md",
            "micro_macro": "04_Micro_vs_Macro.md",
            "micro": "04_Micro_vs_Macro.md",
            "macro": "04_Micro_vs_Macro.md",
            "04": "04_Micro_vs_Macro.md",
            "team_comp": "05_Team_Composition.md",
            "team": "05_Team_Composition.md",
            "composition": "05_Team_Composition.md",
            "05": "05_Team_Composition.md",
            "drafting": "06_Professional_Drafting.md",
            "draft": "06_Professional_Drafting.md",
            "06": "06_Professional_Drafting.md"
        }
        
        # Get the actual file name
        file_name = guide_map.get(guide_name.lower())
        
        if not file_name:
            return {
                "success": False,
                "message": f"Guide '{guide_name}' not found. Available: master, fundamentals, farming, micro_macro, team_comp, drafting"
            }
        
        # Load the guide
        content = guides_service.load_guide(file_name)
        
        if not content:
            return {
                "success": False,
                "message": f"Could not load guide: {file_name}"
            }
        
        # Return first 2000 characters (to avoid token limits)
        preview = content[:2000] + "..." if len(content) > 2000 else content
        
        return {
            "success": True,
            "guide_name": file_name.replace(".md", "").replace("_", " "),
            "content": preview,
            "full_length": len(content),
            "message": f"Loaded {file_name}"
        }
        
    except Exception as e:
        logger.error(f"Error loading guide: {e}")
        return {
            "success": False,
            "error": str(e)
        }
