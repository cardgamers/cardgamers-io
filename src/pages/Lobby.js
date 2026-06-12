import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const GAMES = [
  { id: 'solitaire', suit: '♣', name: 'Solitaire', desc: 'Klondike Solitaire. Perfect solo play.', players: '1 player', status: 'live', color: '#5DCAA5', path: '/game/solitaire' },
  { id: 'bridge', suit: '♠', name: 'Bridge', desc: 'The flagship. 4-player contract bridge with full bidding.', players: '4 players', status: 'live', color: 'var(--gold)', path: '/game/bridge' },
  { id: 'rummy', suit: '♥', name: 'Rummy', desc: 'Gin Rummy against real opponents.', players: '2–4 players', status: 'live', color: '#c0392b', path: '/game/rummy' },
  { id: 'teen-patti', suit: '🪔', name: 'Teen Patti', desc: 'The royal Indian card game. Classic, Muflis and AK47 variants.', players: '2–4 players', status: 'live', color: '#FFD700', path: '/game/teen-patti' },
  { id: 'spades', suit: '♠', name: 'Spades', desc: 'Partnership bidding and trick-taking.', players: '4 players', status: 'soon', color: 'var(--gold)', path: '#' },
  { id: 'poker', suit: '♦', name: 'Poker', desc: "Texas Hold'em — coming soon!", players: '2–9 players', status: 'soon', color: '#85B7EB', path: '#' },
]

export default function Lobby() {
  const { profile } = useAuth()

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div className="page-wrap" style={{ padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="display-title" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
            {profile ? `Welcome back, ${profile.username} ♠` : 'Game Lobby'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Choose a game and start playing in seconds</p>
        </div>

        {/* Quick stats if logged in */}
        {profile && (
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
          {GAMES.map(game => (
            <Link
              key={game.id}
              to={game.status === 'live' ? game.path : '#'}
              style={{
                background: 'var(--felt-light)', border: `1px solid ${game.status === 'live' ? 'rgba(201,168,76,0.2)' : 'var(--border)'}`,
                borderRadius: 14, padding: '1.5rem', textDecoration: 'none',
                opacity: game.status === 'soon' ? 0.6 : 1,
                cursor: game.status === 'soon' ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s, border-color 0.15s',
                display: 'block',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{game.suit}</span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: game.status === 'live' ? 'rgba(29,158,117,0.2)' : 'rgba(201,168,76,0.1)',
                  color: game.status === 'live' ? 'var(--green-accent)' : 'var(--gold)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {game.status === 'live' ? 'Play now' : 'Coming soon'}
                </span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--cream)' }}>{game.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>{game.desc}</div>
              <div style={{ fontSize: '0.75rem', color: game.color, fontWeight: 500 }}>{game.players}</div>
            </Link>
          ))}
        </div>

        {/* Upgrade CTA for free users */}
        {profile?.plan === 'free' && (
          <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06))', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 14, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '0.3rem' }}>⭐ Upgrade to Plus — $6/month</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Remove all ads, unlock game history, custom avatar, and priority matchmaking.</div>
            </div>
            <Link to="/upgrade" className="btn-gold" style={{ flexShrink: 0 }}>Upgrade Now →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
