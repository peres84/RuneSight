/**
 * ChatInterface Component
 * Main chat interface for AI agent interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useProfile } from '../../hooks/useProfile';
import { ChatMessage } from './ChatMessage';
import { ExamplePrompts } from './ExamplePrompts';
import type { ChatMessage as ChatMessageType } from '../../types';

export interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'performance' | 'champion' | 'comparison'>('performance');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const analysisMutation = useAnalysis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || analysisMutation.isPending) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await analysisMutation.mutateAsync({
        type: analysisType,
        query: input,
        riotId: profile?.riotId,
      });

      const agentMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: response.analysis,
        agentType: response.analysis_type as any,
        metadata: response.metadata,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error instanceof Error ? error.message : 'An error occurred',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleExampleClick = (prompt: string, type: 'performance' | 'champion' | 'comparison') => {
    setInput(prompt);
    setAnalysisType(type);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          AI Analysis Chat
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ask questions about your gameplay and get AI-powered insights
        </p>

        {/* Analysis Type Selector */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => setAnalysisType('performance')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              analysisType === 'performance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setAnalysisType('champion')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              analysisType === 'champion'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Champion
          </button>
          <button
            onClick={() => setAnalysisType('comparison')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              analysisType === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <ExamplePrompts onPromptClick={handleExampleClick} />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {analysisMutation.isPending && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${analysisType}...`}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={analysisMutation.isPending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || analysisMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {analysisMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {profile?.riotId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Analyzing for: {profile.riotId}
          </p>
        )}
      </div>
    </div>
  );
};
