import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const CARD_COLORS = { '♠': '#1a1a2e', '♣': '#1a1a2e', '♥': '#c0392b', '♦': '#c0392b' }

function Card({ value, suit, faceDown, selected, highlight }) {
  const w = 56, h = 78
  const col = CARD_COLORS[suit] || '#1a1a2e'
  if (faceDown) return (
    <div style={{ width: w, height: h, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,#1a3a6a,#0f2245)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
  )
  if (!value) return (
    <div style={{ width: w, height: h, borderRadius: 6, border: '2px dashed rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '1.2rem', color: 'rgba(201,168,76,0.2)' }}>{suit || '?'}</span>
    </div>
  )
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, flexShrink: 0,
      background: selected ? '#fffde7' : highlight ? '#e8f5e9' : 'white',
      border: `2px solid ${highlight ? '#2e7d32' : selected ? '#c9a84c' : '#ccc'}`,
      boxShadow: highlight ? '0 0 0 3px rgba(46,125,50,0.35)' : selected ? '0 0 0 3px rgba(201,168,76,0.4)' : '0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative', userSelect: 'none',
      transform: selected ? 'translateY(-8px)' : 'none',
      transition: 'transform 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 3, left: 5, fontSize: 12, fontWeight: 800, color: col, lineHeight: 1 }}>{value}</div>
      <div style={{ position: 'absolute', top: 16, left: 5, fontSize: 11, color: col, lineHeight: 1 }}>{suit}</div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 18, color: col }}>{suit}</div>
      <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 12, fontWeight: 800, color: col, lineHeight: 1, transform: 'rotate(180deg)' }}>{value}</div>
    </div>
  )
}

