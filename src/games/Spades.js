import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { saveGameResult } from '../lib/saveGameResult'
import {
  createDeck, shuffle, dealHands, sortHand,
  botBid, botPlay, getValidCards, trickWinner, calcTeamScore
} from './spadesEngine'

// Player positions: 0=South(human), 1=West, 2=North(partner), 3=East
const PLAYER_NAMES = ['South', 'West', 'North', 'East']
const PLAYER_LABELS = ['You', 'West', 'Partner', 'East']

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

// ─── Card component ───────────────────────────────────────────────
function SCard({ card, selected, valid, onClick, w = 72, h = 100, faceDown }) {
  if (faceDown) return (
    <div style={{
      width: w, height: h, borderRadius: 7, flexShrink: 0,
      background: 'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 10px)',
      border: '1.5px solid rgba(255,255,255,0.18)', boxShadow: '0 2px 5px rgba(0,0,0,0.45)',
    }} />
  )
  if (!card) return null
  const isRed = card.suit === '♥' || card.suit === '♦'
  const col = isRed ? '#c0392b' : '#1a1a2e'
  const fs = Math.max(8, Math.round(w * 0.16))
  const ss = Math.max(12, Math.round(w * 0.28))
  return (
    <div onClick={valid && onClick ? onClick : undefined} style={{
      width: w, height: h, borderRadius: 7, flexShrink: 0,
      background: selected ? '#fffde7' : valid === false ? 'rgba(255,255,255,0.4)' : 'white',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 2px rgba(201,168,76,0.5),0 6px 16px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.2)',
      cursor: valid && onClick ? 'pointer' : 'default',
      userSelect: 'none', position: 'relative',
      transform: selected ? 'translateY(-10px)' : 'none',
      transition: 'transform 0.12s, box-shadow 0.12s',
      opacity: valid === false ? 0.4 : 1,
    }}>
      <div style={{ position: 'absolute', top: 3, left: 4, lineHeight: 1.1 }}>
        <div style={{ fontSize: fs, fontWeight: 800, color: col, lineHeight: 1 }}>{card.rank}</div>
        <div style={{ fontSize: fs, color: col, lineHeight: 1 }}>{card.suit}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: ss, color: col, lineHeight: 1, opacity: 0.85 }}>{card.suit}</div>
      <div style={{ position: 'absolute', bottom: 3, right: 4, transform: 'rotate(180deg)', lineHeight: 1.1 }}>
        <div style={{ fontSize: fs, fontWeight: 800, color: col, lineHeight: 1 }}>{card.rank}</div>
        <div style={{ fontSize: fs, color: col, lineHeight: 1 }}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Fanned face-down hand ────────────────────────────────────────
function FaceDownHand({ count, vertical = false, cardW = 60, cardH = 84, overlap = 18 }) {
  if (count === 0) return null
  if (vertical) {
    return (
      <div style={{ position: 'relative', width: cardW, height: cardH + (count - 1) * overlap, flexShrink: 0 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: i * overlap }}>
            <SCard faceDown w={cardW} h={cardH} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', height: cardH, width: cardW + (count - 1) * overlap, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: i * overlap }}>
          <SCard faceDown w={cardW} h={cardH} />
        </div>
      ))}
    </div>
  )
}

// ─── Player zone label ────────────────────────────────────────────
function PlayerLabel({ pos, name, bid, tricksWon, isActive, isMobile }) {
  const isHuman = pos === 'S'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isActive && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#5DCAA5',
          boxShadow: '0 0 0 3px rgba(93,202,165,0.3)',
          animation: 'pulse 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      <span style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600,
        color: isHuman ? '#5DCAA5' : isActive ? '#c9a84c' : 'rgba(245,240,232,0.6)'
      }}>
        {name}
        {bid !== null && bid !== undefined && (
          <span style={{ color: 'rgba(245,240,232,0.45)', fontWeight: 400, marginLeft: 4 }}>
            bid {bid} · won {tricksWon}
          </span>
        )}
      </span>
    </div>
  )
}

