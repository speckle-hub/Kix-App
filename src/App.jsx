import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BottomNavbar } from './components/BottomNavbar'
import { Hero } from './components/Hero'
import { MatchFeed } from './components/MatchFeed'
import { AuthModal } from './components/AuthModal'
import { ProfilePage } from './components/ProfilePage'
import { SquadsPage } from './components/SquadsPage'
import { PitchSideFeed } from './components/PitchSideFeed'
import { NewsPage } from './components/NewsPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnimatePresence } from 'framer-motion'

export default function App() {
  const { currentUser } = useAuth()
  const location = useLocation()

  useEffect(() => {
    console.log(`🗺️ KIX ROUTE DEBUG: Current path is ${location.pathname}`);
  }, [location.pathname]);

  const [showAuth, setShowAuth] = useState(false)
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const navigate = useNavigate()

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

  useEffect(() => {
    if (currentUser) {
      setShowAuth(false)
    }
  }, [currentUser])

  // Global Click Debugger
  useEffect(() => {
    const handleGlobalClick = (e) => {
      console.log('🔍 KIX CLICK DEBUG:', {
        element: e.target,
        id: e.target.id,
        className: e.target.className,
        parent: e.target.parentElement?.className
      });
    };
    window.addEventListener('click', handleGlobalClick, true); // Use capture phase
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={
            !currentUser ? <Hero onGetStarted={handleGetStarted} onLogin={() => setShowAuth(true)} /> : <Navigate to="/matches" replace />
          } />
          <Route path="/matches" element={<MatchFeed />} />
          <Route path="/squads" element={<SquadsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/feed" element={<PitchSideFeed onNavigateToProfile={() => navigate('/profile')} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Visual Debug Mode overlay for setup errors */}
      {!import.meta.env.VITE_FIREBASE_API_KEY && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center z-[100] uppercase tracking-tighter pointer-events-none">
          Debug: Firebase API Key Missing
        </div>
      )}

      <AnimatePresence>
        {showAuth && !currentUser && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>

      {currentUser && !isKeyboardVisible && (
        <BottomNavbar />
      )}
    </>
  )
}
