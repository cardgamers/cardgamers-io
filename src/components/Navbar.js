<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
=======
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
<<<<<<< HEAD
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location])
=======
  const navigate = useNavigate()
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287

  async function handleSignOut() {
    await signOut()
    navigate('/')
<<<<<<< HEAD
    setMobileOpen(false)
  }

  const navLinks = [
    { to: '/lobby', label: 'Games' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/tournaments', label: 'Tournaments' },
  ]

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>
          Card<span style={{ color: 'var(--cream)' }}>Gamers</span>.io
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <div style={styles.links}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={styles.link}>{l.label}</Link>
            ))}
          </div>
        )}

        <div style={styles.right}>
          {!isMobile && (
            user ? (
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
            )
          )}

          {/* Hamburger button - mobile only */}
          {isMobile && (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={styles.hamburger}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && mobileOpen && (
        <div style={styles.mobileOverlay}>
          <div style={styles.mobileMenu}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={styles.mobileLink}>{l.label}</Link>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            {user ? (
              <>
                <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...styles.avatar, width: 36, height: 36, fontSize: '1rem' }}>{profile?.username?.[0]?.toUpperCase() || '?'}</span>
                  <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{profile?.username}</span>
                  {profile?.plan !== 'free' && <span style={{ fontSize: '0.7rem', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{profile.plan.toUpperCase()}</span>}
                </div>
                <Link to="/profile" style={styles.mobileLink}>My Profile</Link>
                {profile?.plan === 'free' && (
                  <Link to="/upgrade" style={{ ...styles.mobileLink, color: 'var(--gold)' }}>⭐ Upgrade to Plus — $6/mo</Link>
                )}
                <button onClick={handleSignOut} style={{ ...styles.mobileLink, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(245,240,232,0.5)', cursor: 'pointer', fontSize: '1rem' }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.mobileLink}>Sign In</Link>
                <Link to="/signup" style={{ ...styles.mobileLink, color: 'var(--gold)', fontWeight: 600 }}>♠ Create Free Account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
=======
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
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
  )
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
<<<<<<< HEAD
    padding: '0 1.5rem', height: '64px',
    background: 'rgba(15,34,25,0.97)',
=======
    padding: '0 2rem', height: '64px',
    background: 'rgba(15,34,25,0.95)',
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(201,168,76,0.15)',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--gold)', textDecoration: 'none',
<<<<<<< HEAD
    flexShrink: 0,
=======
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
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
<<<<<<< HEAD
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
=======
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700,
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
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
<<<<<<< HEAD
  },
  hamburger: {
    background: 'none', border: '1px solid rgba(201,168,76,0.3)',
    color: 'var(--cream)', fontSize: '1.2rem',
    width: 40, height: 40, borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  mobileOverlay: {
    position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', zIndex: 99,
  },
  mobileMenu: {
    background: 'var(--felt-dark)', borderBottom: '1px solid var(--border)',
    padding: '0.5rem 0',
  },
  mobileLink: {
    display: 'block', padding: '0.85rem 1.5rem',
    fontSize: '1rem', color: 'rgba(245,240,232,0.85)',
    textDecoration: 'none', fontWeight: 500,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
=======
    transition: 'background 0.15s',
>>>>>>> 8c82dba69dcbdd005b3b9591f3709211ca120287
  },
}
