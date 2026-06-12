import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const GAMES = [
  { id: 'bridge', suit: '♠', name: 'Bridge', desc: 'The ultimate card game. Bidding, strategy, and partnership across 4 players.', players: '4 players · Contract & Rubber', status: 'live', path: '/game/bridge' },
  { id: 'rummy', suit: '♥', name: 'Rummy', desc: 'Build melds and go out first. Fast, satisfying, endlessly replayable.', players: '2–4 players · Gin & Indian', status: 'live', path: '/game/rummy' },
  { id: 'teen-patti', suit: '🪔', name: 'Teen Patti', desc: 'The royal Indian card game. Classic, Muflis and AK47 variants. तीन पत्ती', players: '2–4 players · 3 variants', status: 'live', path: '/game/teen-patti' },
  { id: 'solitaire', suit: '♣', name: 'Solitaire', desc: 'Klondike Solitaire. Play at your own pace, any time.', players: '1 player · Klondike', status: 'live', path: '/game/solitaire' },
  { id: 'spades', suit: '♠', name: 'Spades', desc: 'Team up, bid your tricks, and outplay the opposition.', players: '4 players · Partnership', status: 'soon', path: '#' },
  { id: 'poker', suit: '♦', name: 'Poker', desc: 'Texas Hold\'em with fun chips. No real money, all the strategy.', players: '2–9 players · Hold\'em', status: 'soon', path: '#' },
]

