// RiotID validation utilities for frontend

export interface RiotIdValidation {
  isValid: boolean;
  errors: string[];
  gameName?: string;
  tagLine?: string;
}

export interface RegionValidation {
  isValid: boolean;
  normalizedRegion?: string;
  error?: string;
}

// Valid regions mapping
export const VALID_REGIONS = {
  europe: ['euw', 'euw1', 'eune', 'eune1', 'eun1', 'tr', 'tr1', 'ru'],
  americas: ['na', 'na1', 'br', 'br1', 'lan', 'la1', 'las', 'la2'],
  asia: ['kr', 'jp', 'jp1', 'oce', 'oc1'],
  sea: ['ph', 'ph2', 'sg', 'sg2', 'th', 'th2', 'tw', 'tw2', 'vn', 'vn2']
} as const;

export const REGION_DISPLAY_NAMES = {
  europe: 'Europe',
  americas: 'Americas', 
  asia: 'Asia'
} as const;

/**
 * Validates RiotID format (username#tag)
 * Rules:
 * - Must contain exactly one # separator
 * - Game name: 3-16 characters, alphanumeric + spaces
 * - Tag line: 3-5 characters, alphanumeric only
 */
export function validateRiotId(riotId: string): RiotIdValidation {
  const errors: string[] = [];
  
  if (!riotId || typeof riotId !== 'string') {
    return {
      isValid: false,
      errors: ['RiotID is required']
    };
  }

  // Check for # separator
  if (!riotId.includes('#')) {
    return {
      isValid: false,
      errors: ['RiotID must include # separator (e.g., username#tag)']
    };
  }

  const parts = riotId.split('#');
  if (parts.length !== 2) {
    return {
      isValid: false,
      errors: ['RiotID must have exactly one # separator']
    };
  }

  const [gameName, tagLine] = parts;

  // Validate game name
  if (!gameName || gameName.trim().length === 0) {
    errors.push('Username cannot be empty');
  } else {
    const trimmedGameName = gameName.trim();
    
    if (trimmedGameName.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    if (trimmedGameName.length > 16) {
      errors.push('Username cannot exceed 16 characters');
    }
    
    // Check for valid characters (alphanumeric + spaces)
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmedGameName)) {
      errors.push('Username can only contain letters, numbers, and spaces');
    }
  }

  // Validate tag line
  if (!tagLine || tagLine.trim().length === 0) {
    errors.push('Tag cannot be empty');
  } else {
    const trimmedTagLine = tagLine.trim();
    
    if (trimmedTagLine.length < 3) {
      errors.push('Tag must be at least 3 characters');
    }
    
    if (trimmedTagLine.length > 5) {
      errors.push('Tag cannot exceed 5 characters');
    }
    
    // Check for valid characters (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(trimmedTagLine)) {
      errors.push('Tag can only contain letters and numbers');
    }
  }

  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    gameName: isValid ? gameName.trim() : undefined,
    tagLine: isValid ? tagLine.trim() : undefined
  };
}

/**
 * Validates and normalizes region
 */
export function validateRegion(region: string): RegionValidation {
  if (!region || typeof region !== 'string') {
    return {
      isValid: false,
      error: 'Region is required'
    };
  }

  const normalizedInput = region.toLowerCase().trim();
  
  // Check if it's a regional routing value
  if (normalizedInput in VALID_REGIONS) {
    return {
      isValid: true,
      normalizedRegion: normalizedInput as keyof typeof VALID_REGIONS
    };
  }
  
  // Check if it's a platform routing value and convert to regional
  for (const [regional, platforms] of Object.entries(VALID_REGIONS)) {
    if ((platforms as readonly string[]).includes(normalizedInput)) {
      return {
        isValid: true,
        normalizedRegion: regional as keyof typeof VALID_REGIONS
      };
    }
  }
  
  return {
    isValid: false,
    error: `Invalid region. Valid regions: ${Object.keys(VALID_REGIONS).join(', ')}`
  };
}

/**
 * Formats RiotID for display (trims whitespace)
 */
export function formatRiotId(riotId: string): string {
  const validation = validateRiotId(riotId);
  if (validation.isValid && validation.gameName && validation.tagLine) {
    return `${validation.gameName}#${validation.tagLine}`;
  }
  return riotId;
}

/**
 * Parses RiotID into components
 */
export function parseRiotId(riotId: string): { gameName: string; tagLine: string } | null {
  const validation = validateRiotId(riotId);
  if (validation.isValid && validation.gameName && validation.tagLine) {
    return {
      gameName: validation.gameName,
      tagLine: validation.tagLine
    };
  }
  return null;
}

/**
 * Real-time validation for input fields
 */
export function validateRiotIdRealtime(riotId: string): {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'success';
} {
  if (!riotId) {
    return {
      isValid: false,
      message: 'Enter your RiotID (e.g., Faker#T1)',
      severity: 'warning'
    };
  }

  const validation = validateRiotId(riotId);
  
  if (validation.isValid) {
    return {
      isValid: true,
      message: 'Valid RiotID format',
      severity: 'success'
    };
  }

  // Return the first error for real-time feedback
  return {
    isValid: false,
    message: validation.errors[0],
    severity: 'error'
  };
}