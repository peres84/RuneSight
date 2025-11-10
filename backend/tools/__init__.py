"""
Shared tools for RuneSight agents

This module contains reusable tools that can be used across multiple agents.
"""

from tools.user_profile_tool import get_user_profile, get_user_profile_from_cache

# League of Legends guides tools (RAG)
try:
    from tools.guides_tool import (
        search_lol_guides,
        get_guide_summary,
        get_specific_guide
    )
    GUIDES_TOOLS_AVAILABLE = True
except ImportError:
    GUIDES_TOOLS_AVAILABLE = False
    search_lol_guides = None
    get_guide_summary = None
    get_specific_guide = None

# Knowledge base tools (optional - only if KB is configured)
try:
    from tools.kb_tool import (
        knowledge_base_action,
        remember_player_insight,
        recall_player_insights
    )
    KB_TOOLS_AVAILABLE = True
except ImportError:
    KB_TOOLS_AVAILABLE = False
    knowledge_base_action = None
    remember_player_insight = None
    recall_player_insights = None

__all__ = [
    'get_user_profile',
    'get_user_profile_from_cache',
    'search_lol_guides',
    'get_guide_summary',
    'get_specific_guide',
    'GUIDES_TOOLS_AVAILABLE',
    'knowledge_base_action',
    'remember_player_insight',
    'recall_player_insights',
    'KB_TOOLS_AVAILABLE'
]
