import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProfile } from './hooks/useProfile'
import { LandingPage, Navigation } from './components/layout'
import { OnboardingPage } from './components/onboarding'
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard'
import { ChatModal } from './components/chat/ChatModal'
import type { UserProfile } from './types'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
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
    createProfile(newProfile)
    setCurrentPage('dashboard')
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
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
    <QueryClientProvider client={queryClient}>
      {renderCurrentPage()}
    </QueryClientProvider>
  )
}

export default App