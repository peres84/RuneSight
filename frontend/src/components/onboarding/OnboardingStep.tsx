import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface OnboardingStepProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
}

export function OnboardingStep({
  title,
  description,
  icon: Icon,
  children,
  isActive = false,
  isCompleted = false
}: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-6 rounded-lg border transition-colors ${
        isActive 
          ? 'border-primary bg-primary/5' 
          : isCompleted 
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-border bg-background'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : isCompleted 
            ? 'bg-green-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold mb-1 ${
            isActive ? 'text-primary' : isCompleted ? 'text-green-700 dark:text-green-300' : 'text-foreground'
          }`}>
            {title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4">
            {description}
          </p>
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}