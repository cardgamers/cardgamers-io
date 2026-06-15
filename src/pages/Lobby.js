import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const GAMES = [
  { id: 'solitaire', suit: '♣', name: 'Solitaire', desc: 'Klondike Solitaire. Perfect solo play.', players: '1 player', status: 'live', color: '#5DCAA5', path: '/game/solitaire', learnPath: '/learn/solitaire' },
  { id: 'bridge', suit: '♠', name: 'Bridge', desc: 'The flagship. 4-player contract bridge with full bidding.', players: '4 players', status: 'live', color: 'var(--gold)', path: '/game/bridge', learnPath: '/learn/bridge-intro' },
  { id: 'rummy', suit: '♥', name: 'Rummy', desc: 'Gin Rummy against real opponents. Sign in to play.', players: '2–4 players', status: 'live', color: '#c0392b', path: '/game/rummy', learnPath: '/learn/rummy', requiresAuth: true },
  { id: 'spades', suit: '♠', name: 'Spades', desc: 'Partnership bidding and trick-taking.', players: '4 players', status: 'live', color: 'var(--gold)', path: '/game/spades', learnPath: '/learn/spades' },
  { id: 'poker', suit: '♦', name: 'Poker', desc: "Texas Hold'em — coming soon!", players: '2–9 players', status: 'soon', color: '#85B7EB', path: '#' },
]

export default function Lobby() {
  const { profile, isGuest } = useAuth()

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div className="page-wrap" style={{ padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="display-title" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
            {isGuest
              ? `Playing as ${profile?.username} ♠`
              : profile
              ? `Welcome back, ${profile.username} ♠`
              : 'Game Lobby'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Choose a game and start playing in seconds</p>
        </div>

        {/* Guest nudge */}
        {isGuest && (
          <div style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                Playing as guest · {profile?.username}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 8 }}>
                Scores won't be saved
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/signup" className="btn-gold" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Create account</Link>
              <Link to="/login" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Sign in</Link>
            </div>
          </div>
        )}

        {/* Quick stats — real users only */}
        {!isGuest && profile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10, marginBottom: '2rem' }}>
            {[
              ['Rating', profile.rating || 1000],
              ['Games Played', profile.games_played || 0],
              ['Games Won', profile.games_won || 0],
              ['Plan', profile.plan?.toUpperCase() || 'FREE'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: label === 'Plan' && profile.plan !== 'free' ? 'var(--gold)' : 'var(--cream)' }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Games grid */}
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Choose your game</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {GAMES.map(game => {
            const needsLogin = game.requiresAuth && isGuest
            const isDisabled = game.status === 'soon'
            const destination = isDisabled ? '#' : needsLogin ? '/login' : game.path

            return (
              <div key={game.id} style={{
                background: 'var(--felt-light)',
                border: `1px solid ${isDisabled ? 'var(--border)' : 'rgba(201,168,76,0.2)'}`,
                borderRadius: 14, padding: '1.5rem',
                opacity: isDisabled ? 0.6 : 1,
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.15s',
              }}>
                {/* Badge row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{game.suit}</span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: isDisabled ? 'rgba(201,168,76,0.1)' : needsLogin ? 'rgba(255,255,255,0.07)' : 'rgba(29,158,117,0.2)',
                    color: isDisabled ? 'var(--gold)' : needsLogin ? 'var(--text-muted)' : 'var(--green-accent)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {isDisabled ? 'Coming soon' : needsLogin ? '🔒 Sign in' : 'Play now'}
                  </span>
                </div>

                {/* Game info */}
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--cream)' }}>{game.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem', flex: 1 }}>{game.desc}</div>
                <div style={{ fontSize: '0.75rem', color: game.color, fontWeight: 500, marginBottom: '1rem' }}>{game.players}</div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!isDisabled && (
                    <Link to={destination} style={{
                      flex: 1, textAlign: 'center', padding: '0.55rem 0.75rem',
                      borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                      background: 'var(--gold)', color: 'var(--felt-dark)',
                      cursor: 'pointer',
                    }}>
                      {needsLogin ? 'Sign in to play' : `Play ${game.name}`}
                    </Link>
                  )}
                  {game.learnPath && !isDisabled && (
                    <Link to={game.learnPath} style={{
                      padding: '0.55rem 0.75rem', borderRadius: 8, textDecoration: 'none',
                      fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(245,240,232,0.65)',
                    }}>
                      How to play
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Upgrade CTA — logged-in free users */}
        {!isGuest && profile?.plan === 'free' && (
          <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06))', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '0.3rem' }}>⭐ Upgrade to Plus — $6/month</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Remove all ads, unlock game history, custom avatar, and priority matchmaking.</div>
            </div>
            <Link to="/upgrade" className="btn-gold" style={{ flexShrink: 0 }}>Upgrade Now →</Link>
          </div>
        )}

        {/* Sign-up CTA — guests */}
        {isGuest && (
          <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, rgba(93,202,165,0.1), rgba(93,202,165,0.04))', border: '1px solid rgba(93,202,165,0.25)', borderRadius: 14, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#5DCAA5', marginBottom: '0.3rem' }}>🏆 Track your progress — it's free</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Create an account to save scores, appear on the leaderboard, earn badges, and unlock multiplayer Rummy.</div>
            </div>
            <Link to="/signup" className="btn-gold" style={{ flexShrink: 0 }}>Create free account →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
