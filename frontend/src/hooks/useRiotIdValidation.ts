// React hook for RiotID validation with real-time feedback

import { useState, useCallback, useMemo, useEffect } from 'react';
import { validateRiotId, validateRegion, type RiotIdValidation, type RegionValidation } from '../lib/validation';
import { api } from '../lib/api';
import { handleApiError } from '../lib/errors';
import type { RiotIdValidationResponse } from '../types';

interface UseRiotIdValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface ValidationState {
  riotId: string;
  region: string;
  isValidating: boolean;
  localValidation: {
    riotId: RiotIdValidation;
    region: RegionValidation;
  };
  serverValidation: RiotIdValidationResponse | null;
  error: string | null;
}

export function useRiotIdValidation(options: UseRiotIdValidationOptions = {}) {
  const { validateOnChange = true, debounceMs = 300 } = options;
  
  const [state, setState] = useState<ValidationState>({
    riotId: '',
    region: 'europe',
    isValidating: false,
    localValidation: {
      riotId: { isValid: false, errors: [] },
      region: { isValid: true, normalizedRegion: 'europe' }
    },
    serverValidation: null,
    error: null
  });

  // Debounced validation timer
  const [validationTimer, setValidationTimer] = useState<number | null>(null);

  // Update RiotID with local validation
  const setRiotId = useCallback((riotId: string) => {
    setState(prev => {
      const localValidation = validateOnChange ? validateRiotId(riotId) : prev.localValidation.riotId;
      
      return {
        ...prev,
        riotId,
        localValidation: {
          ...prev.localValidation,
          riotId: localValidation
        },
        serverValidation: null, // Clear server validation when input changes
        error: null
      };
    });

    // Clear existing timer
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    // Set up debounced server validation
    if (validateOnChange && riotId.trim()) {
      const timer = setTimeout(() => {
        validateWithServer(riotId, state.region);
      }, debounceMs);
      setValidationTimer(timer);
    }
  }, [validateOnChange, debounceMs, validationTimer, state.region]);

  // Update region with validation
  const setRegion = useCallback((region: string) => {
    setState(prev => {
      const regionValidation = validateRegion(region);
      
      return {
        ...prev,
        region: regionValidation.normalizedRegion || region,
        localValidation: {
          ...prev.localValidation,
          region: regionValidation
        },
        serverValidation: null, // Clear server validation when region changes
        error: null
      };
    });
  }, []);

  // Validate with server
  const validateWithServer = useCallback(async (riotId?: string, region?: string) => {
    const targetRiotId = riotId || state.riotId;
    const targetRegion = region || state.region;

    if (!targetRiotId.trim()) {
      return;
    }

    // First check local validation
    const localValidation = validateRiotId(targetRiotId);
    if (!localValidation.isValid) {
      setState(prev => ({
        ...prev,
        localValidation: {
          ...prev.localValidation,
          riotId: localValidation
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const response = await api.riot.validateRiotId(targetRiotId, targetRegion);
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        serverValidation: response,
        error: response.valid ? null : (response.error || 'Validation failed')
      }));

      return response;
    } catch (error) {
      const apiError = handleApiError(error);
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        serverValidation: null,
        error: apiError.message
      }));

      throw apiError;
    }
  }, [state.riotId, state.region]);

  // Manual validation trigger
  const validate = useCallback(() => {
    return validateWithServer();
  }, [validateWithServer]);

  // Reset validation state
  const reset = useCallback(() => {
    if (validationTimer) {
      clearTimeout(validationTimer);
      setValidationTimer(null);
    }

    setState({
      riotId: '',
      region: 'europe',
      isValidating: false,
      localValidation: {
        riotId: { isValid: false, errors: [] },
        region: { isValid: true, normalizedRegion: 'europe' }
      },
      serverValidation: null,
      error: null
    });
  }, [validationTimer]);

  // Computed validation status
  const validationStatus = useMemo(() => {
    const { riotId: riotIdValidation, region: regionValidation } = state.localValidation;
    
    // If we have server validation, use that
    if (state.serverValidation) {
      return {
        isValid: state.serverValidation.valid,
        isComplete: true,
        canSubmit: state.serverValidation.valid && regionValidation.isValid,
        message: state.serverValidation.valid 
          ? 'RiotID verified successfully' 
          : (state.serverValidation.error || 'Player not found'),
        severity: state.serverValidation.valid ? 'success' : 'error' as const
      };
    }

    // If currently validating
    if (state.isValidating) {
      return {
        isValid: false,
        isComplete: false,
        canSubmit: false,
        message: 'Validating RiotID...',
        severity: 'info' as const
      };
    }

    // If there's an error
    if (state.error) {
      return {
        isValid: false,
        isComplete: true,
        canSubmit: false,
        message: state.error,
        severity: 'error' as const
      };
    }

    // Local validation only
    if (!state.riotId.trim()) {
      return {
        isValid: false,
        isComplete: false,
        canSubmit: false,
        message: 'Enter your RiotID (e.g., Faker#T1)',
        severity: 'info' as const
      };
    }

    if (!riotIdValidation.isValid) {
      return {
        isValid: false,
        isComplete: false,
        canSubmit: false,
        message: riotIdValidation.errors[0] || 'Invalid RiotID format',
        severity: 'error' as const
      };
    }

    if (!regionValidation.isValid) {
      return {
        isValid: false,
        isComplete: false,
        canSubmit: false,
        message: regionValidation.error || 'Invalid region',
        severity: 'error' as const
      };
    }

    // Local validation passed, but no server validation yet
    return {
      isValid: true,
      isComplete: false,
      canSubmit: false,
      message: 'Click to verify RiotID',
      severity: 'warning' as const
    };
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [validationTimer]);

  return {
    // State
    riotId: state.riotId,
    region: state.region,
    isValidating: state.isValidating,
    
    // Validation results
    localValidation: state.localValidation,
    serverValidation: state.serverValidation,
    validationStatus,
    error: state.error,
    
    // Actions
    setRiotId,
    setRegion,
    validate,
    reset,
    
    // Computed properties
    canSubmit: validationStatus.canSubmit,
    isValid: validationStatus.isValid && validationStatus.isComplete
  };
}