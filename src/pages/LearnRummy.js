import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const CARD_COLORS = { '♠': '#1a1a2e', '♣': '#1a1a2e', '♥': '#c0392b', '♦': '#c0392b' }

function Card({ value, suit, faceDown, highlight, selected, dim }) {
  const w = 52, h = 72
  const col = CARD_COLORS[suit] || '#1a1a2e'
  if (faceDown) return (
    <div style={{ width: w, height: h, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,#1a3a6a,#0f2245)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', opacity: dim ? 0.4 : 1 }} />
  )
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, flexShrink: 0,
      background: selected ? '#fffde7' : highlight ? '#e8f5e9' : 'white',
      border: `2px solid ${highlight ? '#2e7d32' : selected ? '#c9a84c' : '#ccc'}`,
      boxShadow: highlight ? '0 0 0 3px rgba(46,125,50,0.35)' : selected ? '0 0 0 3px rgba(201,168,76,0.4)' : '0 2px 5px rgba(0,0,0,0.2)',
      position: 'relative', userSelect: 'none', opacity: dim ? 0.35 : 1,
      transform: selected ? 'translateY(-8px)' : highlight ? 'translateY(-4px)' : 'none',
      transition: 'transform 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 3, left: 4, fontSize: 11, fontWeight: 800, color: col, lineHeight: 1 }}>{value}</div>
      <div style={{ position: 'absolute', top: 15, left: 4, fontSize: 10, color: col, lineHeight: 1 }}>{suit}</div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 16, color: col }}>{suit}</div>
      <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 11, fontWeight: 800, color: col, lineHeight: 1, transform: 'rotate(180deg)' }}>{value}</div>
    </div>
  )
}

function Hand({ cards, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {label && <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.45)', marginBottom: 8 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {cards.map((c, i) => <Card key={i} {...c} />)}
      </div>
    </div>
  )
}

