import React, { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { BottomNavbar } from './components/BottomNavbar'
import { Hero } from './components/Hero'
import { MatchFeed } from './components/MatchFeed'
import { AuthModal } from './components/AuthModal'
import { ProfilePage } from './components/ProfilePage'
import { SquadsPage } from './components/SquadsPage'
import { PitchSideFeed } from './components/PitchSideFeed'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnimatePresence } from 'framer-motion'

function AppContent() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('matches')
  const [showHero, setShowHero] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  // Mobile Keyboard Fix: Hide layout elements when keyboard is up
  useEffect(() => {
    const handleFocus = () => setKeyboardVisible(true)
    const handleBlur = () => setKeyboardVisible(false)

    window.addEventListener('focusin', handleFocus)
    window.addEventListener('focusout', handleBlur)
    return () => {
      window.removeEventListener('focusin', handleFocus)
      window.removeEventListener('focusout', handleBlur)
    }
  }, [])

  // Redirect to feed if user is logged in
  useEffect(() => {
    if (currentUser) {
      setShowHero(false)
      setShowAuth(false)
      setActiveTab('matches')
    }
  }, [currentUser])

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  const renderContent = () => {
    if (showHero && !currentUser) {
      return <Hero onGetStarted={handleGetStarted} />
    }

    switch (activeTab) {
      case 'matches':
        return <MatchFeed />
      case 'squads':
        return <SquadsPage />
      case 'feed':
        return <PitchSideFeed onNavigateToProfile={() => setActiveTab('profile')} />
      case 'profile':
        return <ProfilePage />
      default:
        return <MatchFeed />
    }
  }

  return (
    <Layout>
      {renderContent()}

      {!showHero && !isKeyboardVisible && (
        <BottomNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Visual Debug Mode overlay for setup errors */}
      {!import.meta.env.VITE_FIREBASE_API_KEY && !showHero && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center z-[100] uppercase tracking-tighter">
          Debug: Firebase API Key Missing (Check Vercel Env Vars)
        </div>
      )}

      <AnimatePresence>
        {showAuth && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
