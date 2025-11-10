"""
RiotID Utilities

Helper functions for parsing and extracting RiotIDs from text.
"""

import re
from typing import List, Optional, Tuple


def extract_riot_ids(text: str) -> List[str]:
    """
    Extract all RiotIDs from text using regex pattern.

    RiotID format: gameName#tagLine
    - gameName: 3-16 characters (letters, numbers, spaces)
    - tagLine: 3-5 characters (letters, numbers)

    Args:
        text: Text containing potential RiotIDs

    Returns:
        List of RiotIDs found in the text

    Examples:
        >>> extract_riot_ids("Compare Faker#T1 with Ricochet#LAG")
        ['Faker#T1', 'Ricochet#LAG']
        >>> extract_riot_ids("How is Feniax#skye doing?")
        ['Feniax#skye']
    """
    # RiotID pattern: word chars (including spaces) + # + word chars
    # gameName can be 3-16 chars, tagLine 3-5 chars
    pattern = r'\b([A-Za-z0-9 ]{3,16})#([A-Za-z0-9]{2,5})\b'

    matches = re.findall(pattern, text)
    riot_ids = [f"{game_name.strip()}#{tag_line}" for game_name, tag_line in matches]

    return riot_ids


def parse_riot_id(riot_id: str) -> Optional[Tuple[str, str]]:
    """
    Parse a RiotID into game name and tag line components.

    Args:
        riot_id: RiotID string in format 'gameName#tagLine'

    Returns:
        Tuple of (game_name, tag_line) or None if invalid

    Examples:
        >>> parse_riot_id("Faker#T1")
        ('Faker', 'T1')
        >>> parse_riot_id("invalid")
        None
    """
    if '#' not in riot_id:
        return None

    parts = riot_id.split('#', 1)
    if len(parts) != 2:
        return None

    game_name, tag_line = parts
    game_name = game_name.strip()
    tag_line = tag_line.strip()

    # Validate lengths
    if not (3 <= len(game_name) <= 16) or not (2 <= len(tag_line) <= 5):
        return None

    return game_name, tag_line


def validate_riot_id(riot_id: str) -> bool:
    """
    Validate if a string is a valid RiotID format.

    Args:
        riot_id: RiotID string to validate

    Returns:
        True if valid format, False otherwise

    Examples:
        >>> validate_riot_id("Faker#T1")
        True
        >>> validate_riot_id("invalid")
        False
    """
    return parse_riot_id(riot_id) is not None


def extract_comparison_riot_ids(query: str, current_user: Optional[str] = None) -> List[str]:
    """
    Extract RiotIDs from a comparison query, handling pronouns like "me", "my", "I".

    Args:
        query: User's comparison query
        current_user: Current user's RiotID (for resolving "me", "my", "I")

    Returns:
        List of RiotIDs to compare

    Examples:
        >>> extract_comparison_riot_ids("Compare me with Faker#T1", "Feniax#skye")
        ['Feniax#skye', 'Faker#T1']
        >>> extract_comparison_riot_ids("Compare Faker#T1 with Ricochet#LAG")
        ['Faker#T1', 'Ricochet#LAG']
    """
    riot_ids = extract_riot_ids(query)

    # Check if query contains pronouns suggesting the current user is involved
    pronouns = ['me', 'my', 'i', 'myself']
    query_lower = query.lower()
    has_pronoun = any(pronoun in query_lower.split() for pronoun in pronouns)

    # If there's a pronoun and we have a current user, add them
    if has_pronoun and current_user and current_user not in riot_ids:
        riot_ids.insert(0, current_user)

    return riot_ids