// ─── Bid panel ────────────────────────────────────────────────────
function BidPanel({ onBid, isMobile }) {
  const [selected, setSelected] = useState(null)
  const bids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)', borderRadius: 12,
      padding: isMobile ? '10px 12px' : '14px 18px',
      border: '1px solid rgba(201,168,76,0.3)',
      width: '100%', maxWidth: isMobile ? '100%' : 340,
      boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Your Bid — How many tricks?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {bids.map(n => (
          <button key={n} onClick={() => setSelected(n)} style={{
            width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
            borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
            background: selected === n ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
            border: `2px solid ${selected === n ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
            color: selected === n ? '#1a1a1a' : 'white',
            cursor: 'pointer',
          }}>
            {n === 0 ? 'Nil' : n}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected !== null && onBid(selected)}
        disabled={selected === null}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, fontWeight: 700,
          fontSize: '0.95rem', cursor: selected !== null ? 'pointer' : 'not-allowed',
          background: selected !== null ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
          color: selected !== null ? '#1a1a1a' : 'rgba(255,255,255,0.3)',
          border: 'none',
        }}
      >
        Confirm Bid {selected !== null ? `(${selected === 0 ? 'Nil' : selected})` : ''}
      </button>
      <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.35)', textAlign: 'center', marginTop: 6 }}>
        Nil = you predict 0 tricks (+100/-100 bonus)
      </p>
    </div>
  )
}

// ─── Main Spades component ────────────────────────────────────────
export default function Spades() {
  usePageMeta('/game/spades')
  const { profile } = useAuth()
  const isMobile = useIsMobile()

  const [hands, setHands] = useState(null)
  const [bids, setBids] = useState([null, null, null, null])
  const [trick, setTrick] = useState([])
  const [trickNo, setTrickNo] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [spadesBroken, setSpadesBroken] = useState(false)
  const [tricksWon, setTricksWon] = useState([0, 0, 0, 0])
  const [scores, setScores] = useState([0, 0]) // [NS team, EW team]
  const [phase, setPhase] = useState('deal') // deal | bidding | playing | complete
  const [lastTrick, setLastTrick] = useState(null)
  const [lastWinner, setLastWinner] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [selected, setSelected] = useState(null)
  const [resultSaved, setResultSaved] = useState(false)

  const botTimer = useRef(null)

  // CSS pulse animation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }`
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const startGame = useCallback(() => {
    const deck = shuffle(createDeck())
    const dealt = dealHands(deck)
    setHands(dealt.map(h => sortHand(h)))
    setBids([null, null, null, null])
    setTrick([])
    setTrickNo(0)
    setCurrentPlayer(0)
    setSpadesBroken(false)
    setTricksWon([0, 0, 0, 0])
    setLastTrick(null)
    setLastWinner(null)
    setGameOver(false)
    setSelected(null)
    setResultSaved(false)
    setPhase('bidding')
  }, [])

  useEffect(() => { startGame() }, [startGame])

  // ── Bot bidding ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'bidding' || currentPlayer === 0 || bids[currentPlayer] !== null) return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      const bid = botBid(hands[currentPlayer])
      const newBids = [...bids]
      newBids[currentPlayer] = bid
      setBids(newBids)
      const next = currentPlayer + 1
      if (next < 4) setCurrentPlayer(next)
      else { setCurrentPlayer(0); setPhase('playing') }
    }, 700)
    return () => clearTimeout(botTimer.current)
  }, [phase, currentPlayer, bids, hands])

  const submitBid = (bid) => {
    const newBids = [...bids]
    newBids[0] = bid
    setBids(newBids)
    setCurrentPlayer(1)
  }

  // ── Trick resolution ─────────────────────────────────────────────
  const resolveTrick = useCallback((completedTrick, currentHands, currentTricksWon) => {
    const winner = trickWinner(completedTrick)
    const newTricksWon = [...currentTricksWon]
    newTricksWon[winner] += 1
    setTricksWon(newTricksWon)
    setLastTrick(completedTrick)
    setLastWinner(winner)
    const newTrickNo = trickNo + 1
    setTrickNo(newTrickNo)

    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      setTrick([])
      setCurrentPlayer(winner)
      if (newTrickNo === 13) {
        // Use functional update to avoid stale closure on tricksWon
        setTricksWon(latestTricksWon => {
          const t0 = calcTeamScore([bids[0], bids[2]], [latestTricksWon[0], latestTricksWon[2]])
          const t1 = calcTeamScore([bids[1], bids[3]], [latestTricksWon[1], latestTricksWon[3]])
          setScores(prev => {
            const newScores = [prev[0] + t0, prev[1] + t1]
            if (newScores[0] >= 500 || newScores[1] >= 500) {
              setGameOver(true)
              if (!resultSaved) {
                const playerWon = newScores[0] > newScores[1]
                saveGameResult('spades', playerWon, newScores[0], playerWon ? 20 : -10, {})
                setResultSaved(true)
              }
            } else {
              botTimer.current = setTimeout(() => startGame(), 2000)
            }
            return newScores
          })
          return latestTricksWon
        })
      }
    }, 1400)
  }, [trickNo, bids, resultSaved, startGame])

  // ── Bot card play ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || currentPlayer === 0 || trick.length === 4) return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      const hand = hands[currentPlayer]
      const card = botPlay(hand, trick, spadesBroken)
      const newHands = hands.map(h => [...h])
      newHands[currentPlayer] = hand.filter(c => c !== card)
      const newTrick = [...trick, { player: currentPlayer, card }]
      const newSpadesBroken = spadesBroken || card.suit === '♠'
      setHands(newHands)
      setTrick(newTrick)
      setSpadesBroken(newSpadesBroken)
      if (newTrick.length === 4) {
        resolveTrick(newTrick, newHands, tricksWon)
      } else {
        setCurrentPlayer(currentPlayer + 1)
      }
    }, 800)
    return () => clearTimeout(botTimer.current)
  }, [phase, currentPlayer, hands, trick, spadesBroken, tricksWon, resolveTrick])



  // ── Human plays a card ───────────────────────────────────────────
  const playCard = useCallback((card) => {
    if (currentPlayer !== 0 || phase !== 'playing') return
    const valid = getValidCards(hands[0], trick, spadesBroken)
    if (!valid.find(c => c === card)) return
    const newHands = hands.map(h => [...h])
    newHands[0] = hands[0].filter(c => c !== card)
    const newTrick = [...trick, { player: 0, card }]
    const newSpadesBroken = spadesBroken || card.suit === '♠'
    setHands(newHands)
    setTrick(newTrick)
    setSpadesBroken(newSpadesBroken)
    setSelected(null)
    if (newTrick.length === 4) {
      resolveTrick(newTrick, newHands, tricksWon)
    } else {
      setCurrentPlayer(1)
    }
  }, [currentPlayer, phase, hands, trick, spadesBroken, tricksWon, resolveTrick])

  if (!hands) return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1f14' }}>
      <p style={{ color: 'var(--gold)' }}>Dealing...</p>
    </div>
  )

  const validCards = phase === 'playing' && currentPlayer === 0
    ? getValidCards(hands[0], trick, spadesBroken)
    : []

  const isMyTurn = phase === 'playing' && currentPlayer === 0
  const isBidding = phase === 'bidding'

  // Card sizes
  const northCW = isMobile ? 44 : 60; const northCH = isMobile ? 62 : 84
  const northOL = isMobile ? 14 : 18
  const sideCW = isMobile ? 36 : 48; const sideCH = isMobile ? 50 : 67
  const sideOL = isMobile ? 10 : 14
  const southCW = isMobile ? 56 : 76; const southCH = isMobile ? 78 : 106
  const southOL = isMobile ? 16 : 22
  const trickCW = isMobile ? 46 : 64; const trickCH = isMobile ? 64 : 89

  // Get card played by a player in current trick
  const getTrickCard = (playerIdx) => trick.find(t => t.player === playerIdx)

  // Trick winner for highlighting
  const currentTrickWinner = trick.length === 4 ? trickWinner(trick) : null

  return (
    <div style={{ paddingTop: 56, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d1f14', overflow: 'hidden' }}>

      {/* ── Game Over overlay ── */}
      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a3d28', border: '2px solid var(--gold)', borderRadius: 18, padding: '2rem', textAlign: 'center', maxWidth: 380, width: '90%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{scores[0] > scores[1] ? '🏆' : '😔'}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              {scores[0] > scores[1] ? 'Your Team Wins!' : 'Bots Win!'}
            </h2>
            <p style={{ color: 'rgba(245,240,232,0.6)', marginBottom: '1.5rem' }}>
              NS: {scores[0]} · EW: {scores[1]}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={startGame}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', height: 44, background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)', flexShrink: 0, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
          <Link to="/lobby" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', flexShrink: 0 }}>← Menu</Link>
          <span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>♠</span>
          {/* Trump indicator */}
          <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: 'white', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
            ♠ Spades trump
          </span>
          {spadesBroken && (
            <span style={{ fontSize: '0.72rem', color: '#5DCAA5', flexShrink: 0 }}>· Spades broken</span>
          )}
        </div>
        {/* Turn indicator */}
        <div style={{ fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
          {isBidding
            ? <span style={{ color: 'var(--gold)' }}>{currentPlayer === 0 ? '🟢 Your bid' : `${PLAYER_NAMES[currentPlayer]} bidding...`}</span>
            : isMyTurn
            ? <span style={{ color: '#5DCAA5' }}>🟢 Your turn</span>
            : phase === 'playing'
            ? <span style={{ color: 'var(--gold)' }}>{PLAYER_NAMES[currentPlayer]} thinking...</span>
            : null
          }
        </div>
        {/* Score strip */}
        <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0, alignItems: 'center' }}>
          <span style={{ color: '#5DCAA5' }}>We:{scores[0]}</span>
          <span style={{ color: '#c0392b' }}>They:{scores[1]}</span>
          {phase === 'playing' && <>
            <span style={{ color: 'rgba(245,240,232,0.3)' }}>|</span>
            <span style={{ color: '#5DCAA5' }}>T:{tricksWon[0] + tricksWon[2]}</span>
            <span style={{ color: '#c0392b' }}>T:{tricksWon[1] + tricksWon[3]}</span>
          </>}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* NORTH */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: isMobile ? '4px 6px 2px' : '8px 12px 4px', flexShrink: 0 }}>
          <PlayerLabel pos="N" name={PLAYER_LABELS[2]} bid={bids[2]} tricksWon={tricksWon[2]} isActive={currentPlayer === 2} isMobile={isMobile} />
          <FaceDownHand count={hands[2]?.length || 0} cardW={northCW} cardH={northCH} overlap={northOL} />
        </div>

        {/* MIDDLE ROW */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden', minHeight: 0, padding: isMobile ? '0 4px' : '0 8px', gap: isMobile ? 4 : 8 }}>

          {/* WEST */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: currentPlayer === 1 ? '#c9a84c' : 'rgba(245,240,232,0.45)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {isMobile ? 'W' : `West${bids[1] !== null ? ` · ${bids[1]}` : ''}`}
            </span>
            <FaceDownHand count={hands[1]?.length || 0} vertical cardW={sideCW} cardH={sideCH} overlap={sideOL} />
            {currentPlayer === 1 && phase === 'playing' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 1.2s ease-in-out infinite' }} />
            )}
          </div>

          {/* CENTER — trick area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            {isBidding ? (
              currentPlayer === 0
                ? <BidPanel onBid={submitBid} isMobile={isMobile} />
                : <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(0,0,0,0.45)', borderRadius: 12, border: '1px solid rgba(201,168,76,0.1)' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 6 }}>Waiting for {PLAYER_NAMES[currentPlayer]}...</p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {bids.map((b, i) => b !== null ? (
                        <span key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 20, color: 'var(--cream)' }}>
                          {PLAYER_LABELS[i]}: {b}
                        </span>
                      ) : null)}
                    </div>
                  </div>
            ) : (
              /* Trick area — 4 quadrants */
              <div style={{ position: 'relative', width: isMobile ? 180 : 260, height: isMobile ? 160 : 220, flexShrink: 0 }}>
                {[
                  { player: 2, pos: { top: 0, left: '50%', transform: 'translateX(-50%)' } },
                  { player: 0, pos: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
                  { player: 1, pos: { left: 0, top: '50%', transform: 'translateY(-50%)' } },
                  { player: 3, pos: { right: 0, top: '50%', transform: 'translateY(-50%)' } },
                ].map(({ player, pos }) => {
                  const played = getTrickCard(player)
                  const isWinner = currentTrickWinner === player
                  return (
                    <div key={player} style={{ position: 'absolute', ...pos }}>
                      {played ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            border: isWinner ? '2px solid #c9a84c' : '2px solid transparent',
                            borderRadius: 9, boxShadow: isWinner ? '0 0 12px rgba(201,168,76,0.6)' : 'none',
                          }}>
                            <SCard card={played.card} w={trickCW} h={trickCH} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: isWinner ? '#c9a84c' : 'rgba(245,240,232,0.4)', marginTop: 2, fontWeight: isWinner ? 700 : 400 }}>
                            {PLAYER_LABELS[player]}{isWinner ? ' 👑' : ''}
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: trickCW, height: trickCH, borderRadius: 8, border: '2px dashed rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.15)' }}>{PLAYER_LABELS[player][0]}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Last trick result */}
                {trick.length === 0 && lastWinner !== null && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>
                      {PLAYER_LABELS[lastWinner]} won
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EAST */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
            {currentPlayer === 3 && phase === 'playing' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 1.2s ease-in-out infinite' }} />
            )}
            <FaceDownHand count={hands[3]?.length || 0} vertical cardW={sideCW} cardH={sideCH} overlap={sideOL} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: currentPlayer === 3 ? '#c9a84c' : 'rgba(245,240,232,0.45)', writingMode: 'vertical-rl' }}>
              {isMobile ? 'E' : `East${bids[3] !== null ? ` · ${bids[3]}` : ''}`}
            </span>
          </div>
        </div>

        {/* SOUTH — human hand */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 4 : 6, padding: isMobile ? '2px 6px 8px' : '4px 12px 12px' }}>
          <PlayerLabel pos="S" name="South (You)" bid={bids[0]} tricksWon={tricksWon[0]} isActive={isMyTurn} isMobile={isMobile} />
          {/* Hand sorted by suit */}
          <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', maxWidth: '100%' }}>
            {['♠', '♥', '♦', '♣'].map(suit => {
              const cards = (hands[0] || []).filter(c => c.suit === suit)
              if (!cards.length) return null
              const col = suit === '♥' || suit === '♦' ? '#c0392b' : 'rgba(255,255,255,0.7)'
              return (
                <div key={suit} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 4 }}>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.3rem', color: col, fontWeight: 700, flexShrink: 0 }}>{suit}</span>
                  <div style={{ position: 'relative', height: southCH + 12, width: southCW + (cards.length - 1) * southOL }}>
                    {cards.map((card, i) => {
                      const isValid = validCards.includes(card)
                      const isSel = selected === card
                      return (
                        <div key={`${card.rank}${card.suit}`} style={{ position: 'absolute', left: i * southOL, zIndex: isSel ? 50 : i }}>
                          <SCard
                            card={card}
                            selected={isSel}
                            valid={phase === 'playing' && currentPlayer === 0 ? isValid : undefined}
                            w={southCW} h={southCH}
                            onClick={() => {
                              if (!isValid) return
                              if (isSel) { playCard(card); setSelected(null) }
                              else setSelected(card)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          {isMyTurn && <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)' }}>Tap to select · Tap again to play</p>}
          {isBidding && currentPlayer === 0 && <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)' }}>Select your bid above</p>}
        </div>
      </div>

      {/* Right panel — desktop only */}
      {!isMobile && (
        <div style={{ position: 'fixed', right: 0, top: 56, bottom: 0, width: 180, background: 'rgba(0,0,0,0.4)', borderLeft: '1px solid rgba(201,168,76,0.1)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {/* Bids & tricks */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>This Hand</p>
            {[
              { label: 'You', i: 0, color: '#5DCAA5' },
              { label: 'Partner', i: 2, color: '#5DCAA5' },
              { label: 'West', i: 1, color: '#c0392b' },
              { label: 'East', i: 3, color: '#c0392b' },
            ].map(({ label, i, color }) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.6)' }}>{label}</span>
                <span style={{ fontSize: '0.8rem', color, fontWeight: 600 }}>
                  {bids[i] !== null ? `bid ${bids[i]}` : '—'} · {tricksWon[i]}✓
                </span>
              </div>
            ))}
          </div>
          {/* Team totals */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Score</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.82rem', color: '#5DCAA5' }}>NS (We)</span>
              <span style={{ fontSize: '0.9rem', color: '#5DCAA5', fontWeight: 700 }}>{scores[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', color: '#c0392b' }}>EW (They)</span>
              <span style={{ fontSize: '0.9rem', color: '#c0392b', fontWeight: 700 }}>{scores[1]}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.35)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
              First to 500 wins
            </div>
          </div>
          {/* Trick info */}
          {phase === 'playing' && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>Tricks</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)' }}>Trick</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 700 }}>{trickNo + 1}/13</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.8rem', color: '#5DCAA5' }}>NS won</span>
                <span style={{ fontSize: '0.85rem', color: '#5DCAA5', fontWeight: 700 }}>{tricksWon[0] + tricksWon[2]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#c0392b' }}>EW won</span>
                <span style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 700 }}>{tricksWon[1] + tricksWon[3]}</span>
              </div>
            </div>
          )}
          {/* How to play */}
          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>How to Play</p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>
              ♠ Spades are always trump. Bid your tricks, then make your contract. Bags count against you. First team to 500 wins.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
