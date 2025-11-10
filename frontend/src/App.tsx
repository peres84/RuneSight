import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProfile } from './hooks/useProfile'
import { LandingPage, Navigation } from './components/layout'
import { OnboardingPage } from './components/onboarding'
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard'
import { ChatModal } from './components/chat/ChatModal'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingState } from './components/LoadingState'
import type { UserProfile } from './types'

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2, // Retry failed requests twice
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
    },
  },
})

type Page = 'landing' | 'onboarding' | 'dashboard' | 'chat';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const { profile, isLoading, createProfile, clearProfile } = useProfile()

  // Determine initial page based on profile
  useEffect(() => {
    if (!isLoading) {
      if (profile) {
        setCurrentPage('dashboard')
      } else {
        setCurrentPage('landing')
      }
    }
  }, [profile, isLoading])

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
  }

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    console.log('🎯 App - handleOnboardingComplete called with:', newProfile);
    const savedProfile = createProfile(newProfile);
    console.log('🎯 App - Profile saved to localStorage:', savedProfile);
    setCurrentPage('dashboard');
  }

  const handleLogout = () => {
    clearProfile()
    setCurrentPage('landing')
  }

  const handleOpenChat = () => {
    setIsChatModalOpen(true)
  }

  const handleCloseChat = () => {
    setIsChatModalOpen(false)
  }

  if (isLoading) {
    return (
      <LoadingState 
        message="Loading RuneSight..." 
        size="lg" 
        fullScreen 
      />
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            onGetStarted={() => handleNavigate('onboarding')} 
          />
        )
      
      case 'onboarding':
        return (
          <OnboardingPage 
            onComplete={handleOnboardingComplete}
            onBack={() => handleNavigate('landing')}
          />
        )
      
      case 'dashboard':
      case 'chat':
        return profile ? (
          <>
            <div className="min-h-screen bg-background">
              <Navigation 
                profile={profile}
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                onOpenChat={handleOpenChat}
              />
              <main>
                <AnalyticsDashboard onOpenChat={handleOpenChat} />
              </main>
            </div>
            <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} />
          </>
        ) : null
      
      default:
        return null
    }
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors in production (could send to error tracking service)
        console.error('Application Error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        {renderCurrentPage()}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App