function MeldGroup({ cards, label, valid }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {label && <div style={{ fontSize: '0.65rem', color: valid ? '#5DCAA5' : '#c0392b', marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderRadius: 10, background: valid ? 'rgba(93,202,165,0.1)' : 'rgba(192,57,43,0.1)', border: `1px solid ${valid ? 'rgba(93,202,165,0.3)' : 'rgba(192,57,43,0.3)'}` }}>
        {cards.map((c, i) => <Card key={i} {...c} highlight={valid} />)}
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'The Goal — Form Melds Before Your Opponent',
    desc: 'Rummy is a race. You and your opponent each start with 10 cards. Your goal is to arrange all your cards into valid melds — Sets or Runs — before your opponent does. The first player to meld all their cards wins.',
    tip: 'You win by going out — discarding your last card after forming valid melds. Or knock early if your unmelded cards total 10 or fewer points.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 8 }}>Your hand — aim to form these melds:</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <MeldGroup cards={[{ value: '7', suit: '♠' }, { value: '7', suit: '♥' }, { value: '7', suit: '♦' }]} label="✓ Set (three 7s)" valid />
            <MeldGroup cards={[{ value: '4', suit: '♥' }, { value: '5', suit: '♥' }, { value: '6', suit: '♥' }, { value: '7', suit: '♥' }]} label="✓ Run (4-5-6-7 Hearts)" valid />
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Sets and Runs — The Two Types of Meld',
    desc: 'A Set is 3 or 4 cards of the same rank in different suits. A Run is 3 or more consecutive cards of the same suit. These are the only two valid melds in Rummy. Every card in your hand must eventually belong to a meld to go out.',
    tip: 'Ace is low in Rummy — it counts as 1 and can only start a run (A-2-3), not end one (Q-K-A is not valid).',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textAlign: 'center', marginBottom: 8, fontWeight: 700 }}>SETS — Same rank, different suits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MeldGroup cards={[{ value: 'K', suit: '♠' }, { value: 'K', suit: '♥' }, { value: 'K', suit: '♦' }]} label="✓ Valid Set" valid />
              <MeldGroup cards={[{ value: '5', suit: '♠' }, { value: '5', suit: '♣' }, { value: '5', suit: '♥' }, { value: '5', suit: '♦' }]} label="✓ Valid Set (4 cards)" valid />
              <MeldGroup cards={[{ value: '9', suit: '♥' }, { value: '9', suit: '♥' }, { value: '9', suit: '♦' }]} label="✗ Invalid — two of same suit" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textAlign: 'center', marginBottom: 8, fontWeight: 700 }}>RUNS — Same suit, consecutive</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MeldGroup cards={[{ value: 'J', suit: '♣' }, { value: 'Q', suit: '♣' }, { value: 'K', suit: '♣' }]} label="✓ Valid Run" valid />
              <MeldGroup cards={[{ value: 'A', suit: '♦' }, { value: '2', suit: '♦' }, { value: '3', suit: '♦' }, { value: '4', suit: '♦' }]} label="✓ Valid Run (4 cards)" valid />
              <MeldGroup cards={[{ value: '6', suit: '♠' }, { value: '7', suit: '♥' }, { value: '8', suit: '♠' }]} label="✗ Invalid — mixed suits" />
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Your Turn — Draw Then Discard',
    desc: 'Every turn has exactly two steps: first Draw, then Discard. Draw one card from either the face-down Stock pile or the top of the face-up Discard pile. Then discard one card from your hand face-up. You cannot end a turn without discarding.',
    tip: 'Only take from the Discard pile if that card completes or significantly advances a meld. Otherwise draw from the Stock — don\'t give your opponent information about what you need.',
    render: () => (
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginBottom: 8, fontWeight: 600 }}>Step 1: Draw</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 52, height: 72, margin: '0 auto 6px' }}>
                {[1,0].map(i => <div key={i} style={{ position: 'absolute', top: -i*2, left: -i*2 }}><Card faceDown /></div>)}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.4)' }}>Stock</div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>or</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 6 }}><Card value="8" suit="♥" highlight /></div>
              <div style={{ fontSize: '0.6rem', color: 'var(--gold)' }}>Discard pile top</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 40, fontSize: '1.3rem', color: 'var(--gold)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginBottom: 8, fontWeight: 600 }}>Step 2: Discard</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
            {[
              { value: '6', suit: '♥' }, { value: '7', suit: '♥' }, { value: '8', suit: '♥' },
              { value: 'J', suit: '♠' }, { value: 'J', suit: '♦' }, { value: 'J', suit: '♣' },
              { value: '2', suit: '♣' }, { value: '5', suit: '♦' }, { value: 'K', suit: '♠' }, { value: '3', suit: '♠' },
              { value: 'K', suit: '♠', selected: true, dim: false },
            ].map((c, i) => <Card key={i} {...c} />)}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.5)', marginTop: 6 }}>Discard the unconnected K♠</div>
        </div>
      </div>
    )
  },
  {
    title: 'Knocking — Going Out Early',
    desc: 'You don\'t have to wait until all cards are melded. You can Knock when your remaining unmelded cards (deadwood) total 10 points or less. This ends the round. If your deadwood is lower than your opponent\'s, you win the difference in points. But be careful — if your opponent has fewer deadwood points than you, they win instead (an Undercut!).',
    tip: 'Face cards (J, Q, K) are worth 10 points each. Number cards are worth face value. Ace = 1 point.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginBottom: 8, fontWeight: 600 }}>Your hand — can you knock?</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#5DCAA5', marginBottom: 4, textAlign: 'center' }}>Melded</div>
                <div style={{ display: 'flex', gap: 3, padding: '6px', borderRadius: 8, background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.25)' }}>
                  {[{ value: '9', suit: '♣' }, { value: '9', suit: '♥' }, { value: '9', suit: '♦' }].map((c, i) => <Card key={i} {...c} highlight />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#5DCAA5', marginBottom: 4, textAlign: 'center' }}>Melded</div>
                <div style={{ display: 'flex', gap: 3, padding: '6px', borderRadius: 8, background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.25)' }}>
                  {[{ value: '4', suit: '♠' }, { value: '5', suit: '♠' }, { value: '6', suit: '♠' }].map((c, i) => <Card key={i} {...c} highlight />)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#c0392b', marginBottom: 4, textAlign: 'center' }}>Deadwood (7 pts)</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[{ value: '3', suit: '♥' }, { value: '4', suit: '♦' }].map((c, i) => <Card key={i} {...c} dim />)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, padding: '6px 14px', background: 'rgba(93,202,165,0.15)', border: '1px solid rgba(93,202,165,0.3)', borderRadius: 20, display: 'inline-block' }}>
              <span style={{ fontSize: '0.78rem', color: '#5DCAA5', fontWeight: 700 }}>✓ Yes — 7 pts deadwood. You can knock!</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Strategy — What to Keep, What to Discard',
    desc: 'The key to winning Rummy is reading your hand early and deciding which melds to pursue. Flexibility is valuable — a card that could join two different melds is worth more than one that only fits one place. Always watch the discard pile to infer what your opponent is building.',
    tip: 'Discard high-value unconnected cards first (Kings, Queens, Jacks not in a meld). They cost you the most points if your opponent knocks.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460, margin: '0 auto', width: '100%' }}>
        {[
          { num: '1', rule: 'Keep connected cards', desc: 'Cards that could join a Set or Run are valuable. 7♥ works with other 7s (set) AND 5♥-6♥ (run).' },
          { num: '2', rule: 'Discard isolated high cards early', desc: 'A lone King or Queen that doesn\'t connect to anything costs 10 points if you\'re caught. Get rid of it fast.' },
          { num: '3', rule: 'Watch the discard pile', desc: 'If your opponent picks up a 7, they likely have 7s or a run near 7. Avoid giving them connecting cards.' },
          { num: '4', rule: 'Knock early, knock often', desc: 'Don\'t wait for Gin (all cards melded). A knock at 10 points wins points and prevents your opponent from forming more melds.' },
        ].map(item => (
          <div key={item.num} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(201,168,76,0.12)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', color: 'var(--felt-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{item.num}</div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.88rem', marginBottom: 2 }}>{item.rule}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }
]

export default function LearnRummy() {
  usePageMeta('/learn/rummy')
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(77,15,25,0.8),rgba(15,34,25,0.95))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>♥ Interactive Guide</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--cream)', marginBottom: '0.6rem' }}>How to Play Rummy</h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 500, marginBottom: '1.25rem' }}>
            Learn Gin Rummy with visual examples — melds, knocking, and winning strategy.
          </p>
          <Link to="/game/rummy" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}>♥ Play Rummy Free →</Link>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.75rem' }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: '0.4rem 0.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
              background: i === step ? 'var(--gold)' : i < step ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)',
              color: i === step ? 'var(--felt-dark)' : i < step ? 'var(--gold)' : 'rgba(245,240,232,0.35)',
              transition: 'all 0.2s',
            }}>
              {i < step ? '✓' : i + 1}
            </button>
          ))}
        </div>

        <div key={step} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(192,57,43,0.12)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#c0392b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{step + 1}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: 'var(--cream)', margin: 0 }}>{current.title}</h2>
          </div>

          <div style={{ padding: '2rem 1.5rem', background: 'rgba(0,0,0,0.25)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {current.render()}
          </div>

          <div style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.85, marginBottom: '0.75rem' }}>{current.desc}</p>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold)', lineHeight: 1.6, margin: 0 }}>{current.tip}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: step === 0 ? 'rgba(245,240,232,0.2)' : 'rgba(245,240,232,0.7)', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}>
            ← Previous
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1
            ? <button onClick={() => { setStep(s => s + 1); window.scrollTo(0,0) }} className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>Next →</button>
            : <Link to="/game/rummy" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>♥ Play Now →</Link>
          }
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Learn other games</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[{ to: '/learn/bridge', label: '♠ Bridge' }, { to: '/learn/spades', label: '♠ Spades' }, { to: '/learn/solitaire', label: '♣ Solitaire' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'rgba(245,240,232,0.65)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
