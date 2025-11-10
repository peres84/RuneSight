/**
 * Example Chat Component using the new chat API with cache integration
 * 
 * This component demonstrates how to use the useChatMessage hook
 * which automatically loads cached match data from localStorage.
 */

import { useState } from 'react';
import { useChatMessage } from '../../hooks/useChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    agent?: string;
    usedCache?: boolean;
    confidence?: number;
  };
}

interface ChatExampleProps {
  riotId: string;
}

export function ChatExample({ riotId }: ChatExampleProps) {
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const chatMutation = useChatMessage();

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Send message with automatic cache loading
      const response = await chatMutation.mutateAsync({
        message: userMessage,
        session_id: sessionId,
        riot_id: riotId,
        useCache: true, // 🔥 This enables automatic cache loading from localStorage
      });

      // Save session ID for conversation continuity
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Add AI response to UI
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
          metadata: {
            agent: response.agent_used,
            usedCache: response.metadata.used_cached_data,
            confidence: response.confidence,
          },
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">AI Performance Coach</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ask me anything about your League of Legends performance
        </p>
        {sessionId && (
          <p className="text-xs text-gray-500 mt-1">
            Session: {sessionId.slice(0, 8)}...
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-4">👋 Hi! I'm your AI performance coach.</p>
            <p className="text-sm">Try asking:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>"What's my average CS?"</li>
              <li>"How can I improve my KDA?"</li>
              <li>"Analyze my recent performance"</li>
              <li>"What champions should I play?"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.metadata && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs opacity-75">
                  <span>Agent: {msg.metadata.agent}</span>
                  {msg.metadata.usedCache && (
                    <span className="ml-2">⚡ Fast (cached)</span>
                  )}
                  {msg.metadata.confidence && (
                    <span className="ml-2">
                      Confidence: {(msg.metadata.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your performance..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={chatMutation.isPending}
          />
          <button
            onClick={handleSendMessage}
            disabled={chatMutation.isPending || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Your match data is cached locally for faster responses
        </p>
      </div>
    </div>
  );
}
