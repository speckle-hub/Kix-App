console.log("🚀 KIX: App Execution Started...");
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.jsx'

console.log("🏗️ KIX: Mounting React Root...");

const root = createRoot(document.getElementById('root'));

// SAFETY CHECK: Critical Environment Variables
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error("❌ FATAL: VITE_FIREBASE_API_KEY is missing!");
  root.render(
    <div style={{
      backgroundColor: '#111',
      color: '#ff4444',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️ CONFIGURATION ERROR ⚠️</h1>
      <p>The <code>VITE_FIREBASE_API_KEY</code> is missing.</p>
      <br />
      <p style={{ color: '#888' }}>Please add your Environment Variables in the Vercel Dashboard.</p>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>,
  )
}
