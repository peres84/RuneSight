import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { useRiotIdValidation } from '../../hooks/useRiotIdValidation';
import type { UserProfile } from '../../types';

interface RiotIdFormProps {
  riotId: string;
  onRiotIdChange: (riotId: string) => void;
  onSubmit: (profile: UserProfile) => void;
  isValidating?: boolean;
}

export function RiotIdForm({ 
  riotId, 
  onRiotIdChange, 
  onSubmit, 
  isValidating: externalValidating = false
}: RiotIdFormProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const {
    riotId: validationRiotId,
    region,
    setRiotId: setValidationRiotId,
    validate,
    validationStatus,
    isValidating: internalValidating,
    canSubmit,
    serverValidation
  } = useRiotIdValidation({
    validateOnChange: false, // Disable auto-validation
    debounceMs: 500
  });

  // Sync with parent component
  useEffect(() => {
    if (validationRiotId !== riotId) {
      setValidationRiotId(riotId);
    }
  }, [riotId, validationRiotId, setValidationRiotId]);

  const isValidating = internalValidating || externalValidating;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHasInteracted(true);
    onRiotIdChange(value);
    setValidationRiotId(value);
  };

  const handleValidate = async () => {
    if (isValidating || !riotId.trim()) return;
    
    setHasInteracted(true);
    console.log('Validating Riot ID (region will be auto-detected)');
    
    try {
      await validate();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isValidating) {
      return;
    }

    // Check if Riot ID is entered
    if (!riotId.trim()) {
      return;
    }

    setHasInteracted(true);

    try {
      // Always validate on submit (region will be auto-detected)
      console.log('Validating Riot ID');
      const result = await validate();
      
      if (!result || !result.valid) {
        // Validation failed - error message will be shown
        return;
      }

      // Success - create profile and submit
      const playerData = result.playerData || {};

      console.log('🔍 VALIDATION RESULT:', {
        full_result: result,
        playerData: playerData,
        platform_value: playerData.platform,
        region_value: result.region
      });

      const profile: UserProfile = {
        riotId: result.riotId || riotId,
        region: result.region || region, // Regional routing (AMERICAS, EUROPE, ASIA, SEA)
        platform: playerData.platform, // Platform code (LA1, NA1, EUW1, etc.)
        puuid: result.puuid,
        displayName: playerData.summoner_name || undefined, // Convert null to undefined
        summonerLevel: playerData.summoner_level,
        profileIconId: playerData.profile_icon_id,
        lastActive: Date.now()
      };

      console.log('🔍 CREATED PROFILE:', profile);

      onSubmit(profile);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    }
    
    if (validationStatus.severity === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    if (validationStatus.severity === 'error' && hasInteracted) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusColor = () => {
    if (validationStatus.severity === 'success') return 'text-green-600 dark:text-green-400';
    if (validationStatus.severity === 'error' && hasInteracted) return 'text-red-600 dark:text-red-400';
    if (validationStatus.severity === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="riotId" className="block text-sm font-medium">
          Riot ID
        </label>
        
        <div className="relative">
          <input
            type="text"
            id="riotId"
            value={riotId}
            onChange={handleInputChange}
            placeholder="username#tag"
            className="input pr-10"
            disabled={isValidating}
            autoComplete="off"
            spellCheck={false}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        
        {/* Validation message */}
        <AnimatePresence>
          {validationStatus.message && (hasInteracted || validationStatus.severity === 'success') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className={`text-xs ${getStatusColor()}`}>
                {validationStatus.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Format hint */}
        {!hasInteracted && (
          <p className="text-xs text-muted-foreground">
            Enter your Riot ID in the format: username#tag (e.g., Faker#T1)
          </p>
        )}
      </div>

      {/* Validate button */}
      {!serverValidation?.valid && (
        <motion.button
          type="button"
          onClick={handleValidate}
          disabled={!riotId.trim() || isValidating}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={riotId.trim() && !isValidating ? { scale: 1.02 } : {}}
          whileTap={riotId.trim() && !isValidating ? { scale: 0.98 } : {}}
        >
          {isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating...</span>
            </div>
          ) : (
            'Validate Riot ID'
          )}
        </motion.button>
      )}

      {/* Submit button - only show after successful validation */}
      {serverValidation?.valid && (
        <motion.button
          type="submit"
          className="btn-primary w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Continue
        </motion.button>
      )}
      
      {/* Additional info for successful validation */}
      {serverValidation && serverValidation.valid && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Player found!
            </span>
          </div>
          {serverValidation.playerData && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Level {serverValidation.playerData.summoner_level} • {serverValidation.region}
            </p>
          )}
        </motion.div>
      )}
    </form>
  );
}