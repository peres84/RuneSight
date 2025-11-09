/**
 * ExamplePrompts Component
 * Displays example prompts for different analysis types
 */

import React from 'react';
import { TrendingUp, Sword, Users } from 'lucide-react';

export interface ExamplePromptsProps {
  onPromptClick: (prompt: string, type: 'performance' | 'champion' | 'comparison') => void;
}

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onPromptClick }) => {
  const performancePrompts = [
    'How did I perform in my last game?',
    'What should I focus on to improve my CS?',
    'Analyze my vision score trends',
    'What are my biggest weaknesses?',
  ];

  const championPrompts = [
    "What's the best build for Akali?",
    'How do I play Yasuo into Malzahar?',
    'Should I add Zed to my champion pool?',
    'What champions should I focus on?',
  ];

  const comparisonPrompts = [
    'Compare me with Faker#T1',
    'How well do I synergize with my duo partner?',
    "Who's better at CS, me or my friend?",
    'Analyze my performance vs similar rank players',
  ];

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What would you like to know?
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Choose an example prompt or type your own question
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Performance Analysis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Performance Analysis
            </h4>
          </div>
          <div className="space-y-2">
            {performancePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptClick(prompt, 'performance')}
                className="w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Champion Analysis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Sword className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Champion Expertise
            </h4>
          </div>
          <div className="space-y-2">
            {championPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptClick(prompt, 'champion')}
                className="w-full text-left px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-900 dark:text-purple-100 rounded-lg transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Analysis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Player Comparison
            </h4>
          </div>
          <div className="space-y-2">
            {comparisonPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptClick(prompt, 'comparison')}
                className="w-full text-left px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-900 dark:text-green-100 rounded-lg transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