export default function Home() {
  const [onlineCount, setOnlineCount] = useState(247)

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(c => Math.max(180, Math.min(400, c + Math.floor(Math.random() * 7) - 3)))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Online bar */}
      <div style={s.onlineBar}>
        <span style={s.onlineDot} />
        <strong>{onlineCount}</strong> players online right now
      </div>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        {/* floating card decorations */}
        {[
          { top: '18%', left: '7%', rotate: '-18deg' },
          { top: '22%', right: '9%', rotate: '14deg' },
          { bottom: '28%', left: '11%', rotate: '8deg' },
          { bottom: '22%', right: '7%', rotate: '-12deg' },
        ].map((pos, i) => (
          <div key={i} style={{ ...s.floatCard, ...pos, animationDelay: `${i * 1.5}s` }} />
        ))}

        <div style={s.heroContent} className="fade-in">
          <div style={s.eyebrow}>
            <span style={s.eyebrowDot} />
            Free to play · No download needed
          </div>
          <h1 style={s.heroTitle}>
            The card table<br />
            <span style={{ color: 'var(--gold)' }}>the world plays at</span>
          </h1>
          <p style={s.heroSub}>
            Bridge, Rummy, Spades, Hearts — beautifully designed,
            real opponents, live tournaments. Play from any device, any time.
          </p>
          <div style={s.heroActions}>
            <Link to="/signup" className="btn-gold" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              ♠ Start Playing Free
            </Link>
            <a href="#games" className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              Browse Games →
            </a>
          </div>
          <div style={s.heroStats}>
            {[['6', 'Card Games'], ['24/7', 'Live Opponents'], ['Free', 'Always'], ['No', 'Download']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <span style={s.statNum}>{num}</span>
                <span style={s.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section style={s.section} id="games">
        <div className="page-wrap">
          <span className="section-eye">The games</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
            Every great card game, in one place
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: 480, lineHeight: 1.7 }}>
            All games are free to play against real opponents worldwide.
          </p>
          <div style={s.gamesGrid}>
            {GAMES.map(game => (
              <Link key={game.id} to={game.path} style={{ ...s.gameCard, ...(game.status === 'live' ? s.gameCardLive : {}) }}>
                <span style={{ ...s.gameBadge, ...(game.status === 'live' ? s.badgeLive : s.badgeSoon) }}>
                  {game.status === 'live' ? 'Live now' : 'Coming soon'}
                </span>
                <span style={s.gameSuit}>{game.suit}</span>
                <div style={s.gameName}>{game.name}</div>
                <div style={s.gameDesc}>{game.desc}</div>
                <div style={s.gamePlayers}>{game.players}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, background: 'rgba(15,34,25,0.6)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-wrap">
          <span className="section-eye">How it works</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>Up and playing in 60 seconds</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: 480, lineHeight: 1.7 }}>No downloads, no installs, no credit card.</p>
          <div style={s.stepsGrid}>
            {[
              ['01', 'Create a free account', 'Sign up with email or Google. Under a minute. Your stats are saved from game one.'],
              ['02', 'Pick your game', 'Choose from Bridge, Rummy, Spades, Hearts, or Solitaire. Live lobbies always have players waiting.'],
              ['03', 'Join or create a table', 'Jump into an open game or create a private room. Invite friends with a link.'],
              ['04', 'Play and level up', 'Your rating updates after every game. Climb the leaderboard and join weekly tournaments.'],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <div style={s.stepNum}>{num}</div>
                <div style={s.stepTitle}>{title}</div>
                <div style={s.stepDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={s.section} id="pricing">
        <div className="page-wrap" style={{ textAlign: 'center' }}>
          <span className="section-eye">Pricing</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>Always free to play</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: 480, margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Go ad-free and unlock the full experience for less than a coffee a month.
          </p>
          <div style={s.pricingGrid}>
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['All card games', 'Live multiplayer', 'Basic stats & rankings', 'Public tournaments'], negative: ['Ads between hands', 'Limited game history'], cta: 'Play Free', featured: false },
              { name: 'Plus', price: '$6', period: '/month · cancel anytime', features: ['Everything in Free', 'Zero ads, ever', 'Full game history & replays', 'Custom avatar & profile', 'Priority matchmaking', 'Monthly tournament entries'], cta: 'Get Plus →', featured: true },
              { name: 'Club', price: '$30', period: '/month for your whole club', features: ['Private club room', 'Up to 20 members', 'Club leaderboard', 'Host your own tournaments', 'All Plus features included', 'Club admin dashboard'], cta: 'Start a Club', featured: false },
            ].map(plan => (
              <div key={plan.name} style={{ ...s.priceCard, ...(plan.featured ? s.priceCardFeatured : {}) }}>
                {plan.featured && <span style={s.featuredBadge}>Most Popular</span>}
                <div style={s.planName}>{plan.name}</div>
                <div style={s.planPrice}>{plan.price}<span style={{ fontSize: '1.1rem', opacity: 0.5 }}>{plan.name !== 'Free' ? '' : ''}</span></div>
                <div style={s.planPeriod}>{plan.period}</div>
                <ul style={{ listStyle: 'none', marginBottom: '1.5rem', textAlign: 'left' }}>
                  {plan.features.map(f => <li key={f} style={s.planFeature}><span style={{ color: 'var(--green-accent)' }}>✓</span> {f}</li>)}
                  {plan.negative?.map(f => <li key={f} style={{ ...s.planFeature, opacity: 0.35 }}>✗ {f}</li>)}
                </ul>
                <Link to={plan.featured ? '/upgrade' : '/signup'} style={{ ...s.planBtn, ...(plan.featured ? s.planBtnGold : s.planBtnOutline) }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div className="page-wrap">
          <div style={s.footerInner}>
            <span style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 700 }}>
              Card<span style={{ color: 'var(--cream)' }}>Gamers</span>.io
            </span>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {['About', 'Games', 'Tournaments', 'Leaderboard', 'Blog', 'Privacy Policy', 'Terms of Service', 'Contact'].map(l => (
                <Link key={l} to="/" style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)' }}>{l}</Link>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(245,240,232,0.06)', fontSize: '0.8rem', color: 'rgba(245,240,232,0.3)' }}>
            © 2026 CardGamers.io — Play card games online free. Built for card players everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}

const s = {
  onlineBar: { background: 'rgba(29,158,117,0.12)', borderBottom: '1px solid rgba(29,158,117,0.2)', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--green-accent)', fontWeight: 500, marginTop: 64 },
  onlineDot: { display: 'inline-block', width: 7, height: 7, background: 'var(--green-accent)', borderRadius: '50%', marginRight: 6, animation: 'pulse 2s ease-in-out infinite' },
  hero: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 4rem', position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(35,77,56,0.6) 0%, transparent 70%), var(--felt-dark)' },
  floatCard: { position: 'absolute', width: 55, height: 78, borderRadius: 6, border: '1px solid rgba(201,168,76,0.2)', opacity: 0.1, background: 'white', animation: 'floatA 9s ease-in-out infinite' },
  heroContent: { position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 780 },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1.5rem', padding: '0.35rem 1rem', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20 },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s ease-in-out infinite' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '1.5rem', color: 'var(--cream)' },
  heroSub: { fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'rgba(245,240,232,0.65)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 2.5rem', fontWeight: 400 },
  heroActions: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' },
  heroStats: { display: 'flex', gap: '2.5rem', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.15)' },
  statNum: { fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)', display: 'block' },
  statLabel: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' },
  section: { padding: '5rem 0' },
  gamesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.1rem' },
  gameCard: { background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' },
  gameCardLive: { borderColor: 'rgba(201,168,76,0.25)' },
  gameBadge: { display: 'inline-block', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginBottom: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  badgeLive: { background: 'rgba(29,158,117,0.2)', color: 'var(--green-accent)' },
  badgeSoon: { background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' },
  gameSuit: { fontSize: '2.2rem', marginBottom: '0.6rem', display: 'block', lineHeight: 1 },
  gameName: { fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.35rem' },
  gameDesc: { fontSize: '0.83rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6 },
  gamePlayers: { fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.9rem', fontWeight: 500 },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '2rem' },
  stepNum: { fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', fontWeight: 900, color: 'rgba(201,168,76,0.2)', lineHeight: 1, marginBottom: '0.75rem' },
  stepTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '0.5rem' },
  stepDesc: { fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 },
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', maxWidth: 860, margin: '0 auto' },
  priceCard: { background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', position: 'relative', textAlign: 'left' },
  priceCardFeatured: { border: '2px solid var(--gold)' },
  featuredBadge: { position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--felt-dark)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', padding: '3px 14px', borderRadius: 20, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  planName: { fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)', marginBottom: '0.6rem' },
  planPrice: { fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, marginBottom: '0.2rem' },
  planPeriod: { fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.25rem' },
  planFeature: { fontSize: '0.875rem', color: 'rgba(245,240,232,0.7)', padding: '0.35rem 0', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(245,240,232,0.06)' },
  planBtn: { display: 'block', width: '100%', padding: '0.7rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', border: 'none', cursor: 'pointer', textDecoration: 'none' },
  planBtnGold: { background: 'var(--gold)', color: 'var(--felt-dark)' },
  planBtnOutline: { background: 'transparent', border: '1px solid rgba(245,240,232,0.2)', color: 'var(--cream)' },
  footer: { background: 'var(--felt-dark)', borderTop: '1px solid var(--border)', padding: '3rem 0' },
  footerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' },
}
