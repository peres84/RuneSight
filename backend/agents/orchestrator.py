"""
Agent Orchestrator

Intelligent routing system that analyzes user queries and selects the appropriate
specialized agent to handle the request. Also manages conversation memory.
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque
import re

from agents.performance_agent import PerformanceAgent
from agents.champion_agent import ChampionAgent
from agents.comparison_agent import ComparisonAgent
from agents.team_synergy_agent import TeamSynergyAgent
from agents.match_summarizer_agent import MatchSummarizerAgent
from utils.tool_logger import log_agent_execution, log_agent_completion
import time

logger = logging.getLogger(__name__)

# Import knowledge base tools (optional - only if KB is configured)
try:
    from tools.kb_tool import (
        remember_player_insight,
        recall_player_insights
    )
    KB_AVAILABLE = True
    logger.info("Knowledge base tools available")
except ImportError:
    KB_AVAILABLE = False
    remember_player_insight = None
    recall_player_insights = None
    logger.info("Knowledge base tools not available (optional feature)")


class ConversationMemory:
    """
    Manages conversation history with a sliding window of recent messages.
    """
    
    def __init__(self, max_messages: int = 10):
        """
        Initialize conversation memory.
        
        Args:
            max_messages: Maximum number of messages to keep in memory
        """
        self.max_messages = max_messages
        self.messages = deque(maxlen=max_messages)
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """
        Add a message to conversation history.
        
        Args:
            role: Message role ('user' or 'assistant')
            content: Message content
            metadata: Optional metadata about the message
        """
        self.messages.append({
            "role": role,
            "content": content,
            "metadata": metadata or {}
        })
    
    def get_context(self) -> str:
        """
        Get formatted conversation context for agent prompts.
        
        Returns:
            Formatted string with recent conversation history
        """
        if not self.messages:
            return ""
        
        context_parts = ["Recent conversation history:"]
        for msg in self.messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            context_parts.append(f"{role}: {msg['content']}")
        
        return "\n".join(context_parts)
    
    def get_messages(self) -> List[Dict]:
        """Get all messages in memory"""
        return list(self.messages)
    
    def clear(self):
        """Clear conversation history"""
        self.messages.clear()


class AgentOrchestrator:
    """
    Orchestrates agent selection and query routing based on user intent.
    
    Analyzes user queries to determine:
    1. Which specialized agent should handle the query
    2. What tools the agent should use
    3. What context from conversation history is relevant
    """
    
    # Agent type identifiers
    PERFORMANCE_AGENT = "performance"
    CHAMPION_AGENT = "champion"
    COMPARISON_AGENT = "comparison"
    TEAM_SYNERGY_AGENT = "team_synergy"
    MATCH_SUMMARIZER_AGENT = "match_summarizer"
    
    # Keywords for agent routing
    AGENT_KEYWORDS = {
        PERFORMANCE_AGENT: [
            "performance", "kda", "improve", "better", "stats", "damage", "cs", "farm",
            "vision", "ward", "objective", "gold", "died", "death", "kill", "assist",
            "how did i do", "how am i doing", "analyze my", "my performance"
        ],
        CHAMPION_AGENT: [
            "champion", "build", "item", "rune", "matchup", "counter", "play against",
            "champion pool", "main", "one trick", "best champion", "tier list",
            "meta", "op", "strong", "weak", "buff", "nerf"
        ],
        COMPARISON_AGENT: [
            "compare", "vs", "versus", "better than", "worse than", "friend",
            "duo", "synergy", "together", "head to head", "benchmark"
        ],
        TEAM_SYNERGY_AGENT: [
            "team", "composition", "comp", "draft", "synergy", "role", "teammate",
            "team fight", "engage", "peel", "frontline", "backline", "win condition"
        ],
        MATCH_SUMMARIZER_AGENT: [
            "summary", "summarize", "recap", "review", "season", "achievement",
            "highlight", "best game", "worst game", "progress", "improvement over time",
            "how have i been", "overall"
        ]
    }
    
    def __init__(self):
        """Initialize the orchestrator with all agents"""
        self.agents = {}
        self.conversation_memories = {}  # {session_id: ConversationMemory}
        
        logger.info("Initializing Agent Orchestrator...")
    
    def _get_agent(self, agent_type: str):
        """
        Get or create an agent instance (lazy loading).
        
        Args:
            agent_type: Type of agent to get
            
        Returns:
            Agent instance
        """
        if agent_type not in self.agents:
            logger.info(f"Initializing {agent_type} agent...")
            
            if agent_type == self.PERFORMANCE_AGENT:
                self.agents[agent_type] = PerformanceAgent()
            elif agent_type == self.CHAMPION_AGENT:
                self.agents[agent_type] = ChampionAgent()
            elif agent_type == self.COMPARISON_AGENT:
                self.agents[agent_type] = ComparisonAgent()
            elif agent_type == self.TEAM_SYNERGY_AGENT:
                self.agents[agent_type] = TeamSynergyAgent()
            elif agent_type == self.MATCH_SUMMARIZER_AGENT:
                self.agents[agent_type] = MatchSummarizerAgent()
            else:
                raise ValueError(f"Unknown agent type: {agent_type}")
        
        return self.agents[agent_type]
    
    def _get_memory(self, session_id: str) -> ConversationMemory:
        """
        Get or create conversation memory for a session.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            ConversationMemory instance
        """
        if session_id not in self.conversation_memories:
            self.conversation_memories[session_id] = ConversationMemory(max_messages=10)
        
        return self.conversation_memories[session_id]
    
    def _analyze_query_intent(self, query: str) -> Tuple[str, float]:
        """
        Analyze user query to determine which agent should handle it.
        
        Args:
            query: User's natural language query
            
        Returns:
            Tuple of (agent_type, confidence_score)
        """
        query_lower = query.lower()
        
        # Score each agent based on keyword matches
        scores = {agent_type: 0 for agent_type in self.AGENT_KEYWORDS.keys()}
        
        for agent_type, keywords in self.AGENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in query_lower:
                    # Longer keywords get higher weight
                    scores[agent_type] += len(keyword.split())
        
        # Special patterns for better detection
        
        # Comparison patterns - ENHANCED
        if re.search(r'\b(compare|comparison)\b', query_lower):
            scores[self.COMPARISON_AGENT] += 10
        if re.search(r'\b(friend|duo|teammate|partner)\b', query_lower):
            scores[self.COMPARISON_AGENT] += 5
        if re.search(r'\b(me|i|my)\b.*\b(vs|versus|compared to|better than|with)\b.*\b(friend|player|them|him|her)\b', query_lower):
            scores[self.COMPARISON_AGENT] += 8
        if re.search(r'\b(who.*better|who.*worse)\b', query_lower):
            scores[self.COMPARISON_AGENT] += 5
        
        # Champion-specific patterns
        if re.search(r'\b(how to play|how do i play|tips for|guide for)\b', query_lower):
            scores[self.CHAMPION_AGENT] += 3
        
        # Performance patterns
        if re.search(r'\b(last game|recent game|my game|this match)\b', query_lower):
            scores[self.PERFORMANCE_AGENT] += 3
        
        # Summary patterns
        if re.search(r'\b(last \d+ games|recent matches|this season|overall)\b', query_lower):
            scores[self.MATCH_SUMMARIZER_AGENT] += 3
        
        # Team patterns
        if re.search(r'\b(our team|my team|team comp)\b', query_lower):
            scores[self.TEAM_SYNERGY_AGENT] += 3
        
        # Find agent with highest score
        best_agent = max(scores.items(), key=lambda x: x[1])
        agent_type, score = best_agent
        
        # Calculate confidence (normalize score)
        max_possible_score = len(self.AGENT_KEYWORDS[agent_type]) * 3
        confidence = min(score / max(max_possible_score, 1), 1.0)
        
        # Default to performance agent if confidence is too low
        if confidence < 0.1:
            agent_type = self.PERFORMANCE_AGENT
            confidence = 0.5
        
        # Enhanced logging
        logger.info("=" * 60)
        logger.info(f"🎯 AGENT SELECTION")
        logger.info(f"Query: {query[:100]}...")
        logger.info(f"Selected Agent: {agent_type.upper()}")
        logger.info(f"Confidence: {confidence:.2%}")
        logger.info(f"All Scores: {dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))}")
        logger.info("=" * 60)
        
        return agent_type, confidence
    
    def route_query(
        self,
        query: str,
        session_id: str,
        riot_id: Optional[str] = None,
        match_data: Optional[List[dict]] = None,
        ranked_data: Optional[dict] = None,
        user_profile: Optional[dict] = None,
        force_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Route a user query to the appropriate agent.
        
        Args:
            query: User's natural language query
            session_id: Unique session identifier for conversation memory
            riot_id: Optional RiotID for context
            match_data: Optional pre-fetched match data from frontend
            ranked_data: Optional pre-fetched ranked data from frontend
            user_profile: Optional pre-fetched user profile (rank, stats, etc.) from frontend
            force_agent: Optional agent type to force (bypasses intent analysis)
            
        Returns:
            Dictionary containing response and metadata
        """
        try:
            # Get conversation memory
            memory = self._get_memory(session_id)
            
            # Add user message to memory
            memory.add_message("user", query, {"riot_id": riot_id})
            
            # Determine which agent to use
            if force_agent:
                agent_type = force_agent
                confidence = 1.0
            else:
                agent_type, confidence = self._analyze_query_intent(query)
            
            # Get the appropriate agent
            agent = self._get_agent(agent_type)
            
            # Build enhanced query with context
            conversation_context = memory.get_context()
            
            enhanced_query = query
            if conversation_context:
                enhanced_query = f"{conversation_context}\n\nCurrent query: {query}"
            
            if riot_id:
                enhanced_query = f"For player {riot_id}: {enhanced_query}"
            
            # Inform agent about cached data availability
            cache_context = []
            
            if match_data and len(match_data) > 0:
                cache_context.append(f"{len(match_data)} matches in memory")
                logger.info(f"📦 Providing {len(match_data)} cached matches to {agent_type} agent")
            
            if user_profile:
                # Add user profile summary to context
                rank_solo = user_profile.get('ranked_solo', {})
                rank_flex = user_profile.get('ranked_flex', {})
                avg_stats = user_profile.get('average_stats', {})
                
                profile_summary = f"""
USER PROFILE (CACHED):
- Rank Solo/Duo: {rank_solo.get('tier', 'UNRANKED')} {rank_solo.get('rank', '')} ({rank_solo.get('lp', 0)} LP)
- Rank Flex: {rank_flex.get('tier', 'UNRANKED')} {rank_flex.get('rank', '')} ({rank_flex.get('lp', 0)} LP)
- Level: {user_profile.get('summoner_level', 'Unknown')}
- Average KDA: {avg_stats.get('kda_ratio', 'N/A')}
- Average CS: {avg_stats.get('cs', 'N/A')} ({avg_stats.get('cs_per_minute', 'N/A')} CS/min)
- Average Gold: {avg_stats.get('gold', 'N/A')}
- Average Damage: {avg_stats.get('damage', 'N/A')}
- Average Vision Score: {avg_stats.get('vision_score', 'N/A')}
- Most Played: {', '.join([f"{c['champion']} ({c['games']} games)" for c in user_profile.get('most_played_champions', [])[:3]])}
"""
                cache_context.append("user profile with rank and stats")
                logger.info(f"📦 Providing user profile to {agent_type} agent: {rank_solo.get('tier', 'UNRANKED')} {rank_solo.get('rank', '')}")
                enhanced_query = f"{profile_summary}\n{enhanced_query}"
            
            if cache_context:
                cache_msg = f"CACHED DATA AVAILABLE: {', '.join(cache_context)}.\nUse cached data tools (analyze_provided_matches, get_user_profile_from_cache) instead of fetching fresh data.\n\n"
                enhanced_query = cache_msg + enhanced_query
            
            # Route to agent's custom_query method
            log_agent_execution(agent_type, query)
            
            start_time = time.time()
            response = agent.custom_query(enhanced_query, match_data=match_data)
            elapsed = time.time() - start_time
            
            log_agent_completion(agent_type, len(response), elapsed)
            
            # Add assistant response to memory
            memory.add_message("assistant", response, {
                "agent_type": agent_type,
                "confidence": confidence,
                "used_cache": match_data is not None
            })
            
            return {
                "response": response,
                "agent_used": agent_type,
                "confidence": confidence,
                "session_id": session_id,
                "conversation_length": len(memory.get_messages()),
                "used_cache": match_data is not None
            }
            
        except Exception as e:
            logger.error(f"Error in route_query: {e}")
            raise
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of messages in conversation history
        """
        memory = self._get_memory(session_id)
        return memory.get_messages()
    
    def clear_conversation(self, session_id: str):
        """
        Clear conversation history for a session.
        
        Args:
            session_id: Session identifier
        """
        if session_id in self.conversation_memories:
            self.conversation_memories[session_id].clear()
            logger.info(f"Cleared conversation history for session {session_id}")
    
    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get information about available agents.
        
        Returns:
            Dictionary with agent information
        """
        return {
            "available_agents": [
                {
                    "id": self.PERFORMANCE_AGENT,
                    "name": "Performance Analyst",
                    "description": "Analyzes your individual match performance and identifies improvement areas",
                    "specialties": ["KDA Analysis", "Damage Patterns", "Objective Control"]
                },
                {
                    "id": self.CHAMPION_AGENT,
                    "name": "Champion Expert",
                    "description": "Provides champion-specific advice, builds, and matchup analysis",
                    "specialties": ["Build Optimization", "Matchup Analysis", "Meta Insights"]
                },
                {
                    "id": self.TEAM_SYNERGY_AGENT,
                    "name": "Team Synergy Specialist",
                    "description": "Evaluates team compositions and player synergies",
                    "specialties": ["Draft Analysis", "Team Comps", "Role Synergy"]
                },
                {
                    "id": self.COMPARISON_AGENT,
                    "name": "Comparison Analyst",
                    "description": "Compares your performance with friends and other players",
                    "specialties": ["Friend Analysis", "Benchmarking", "Duo Synergy"]
                },
                {
                    "id": self.MATCH_SUMMARIZER_AGENT,
                    "name": "Match Summarizer",
                    "description": "Creates comprehensive match summaries and retrospectives",
                    "specialties": ["Game Summaries", "Season Reviews", "Achievement Tracking"]
                }
            ],
            "conversation_memory": {
                "max_messages": 10,
                "description": "Maintains context from the last 10 messages"
            }
        }


# Global orchestrator instance
_orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator() -> AgentOrchestrator:
    """Get or create the global orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
