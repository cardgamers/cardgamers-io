import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const GAME_KEYS = [
  { id: 'bridge',    suit: '♠', name: 'Bridge',     key: 'bridge',    status: 'live',  path: '/game/bridge' },
  { id: 'rummy',     suit: '♥', name: 'Rummy',      key: 'rummy',     status: 'live',  path: '/game/rummy' },
  { id: 'teen-patti',suit: '🪔', name: 'Teen Patti', key: 'teenPatti', status: 'live',  path: '/game/teen-patti' },
  { id: 'solitaire', suit: '♣', name: 'Solitaire',  key: 'solitaire', status: 'live',  path: '/game/solitaire' },
  { id: 'spades',    suit: '♠', name: 'Spades',     key: 'spades',    status: 'soon',  path: '#' },
  { id: 'poker',     suit: '♦', name: 'Poker',      key: 'poker',     status: 'soon',  path: '#' },
]

export default function Home() {
  const { t } = useTranslation()
  const [onlineCount, setOnlineCount] = useState(247)

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(c => Math.max(180, Math.min(400, c + Math.floor(Math.random() * 7) - 3)))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const steps = t('home.howItWorks.steps', { returnObjects: true })

  return (
    <div>
      {/* Online bar */}
      <div style={s.onlineBar}>
        <span style={s.onlineDot} />
        <span dangerouslySetInnerHTML={{ __html: t('home.onlineBar', { count: onlineCount }) }} />
      </div>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBg} />
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
            {t('home.eyebrow')}
          </div>
          <h1 style={s.heroTitle}>
            {t('home.heroTitle1')}<br />
            <span style={{ color: 'var(--gold)' }}>{t('home.heroTitle2')}</span>
          </h1>
          <p style={s.heroSub}>{t('home.heroSub')}</p>
          <div style={s.heroActions}>
            <Link to="/signup" className="btn-gold" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              {t('home.startPlaying')}
            </Link>
            <a href="#games" className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              {t('home.browseGames')}
            </a>
          </div>
          <div style={s.heroStats}>
            {[
              ['6', t('home.stats.games')],
              [t('home.stats.liveLabel'), t('home.stats.opponents')],
              [t('home.stats.freeLabel'), t('home.stats.free')],
              [t('home.stats.noLabel'), t('home.stats.download')],
            ].map(([num, label]) => (
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
          <span className="section-eye">{t('home.gamesSection.eye')}</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
            {t('home.gamesSection.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: 480, lineHeight: 1.7 }}>
            {t('home.gamesSection.sub')}
          </p>
          <div style={s.gamesGrid}>
            {GAME_KEYS.map(game => (
              <Link key={game.id} to={game.path} style={{ ...s.gameCard, ...(game.status === 'live' ? s.gameCardLive : {}) }}>
                <span style={{ ...s.gameBadge, ...(game.status === 'live' ? s.badgeLive : s.badgeSoon) }}>
                  {game.status === 'live' ? t('home.badge.live') : t('home.badge.soon')}
                </span>
                <span style={s.gameSuit}>{game.suit}</span>
                <div style={s.gameName}>{game.name}</div>
                <div style={s.gameDesc}>{t(`home.games.${game.key}.desc`)}</div>
                <div style={s.gamePlayers}>{t(`home.games.${game.key}.players`)}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, background: 'rgba(15,34,25,0.6)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-wrap">
          <span className="section-eye">{t('home.howItWorks.eye')}</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
            {t('home.howItWorks.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: 480, lineHeight: 1.7 }}>
            {t('home.howItWorks.sub')}
          </p>
          <div style={s.stepsGrid}>
            {steps.map(step => (
              <div key={step.num}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={s.section} id="pricing">
        <div className="page-wrap" style={{ textAlign: 'center' }}>
          <span className="section-eye">{t('home.pricing.eye')}</span>
          <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
            {t('home.pricing.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: 480, margin: '0 auto 3rem', lineHeight: 1.7 }}>
            {t('home.pricing.sub')}
          </p>
          <div style={s.pricingGrid}>
            {[
              { name: 'Free',  price: '$0',  planKey: 'free',  featured: false, link: '/signup' },
              { name: 'Plus',  price: '$6',  planKey: 'plus',  featured: true,  link: '/upgrade' },
              { name: 'Club',  price: '$30', planKey: 'club',  featured: false, link: '/signup' },
            ].map(plan => {
              const p = t(`home.pricing.plans.${plan.planKey}`, { returnObjects: true })
              return (
                <div key={plan.name} style={{ ...s.priceCard, ...(plan.featured ? s.priceCardFeatured : {}) }}>
                  {plan.featured && <span style={s.featuredBadge}>{t('home.pricing.mostPopular')}</span>}
                  <div style={s.planName}>{plan.name}</div>
                  <div style={s.planPrice}>{plan.price}</div>
                  <div style={s.planPeriod}>{p.period}</div>
                  <ul style={{ listStyle: 'none', marginBottom: '1.5rem', textAlign: 'left' }}>
                    {p.features.map(f => <li key={f} style={s.planFeature}><span style={{ color: 'var(--green-accent)' }}>✓</span> {f}</li>)}
                    {p.negative?.map(f => <li key={f} style={{ ...s.planFeature, opacity: 0.35 }}>✗ {f}</li>)}
                  </ul>
                  <Link to={plan.link} style={{ ...s.planBtn, ...(plan.featured ? s.planBtnGold : s.planBtnOutline) }}>
                    {p.cta}
                  </Link>
                </div>
              )
            })}
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
              {t('home.footer.links', { returnObjects: true }).map(l => (
                <Link key={l} to="/" style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)' }}>{l}</Link>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(245,240,232,0.06)', fontSize: '0.8rem', color: 'rgba(245,240,232,0.3)' }}>
            {t('home.footer.copy')}
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
