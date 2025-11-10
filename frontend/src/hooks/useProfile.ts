import { useState, useEffect, useCallback } from 'react';
import { profileStorage } from '../lib/storage';
import { 
  validateUserProfile, 
  migrateUserProfile, 
  createNewProfile,
} from '../lib/profileValidation';
import type { UserProfile } from '../types';

interface UseProfileOptions {
  autoSave?: boolean;
  validateOnLoad?: boolean;
}



export function useProfile(options: UseProfileOptions = {}) {
  const { autoSave = true, validateOnLoad = true } = options;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-save when profile changes (if enabled)
  useEffect(() => {
    if (profile && autoSave && hasUnsavedChanges) {
      saveProfile(profile);
      setHasUnsavedChanges(false);
    }
  }, [profile, autoSave, hasUnsavedChanges]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storedProfile = profileStorage.get();
      
      if (storedProfile) {
        if (validateOnLoad) {
          const validation = validateUserProfile(storedProfile);
          
          if (!validation.isValid) {
            setError(`Profile validation failed: ${validation.errors.join(', ')}`);
            
            if (validation.needsMigration) {
              // Attempt to migrate the profile
              const migrationResult = migrateUserProfile(storedProfile);
              if (migrationResult.success && migrationResult.profile) {
                setProfile(migrationResult.profile);
                saveProfile(migrationResult.profile);
              } else {
                // Migration failed, clear invalid profile
                setError(`Profile migration failed: ${migrationResult.errors.join(', ')}`);
                clearProfile();
              }
            } else {
              // Invalid profile that can't be migrated
              clearProfile();
            }
          } else {
            setProfile(storedProfile);
            
            // Show warnings if any
            if (validation.warnings.length > 0) {
              console.warn('Profile validation warnings:', validation.warnings);
            }
          }
        } else {
          setProfile(storedProfile);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [validateOnLoad]);

  const saveProfile = useCallback((profileToSave: UserProfile) => {
    try {
      console.log('💾 useProfile - saveProfile called with:', profileToSave);

      const validation = validateUserProfile(profileToSave);

      if (!validation.isValid) {
        console.error('❌ Profile validation failed:', validation.errors);
        throw new Error(`Cannot save invalid profile: ${validation.errors.join(', ')}`);
      }

      // Update lastActive timestamp and ensure schema version
      const profileWithTimestamp = {
        ...profileToSave,
        lastActive: Date.now(),
        schemaVersion: 1 // Current schema version
      };

      console.log('💾 useProfile - Saving to localStorage:', profileWithTimestamp);
      profileStorage.set(profileWithTimestamp);
      setProfile(profileWithTimestamp);
      setHasUnsavedChanges(false);
      setError(null);

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Profile validation warnings:', validation.warnings);
      }

      console.log('✅ Profile saved successfully!');
      return profileWithTimestamp;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      console.error('❌ Failed to save profile:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!profile) {
      throw new Error('No profile to update');
    }

    const updatedProfile = { ...profile, ...updates };
    
    if (autoSave) {
      return saveProfile(updatedProfile);
    } else {
      setProfile(updatedProfile);
      setHasUnsavedChanges(true);
      return updatedProfile;
    }
  }, [profile, autoSave, saveProfile]);

  const createProfile = useCallback((newProfile: Omit<UserProfile, 'lastActive' | 'schemaVersion'>) => {
    const profileWithSchema = createNewProfile(newProfile);
    return saveProfile(profileWithSchema);
  }, [saveProfile]);

  const clearProfile = useCallback(() => {
    try {
      profileStorage.remove();
      setProfile(null);
      setHasUnsavedChanges(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear profile');
    }
  }, []);

  const refreshProfile = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

  const hasProfile = profile !== null;
  const isProfileValid = profile ? validateUserProfile(profile).isValid : false;

  return {
    // State
    profile,
    isLoading,
    error,
    hasUnsavedChanges,
    
    // Computed properties
    hasProfile,
    isProfileValid,
    
    // Actions
    loadProfile,
    saveProfile,
    updateProfile,
    createProfile,
    clearProfile,
    refreshProfile
  };
}

