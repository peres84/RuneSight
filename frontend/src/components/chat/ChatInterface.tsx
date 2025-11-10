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
    <div className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 ${className}`}>
      {/* Agent Selector - Compact Dropdown */}
      <div className="border-b border-slate-300 dark:border-slate-700/50 px-3 md:px-4 py-2 bg-slate-200/50 dark:bg-slate-800/30">
        <div className="flex items-center space-x-2">
          <label htmlFor="agent-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap uppercase tracking-wider">
            Agent:
          </label>
          <select
            id="agent-select"
            value={forceAgent || 'auto'}
            onChange={(e) => setForceAgent(e.target.value === 'auto' ? undefined : e.target.value as any)}
            className="flex-1 px-3 py-2 rounded-md text-xs font-bold text-center bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white border border-runesight-accent/50 hover:border-runesight-accent focus:outline-none focus:ring-2 focus:ring-runesight-accent focus:border-runesight-accent transition-all uppercase tracking-wider cursor-pointer shadow-inner [&>option]:bg-slate-900 [&>option]:text-white [&>option]:py-2 [&>option]:text-center"
            style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}
          >
            <option value="auto" className="bg-slate-900 text-white font-bold">🤖 AUTO</option>
            <option value="performance" className="bg-slate-900 text-white font-bold">📊 PERFORMANCE</option>
            <option value="champion" className="bg-slate-900 text-white font-bold">⚔️ CHAMPION</option>
            <option value="comparison" className="bg-slate-900 text-white font-bold">🔄 COMPARISON</option>
            <option value="team_synergy" className="bg-slate-900 text-white font-bold">👥 TEAM SYNERGY</option>
            <option value="match_summarizer" className="bg-slate-900 text-white font-bold">📝 SUMMARIZER</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
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
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-runesight-accent" />
                <span className="text-sm font-medium">Analyzing with AI agent...</span>
                {profile?.riotId && (
                  <span title="Using cached data for faster response">
                    <Zap className="w-4 h-4 text-runesight-accent" />
                  </span>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Compact on Mobile */}
      <div className="border-t border-slate-300 dark:border-slate-700/50 p-2 md:p-4 bg-slate-200/50 dark:bg-slate-800/30">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={forceAgent ? `Ask ${forceAgent} agent...` : 'Ask anything...'}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700/50 rounded-lg bg-white dark:bg-slate-800/50 text-sm md:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-runesight-accent focus:border-runesight-accent/50 resize-none transition-all"
            rows={1}
            disabled={chatMutation.isPending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-3 md:px-4 py-2 bg-gradient-to-r from-runesight-accent to-runesight-secondary text-white font-bold uppercase tracking-wider rounded-lg hover:from-runesight-accent/80 hover:to-runesight-secondary/80 disabled:from-slate-400 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-600 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-lg hover:shadow-runesight-accent/50"
            style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 100%, 6px 100%)' }}
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1 md:mt-2 text-[10px] md:text-xs font-medium">
          {profile?.riotId && (
            <p className="truncate max-w-[50%] text-runesight-accent/80 dark:text-runesight-accent/70">
              {profile.riotId}
            </p>
          )}
          {sessionId && (
            <p className="truncate text-slate-500 dark:text-slate-400">
              {messages.length} msg
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
