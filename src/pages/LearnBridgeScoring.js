import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const SECTIONS = [
  {
    id: 'rubber',
    title: 'Rubber Bridge Scoring',
    eyebrow: 'The Classic Format',
    content: `Rubber Bridge is the traditional home-game format — the one most people learn first. Points are scored below the line for contracts you bid and made, and above the line for bonuses (overtricks, honors, penalties). The first partnership to score 100 points below the line wins a game. Two games wins the rubber, which comes with a large bonus.`,
    detail: `Making your contract matters more than just taking extra tricks — bidding accurately and reaching game or slam contracts is where the real points are. Vulnerability increases both your bonuses and the penalties if you fail to make your contract.`,
    tip: 'Rubber Bridge rewards consistent partnership bidding and a willingness to push for game and slam contracts — the bonuses for bidding and making them are large.',
    table: [
      { label: 'Major suit trick (♥♠)', value: '30 pts each' },
      { label: 'Minor suit trick (♣♦)', value: '20 pts each' },
      { label: 'NT first trick', value: '40 pts' },
      { label: 'NT subsequent tricks', value: '30 pts each' },
      { label: 'Game bonus (not vul)', value: '+300 pts' },
      { label: 'Game bonus (vulnerable)', value: '+500 pts' },
      { label: 'Rubber bonus (2-0)', value: '+700 pts' },
      { label: 'Rubber bonus (2-1)', value: '+500 pts' },
    ]
  },
  {
    id: 'duplicate',
    title: 'Duplicate Bridge Scoring',
    eyebrow: 'Club & Tournament Format',
    content: `Duplicate Bridge is the format used in clubs and tournaments (including ACBL-sanctioned play). Instead of one long rubber, each hand is scored on its own, and the same hands are played by multiple pairs so results can be compared directly.`,
    detail: `Each board (hand) has its own score, calculated using standard bridge scoring. Because every pair plays the identical cards, Duplicate removes the luck of the deal from the comparison — you're being judged against others who had exactly the same hand. Results are then converted into either Matchpoints or IMPs, depending on the event.`,
    tip: 'Duplicate is the foundation format — Matchpoint and IMP scoring are simply two different ways of comparing Duplicate results across a field of players.',
    table: null
  },
  {
    id: 'matchpoints',
    title: 'Matchpoint Scoring',
    eyebrow: 'Pairs Events',
    content: `Matchpoint scoring (also called Pairs scoring) compares your result on each board against every other pair who played that same board. For each board, you earn one matchpoint for every pair you outscore, and half a matchpoint for every pair you tie.`,
    detail: `Because every point matters equally, Matchpoint play rewards squeezing out every possible trick — an overtrick is often the difference between a top and an average board. A hand that other formats would treat as "made the contract, fine" can swing your whole session in Matchpoints.`,
    tip: 'In Matchpoints, overtricks matter just as much as making the contract. Every extra trick is worth fighting for.',
    table: [
      { label: 'Beat every other pair', value: 'Top score' },
      { label: 'Beat half the field', value: 'Average score' },
      { label: 'Worse than all pairs', value: 'Bottom score' },
      { label: 'Tie with another pair', value: '½ matchpoint each' },
    ]
  },
  {
    id: 'imps',
    title: 'IMP Scoring',
    eyebrow: 'Team Events & Our Platform',
    content: `IMP scoring (International Match Points) is used in team events and on cardgamers.io. The raw point difference between results is converted into IMPs using the official WBF conversion table — small differences convert to few IMPs, large differences (like bidding a making game the other team missed) convert to many.`,
    detail: `Because the conversion table flattens out at the extremes, IMP scoring rewards avoiding disasters more than squeezing out marginal overtricks — a swing from bidding and making a vulnerable game is worth far more than one extra trick on a partscore hand. IMP scoring is generally considered closer to Rubber Bridge in spirit.`,
    tip: 'In IMPs, the biggest swings come from game and slam contracts. Missing a vulnerable game is a 6 IMP loss. Bidding and making a vulnerable slam is 13+ IMPs.',
    table: [
      { label: '20–40 pts difference', value: '1 IMP' },
      { label: '130–160 pts', value: '4 IMPs' },
      { label: '430–490 pts', value: '10 IMPs' },
      { label: '750–890 pts', value: '13 IMPs' },
      { label: '1500–1740 pts', value: '17 IMPs' },
      { label: '4000+ pts', value: '24 IMPs (max)' },
    ]
  },
]

