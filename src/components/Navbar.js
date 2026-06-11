import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        Card<span style={{ color: 'var(--cream)' }}>Gamers</span>.io
      </Link>

      <div style={styles.links}>
        <Link to="/lobby" style={styles.link}>Games</Link>
        <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
        <Link to="/tournaments" style={styles.link}>Tournaments</Link>
      </div>

      <div style={styles.right}>
        {user ? (
          <div style={styles.userMenu}>
            <button style={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
              <span style={styles.avatar}>{profile?.username?.[0]?.toUpperCase() || '?'}</span>
              <span style={{ fontSize: '0.875rem' }}>{profile?.username}</span>
              <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>▼</span>
            </button>
            {menuOpen && (
              <div style={styles.dropdown}>
                <Link to="/profile" style={styles.dropItem} onClick={() => setMenuOpen(false)}>My Profile</Link>
                <Link to="/history" style={styles.dropItem} onClick={() => setMenuOpen(false)}>Game History</Link>
                {profile?.plan === 'free' && (
                  <Link to="/upgrade" style={{ ...styles.dropItem, color: 'var(--gold)' }} onClick={() => setMenuOpen(false)}>⭐ Upgrade to Plus</Link>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button style={{ ...styles.dropItem, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(245,240,232,0.5)', cursor: 'pointer' }} onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" style={styles.link}>Sign In</Link>
            <Link to="/signup" className="btn-gold" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>Play Free →</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
    background: 'rgba(15,34,25,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(201,168,76,0.15)',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--gold)', textDecoration: 'none',
  },
  links: { display: 'flex', gap: '2rem', alignItems: 'center' },
  link: { fontSize: '0.875rem', color: 'rgba(245,240,232,0.7)', textDecoration: 'none', fontWeight: 500 },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userMenu: { position: 'relative' },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
    color: 'var(--cream)', padding: '0.4rem 0.75rem', borderRadius: '8px',
    cursor: 'pointer',
  },
  avatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--gold)', color: 'var(--felt-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700,
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: 'var(--felt-light)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '6px', minWidth: '180px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  dropItem: {
    display: 'block', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', color: 'rgba(245,240,232,0.8)',
    borderRadius: '6px', textDecoration: 'none',
    transition: 'background 0.15s',
  },
}
