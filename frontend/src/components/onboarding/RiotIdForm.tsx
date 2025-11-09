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
    validateOnChange: true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit || isValidating) {
      return;
    }

    try {
      // Validate if not already validated
      let validationResult = serverValidation;
      if (!validationResult || !validationResult.valid) {
        const result = await validate();
        validationResult = result || null;
      }
      
      if (!validationResult) {
        throw new Error('Validation failed');
      }

      if (validationResult && validationResult.valid) {
        const profile: UserProfile = {
          riotId: validationResult.riotId || riotId,
          region: validationResult.region || region,
          puuid: validationResult.puuid,
          displayName: validationResult.playerData?.summoner_name,
          lastActive: Date.now()
        };
        
        onSubmit(profile);
      }
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

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={!canSubmit || isValidating}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={canSubmit && !isValidating ? { scale: 1.02 } : {}}
        whileTap={canSubmit && !isValidating ? { scale: 0.98 } : {}}
      >
        {isValidating ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validating...</span>
          </div>
        ) : (
          'Continue'
        )}
      </motion.button>
      
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