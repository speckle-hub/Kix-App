import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
  const [showAuth, setShowAuth] = useState(false)
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const navigate = useNavigate()

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

  // Redirect to matches if user is logged in
  useEffect(() => {
    if (currentUser) {
      setShowAuth(false)
      // Only navigate to matches if they are on the root or trying to access hero
      if (window.location.pathname === '/') {
        navigate('/matches')
      }
    }
  }, [currentUser, navigate])

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          !currentUser ? <Hero onGetStarted={handleGetStarted} onLogin={() => setShowAuth(true)} /> : <Navigate to="/matches" />
        } />
        <Route path="/matches" element={<MatchFeed />} />
        <Route path="/squads" element={<SquadsPage />} />
        <Route path="/feed" element={<PitchSideFeed onNavigateToProfile={() => navigate('/profile')} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {currentUser && !isKeyboardVisible && (
        <BottomNavbar />
      )}

      {/* Visual Debug Mode overlay for setup errors */}
      {!import.meta.env.VITE_FIREBASE_API_KEY && (
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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
