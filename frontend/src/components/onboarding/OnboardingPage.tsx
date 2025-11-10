import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Users, TrendingUp, Sparkles, Target } from 'lucide-react';
import { RiotIdForm } from './RiotIdForm';
import { RegionSelector } from './RegionSelector';
import { Logo } from '../ui/Logo';

import type { UserProfile } from '../../types';

interface OnboardingPageProps {
  onComplete: (profile: UserProfile) => void;
  onBack?: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to RuneSight',
    description: 'AI-powered League of Legends analytics platform',
    icon: Sparkles
  },
  {
    id: 'features',
    title: 'Discover Your Potential',
    description: 'Get personalized insights from specialized AI agents',
    icon: Zap
  },
  {
    id: 'setup',
    title: 'Set Up Your Profile',
    description: 'Enter your Riot ID to get started',
    icon: Users
  }
] as const;

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Performance Analysis',
    description: 'Get detailed insights into your match performance and improvement areas'
  },
  {
    icon: Users,
    title: 'Champion Expertise',
    description: 'Receive champion-specific advice, builds, and matchup analysis'
  },
  {
    icon: Target,
    title: 'Team Synergy',
    description: 'Analyze team compositions and player synergies for better coordination'
  }
];

export function OnboardingPage({ onComplete, onBack }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState('euw'); // Default to EUW
  const [regionalRouting, setRegionalRouting] = useState('EUROPE');
  const [platform, setPlatform] = useState('EUW1');
  const [isValidating, setIsValidating] = useState(false);

  const handleRegionChange = (value: string, routing: string, platformCode: string) => {
    setRegion(value);
    setRegionalRouting(routing);
    setPlatform(platformCode);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleRiotIdSubmit = async (validatedProfile: UserProfile) => {
    setIsValidating(true);
    try {
      console.log('🎯 OnboardingPage - Received profile:', validatedProfile);
      // Add any additional processing here if needed
      onComplete(validatedProfile);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to RuneSight</h2>
              <p className="text-muted-foreground text-lg">
                AI-powered League of Legends analytics platform
              </p>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get personalized insights, match analysis, and improvement recommendations 
              from specialized AI agents trained on League of Legends data.
            </p>
          </motion.div>
        );

      case 'features':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Discover Your Potential</h2>
              <p className="text-muted-foreground text-lg">
                Powered by specialized AI agents
              </p>
            </div>
            
            <div className="grid gap-4 max-w-2xl mx-auto">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'setup':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Set Up Your Profile</h2>
              <p className="text-muted-foreground text-lg">
                Enter your Riot ID to get personalized insights
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <RiotIdForm
                riotId={riotId}
                onRiotIdChange={setRiotId}
                onSubmit={handleRiotIdSubmit}
                isValidating={isValidating}
              />
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 transition-colors ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Main content */}
        <div className="card p-8 min-h-[500px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={handlePrevious}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isValidating}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{currentStep === 0 ? 'Back' : 'Previous'}</span>
            </button>

            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center space-x-2"
                disabled={isValidating}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Complete the form above to continue
              </div>
            )}
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            RuneSight is not endorsed by Riot Games and does not reflect the views or opinions 
            of Riot Games or anyone officially involved in producing or managing Riot Games properties.
          </p>
        </div>
      </div>
    </div>
  );
}