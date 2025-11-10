import React from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../ui/Logo';
import { RiotButton } from '../ui/RiotButton';
import type { UserProfile } from '../../types';

interface NavigationProps {
  profile: UserProfile | null;
  currentPage: 'landing' | 'onboarding' | 'dashboard' | 'chat';
  onNavigate: (page: 'landing' | 'onboarding' | 'dashboard' | 'chat') => void;
  onLogout?: () => void;
  onOpenChat?: () => void;
}

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and quick insights'
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: MessageSquare,
    description: 'Talk to your AI coaches'
  }
] as const;

export function Navigation({ profile, currentPage, onNavigate, onLogout, onOpenChat }: NavigationProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout?.();
  };

  const handleNavItemClick = (itemId: string) => {
    if (itemId === 'chat') {
      onOpenChat?.();
    } else {
      onNavigate(itemId as any);
    }
  };

  return (
    <header className={`border-b sticky top-0 z-50 ${
      currentPage === 'landing' 
        ? 'border-white/10 bg-black/20 backdrop-blur-md' 
        : 'border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="cursor-pointer"
            onClick={() => onNavigate(profile ? 'dashboard' : 'landing')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Logo size="nav" forceWhite={currentPage === 'landing'} />
          </motion.div>

          {/* Navigation Items (only show when user has profile) */}
          {profile && (
            <nav className="hidden md:flex items-center space-x-1">
              {NAVIGATION_ITEMS.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    currentPage === item.id && item.id !== 'chat'
                      ? 'bg-primary text-primary-foreground'
                      : currentPage === 'landing'
                      ? 'text-white/80 hover:text-runesight-accent hover:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={item.description}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle forceWhite={currentPage === 'landing'} />

            {profile ? (
              /* Profile Menu */
              <div className="relative">
                <button
                  onClick={handleProfileMenuToggle}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    currentPage === 'landing' 
                      ? 'hover:bg-white/10 text-white' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-8 h-8 bg-runesight-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-runesight-primary dark:text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-sm font-medium ${currentPage === 'landing' ? 'text-white' : ''}`}>
                      {profile.riotId}
                    </p>
                    <p className={`text-xs capitalize ${
                      currentPage === 'landing' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {profile.region}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${
                    currentPage === 'landing' ? 'text-white/70' : 'text-muted-foreground'
                  }`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-md shadow-lg z-50"
                  >
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-runesight-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-runesight-primary dark:text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{profile.riotId}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.displayName || 'Summoner'}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {profile.region} • Level {profile.puuid ? '?' : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // TODO: Navigate to settings when implemented
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-2 text-runesight-accent hover:text-runesight-accent/80"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Get Started Button */
              <RiotButton
                onClick={() => onNavigate('onboarding')}
                variant="primary"
                size="sm"
              >
                Get Started
              </RiotButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation (only show when user has profile) */}
        {profile && (
          <nav className="md:hidden mt-4 flex space-x-2 overflow-x-auto pb-1">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap text-sm ${
                  currentPage === item.id && item.id !== 'chat'
                    ? 'bg-primary text-primary-foreground'
                    : currentPage === 'landing'
                    ? 'text-white/80 hover:text-runesight-accent hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
}