/**
 * ChatInterface Component
 * Main chat interface for AI agent interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Zap } from 'lucide-react';
import { useChatMessage } from '../../hooks/useChat';
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
  const [sessionId, setSessionId] = useState<string>();
  const [forceAgent, setForceAgent] = useState<'performance' | 'champion' | 'comparison' | 'team_synergy' | 'match_summarizer' | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput('');

    try {
      console.log('🚀 Sending chat message:', {
        message: messageText,
        riot_id: profile?.riotId,
        session_id: sessionId,
        force_agent: forceAgent,
      });

      // Send message with automatic cache loading
      const response = await chatMutation.mutateAsync({
        message: messageText,
        session_id: sessionId,
        riot_id: profile?.riotId,
        useCache: true, // 🔥 Automatically loads cached match data
        force_agent: forceAgent,
      });

      console.log('✅ Chat response received:', response);

      // Save session ID for conversation continuity
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const agentMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: response.response,
        agentType: response.agent_used as any,
        metadata: {
          ...response.metadata,
          agent_used: response.agent_used,
          confidence: response.confidence,
          used_cache: response.metadata.used_cached_data,
        },
        timestamp: Date.now(),
      };

      console.log('💬 Adding agent message to UI:', agentMessage);
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: error instanceof Error ? error.message : 'An error occurred',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleExampleClick = (prompt: string, type: 'performance' | 'champion' | 'comparison' | 'team_synergy' | 'match_summarizer') => {
    setInput(prompt);
    setForceAgent(type);
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

        {/* Agent Selector - All 5 Agents */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setForceAgent(undefined)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              !forceAgent
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🤖 Auto
          </button>
          <button
            onClick={() => setForceAgent('performance')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              forceAgent === 'performance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📊 Performance
          </button>
          <button
            onClick={() => setForceAgent('champion')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              forceAgent === 'champion'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ⚔️ Champion
          </button>
          <button
            onClick={() => setForceAgent('comparison')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              forceAgent === 'comparison'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🔄 Comparison
          </button>
          <button
            onClick={() => setForceAgent('team_synergy')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              forceAgent === 'team_synergy'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            👥 Team Synergy
          </button>
          <button
            onClick={() => setForceAgent('match_summarizer')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              forceAgent === 'match_summarizer'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📝 Summarizer
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
            {chatMutation.isPending && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing with AI agent...</span>
                {profile?.riotId && (
                  <span title="Using cached data for faster response">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </span>
                )}
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
            placeholder={forceAgent ? `Ask ${forceAgent} agent...` : 'Ask anything (AI will choose best agent)...'}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={chatMutation.isPending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          {profile?.riotId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analyzing for: {profile.riotId}
            </p>
          )}
          {sessionId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Session: {sessionId.slice(0, 8)}... • {messages.length} messages
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
