/**
 * Data Dragon CDN utilities for League of Legends static assets
 * Documentation: https://developer.riotgames.com/docs/lol#data-dragon
 */

// Latest patch version - update this periodically or fetch dynamically
const DDRAGON_VERSION = '14.24.1';
const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn';

/**
 * Get champion square icon URL
 * @param championName - Champion name (e.g., "Ahri", "LeeSin")
 * @returns URL to champion square icon
 */
export const getChampionIconUrl = (championName: string): string => {
  if (!championName) return '';
  return `${DDRAGON_BASE_URL}/${DDRAGON_VERSION}/img/champion/${championName}.png`;
};

/**
 * Get champion loading screen URL
 * @param championName - Champion name
 * @param skinNum - Skin number (default 0 for base skin)
 * @returns URL to champion loading screen
 */
export const getChampionLoadingUrl = (championName: string, skinNum: number = 0): string => {
  if (!championName) return '';
  return `${DDRAGON_BASE_URL}/img/champion/loading/${championName}_${skinNum}.jpg`;
};

/**
 * Get champion splash art URL
 * @param championName - Champion name
 * @param skinNum - Skin number (default 0 for base skin)
 * @returns URL to champion splash art
 */
export const getChampionSplashUrl = (championName: string, skinNum: number = 0): string => {
  if (!championName) return '';
  return `${DDRAGON_BASE_URL}/img/champion/splash/${championName}_${skinNum}.jpg`;
};

/**
 * Get item icon URL
 * @param itemId - Item ID number
 * @returns URL to item icon
 */
export const getItemIconUrl = (itemId: number): string => {
  if (!itemId || itemId === 0) return '';
  return `${DDRAGON_BASE_URL}/${DDRAGON_VERSION}/img/item/${itemId}.png`;
};

/**
 * Get summoner spell icon URL
 * @param spellId - Summoner spell ID
 * @returns URL to summoner spell icon
 */
export const getSummonerSpellIconUrl = (spellId: number): string => {
  if (!spellId) return '';
  
  // Map spell IDs to spell names
  const spellMap: Record<number, string> = {
    1: 'SummonerBoost',      // Cleanse
    3: 'SummonerExhaust',    // Exhaust
    4: 'SummonerFlash',      // Flash
    6: 'SummonerHaste',      // Ghost
    7: 'SummonerHeal',       // Heal
    11: 'SummonerSmite',     // Smite
    12: 'SummonerTeleport',  // Teleport
    13: 'SummonerMana',      // Clarity
    14: 'SummonerDot',       // Ignite
    21: 'SummonerBarrier',   // Barrier
    30: 'SummonerPoroRecall', // To the King!
    31: 'SummonerPoroThrow',  // Poro Toss
    32: 'SummonerSnowball',   // Mark/Dash (ARAM)
    39: 'SummonerSnowURFSnowball_Mark', // URF Snowball
    54: 'Summoner_UltBookPlaceholder', // Placeholder
    55: 'Summoner_UltBookSmitePlaceholder', // Placeholder
  };
  
  const spellName = spellMap[spellId];
  if (!spellName) return '';
  
  return `${DDRAGON_BASE_URL}/${DDRAGON_VERSION}/img/spell/${spellName}.png`;
};

/**
 * Get profile icon URL
 * @param iconId - Profile icon ID
 * @returns URL to profile icon
 */
export const getProfileIconUrl = (iconId: number): string => {
  if (!iconId) return '';
  return `${DDRAGON_BASE_URL}/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`;
};

/**
 * Get rune icon URL
 * @param runeId - Rune/Perk ID
 * @returns URL to rune icon
 */
export const getRuneIconUrl = (runeId: number): string => {
  if (!runeId) return '';
  return `${DDRAGON_BASE_URL}/img/perk-images/Styles/${runeId}.png`;
};

/**
 * Fetch latest Data Dragon version
 * @returns Promise with latest version string
 */
export const fetchLatestVersion = async (): Promise<string> => {
  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await response.json();
    return versions[0]; // Latest version is first
  } catch (error) {
    console.error('Failed to fetch latest Data Dragon version:', error);
    return DDRAGON_VERSION; // Fallback to hardcoded version
  }
};

/**
 * Get queue type name from queue ID
 * @param queueId - Queue ID number
 * @returns Human-readable queue name
 */
export const getQueueName = (queueId: number): string => {
  const queueMap: Record<number, string> = {
    0: 'Custom',
    400: 'Normal Draft',
    420: 'Ranked Solo',
    430: 'Normal Blind',
    440: 'Ranked Flex',
    450: 'ARAM',
    490: 'Normal Quickplay',
    700: 'Clash',
    720: 'ARAM Clash',
    830: 'Co-op vs AI Intro',
    840: 'Co-op vs AI Beginner',
    850: 'Co-op vs AI Intermediate',
    900: 'URF',
    1020: 'One for All',
    1300: 'Nexus Blitz',
    1400: 'Ultimate Spellbook',
    1700: 'Arena',
    1710: 'Arena',
    1900: 'Pick URF',
    2000: 'Tutorial 1',
    2010: 'Tutorial 2',
    2020: 'Tutorial 3',
  };
  
  return queueMap[queueId] || 'Custom';
};
