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

function PlayerBox({ label, pos, isYou, isDummy, isDeclarer, cards, faceDown, bidBubble, thinking }) {
  const posColors = {
    N: 'rgba(93,202,165,0.15)',
    S: 'rgba(201,168,76,0.15)',
    E: 'rgba(255,255,255,0.06)',
    W: 'rgba(255,255,255,0.06)',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        background: posColors[pos], border: `1px solid ${isYou ? 'rgba(201,168,76,0.5)' : isDummy ? 'rgba(93,202,165,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10, padding: '6px 14px', textAlign: 'center', minWidth: 90,
      }}>
        <div style={{ fontSize: '0.65rem', color: isYou ? 'var(--gold)' : isDummy ? '#5DCAA5' : 'rgba(245,240,232,0.5)', fontWeight: 700 }}>
          {label} {isDummy ? '★ Dummy' : isDeclarer ? '★ Declarer' : ''}
        </div>
        {bidBubble && (
          <div style={{ marginTop: 4, fontSize: '0.75rem', fontWeight: 800, color: thinking ? 'var(--gold)' : 'var(--cream)' }}>
            {thinking ? '...' : bidBubble}
          </div>
        )}
      </div>
      {cards && (
        <div style={{ display: 'flex', gap: 3 }}>
          {cards.map((c, i) => <Card key={i} {...c} />)}
        </div>
      )}
      {faceDown && (
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: faceDown }).map((_, i) => <Card key={i} faceDown />)}
        </div>
      )}
    </div>
  )
}

function TrickSlot({ card, pos, winner, empty }) {
  const posStyle = {
    N: { top: 0, left: '50%', transform: 'translateX(-50%)' },
    S: { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    E: { right: 0, top: '50%', transform: 'translateY(-50%)' },
    W: { left: 0, top: '50%', transform: 'translateY(-50%)' },
  }[pos]
  return (
    <div style={{ position: 'absolute', ...posStyle, textAlign: 'center' }}>
      {winner && <div style={{ fontSize: '0.55rem', color: 'var(--gold)', marginBottom: 2, fontWeight: 700 }}>👑</div>}
      {card
        ? <Card {...card} highlight={winner} />
        : <div style={{ width: 52, height: 72, borderRadius: 6, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)' }}>{pos}</span>
          </div>
      }
    </div>
  )
}

const STEPS = [
  {
    title: 'The Table — 4 Players, 2 Partnerships',
    desc: 'Bridge is played by 4 players sitting around a table, identified by compass positions: North, South, East, West. North and South are partners — they play together as a team against East and West. You always play as South. Your partner is North, sitting opposite you.',
    tip: 'Partners cannot see each other\'s cards. You communicate only through your bids during the auction.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
        {/* North */}
        <div style={{ background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)', borderRadius: 10, padding: '8px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#5DCAA5', fontWeight: 700 }}>North — your partner</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)', marginTop: 2 }}>NS Partnership</div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          {/* West */}
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#c0392b', fontWeight: 700 }}>West</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', marginTop: 2 }}>EW Partnership</div>
          </div>

          {/* Table */}
          <div style={{ width: 100, height: 70, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>♠</span>
          </div>

          {/* East */}
          <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: '#c0392b', fontWeight: 700 }}>East</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', marginTop: 2 }}>EW Partnership</div>
          </div>
        </div>

        {/* South */}
        <div style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 10, padding: '8px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700 }}>South — You</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.5)', marginTop: 2 }}>NS Partnership</div>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 4 }}>
          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(93,202,165,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#5DCAA5', fontWeight: 600 }}>NS (You + North)</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.4)' }}>work together</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(192,57,43,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#c0392b', fontWeight: 600 }}>EW (opponents)</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.4)' }}>work together</div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Your Hand — 13 Cards and How to Count Them',
    desc: 'Each player receives exactly 13 cards. Before you can bid, you need to assess your hand strength using High Card Points (HCP): Ace = 4 pts, King = 3 pts, Queen = 2 pts, Jack = 1 pt. The whole deck has 40 HCP. You need 12+ HCP to open the bidding. 26 combined HCP with your partner typically makes a Game.',
    tip: 'Sort your hand by suit — it makes counting HCP and planning your bid much easier.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', textAlign: 'center' }}>Your hand (South) — count the HCP:</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { suit: '♠', cards: [{ value: 'A', suit: '♠', highlight: true }, { value: 'K', suit: '♠', highlight: true }, { value: '7', suit: '♠' }, { value: '3', suit: '♠' }] },
            { suit: '♥', cards: [{ value: 'Q', suit: '♥', highlight: true }, { value: '9', suit: '♥' }, { value: '4', suit: '♥' }] },
            { suit: '♦', cards: [{ value: 'J', suit: '♦', highlight: true }, { value: '8', suit: '♦' }, { value: '2', suit: '♦' }] },
            { suit: '♣', cards: [{ value: 'K', suit: '♣', highlight: true }, { value: '6', suit: '♣' }, { value: '5', suit: '♣' }] },
          ].map(({ suit, cards }) => (
            <div key={suit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.1rem', color: CARD_COLORS[suit], fontWeight: 700, width: 16 }}>{suit}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {cards.map((c, i) => <Card key={i} {...c} />)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { card: 'A♠', pts: 4 }, { card: 'K♠', pts: 3 }, { card: 'Q♥', pts: 2 },
            { card: 'J♦', pts: 1 }, { card: 'K♣', pts: 3 },
          ].map(({ card, pts }) => (
            <div key={card} style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '5px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 700 }}>{card}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>+{pts} pts</div>
            </div>
          ))}
          <div style={{ background: 'rgba(201,168,76,0.25)', border: '2px solid var(--gold)', borderRadius: 8, padding: '5px 14px', textAlign: 'center', display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 800 }}>= 13 HCP ✓ Open!</div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'The Auction — Bidding for the Contract',
    desc: 'The auction is how both partnerships communicate their hand strength and agree on a contract. A bid is a promise: "2♥" means your side will win at least 8 tricks with Hearts as trump (6 + 2). Bids go clockwise starting with the Dealer. Each bid must be higher than the last. Three consecutive passes ends the auction. The final bid becomes the Contract.',
    tip: 'The player who first names the winning suit becomes the Declarer — they play both their own hand and their partner\'s (the Dummy) during card play.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', textAlign: 'center' }}>A typical auction — bids going clockwise</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%', maxWidth: 420 }}>
          {['West', 'North', 'East', 'South'].map(p => (
            <div key={p} style={{ textAlign: 'center', fontSize: '0.62rem', color: 'rgba(245,240,232,0.4)', fontWeight: 700, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{p}</div>
          ))}
          {[
            { pos: 'W', bid: 'Pass', color: 'rgba(245,240,232,0.35)' },
            { pos: 'N', bid: '1♠', color: 'white' },
            { pos: 'E', bid: 'Pass', color: 'rgba(245,240,232,0.35)' },
            { pos: 'S', bid: '2♠', color: 'white', you: true },
            { pos: 'W', bid: 'Pass', color: 'rgba(245,240,232,0.35)' },
            { pos: 'N', bid: '4♠', color: 'var(--gold)', bold: true },
            { pos: 'E', bid: 'Pass', color: 'rgba(245,240,232,0.35)' },
            { pos: 'S', bid: 'Pass', color: 'rgba(245,240,232,0.35)', you: true },
            { pos: 'W', bid: 'Pass', color: 'rgba(245,240,232,0.35)' },
            { pos: '', bid: '', color: '' },
            { pos: '', bid: '', color: '' },
            { pos: '', bid: '', color: '' },
          ].map((item, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '6px 4px', borderRadius: 6,
              background: item.you ? 'rgba(201,168,76,0.1)' : item.bold ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: item.bold ? '1px solid rgba(201,168,76,0.3)' : 'none',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: item.bold ? 800 : 600, color: item.color }}>{item.bid}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 700 }}>Contract: 4♠ by North (Declarer)</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', marginTop: 3 }}>NS must win 10 tricks with Spades as trump</div>
        </div>
      </div>
    )
  },
  {
    title: 'The Dummy — Your Partner\'s Cards Face Up',
    desc: 'After the auction, the player to the left of the Declarer makes the Opening Lead — the first card played. Then the Declarer\'s partner (the Dummy) lays all their cards face-up on the table for everyone to see. The Dummy takes no further part in play. The Declarer plays BOTH their own hand AND the Dummy\'s hand, trying to make the contract.',
    tip: 'As Declarer, study the Dummy\'s hand carefully before playing. Plan how many tricks you can win before touching a card.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
        {/* North — dummy, face up */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#5DCAA5', fontWeight: 700, marginBottom: 6 }}>North ★ Dummy (face up — everyone sees)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { suit: '♠', cards: [{ value: 'K', suit: '♠', highlight: true }, { value: 'Q', suit: '♠', highlight: true }, { value: '8', suit: '♠' }] },
              { suit: '♥', cards: [{ value: 'A', suit: '♥', highlight: true }, { value: '6', suit: '♥' }] },
              { suit: '♦', cards: [{ value: '7', suit: '♦' }, { value: '3', suit: '♦' }] },
              { suit: '♣', cards: [{ value: 'Q', suit: '♣', highlight: true }, { value: 'J', suit: '♣', highlight: true }, { value: '4', suit: '♣' }] },
            ].map(({ suit, cards }) => (
              <div key={suit} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: '0.9rem', color: CARD_COLORS[suit], fontWeight: 700, width: 14 }}>{suit}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {cards.map((c, i) => <Card key={i} {...c} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* West — face down */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#c0392b', marginBottom: 4 }}>West (hidden)</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3].map(i => <Card key={i} faceDown />)}
            </div>
          </div>

          {/* Center table */}
          <div style={{ width: 80, height: 60, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)' }}>Opening lead:</div>
              <Card value="2" suit="♣" />
            </div>
          </div>

          {/* East — face down */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#c0392b', marginBottom: 4 }}>East (hidden)</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3].map(i => <Card key={i} faceDown />)}
            </div>
          </div>
        </div>

        {/* South — declarer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>South ★ You — Declarer (plays both hands)</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[{ value: 'A', suit: '♠' }, { value: 'J', suit: '♠' }, { value: '9', suit: '♠' }, { value: 'K', suit: '♥' }].map((c, i) => <Card key={i} {...c} />)}
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Winning a Trick — Trump Beats Everything',
    desc: 'Each trick has 4 cards, one from each player, played clockwise. You must follow suit if you can. If you can\'t follow suit, you may play any card — including a trump. The highest card of the suit led wins, UNLESS a trump card is played, in which case the highest trump wins. The winner of each trick leads the next one.',
    tip: 'In a No Trump (NT) contract there is no trump suit — the highest card in the suit led always wins. This makes NT contracts harder to make but worth more points.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', textAlign: 'center' }}>Contract: 4♠ — Spades are trump. West leads 2♣</div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>

          {/* Trick 1 — no trump played */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.4)', marginBottom: 8 }}>Trick 1 — no trump played</div>
            <div style={{ position: 'relative', width: 200, height: 190 }}>
              <TrickSlot pos="N" card={{ value: 'J', suit: '♣' }} />
              <TrickSlot pos="W" card={{ value: '2', suit: '♣' }} />
              <TrickSlot pos="E" card={{ value: '5', suit: '♣' }} />
              <TrickSlot pos="S" card={{ value: 'Q', suit: '♣' }} winner />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#5DCAA5', marginTop: 6, fontWeight: 600 }}>South wins — Q♣ highest in Clubs</div>
          </div>

          {/* Trick 2 — trump played */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.4)', marginBottom: 8 }}>Trick 2 — East can't follow, plays trump</div>
            <div style={{ position: 'relative', width: 200, height: 190 }}>
              <TrickSlot pos="N" card={{ value: 'A', suit: '♥' }} />
              <TrickSlot pos="W" card={{ value: '6', suit: '♥' }} />
              <TrickSlot pos="E" card={{ value: '3', suit: '♠' }} winner />
              <TrickSlot pos="S" card={{ value: 'K', suit: '♥' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#c0392b', marginTop: 6, fontWeight: 600 }}>East wins — 3♠ (trump) beats A♥!</div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Scoring — Making or Going Down',
    desc: 'If the Declarer wins at least as many tricks as the contract requires, the contract is Made — the declaring side scores points. If they win fewer tricks, the contract is Defeated — the defending side scores penalty points instead. Major suit tricks (♥♠) score 30 each. Minor suit tricks (♣♦) score 20 each. Reaching 100 trick points earns a Game bonus.',
    tip: 'The Game contracts to aim for: 3NT (9 tricks), 4♥ or 4♠ (10 tricks), 5♣ or 5♦ (11 tricks). These score 100+ trick points and earn valuable bonuses.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {[
            { label: '4♠ made (10 tricks)', tricks: 10, needed: 10, score: '+620', detail: '4×30 + Game bonus', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)' },
            { label: '4♠ made + 1 overtrick', tricks: 11, needed: 10, score: '+650', detail: '+30 for overtrick', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)' },
            { label: '4♠ defeated (9 tricks)', tricks: 9, needed: 10, score: '-50', detail: '1 undertrick, not vul', color: '#c0392b', bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.25)' },
            { label: '3NT made', tricks: 9, needed: 9, score: '+400', detail: '40+30+30 + Game bonus', color: '#5DCAA5', bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.25)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 130, flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.5)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)', marginBottom: 6 }}>{s.tricks}/{s.needed} tricks</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.score}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.35)' }}>{s.detail}</div>
            </div>
          ))}
        </div>
        <Link to="/learn/bridge" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 10, padding: '10px 18px', textDecoration: 'none', marginTop: 4,
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>♠ Go deeper — read the full 11-chapter Bridge guide →</span>
        </Link>
      </div>
    )
  }
]

export default function LearnBridge() {
  usePageMeta('/learn/bridge-intro')
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>♠ Interactive Guide</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--cream)', marginBottom: '0.6rem' }}>How to Play Bridge</h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 520, marginBottom: '1.25rem' }}>
            A visual beginner's introduction — partnerships, bidding, the dummy hand, tricks and scoring.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}>♠ Play Bridge Free →</Link>
            <Link to="/learn/bridge" style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(245,240,232,0.7)', textDecoration: 'none' }}>
              Full 11-chapter guide →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Progress */}
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

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: step === 0 ? 'rgba(245,240,232,0.2)' : 'rgba(245,240,232,0.7)', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}>
            ← Previous
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1
            ? <button onClick={() => { setStep(s => s + 1); window.scrollTo(0, 0) }} className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>Next →</button>
            : <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}>♠ Play Now →</Link>
          }
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Go deeper</p>
          <Link to="/learn/bridge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', padding: '0.6rem 1.25rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, color: 'var(--gold)', textDecoration: 'none', marginBottom: '1rem' }}>
            ♠ Full 11-chapter Bridge guide — bidding systems, conventions, strategy →
          </Link>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1rem 0 0.75rem' }}>Learn other games</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[{ to: '/learn/rummy', label: '♥ Rummy' }, { to: '/learn/spades', label: '♠ Spades' }, { to: '/learn/solitaire', label: '♣ Solitaire' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'rgba(245,240,232,0.65)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
