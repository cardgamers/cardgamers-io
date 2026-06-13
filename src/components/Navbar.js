import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const location = useLocation()
  const langRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  // Close lang dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setMobileOpen(false)
  }

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    setLangOpen(false)
    setMobileOpen(false)
  }

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const navLinks = [
    { to: '/lobby', label: t('nav.games') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
    { to: '/how-to-play', label: t('nav.howToPlay') },
    { to: '/tournaments', label: t('nav.tournaments') },
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
          {/* Language switcher */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button style={styles.langBtn} onClick={() => setLangOpen(!langOpen)} title="Change language">
              <span style={{ fontSize: '1rem' }}>{currentLang.flag}</span>
              {!isMobile && <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>{currentLang.code.toUpperCase()}</span>}
              <span style={{ opacity: 0.4, fontSize: '0.6rem' }}>▼</span>
            </button>
            {langOpen && (
              <div style={styles.langDropdown}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    style={{
                      ...styles.langItem,
                      ...(i18n.language === lang.code ? styles.langItemActive : {}),
                    }}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                    <Link to="/profile" style={styles.dropItem} onClick={() => setMenuOpen(false)}>{t('nav.myProfile')}</Link>
                    <Link to="/history" style={styles.dropItem} onClick={() => setMenuOpen(false)}>{t('nav.gameHistory')}</Link>
                    {profile?.plan === 'free' && (
                      <Link to="/upgrade" style={{ ...styles.dropItem, color: 'var(--gold)' }} onClick={() => setMenuOpen(false)}>{t('nav.upgradePlus')}</Link>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                    <button style={{ ...styles.dropItem, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(245,240,232,0.5)', cursor: 'pointer' }} onClick={handleSignOut}>{t('nav.signOut')}</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" style={styles.link}>{t('nav.signIn')}</Link>
                <Link to="/signup" className="btn-gold" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>{t('nav.playFree')}</Link>
              </div>
            )
          )}

          {isMobile && (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={styles.hamburger}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
        <div style={styles.mobileOverlay}>
          <div style={styles.mobileMenu}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={styles.mobileLink}>{l.label}</Link>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

            {/* Language options in mobile menu */}
            <div style={{ padding: '0.5rem 1rem 0.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Language</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    style={{
                      background: i18n.language === lang.code ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                      border: i18n.language === lang.code ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: i18n.language === lang.code ? 'var(--gold)' : 'rgba(245,240,232,0.6)',
                      padding: '0.3rem 0.6rem', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {lang.flag} {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0 0.25rem' }} />

            {user ? (
              <>
                <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...styles.avatar, width: 36, height: 36, fontSize: '1rem' }}>{profile?.username?.[0]?.toUpperCase() || '?'}</span>
                  <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{profile?.username}</span>
                  {profile?.plan !== 'free' && <span style={{ fontSize: '0.7rem', background: 'rgba(201,168,76,0.2)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{profile.plan.toUpperCase()}</span>}
                </div>
                <Link to="/profile" style={styles.mobileLink}>{t('nav.myProfile')}</Link>
                {profile?.plan === 'free' && (
                  <Link to="/upgrade" style={{ ...styles.mobileLink, color: 'var(--gold)' }}>{t('nav.upgradeMobile')}</Link>
                )}
                <button onClick={handleSignOut} style={{ ...styles.mobileLink, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(245,240,232,0.5)', cursor: 'pointer', fontSize: '1rem' }}>{t('nav.signOut')}</button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.mobileLink}>{t('nav.signIn')}</Link>
                <Link to="/signup" style={{ ...styles.mobileLink, color: 'var(--gold)', fontWeight: 600 }}>{t('nav.createAccount')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: '64px',
    background: 'rgba(15,34,25,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(201,168,76,0.15)',
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--gold)', textDecoration: 'none',
    flexShrink: 0,
  },
  links: { display: 'flex', gap: '2rem', alignItems: 'center' },
  link: { fontSize: '0.875rem', color: 'rgba(245,240,232,0.7)', textDecoration: 'none', fontWeight: 500 },
  right: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  langBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.2)',
    color: 'var(--cream)', padding: '0.35rem 0.6rem', borderRadius: '7px',
    cursor: 'pointer', lineHeight: 1,
  },
  langDropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: 'var(--felt-light)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '6px', minWidth: '150px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
  },
  langItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '0.45rem 0.75rem',
    fontSize: '0.875rem', color: 'rgba(245,240,232,0.8)',
    background: 'none', border: 'none', borderRadius: '6px',
    cursor: 'pointer', textAlign: 'left',
  },
  langItemActive: {
    background: 'rgba(201,168,76,0.15)',
    color: 'var(--gold)',
  },
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
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
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
  },
}
