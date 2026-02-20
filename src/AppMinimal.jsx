import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Hero } from './components/Hero'
import { MatchFeed } from './components/MatchFeed'
import { MatchDetails } from './components/MatchDetails'
import { CreateMatch } from './components/CreateMatch'
import { CreateRequest } from './components/CreateRequest'
import { AuthModal } from './components/AuthModal'
import { ProfilePage } from './components/ProfilePage'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }) {
    const { currentUser } = useAuth()
    return currentUser ? children : <Navigate to="/" replace />
}

export default function App() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const [showAuth, setShowAuth] = useState(false)

    return (
        <>
            <Routes>
                <Route path="/" element={
                    !currentUser ? (
                        <Hero onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />
                    ) : (
                        <Navigate to="/matches" replace />
                    )
                } />
                <Route path="/matches" element={<ProtectedRoute><MatchFeed /></ProtectedRoute>} />
                <Route path="/matches/create" element={<ProtectedRoute><CreateMatch /></ProtectedRoute>} />
                <Route path="/matches/request" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
                <Route path="/matches/:matchId" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {showAuth && !currentUser && (
                <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
            )}
        </>
    )
}