function ScoringTable({ rows }) {
  if (!rows) return null
  return (
    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, overflow: 'hidden', marginTop: '1rem' }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 14px',
          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.65)' }}>{row.label}</span>
          <span style={{ fontSize: '0.88rem', color: 'var(--gold)', fontWeight: 700 }}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function LearnBridgeScoring() {
  usePageMeta('/learn/bridge/scoring')

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>♠ Bridge Knowledge Base</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--cream)', marginBottom: '0.6rem' }}>
            Bridge Scoring Systems Explained
          </h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 560, marginBottom: '1.25rem' }}>
            Rubber, Duplicate, IMP and Matchpoint scoring — explained simply so you know what you're playing for and why it changes how you should bid.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}>♠ Play Bridge Free →</Link>
            <Link to="/learn/bridge-intro" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(245,240,232,0.7)', textDecoration: 'none' }}>
              ← Beginner's guide
            </Link>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 1.5rem', overflowX: 'auto' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              fontSize: '0.78rem', padding: '4px 12px', borderRadius: 20,
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>{s.title}</a>
          ))}
        </div>
      </div>

      {/* Which format box */}
      <div style={{ maxWidth: 800, margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' }}>Which format will you actually see?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { context: 'Playing at home', format: 'Rubber Bridge' },
              { context: 'At a club game', format: 'Duplicate — Matchpoints' },
              { context: 'Team tournament', format: 'Duplicate — IMPs' },
              { context: 'On cardgamers.io', format: 'Rubber, Duplicate or IMPs' },
            ].map(({ context, format }) => (
              <div key={context} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.45)' }}>{context}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 600 }}>→ {format}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {SECTIONS.map((section, idx) => (
          <div key={section.id} id={section.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem',
          }}>
            {/* Section header */}
            <div style={{ background: 'rgba(26,26,46,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: 'var(--felt-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{idx + 1}</div>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{section.eyebrow}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: 'var(--cream)', margin: 0 }}>{section.title}</h2>
              </div>
            </div>

            {/* Section body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.92rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.85, marginBottom: '0.75rem' }}>{section.content}</p>
              <p style={{ fontSize: '0.88rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.8, marginBottom: '1rem' }}>{section.detail}</p>

              {section.table && <ScoringTable rows={section.table} />}

              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', gap: 8, marginTop: '1rem' }}>
                <span style={{ color: 'var(--gold)', flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: '0.82rem', color: 'var(--gold)', lineHeight: 1.6, margin: 0 }}>{section.tip}</p>
              </div>
            </div>
          </div>
        ))}

        {/* IMP conversion reference */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(26,26,46,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '1rem 1.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: 'var(--cream)', margin: 0 }}>Full IMP Conversion Table</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.8, marginBottom: '1rem' }}>
              The official WBF IMP scale converts the raw point difference between two results into IMPs. Small differences earn 1-3 IMPs; game swings earn 6-10; slam swings earn 11-17.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
              {[
                [0, 20, 0], [20, 50, 1], [50, 90, 2], [90, 130, 3], [130, 170, 4],
                [170, 220, 5], [220, 270, 6], [270, 320, 7], [320, 370, 8], [370, 430, 9],
                [430, 500, 10], [500, 600, 11], [600, 750, 12], [750, 900, 13], [900, 1100, 14],
                [1100, 1300, 15], [1300, 1500, 16], [1500, 1750, 17], [1750, 2000, 18], [2000, 2250, 19],
                [2250, 2500, 20], [2500, 3000, 21], [3000, 3500, 22], [3500, 4000, 23], [4000, null, 24],
              ].map(([lo, hi, imp]) => (
                <div key={imp} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)' }}>
                    {hi ? `${lo}–${hi}` : `${lo}+`}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 700 }}>{imp} IMP{imp !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Continue learning</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Link to="/learn/bridge-intro" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, color: 'var(--gold)', textDecoration: 'none' }}>♠ Beginner's Guide to Bridge</Link>
            <Link to="/learn/bridge" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'rgba(245,240,232,0.65)', textDecoration: 'none' }}>Full 11-chapter Bridge Guide →</Link>
          </div>
          <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem', display: 'inline-flex' }}>♠ Play Bridge with IMP Scoring →</Link>
        </div>
      </div>
    </div>
  )
}
