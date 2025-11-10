import type { UserProfile } from '../types';
import { validateRiotId, validateRegion } from './validation';

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  needsMigration: boolean;
  migrationVersion?: number;
}

export interface ProfileMigrationResult {
  success: boolean;
  profile?: UserProfile;
  errors: string[];
}

// Current profile schema version
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Validates a user profile object comprehensively
 */
export function validateUserProfile(profile: any): ProfileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsMigration = false;
  let migrationVersion: number | undefined;

  // Check if profile exists and is an object
  if (!profile || typeof profile !== 'object') {
    return {
      isValid: false,
      errors: ['Profile must be a valid object'],
      warnings: [],
      needsMigration: false
    };
  }

  // Check schema version
  if (profile.schemaVersion === undefined) {
    needsMigration = true;
    migrationVersion = 0; // Legacy profile
    warnings.push('Profile needs migration to current schema');
  } else if (profile.schemaVersion < CURRENT_SCHEMA_VERSION) {
    needsMigration = true;
    migrationVersion = profile.schemaVersion;
    warnings.push(`Profile schema is outdated (v${profile.schemaVersion} -> v${CURRENT_SCHEMA_VERSION})`);
  }

  // Validate required fields
  if (!profile.riotId || typeof profile.riotId !== 'string') {
    errors.push('riotId is required and must be a string');
  } else {
    // Validate RiotID format
    const riotIdValidation = validateRiotId(profile.riotId);
    if (!riotIdValidation.isValid) {
      errors.push(`Invalid riotId format: ${riotIdValidation.errors.join(', ')}`);
    }
  }

  if (!profile.region || typeof profile.region !== 'string') {
    errors.push('region is required and must be a string');
  } else {
    // Validate region
    const regionValidation = validateRegion(profile.region);
    if (!regionValidation.isValid) {
      errors.push(`Invalid region: ${regionValidation.error}`);
    }
  }

  if (typeof profile.lastActive !== 'number') {
    if (profile.lastActive === undefined) {
      needsMigration = true;
      warnings.push('lastActive timestamp is missing and will be added');
    } else {
      errors.push('lastActive must be a number (timestamp)');
    }
  } else {
    // Check if timestamp is reasonable (not in the future, not too old)
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    if (profile.lastActive > now + (24 * 60 * 60 * 1000)) { // Allow 1 day future for clock skew
      warnings.push('lastActive timestamp appears to be in the future');
    } else if (profile.lastActive < oneYearAgo) {
      warnings.push('Profile appears to be very old (over 1 year)');
    }
  }

  // Validate optional fields
  if (profile.puuid !== undefined) {
    if (typeof profile.puuid !== 'string') {
      errors.push('puuid must be a string if provided');
    } else if (profile.puuid.length === 0) {
      warnings.push('puuid is empty');
    }
  }

  if (profile.displayName !== undefined) {
    if (typeof profile.displayName !== 'string') {
      errors.push('displayName must be a string if provided');
    } else if (profile.displayName.length === 0) {
      warnings.push('displayName is empty');
    }
  }

  if (profile.favoriteChampions !== undefined) {
    if (!Array.isArray(profile.favoriteChampions)) {
      errors.push('favoriteChampions must be an array if provided');
    } else {
      const invalidChampions = profile.favoriteChampions.filter(
        (champ: any) => typeof champ !== 'string' || champ.length === 0
      );
      if (invalidChampions.length > 0) {
        errors.push('favoriteChampions must contain only non-empty strings');
      }
      if (profile.favoriteChampions.length > 10) {
        warnings.push('favoriteChampions list is quite long (>10 champions)');
      }
    }
  }

  if (profile.preferredAnalysisDepth !== undefined) {
    const validDepths = ['basic', 'detailed', 'expert'];
    if (!validDepths.includes(profile.preferredAnalysisDepth)) {
      errors.push(`preferredAnalysisDepth must be one of: ${validDepths.join(', ')}`);
    }
  }

  // Check for unknown fields (potential data corruption or version mismatch)
  const knownFields = [
    'riotId', 'region', 'platform', 'puuid', 'displayName', 'summonerLevel',
    'profileIconId', 'favoriteChampions', 'preferredAnalysisDepth',
    'lastActive', 'schemaVersion'
  ];
  const unknownFields = Object.keys(profile).filter(key => !knownFields.includes(key));
  if (unknownFields.length > 0) {
    warnings.push(`Unknown fields detected: ${unknownFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    needsMigration,
    migrationVersion
  };
}

/**
 * Migrates a profile to the current schema version
 */
export function migrateUserProfile(oldProfile: any): ProfileMigrationResult {
  const errors: string[] = [];

  try {
    // Start with the old profile
    let migratedProfile: any = { ...oldProfile };

    // Determine starting version
    const startVersion = oldProfile.schemaVersion || 0;

    // Apply migrations sequentially
    for (let version = startVersion; version < CURRENT_SCHEMA_VERSION; version++) {
      switch (version) {
        case 0:
          // Migration from legacy (no schema version) to v1
          migratedProfile = migrateLegacyToV1(migratedProfile);
          break;
        
        // Future migrations would go here
        // case 1:
        //   migratedProfile = migrateV1ToV2(migratedProfile);
        //   break;
        
        default:
          errors.push(`Unknown migration path from version ${version}`);
          return { success: false, errors };
      }
    }

    // Set current schema version
    migratedProfile.schemaVersion = CURRENT_SCHEMA_VERSION;

    // Validate the migrated profile
    const validation = validateUserProfile(migratedProfile);
    if (!validation.isValid) {
      errors.push(...validation.errors);
      return { success: false, errors };
    }

    return {
      success: true,
      profile: migratedProfile as UserProfile,
      errors: []
    };
  } catch (error) {
    errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
}

/**
 * Migrates legacy profile (no schema version) to v1
 */
function migrateLegacyToV1(profile: any): any {
  const migrated = { ...profile };

  // Add missing lastActive timestamp
  if (migrated.lastActive === undefined) {
    migrated.lastActive = Date.now();
  }

  // Ensure required fields have sensible defaults
  if (!migrated.region) {
    migrated.region = 'AMERICAS'; // Default to AMERICAS (will be re-detected on next validation)
  }

  // Clear platform if migrating from old schema - force re-detection
  if (!migrated.platform) {
    delete (migrated as any).platform; // Will be detected on next API call
  }

  // Clean up any invalid data
  if (migrated.favoriteChampions && !Array.isArray(migrated.favoriteChampions)) {
    delete migrated.favoriteChampions;
  }

  // Normalize preferredAnalysisDepth
  if (migrated.preferredAnalysisDepth && 
      !['basic', 'detailed', 'expert'].includes(migrated.preferredAnalysisDepth)) {
    delete migrated.preferredAnalysisDepth;
  }

  return migrated;
}

/**
 * Creates a new profile with current schema
 */
export function createNewProfile(data: Omit<UserProfile, 'lastActive' | 'schemaVersion'>): UserProfile {
  return {
    ...data,
    lastActive: Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION
  } as UserProfile & { schemaVersion: number };
}

/**
 * Checks if a profile needs migration
 */
export function profileNeedsMigration(profile: any): boolean {
  if (!profile || typeof profile !== 'object') {
    return false; // Invalid profiles can't be migrated
  }

  return profile.schemaVersion === undefined || profile.schemaVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Gets profile schema version
 */
export function getProfileSchemaVersion(profile: any): number {
  return profile?.schemaVersion || 0;
}