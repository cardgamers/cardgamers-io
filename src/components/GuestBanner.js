import { Link } from 'react-router-dom'
import { useState } from 'react'

/**
 * Show after a game ends to nudge guests to sign up.
 * Usage: <GuestBanner /> — only renders for guests, null for real users.
 * Pass gameName for personalised message e.g. gameName="Bridge"
 */
export default function GuestBanner({ gameName }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.07))',
      border: '1px solid rgba(201,168,76,0.4)',
      borderRadius: 14,
      padding: '1.1rem 1.25rem',
      margin: '1rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 4, fontSize: '0.95rem' }}>
          🏆 Want to save your {gameName ? `${gameName} ` : ''}scores?
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Create a free account to appear on the leaderboard, track your stats, and unlock badges.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <Link to="/signup" className="btn-gold" style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem', whiteSpace: 'nowrap' }}>
          Sign up free →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem', lineHeight: 1 }}
          aria-label="Dismiss"
        >✕</button>
      </div>
    </div>
  )
}
