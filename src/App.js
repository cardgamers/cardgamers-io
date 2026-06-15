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
import TeenPatti from './games/TeenPatti'
import Spades from './games/Spades'
import ComingSoon from './pages/ComingSoon'
import Contact from './pages/Contact'
import About from './pages/About'
import Games from './pages/Games'
import Tournaments from './pages/Tournaments'
import ContainerTycoon from './pages/ContainerTycoon'
import BridgeGuide from './pages/BridgeGuide'
import './index.css'

// Only used for routes that truly require a real account (multiplayer)
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

        {/* Open to guests — no login required */}
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/solitaire" element={<Solitaire />} />
        <Route path="/game/bridge" element={<Bridge />} />
        <Route path="/game/teen-patti" element={<TeenPatti />} />
        <Route path="/game/spades" element={<Spades />} />
        <Route path="/game/container-tycoon" element={<ContainerTycoon />} />

        {/* Multiplayer — requires real account */}
        <Route path="/game/rummy" element={<ProtectedRoute><Rummy /></ProtectedRoute>} />

        {/* Account-only pages */}
        <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Learn / SEO content */}
        <Route path="/learn/bridge" element={<BridgeGuide />} />

        {/* Info pages */}
        <Route path="/game/:gameId" element={<ComingSoon />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/about" element={<About />} />
        <Route path="/games" element={<Games />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/blog" element={<ComingSoon />} />
        <Route path="/contact" element={<Contact />} />
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
