import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'));

// SAFETY CHECK: Critical Environment Variables
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  root.render(
    <div className="h-screen bg-black flex items-center justify-center p-10 text-center font-mono">
      <div className="space-y-4">
        <h1 className="text-red-500 text-2xl font-bold">⚠️ CONFIG ERROR ⚠️</h1>
        <p className="text-white/60">VITE_FIREBASE_API_KEY is missing.</p>
        <p className="text-white/20 text-xs">Add it to your environment variables.</p>
      </div>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <App />
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>
  );
}
