// LocalStorage utilities for RuneSight

import type { UserProfile } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'runesight-profile',
  THEME: 'runesight-theme',
  CHAT_HISTORY: 'runesight-chat-history',
} as const;

// User profile management
export const profileStorage = {
  get: (): UserProfile | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading profile from localStorage:', error);
      return null;
    }
  },

  set: (profile: UserProfile): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
      throw error; // Re-throw to allow error handling upstream
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error removing profile from localStorage:', error);
      throw error;
    }
  },

  update: (updates: Partial<UserProfile>): UserProfile | null => {
    const current = profileStorage.get();
    if (!current) return null;

    const updated = { ...current, ...updates, lastActive: Date.now() };
    profileStorage.set(updated);
    return updated;
  },

  // Check if profile exists
  exists: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_PROFILE) !== null;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  },

  // Get profile metadata without full deserialization
  getMetadata: (): { lastActive: number; riotId: string } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!stored) return null;
      
      const profile = JSON.parse(stored);
      return {
        lastActive: profile.lastActive || 0,
        riotId: profile.riotId || 'Unknown'
      };
    } catch (error) {
      console.error('Error reading profile metadata:', error);
      return null;
    }
  },

  // Backup profile to a different key
  backup: (backupKey?: string): boolean => {
    try {
      const profile = profileStorage.get();
      if (!profile) return false;

      const key = backupKey || `${STORAGE_KEYS.USER_PROFILE}-backup-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error backing up profile:', error);
      return false;
    }
  },

  // Restore profile from backup
  restore: (backupKey: string): UserProfile | null => {
    try {
      const stored = localStorage.getItem(backupKey);
      if (!stored) return null;

      const profile = JSON.parse(stored);
      profileStorage.set(profile);
      return profile;
    } catch (error) {
      console.error('Error restoring profile from backup:', error);
      return null;
    }
  }
};

// Theme management
export const themeStorage = {
  get: (): 'light' | 'dark' | 'system' => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      return (stored as 'light' | 'dark' | 'system') || 'system';
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
      return 'system';
    }
  },

  set: (theme: 'light' | 'dark' | 'system'): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  },
};

// Chat history management
export const chatStorage = {
  get: (sessionId: string): any[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CHAT_HISTORY}-${sessionId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading chat history from localStorage:', error);
      return [];
    }
  },

  set: (sessionId: string, messages: any[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.CHAT_HISTORY}-${sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  },

  clear: (sessionId: string): void => {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.CHAT_HISTORY}-${sessionId}`);
    } catch (error) {
      console.error('Error clearing chat history from localStorage:', error);
    }
  },
};

// Match data retrieval for chat API
export const getStoredMatchHistory = (riotId: string, queue?: number): any[] | null => {
  try {
    const cacheKey = `runesight_matches_${riotId}_${queue || 'all'}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      console.log(`❌ No cached matches found for ${riotId} (queue: ${queue || 'all'})`);
      return null;
    }
    
    const data = JSON.parse(cached);
    
    // Check if cache is still valid (less than 10 minutes old)
    const cacheAge = Date.now() - (data.timestamp || 0);
    if (cacheAge >= 10 * 60 * 1000) {
      console.log(`⏰ Cached matches for ${riotId} expired (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
      return null;
    }
    
    const matches = data.matches?.matches || data.matches || null;
    
    if (matches && Array.isArray(matches)) {
      console.log(`✅ Found ${matches.length} cached matches for ${riotId}`);
      return matches;
    } else {
      console.log(`❌ Invalid match data structure for ${riotId}:`, data);
      return null;
    }
  } catch (error) {
    console.error('Error reading match history from cache:', error);
  }
  return null;
};

export const getStoredRankedInfo = (riotId: string): any | null => {
  try {
    const cacheKey = `runesight_ranked_${riotId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (less than 30 minutes old)
      const cacheAge = Date.now() - (data.timestamp || 0);
      if (cacheAge < 30 * 60 * 1000) {
        return data.ranked;
      }
    }
  } catch (error) {
    console.error('Error reading ranked info from cache:', error);
  }
  return null;
};

// User profile storage for chat API
export const getStoredUserProfile = (riotId: string): any | null => {
  try {
    const cacheKey = `runesight_user_profile_${riotId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (less than 30 minutes old)
      const cacheAge = Date.now() - (data.timestamp || 0);
      if (cacheAge < 30 * 60 * 1000) {
        return data.profile;
      }
    }
  } catch (error) {
    console.error('Error reading user profile from cache:', error);
  }
  return null;
};

export const setStoredUserProfile = (riotId: string, profile: any): void => {
  try {
    const cacheKey = `runesight_user_profile_${riotId}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      profile,
      timestamp: Date.now(),
    }));
    console.log(`💾 Cached user profile for ${riotId}`);
  } catch (error) {
    console.error('Error storing user profile:', error);
  }
};

// Utility functions
export const storage = {
  // Check if localStorage is available
  isAvailable: (): boolean => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Clear all RuneSight data
  clearAll: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear chat history for all sessions
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEYS.CHAT_HISTORY)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Get storage usage info
  getUsageInfo: (): { used: number; available: number } => {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Rough estimate of available space (5MB typical limit)
      const available = 5 * 1024 * 1024 - used;
      
      return { used, available };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, available: 0 };
    }
  },
};