function Column({ cards, label, highlightTop }) {
  const overlap = 24
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.4)', marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative', width: 56, height: 78 + Math.max(0, cards.length - 1) * overlap }}>
        {cards.map((c, i) => (
          <div key={i} style={{ position: 'absolute', top: i * overlap }}>
            <Card {...c} highlight={highlightTop && i === cards.length - 1} />
          </div>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'The Setup — 7 Tableau Columns',
    desc: 'Solitaire begins by dealing 28 cards into 7 columns called the Tableau. Column 1 has 1 face-up card. Column 2 has 1 face-down, 1 face-up. Column 3 has 2 face-down, 1 face-up — and so on. Only the top card (face-up) in each column can be moved. The remaining 24 cards form the Stock pile.',
    tip: 'Your goal: move all 52 cards to the 4 Foundation piles, one per suit, from Ace to King.',
    render: () => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {[
          [{ value: 'K', suit: '♠' }],
          [{ faceDown: true }, { value: '7', suit: '♥' }],
          [{ faceDown: true }, { faceDown: true }, { value: 'J', suit: '♣' }],
          [{ faceDown: true }, { faceDown: true }, { faceDown: true }, { value: '4', suit: '♦' }],
          [{ faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { value: '9', suit: '♠' }],
          [{ faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { value: '2', suit: '♥' }],
          [{ faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { faceDown: true }, { value: '6', suit: '♦' }],
        ].map((col, i) => (
          <Column key={i} cards={col} label={`Col ${i + 1}`} />
        ))}
      </div>
    )
  },
  {
    title: 'Moving Cards — Alternating Colours, Descending Rank',
    desc: 'Cards in the Tableau must be placed on a card of the opposite colour and one rank higher. Red on Black, Black on Red — always going down in rank. You can move an entire sequence of cards together as one group. Only a King can go into an empty column.',
    tip: 'When you move a card away from a column, the face-down card beneath it flips face-up — revealing a new card to play.',
    render: () => (
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 10, textAlign: 'center' }}>Before</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Column cards={[{ faceDown: true }, { value: '8', suit: '♣', selected: true }]} label="Col A" />
            <Column cards={[{ faceDown: true }, { faceDown: true }, { value: '9', suit: '♥' }]} label="Col B" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: 'var(--gold)', paddingTop: 36 }}>→</div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 10, textAlign: 'center' }}>After — 8♣ moved onto 9♥</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Column cards={[{ faceDown: true }, { value: '5', suit: '♦' }]} label="Col A (flipped!)" highlightTop />
            <Column cards={[{ faceDown: true }, { faceDown: true }, { value: '9', suit: '♥' }, { value: '8', suit: '♣' }]} label="Col B" highlightTop />
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'The Foundation — Ace to King by Suit',
    desc: 'The 4 Foundation piles are where you win the game. Each is dedicated to one suit. Build each Foundation from Ace up to King in order: A → 2 → 3 → ... → K. When all 52 cards are on the Foundations — you win!',
    tip: 'Always send Aces to the Foundation immediately. Send 2s as soon as their Ace is there.',
    render: () => (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {[
          { suit: '♠', top: { value: '3', suit: '♠' }, label: 'A→2→3...' },
          { suit: '♥', top: { value: 'A', suit: '♥' }, label: 'A only so far' },
          { suit: '♦', top: null, label: 'Empty — need A♦' },
          { suit: '♣', top: { value: '2', suit: '♣' }, label: 'A→2...' },
        ].map(({ suit, top, label }) => (
          <div key={suit} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginBottom: 6 }}>Foundation {suit}</div>
            <Card value={top?.value} suit={top ? top.suit : suit} highlight={!!top} />
            <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.4)', marginTop: 6, maxWidth: 60 }}>{label}</div>
          </div>
        ))}
      </div>
    )
  },
  {
    title: 'The Stock Pile — Draw When You\'re Stuck',
    desc: 'When you have no moves in the Tableau, click the face-down Stock pile to flip one card at a time to the Waste pile. The top Waste card is always available — move it to the Tableau or Foundation if you can. When the Stock is empty, click the empty space to reset and go through it again.',
    tip: 'Plan what you\'re looking for before drawing. Going through the Stock without a target wastes opportunities.',
    render: () => (
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 8 }}>Stock pile</div>
          <div style={{ position: 'relative', width: 56, height: 78 }}>
            {[2,1,0].map(i => (
              <div key={i} style={{ position: 'absolute', top: -i*2, left: -i*2 }}>
                <Card faceDown />
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 6 }}>Click to draw</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 8 }}>Waste — top card playable</div>
          <div style={{ position: 'relative', width: 56, height: 78 }}>
            <div style={{ position: 'absolute', top: 4, left: 4 }}><Card value="Q" suit="♦" /></div>
            <div style={{ position: 'absolute', top: 2, left: 2 }}><Card value="5" suit="♠" /></div>
            <div style={{ position: 'absolute' }}><Card value="J" suit="♥" highlight /></div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 6 }}>J♥ available</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', marginBottom: 8 }}>Play J♥ onto Q♣</div>
          <Column cards={[{ faceDown: true }, { value: 'Q', suit: '♣' }, { value: 'J', suit: '♥' }]} highlightTop />
        </div>
      </div>
    )
  },
  {
    title: 'Winning Strategy',
    desc: 'Most Solitaire deals (about 80%) are winnable with correct play. The key is patience and planning ahead rather than making the first move you see.',
    tip: 'Use the Undo button freely — it helps you learn from mistakes and explore different lines of play.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460, margin: '0 auto', width: '100%' }}>
        {[
          { num: '1', rule: 'Uncover face-down cards first', desc: 'Every hidden card is a potential move. Prioritise revealing them before anything else.' },
          { num: '2', rule: 'Empty columns are your most powerful tool', desc: 'Only put a King (+ sequence) into an empty column. Don\'t waste it on a random card.' },
          { num: '3', rule: 'Don\'t rush the Foundation', desc: 'A card on the Foundation can\'t come back. Keep low cards available if you need them for sequences.' },
          { num: '4', rule: 'Think before you draw', desc: 'Know what card you\'re looking for in the Stock before clicking. Draw with purpose.' },
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

export default function LearnSolitaire() {
  usePageMeta('/learn/solitaire')
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(35,77,56,0.8),rgba(15,34,25,0.95))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>♣ Interactive Guide</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--cream)', marginBottom: '0.6rem' }}>How to Play Solitaire</h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 500, marginBottom: '1.25rem' }}>
            Step-by-step visual guide to Klondike Solitaire — from setup to winning strategy.
          </p>
          <Link to="/game/solitaire" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}>♣ Play Solitaire Free →</Link>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Progress bar */}
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

        {/* Main card */}
        <div key={step} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(201,168,76,0.1)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: 'var(--felt-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{step + 1}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: 'var(--cream)', margin: 0 }}>{current.title}</h2>
          </div>

          <div style={{ padding: '2rem 1.5rem', background: 'rgba(0,0,0,0.25)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {current.render()}
          </div>

          <div style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.85, marginBottom: '0.75rem' }}>{current.desc}</p>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold)', lineHeight: 1.6, margin: 0 }}>{current.tip}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: step === 0 ? 'rgba(245,240,232,0.2)' : 'rgba(245,240,232,0.7)', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}>
            ← Previous
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1
            ? <button onClick={() => { setStep(s => s + 1); window.scrollTo(0,0) }} className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>Next →</button>
            : <Link to="/game/solitaire" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>♣ Play Now →</Link>
          }
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Learn other games</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[{ to: '/learn/bridge', label: '♠ Bridge' }, { to: '/learn/rummy', label: '♥ Rummy' }, { to: '/learn/spades', label: '♠ Spades' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'rgba(245,240,232,0.65)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
