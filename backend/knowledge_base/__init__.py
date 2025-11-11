"""
Knowledge Base Module

Provides knowledge base integration for RuneSight agents to store and retrieve
player insights, strategies, and historical context.

Note: The actual implementation files have been moved:
- kb_service.py -> services/kb_service.py
- kb_tool.py -> tools/kb_tool.py

This module now just provides convenient imports.
"""

from services.kb_service import KnowledgeBaseService, get_kb_service
from tools.kb_tool import (
    knowledge_base_action,
    remember_player_insight,
    recall_player_insights
)

__all__ = [
    'KnowledgeBaseService',
    'get_kb_service',
    'knowledge_base_action',
    'remember_player_insight',
    'recall_player_insights',
]