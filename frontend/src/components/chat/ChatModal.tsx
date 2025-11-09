/**
 * ChatModal Component
 * Full-screen modal for AI Chat interface
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-7xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-runesight-accent/20 to-runesight-secondary/20 flex items-center justify-center rounded-lg">
                    <img
                      src="/logo-precision-dark-mode.png"
                      alt="AI"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">
                      AI Analysis Chat
                    </h2>
                    <p className="text-sm text-slate-400">
                      Ask questions about your gameplay and get AI-powered insights
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
                  aria-label="Close chat"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface className="h-full" />
              </div>

              {/* Mobile hint */}
              <div className="md:hidden px-4 py-2 bg-slate-800/50 border-t border-slate-700/50 text-center">
                <p className="text-xs text-slate-400">
                  Swipe down or tap outside to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
