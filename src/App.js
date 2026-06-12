import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { Login, Signup } from './pages/Auth'
import Lobby from './pages/Lobby'
import Leaderboard from './pages/Leaderboard'
import Upgrade from './pages/Upgrade'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import HowToPlay from './pages/HowToPlay'
import Profile from './pages/Profile'
import Solitaire from './games/Solitaire'
import Rummy from './games/Rummy'
import Bridge from './games/bridge/Bridge'
import ComingSoon from './pages/ComingSoon'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>CardGamers.io</div>
        <div style={{ fontSize: '0.875rem' }}>Loading...</div>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
        <Route path="/game/solitaire" element={<ProtectedRoute><Solitaire /></ProtectedRoute>} />
        <Route path="/game/rummy" element={<ProtectedRoute><Rummy /></ProtectedRoute>} />
        <Route path="/game/bridge" element={<ProtectedRoute><Bridge /></ProtectedRoute>} />
        <Route path="/game/:gameId" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
