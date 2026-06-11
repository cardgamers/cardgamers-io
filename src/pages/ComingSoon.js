import { Link, useParams } from 'react-router-dom'

const GAME_INFO = {
  bridge: { suit: '♠', name: 'Bridge', eta: 'Phase 2 — coming in 4 weeks' },
  rummy:  { suit: '♥', name: 'Rummy',  eta: 'Phase 2 — coming in 4 weeks' },
  spades: { suit: '♠', name: 'Spades', eta: 'Phase 3 — coming soon' },
  hearts: { suit: '♥', name: 'Hearts', eta: 'Phase 3 — coming soon' },
  poker:  { suit: '♦', name: 'Poker',  eta: 'Phase 4 — coming later' },
}

export default function ComingSoon() {
  const { gameId } = useParams()
  const info = GAME_INFO[gameId] || { suit: '♣', name: gameId, eta: 'Coming soon' }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.6 }}>{info.suit}</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.75rem' }}>
          {info.name} is coming
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          We're building a proper {info.name} experience — beautiful, fast, and with real opponents.
        </p>
        <p style={{ color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '2rem' }}>
          {info.eta}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/game/solitaire" className="btn-gold">Play Solitaire Now →</Link>
          <Link to="/lobby" className="btn-outline">Back to Lobby</Link>
        </div>
      </div>
    </div>
  )
}
