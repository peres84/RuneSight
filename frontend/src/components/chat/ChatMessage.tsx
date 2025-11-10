/**
 * ChatMessage Component
 * Displays individual chat messages with markdown support
 */

import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../types';

export interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';
  const isAgent = message.type === 'agent';

  const getAgentColor = () => {
    switch (message.agentType) {
      case 'performance':
        return 'text-blue-600 dark:text-blue-400';
      case 'champion_expert':
        return 'text-purple-600 dark:text-purple-400';
      case 'comparison':
        return 'text-green-600 dark:text-green-400';
      case 'team_synergy':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'summary':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAgentName = () => {
    switch (message.agentType) {
      case 'performance':
        return '📊 Performance Analyst';
      case 'champion_expert':
        return '⚔️ Champion Expert';
      case 'comparison':
        return '🔄 Comparison Analyst';
      case 'team_synergy':
        return '👥 Team Synergy Specialist';
      case 'summary':
        return '📝 Match Summarizer';
      default:
        return '🤖 AI Assistant';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600'
            : isError
            ? 'bg-red-600'
            : 'bg-gray-600 dark:bg-gray-700'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Agent Name */}
          {isAgent && (
            <span className={`text-xs font-semibold mb-1 ${getAgentColor()}`}>
              {getAgentName()}
            </span>
          )}

          {/* Message Bubble */}
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? 'bg-blue-600 text-white'
                : isError
                ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
          >
            {isAgent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-strong:text-runesight-accent dark:prose-strong:text-runesight-accent">
                <ReactMarkdown
                  components={{
                    // Custom heading styles
                    h1: ({ node, ...props }) => <h1 className="text-xl font-black uppercase tracking-wide border-b-2 border-runesight-accent pb-2 mb-3" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold flex items-center gap-2 mt-4 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                    // Custom list styles
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                    // Custom paragraph styles
                    p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
                    // Custom strong/bold styles
                    strong: ({ node, ...props }) => <strong className="font-bold text-runesight-accent dark:text-runesight-accent" {...props} />,
                    // Custom code styles
                    code: ({ node, inline, ...props }: any) => 
                      inline ? (
                        <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                      ) : (
                        <code className="block bg-slate-700/50 p-3 rounded my-2 text-sm font-mono overflow-x-auto" {...props} />
                      ),
                    // Custom blockquote styles
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-runesight-accent pl-4 italic my-3" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>

          {/* Metadata (for agent messages) */}
          {isAgent && message.metadata && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {message.metadata.agent_used && typeof message.metadata.agent_used === 'string' && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  Agent: {message.metadata.agent_used}
                </span>
              )}
              {message.metadata.used_cache === true && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                  ⚡ Fast (cached data)
                </span>
              )}
              {message.metadata.matches_provided && message.metadata.matches_provided > 0 && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                  {message.metadata.matches_provided} matches analyzed
                </span>
              )}
              {message.metadata.match_id && typeof message.metadata.match_id === 'string' && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  Match: {message.metadata.match_id}
                </span>
              )}
              {message.metadata.champion && typeof message.metadata.champion === 'string' && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  Champion: {message.metadata.champion}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
