import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Hero } from './components/Hero'
import { MatchFeed } from './components/MatchFeed'
import { AuthModal } from './components/AuthModal'
import { ProfilePage } from './components/ProfilePage'
import { SquadsPage } from './components/SquadsPage'
import { PitchSideFeed } from './components/PitchSideFeed'
import { NewsPage } from './components/NewsPage'
import { BottomNavbar } from './components/BottomNavbar'
import { useAuth } from './contexts/AuthContext'
import { AnimatePresence } from 'framer-motion'

export default function App() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.log(`🗺️ KIX ROUTE DEBUG: Current path is ${location.pathname}`);
  }, [location.pathname]);

  const [showAuth, setShowAuth] = useState(false)

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
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={
          !currentUser ? (
            <Hero
              onGetStarted={() => setShowAuth(true)}
              onLogin={() => setShowAuth(true)}
            />
          ) : (
            <Navigate to="/matches" replace />
          )
        } />
        <Route path="/matches" element={<MatchFeed />} />
        <Route path="/squads" element={<SquadsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/feed" element={<PitchSideFeed onNavigateToProfile={() => navigate('/profile')} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AnimatePresence>
        {showAuth && !currentUser && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>

      {currentUser && <BottomNavbar />}
    </>
  )
}
