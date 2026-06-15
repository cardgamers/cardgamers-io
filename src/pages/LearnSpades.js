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

function TrickCard({ card, pos, winner }) {
  const posStyle = {
    N: { top: 0, left: '50%', transform: 'translateX(-50%)' },
    S: { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    E: { right: 0, top: '50%', transform: 'translateY(-50%)' },
    W: { left: 0, top: '50%', transform: 'translateY(-50%)' },
  }[pos]
  return (
    <div style={{ position: 'absolute', ...posStyle, textAlign: 'center' }}>
      {winner && <div style={{ fontSize: '0.6rem', color: 'var(--gold)', marginBottom: 2, fontWeight: 700 }}>👑 Winner</div>}
      <Card {...card} highlight={winner} />
      <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.4)', marginTop: 2 }}>{pos}</div>
    </div>
  )
}

const STEPS = [
  {
    title: 'The Basics — Spades Always Win',
    desc: 'Spades is a trick-taking partnership game for 4 players. North/South play together against East/West. The most important rule: Spades (♠) are ALWAYS the trump suit. A Spade beats every card in every other suit, no matter how high. Even the 2♠ beats the A♥.',
    tip: 'You cannot lead Spades until they have been "broken" — meaning someone played a Spade when they couldn\'t follow suit.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.6)', textAlign: 'center' }}>Suit ranking (highest to lowest)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { suit: '♠', label: 'Spades — ALWAYS TRUMP', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.4)' },
            { suit: '♥', label: 'Hearts', color: 'rgba(245,240,232,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
            { suit: '♦', label: 'Diamonds', color: 'rgba(245,240,232,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
            { suit: '♣', label: 'Clubs', color: 'rgba(245,240,232,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
          ].map(s => (
            <div key={s.suit} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>{s.suit}</div>
              <div style={{ fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: '#5DCAA5' }}>2♠ beats A♥, A♦, and A♣ — always</div>
        </div>
      </div>
    )
  },
  {
    title: 'Bidding — How Many Tricks Will You Win?',
    desc: 'Before any card is played, each player bids how many tricks they expect to win. Bids go clockwise starting left of the dealer. You can bid 0 to 13. Your bid is added to your partner\'s bid to form your team\'s contract. If you bid 3 and your partner bids 2, your team must win at least 5 tricks.',
    tip: 'Count your sure winners: Aces, Kings (if you have the Ace), and high Spades. Add 1 extra trick for every strong 4-card suit.',
    render: () => (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {[
          { pos: 'North (your partner)', bid: 3, hand: [{ value: 'A', suit: '♣' }, { value: 'K', suit: '♦' }, { value: '7', suit: '♠' }] },
          { pos: 'East (opponent)', bid: 2, hand: [{ value: 'Q', suit: '♥' }, { value: '8', suit: '♠' }, { value: '5', suit: '♣' }] },
          { pos: 'South (you)', bid: 4, hand: [{ value: 'A', suit: '♠' }, { value: 'K', suit: '♠' }, { value: 'A', suit: '♥' }, { value: '9', suit: '♦' }] },
          { pos: 'West (opponent)', bid: 4, hand: [{ value: 'Q', suit: '♠' }, { value: 'J', suit: '♠' }, { value: 'A', suit: '♦' }, { value: 'K', suit: '♥' }] },
        ].map(({ pos, bid, hand }) => (
          <div key={pos} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6 }}>{pos}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>Bid: {bid}</div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              {hand.map((c, i) => <Card key={i} {...c} small />)}
            </div>
          </div>
        ))}
        <div style={{ width: '100%', textAlign: 'center', marginTop: 8 }}>
          <div style={{ display: 'inline-flex', gap: 20, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '10px 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NS Contract</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#5DCAA5' }}>3+4 = 7 tricks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EW Contract</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c0392b' }}>2+4 = 6 tricks</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Playing a Trick — Follow Suit or Trump',
    desc: 'The player to the dealer\'s left leads the first trick. Play goes clockwise. You MUST follow suit if you can — play a card of the same suit as the card led. If you have no cards in that suit, you may play any card including a Spade. The highest card of the suit led wins, UNLESS a Spade was played — then the highest Spade wins.',
    tip: 'The winner of each trick leads the next one. Keep track of how many tricks each side has won.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 240, height: 220 }}>
          <TrickCard card={{ value: 'K', suit: '♥' }} pos="N" />
          <TrickCard card={{ value: '7', suit: '♥' }} pos="W" />
          <TrickCard card={{ value: '6', suit: '♠' }} pos="E" winner />
          <TrickCard card={{ value: 'Q', suit: '♥' }} pos="S" />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)' }}>Trick</div>
          </div>
        </div>
        <div style={{ background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.25)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: '#5DCAA5', marginBottom: 4, fontWeight: 600 }}>East wins with 6♠!</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)' }}>Hearts were led — North played K♥, South Q♥, West 7♥. But East had no Hearts, so played 6♠. The Spade beats everything.</div>
        </div>
      </div>
    )
  },
  {
    title: 'Scoring — Making or Breaking Your Bid',
    desc: 'If your team wins at least as many tricks as you bid, you score 10 points per trick bid. Extra tricks (bags) score 1 point each. But collecting 10 bags costs you 100 points — so don\'t sandbag! If you win FEWER tricks than you bid, you lose 10 points per trick bid. This is called "going set."',
    tip: 'The Nil bid: bid zero tricks for +100 points if you win zero tricks. If you win even one trick while bidding Nil, it\'s -100. High risk, high reward.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {[
            { scenario: 'Made bid exactly', bid: 4, won: 4, score: '+40', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)' },
            { scenario: 'Made bid + bags', bid: 4, won: 6, score: '+42', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)', note: '(4×10 + 2 bags)' },
            { scenario: 'Went set (lost)', bid: 5, won: 3, score: '-50', color: '#c0392b', bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.25)' },
            { scenario: 'Nil bid — made it', bid: 0, won: 0, score: '+100', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)' },
            { scenario: 'Nil bid — failed', bid: 0, won: 2, score: '-100', color: '#c0392b', bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.25)' },
          ].map(s => (
            <div key={s.scenario} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.5)', marginBottom: 4 }}>{s.scenario}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', marginBottom: 6 }}>Bid {s.bid}, Won {s.won}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.score}</div>
              {s.note && <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.35)', marginTop: 2 }}>{s.note}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gold)' }}>First team to 500 points wins the game</div>
        </div>
      </div>
    )
  },
  {
    title: 'Strategy — Bidding and Playing Smart',
    desc: 'Spades rewards accurate bidding and careful card play. The biggest mistake beginners make is underbidding (sandbagging) to be safe — bags accumulate and cost you 100 points at 10. Bid what you expect to win.',
    tip: 'Communicate with your partner through your bids. A bid of 4 tells your partner you have 4 solid tricks. A nil bid tells them to protect you.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460, margin: '0 auto', width: '100%' }}>
        {[
          { num: '1', rule: 'Count your winners before bidding', desc: 'Aces = 1 trick. High Spades (A,K,Q) = 1 trick each. A 5-card suit often produces an extra trick.' },
          { num: '2', rule: 'Don\'t lead Spades early', desc: 'Unless you have a strong Spade suit (A,K,Q), save Spades. Let your opponents use theirs first.' },
          { num: '3', rule: 'Protect your Nil partner', desc: 'If your partner bids Nil, play high cards in every suit to prevent them winning tricks. Win tricks they\'d otherwise have to take.' },
          { num: '4', rule: 'Avoid bags — bid aggressively', desc: 'Sandbagging costs 100 points at 10 bags. It\'s often better to overbid slightly than to collect bags deliberately.' },
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

export default function LearnSpades() {
  usePageMeta('/learn/spades')
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>♠ Interactive Guide</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--cream)', marginBottom: '0.6rem' }}>How to Play Spades</h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 500, marginBottom: '1.25rem' }}>
            Learn partnership Spades with visual trick examples — bidding, trump, and winning strategy.
          </p>
          <Link to="/game/spades" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}>♠ Play Spades Free →</Link>
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
          <div style={{ background: 'rgba(26,26,46,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: 'var(--felt-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{step + 1}</div>
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
            : <Link to="/game/spades" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>♠ Play Now →</Link>
          }
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Learn other games</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[{ to: '/learn/bridge', label: '♠ Bridge' }, { to: '/learn/rummy', label: '♥ Rummy' }, { to: '/learn/solitaire', label: '♣ Solitaire' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'rgba(245,240,232,0.65)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
