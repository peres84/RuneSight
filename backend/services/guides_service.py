"""
Guides Service

Loads League of Legends strategy guides from S3 for agent use.
Simpler alternative to Bedrock Knowledge Base.
"""

import os
import json
import logging
import boto3
from typing import Dict, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Configuration
GUIDES_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "../config/guides_storage.json")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "../.cache/guides")


class GuidesService:
    """
    Service for loading and caching League of Legends strategy guides.
    """
    
    def __init__(self):
        """Initialize guides service"""
        self.config = self._load_config()
        self.s3_client = None
        self.cache_enabled = True
        
        if self.config:
            self.bucket_name = self.config.get("bucket_name")
            self.region = self.config.get("region", "eu-central-1")
            self.guides_path = self.config.get("guides_path", "guides/")
            
            # Initialize S3 client
            try:
                self.s3_client = boto3.client('s3', region_name=self.region)
                logger.info(f"Guides service initialized: {self.bucket_name}")
            except Exception as e:
                logger.warning(f"Could not initialize S3 client: {e}")
        else:
            logger.info("Guides service not configured (optional feature)")
    
    def _load_config(self) -> Optional[Dict]:
        """Load guides configuration"""
        try:
            if os.path.exists(GUIDES_CONFIG_PATH):
                with open(GUIDES_CONFIG_PATH, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.debug(f"Could not load guides config: {e}")
        return None
    
    def _get_cache_path(self, guide_name: str) -> str:
        """Get cache file path for a guide"""
        os.makedirs(CACHE_DIR, exist_ok=True)
        return os.path.join(CACHE_DIR, guide_name)
    
    def _load_from_cache(self, guide_name: str) -> Optional[str]:
        """Load guide from local cache"""
        if not self.cache_enabled:
            return None
        
        cache_path = self._get_cache_path(guide_name)
        try:
            if os.path.exists(cache_path):
                with open(cache_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                logger.debug(f"Loaded {guide_name} from cache")
                return content
        except Exception as e:
            logger.debug(f"Cache read failed for {guide_name}: {e}")
        return None
    
    def _save_to_cache(self, guide_name: str, content: str):
        """Save guide to local cache"""
        if not self.cache_enabled:
            return
        
        cache_path = self._get_cache_path(guide_name)
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.debug(f"Cached {guide_name}")
        except Exception as e:
            logger.debug(f"Cache write failed for {guide_name}: {e}")
    
    def load_guide(self, guide_name: str) -> Optional[str]:
        """
        Load a specific guide by name.
        
        Tries in order:
        1. Local cache (fastest)
        2. S3 bucket (production)
        3. Local knowledge_base folder (development fallback)
        
        Args:
            guide_name: Guide filename (e.g., "01_LoL_Master_Guide.md")
            
        Returns:
            Guide content as string, or None if not found
        """
        # Try cache first
        cached = self._load_from_cache(guide_name)
        if cached:
            return cached
        
        # Try S3 if configured
        if self.config and self.s3_client:
            try:
                s3_key = f"{self.guides_path}{guide_name}"
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=s3_key
                )
                content = response['Body'].read().decode('utf-8')
                
                # Cache for next time
                self._save_to_cache(guide_name, content)
                
                logger.info(f"Loaded guide from S3: {guide_name}")
                return content
                
            except Exception as e:
                logger.warning(f"Failed to load from S3: {e}, trying local fallback...")
        
        # Fallback to local knowledge_base folder (for development)
        try:
            local_path = os.path.join(
                os.path.dirname(__file__),
                "../knowledge_base",
                guide_name
            )
            
            if os.path.exists(local_path):
                with open(local_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Cache for next time
                self._save_to_cache(guide_name, content)
                
                logger.info(f"Loaded guide from local file: {guide_name}")
                return content
            else:
                logger.error(f"Guide not found locally: {local_path}")
                
        except Exception as e:
            logger.error(f"Failed to load guide locally: {e}")
        
        return None
    
    def load_all_guides(self) -> Dict[str, str]:
        """
        Load all available guides.
        
        Returns:
            Dictionary mapping guide names to content
        """
        guides = {}
        guide_files = [
            "01_LoL_Master_Guide.md",
            "02_Game_Fundamentals.md",
            "03_Farming_and_Economy.md",
            "04_Micro_vs_Macro.md",
            "05_Team_Composition.md",
            "06_Professional_Drafting.md"
        ]
        
        for guide_file in guide_files:
            content = self.load_guide(guide_file)
            if content:
                guides[guide_file] = content
        
        logger.info(f"Loaded {len(guides)} guides")
        return guides
    
    def search_guides(self, query: str) -> List[Dict[str, str]]:
        """
        Search guides for relevant content.
        
        Args:
            query: Search query
            
        Returns:
            List of relevant guide sections
        """
        results = []
        guides = self.load_all_guides()
        
        query_lower = query.lower()
        
        for guide_name, content in guides.items():
            # Simple keyword search
            if query_lower in content.lower():
                # Find relevant sections
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if query_lower in line.lower():
                        # Get context (5 lines before and after)
                        start = max(0, i - 5)
                        end = min(len(lines), i + 6)
                        context = '\n'.join(lines[start:end])
                        
                        results.append({
                            "guide": guide_name,
                            "content": context,
                            "line": i
                        })
        
        logger.info(f"Found {len(results)} results for query: {query}")
        return results
    
    def get_guide_summary(self) -> str:
        """
        Get a summary of available guides.
        
        Returns:
            Summary text
        """
        if not self.config:
            return "Guides service not configured"
        
        guides = self.load_all_guides()
        
        summary = "Available League of Legends Strategy Guides:\n\n"
        
        guide_descriptions = {
            "01_LoL_Master_Guide.md": "Complete learning guide overview",
            "02_Game_Fundamentals.md": "Core mechanics and game structure",
            "03_Farming_and_Economy.md": "CS, wave management, gold generation",
            "04_Micro_vs_Macro.md": "Individual mechanics vs map strategy",
            "05_Team_Composition.md": "Building balanced teams",
            "06_Professional_Drafting.md": "Pick/ban strategies"
        }
        
        for guide_name in guides.keys():
            desc = guide_descriptions.get(guide_name, "Strategy guide")
            summary += f"- {guide_name}: {desc}\n"
        
        return summary


# Global service instance
_guides_service: Optional[GuidesService] = None


def get_guides_service() -> GuidesService:
    """Get or create the global guides service instance"""
    global _guides_service
    if _guides_service is None:
        _guides_service = GuidesService()
    return _guides_service
