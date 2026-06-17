import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { saveGameResult } from '../lib/saveGameResult'
import {
  createDeck, shuffle, dealHands, sortHand,
  botBid, botPlay, getValidCards, trickWinner, calcTeamScore
} from './spadesEngine'

// Players: 0=South(human), 1=West, 2=North(partner), 3=East
const LABELS = ['You', 'West', 'Partner', 'East']

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 600)
  useEffect(() => {
    const h = () => setV(window.innerWidth < 600)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return v
}

// ─── Create a fresh game state object ────────────────────────────
function newGameState() {
  const deck = shuffle(createDeck())
  const dealt = dealHands(deck)
  return {
    hands: dealt.map(h => sortHand(h)),
    bids: [null, null, null, null],
    phase: 'bidding',        // bidding | playing | handEnd
    currentPlayer: 0,        // who bids / plays next
    trick: [],               // [{player, card}, ...]
    trickNo: 0,              // 0-12
    spadesBroken: false,
    tricksWon: [0, 0, 0, 0],
    lastTrick: null,
    lastWinner: null,
    trickResolved: false,
  }
}

// ─── Pure logic: advance bidding ──────────────────────────────────
function applyBid(g, playerIdx, bid) {
  const ng = deepClone(g)
  ng.bids[playerIdx] = bid
  const next = playerIdx + 1
  if (next < 4) {
    ng.currentPlayer = next
  } else {
    ng.phase = 'playing'
    ng.currentPlayer = 0
  }
  return ng
}

// ─── Pure logic: play a card ──────────────────────────────────────
function applyCard(g, playerIdx, card) {
  const ng = deepClone(g)
  ng.hands[playerIdx] = ng.hands[playerIdx].filter(c =>
    !(c.rank === card.rank && c.suit === card.suit)
  )
  ng.trick = [...ng.trick, { player: playerIdx, card }]
  if (card.suit === '♠') ng.spadesBroken = true

  if (ng.trick.length === 4) {
    // Trick complete — keep all 4 cards visible, mark as resolved
    // The trick is cleared later by a separate timer (see clearResolvedTrick)
    const winner = trickWinner(ng.trick)
    ng.tricksWon[winner] += 1
    ng.lastTrick = ng.trick
    ng.lastWinner = winner
    ng.trickNo += 1
    ng.currentPlayer = winner
    ng.trickResolved = true // signals: trick is full, waiting to be cleared
    if (ng.trickNo === 13) {
      ng.phase = 'handEnd'
    }
  } else {
    ng.currentPlayer = (playerIdx + 1) % 4
  }
  return ng
}

// Called after a delay once a trick is resolved, to clear it from the table
function clearResolvedTrick(g) {
  const ng = deepClone(g)
  ng.trick = []
  ng.trickResolved = false
  return ng
}

function deepClone(g) {
  return JSON.parse(JSON.stringify(g))
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
  const isInvalid = valid === false
  const col = isInvalid ? (isRed ? '#a05050' : '#555566') : (isRed ? '#c0392b' : '#1a1a2e')
  const fs = Math.max(8, Math.round(w * 0.16))
  const ss = Math.max(12, Math.round(w * 0.28))
  return (
    <div onClick={valid && onClick ? onClick : undefined} style={{
      width: w, height: h, borderRadius: 7, flexShrink: 0,
      background: selected ? '#fffde7' : isInvalid ? '#d8d8d8' : 'white',
      border: selected ? '2.5px solid #c9a84c' : isInvalid ? '1px solid #aaa' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 2px rgba(201,168,76,0.5),0 6px 16px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.2)',
      cursor: valid && onClick ? 'pointer' : 'default',
      userSelect: 'none', position: 'relative',
      transform: selected ? 'translateY(-10px)' : 'none',
      transition: 'transform 0.12s, box-shadow 0.12s',
      opacity: isInvalid ? 0.65 : 1,
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

function FaceDownHand({ count, vertical = false, cardW = 56, cardH = 78, overlap = 16 }) {
  if (!count) return null
  if (vertical) return (
    <div style={{ position: 'relative', width: cardW, height: cardH + (count - 1) * overlap, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', top: i * overlap }}>
          <SCard faceDown w={cardW} h={cardH} />
        </div>
      ))}
    </div>
  )
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

function BidPanel({ onBid, isMobile }) {
  const [sel, setSel] = useState(null)
  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)', borderRadius: 12,
      padding: isMobile ? '10px 12px' : '14px 18px',
      border: '1px solid rgba(201,168,76,0.3)',
      width: '100%', maxWidth: 340, boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: '0.94rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Your Bid — How many tricks?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => (
          <button key={n} onClick={() => setSel(n)} style={{
            width: isMobile ? 38 : 42, height: isMobile ? 38 : 42,
            borderRadius: 8, fontWeight: 700, fontSize: '1.02rem',
            background: sel === n ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
            border: `2px solid ${sel === n ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
            color: sel === n ? '#1a1a1a' : 'white', cursor: 'pointer',
          }}>{n === 0 ? 'Nil' : n}</button>
        ))}
      </div>
      <button onClick={() => sel !== null && onBid(sel)} disabled={sel === null} style={{
        width: '100%', padding: '10px', borderRadius: 8, fontWeight: 700,
        fontSize: '0.95rem', cursor: sel !== null ? 'pointer' : 'not-allowed',
        background: sel !== null ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
        color: sel !== null ? '#1a1a1a' : 'rgba(255,255,255,0.3)', border: 'none',
      }}>
        Confirm Bid {sel !== null ? `(${sel === 0 ? 'Nil' : sel})` : ''}
      </button>
    </div>
  )
}

// ─── Main Spades component ────────────────────────────────────────
export default function Spades() {
  usePageMeta('/game/spades')
  const isMobile = useIsMobile()

  const [g, setG] = useState(null)               // game state
  const [scores, setScores] = useState([0, 0])   // [NS, EW] cumulative
  const [selected, setSelected] = useState(null)  // selected card object
  const [gameOver, setGameOver] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [showLastTrick, setShowLastTrick] = useState(false)

  const botTimer = useRef(null)
  const lastTrickTimer = useRef(null)

  // Pulse animation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `@keyframes spulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}`
    document.head.appendChild(style)
    return () => { try { document.head.removeChild(style) } catch(e){} }
  }, [])

  function startNewHand() {
    clearTimeout(botTimer.current)
    clearTimeout(lastTrickTimer.current)
    setG(newGameState())
    setSelected(null)
    setShowLastTrick(false)
  }

  useEffect(() => { startNewHand() }, [])

  // ── Watch for handEnd — score and start next hand ─────────────────
  useEffect(() => {
    if (!g || g.phase !== 'handEnd') return
    const { bids, tricksWon } = g
    const t0 = calcTeamScore([bids[0], bids[2]], [tricksWon[0], tricksWon[2]])
    const t1 = calcTeamScore([bids[1], bids[3]], [tricksWon[1], tricksWon[3]])
    const newScores = [scores[0] + t0, scores[1] + t1]
    setScores(newScores)
    if (newScores[0] >= 500 || newScores[1] >= 500) {
      setGameOver(true)
    } else {
      botTimer.current = setTimeout(() => startNewHand(), 2500)
    }
  }, [g?.phase]) // only fire when phase changes to handEnd

  // Save result
  useEffect(() => {
    if (!gameOver || resultSaved) return
    const playerWon = scores[0] > scores[1]
    saveGameResult('spades', playerWon, scores[0], playerWon ? 20 : -10, {})
    setResultSaved(true)
  }, [gameOver])

  // ── Bot actions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!g) return
    if (g.phase === 'handEnd') return

    // Bot bidding
    if (g.phase === 'bidding' && g.currentPlayer !== 0) {
      clearTimeout(botTimer.current)
      botTimer.current = setTimeout(() => {
        const bid = botBid(g.hands[g.currentPlayer])
        setG(prev => applyBid(prev, prev.currentPlayer, bid))
      }, 600)
      return () => clearTimeout(botTimer.current)
    }

    // Bot card play — skip while a completed trick is waiting to clear
    if (g.phase === 'playing' && g.currentPlayer !== 0 && g.trick.length < 4 && !g.trickResolved) {
      clearTimeout(botTimer.current)
      botTimer.current = setTimeout(() => {
        setG(prev => {
          if (!prev || prev.phase !== 'playing' || prev.currentPlayer === 0 || prev.trickResolved) return prev
          const card = botPlay(prev.hands[prev.currentPlayer], prev.trick, prev.spadesBroken)
          return applyCard(prev, prev.currentPlayer, card)
        })
      }, 750)
      return () => clearTimeout(botTimer.current)
    }
  }, [g])

  // ── Clear a resolved trick after a pause so the 4th card is visible ──
  useEffect(() => {
    if (!g || !g.trickResolved) return
    clearTimeout(lastTrickTimer.current)
    lastTrickTimer.current = setTimeout(() => {
      setG(prev => {
        if (!prev || !prev.trickResolved) return prev
        return clearResolvedTrick(prev)
      })
    }, 1600) // 1.6s pause showing the completed trick with winner highlighted
    return () => clearTimeout(lastTrickTimer.current)
  }, [g?.trickResolved, g?.trickNo])

  // ── Show last trick briefly after trick completes ─────────────────
  useEffect(() => {
    if (!g?.lastTrick) return
    setShowLastTrick(true)
    const t = setTimeout(() => setShowLastTrick(false), 1800)
    return () => clearTimeout(t)
  }, [g?.trickNo])

  // ── Human plays card ──────────────────────────────────────────────
  function handleCardClick(card) {
    if (!g || g.phase !== 'playing' || g.currentPlayer !== 0 || g.trickResolved) return
    const valid = getValidCards(g.hands[0], g.trick, g.spadesBroken)
    if (!valid.find(c => c.rank === card.rank && c.suit === card.suit)) return
    if (selected && selected.rank === card.rank && selected.suit === card.suit) {
      setSelected(null)
      setG(prev => applyCard(prev, 0, card))
    } else {
      setSelected(card)
    }
  }

  // ── Human bids ────────────────────────────────────────────────────
  function handleBid(bid) {
    if (!g || g.phase !== 'bidding' || g.currentPlayer !== 0) return
    setG(prev => applyBid(prev, 0, bid))
  }

  if (!g) return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1f14' }}>
      <p style={{ color: 'var(--gold)' }}>Dealing...</p>
    </div>
  )

  const isMyTurn = g.phase === 'playing' && g.currentPlayer === 0
  const isBidding = g.phase === 'bidding'
  const validCards = isMyTurn ? getValidCards(g.hands[0], g.trick, g.spadesBroken) : []

  // Trick winner for gold highlight
  const trickComplete = g.trick.length === 4
  const currentWinner = trickComplete ? trickWinner(g.trick) : null

  // Card sizes
  const nCW = isMobile ? 48 : 68; const nCH = isMobile ? 67 : 95; const nOL = isMobile ? 14 : 20
  const sCW = isMobile ? 40 : 54; const sCH = isMobile ? 56 : 76; const sOL = isMobile ? 11 : 15
  const myCW = isMobile ? 62 : 88; const myCH = isMobile ? 87 : 123; const myOL = isMobile ? 18 : 26
  const tCW = isMobile ? 56 : 78; const tCH = isMobile ? 79 : 109

  return (
    <div style={{ paddingTop: 56, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d1f14', overflow: 'hidden' }}>

      {/* Game Over overlay */}
      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a3d28', border: '2px solid var(--gold)', borderRadius: 18, padding: '2rem', textAlign: 'center', maxWidth: 380, width: '90%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{scores[0] > scores[1] ? '🏆' : '😔'}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              {scores[0] > scores[1] ? 'Your Team Wins!' : 'Bots Win!'}
            </h2>
            <p style={{ color: 'rgba(245,240,232,0.6)', marginBottom: '1.5rem' }}>NS: {scores[0]} · EW: {scores[1]}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={() => { setGameOver(false); setScores([0,0]); setResultSaved(false); startNewHand() }}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', height: 44, background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)', flexShrink: 0, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          <Link to="/lobby" style={{ color: 'var(--text-muted)', fontSize: '0.97rem', textDecoration: 'none', flexShrink: 0 }}>← Menu</Link>
          <span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>♠</span>
          <span style={{ fontSize: '1.04rem', background: 'rgba(255,255,255,0.08)', color: 'white', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
            ♠ Spades trump{g.spadesBroken ? ' · broken' : ''}
          </span>
        </div>
        <div style={{ fontSize: '0.94rem', fontWeight: 600, flexShrink: 0 }}>
          {isBidding
            ? <span style={{ color: g.currentPlayer === 0 ? '#5DCAA5' : 'var(--gold)' }}>
                {g.currentPlayer === 0 ? '🟢 Your bid' : `${LABELS[g.currentPlayer]} bidding...`}
              </span>
            : isMyTurn
            ? <span style={{ color: '#5DCAA5' }}>🟢 Your turn</span>
            : g.phase === 'playing'
            ? <span style={{ color: 'var(--gold)' }}>{LABELS[g.currentPlayer]} thinking...</span>
            : null
          }
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.94rem', fontWeight: 600, flexShrink: 0, alignItems: 'center' }}>
          <span style={{ color: '#5DCAA5' }}>We:{scores[0]}</span>
          <span style={{ color: '#c0392b' }}>They:{scores[1]}</span>
          {g.phase === 'playing' && <>
            <span style={{ color: 'rgba(245,240,232,0.3)' }}>|</span>
            <span style={{ color: '#5DCAA5' }}>T:{g.tricksWon[0]+g.tricksWon[2]}</span>
            <span style={{ color: '#c0392b' }}>T:{g.tricksWon[1]+g.tricksWon[3]}</span>
          </>}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, paddingRight: isMobile ? 0 : 200 }}>

        {/* NORTH */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: isMobile ? '4px 6px 2px' : '8px 12px 4px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {g.currentPlayer === 2 && g.phase === 'playing' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'spulse 1.2s ease-in-out infinite' }} />
            )}
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', fontWeight: 600, color: g.currentPlayer === 2 ? '#c9a84c' : 'rgba(245,240,232,0.55)' }}>
              Partner{g.bids[2] !== null ? ` · bid ${g.bids[2]} · won ${g.tricksWon[2]}` : ''}
            </span>
          </div>
          <FaceDownHand count={g.hands[2]?.length || 0} cardW={nCW} cardH={nCH} overlap={nOL} />
        </div>

        {/* MIDDLE ROW */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflow: 'hidden', minHeight: 0, padding: isMobile ? '0 8px' : '0 20px', gap: isMobile ? 6 : 14 }}>

          {/* WEST */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 700, color: g.currentPlayer === 1 ? '#c9a84c' : 'rgba(245,240,232,0.45)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {isMobile ? 'W' : `West${g.bids[1] !== null ? ` · ${g.bids[1]}` : ''}`}
            </span>
            <FaceDownHand count={g.hands[1]?.length || 0} vertical cardW={sCW} cardH={sCH} overlap={sOL} />
            {g.currentPlayer === 1 && g.phase === 'playing' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'spulse 1.2s ease-in-out infinite' }} />
            )}
          </div>

          {/* CENTER */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            {isBidding ? (
              g.currentPlayer === 0
                ? <BidPanel onBid={handleBid} isMobile={isMobile} />
                : <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(0,0,0,0.45)', borderRadius: 12, border: '1px solid rgba(201,168,76,0.1)' }}>
                    <p style={{ fontSize: '1.02rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {LABELS[g.currentPlayer]} is bidding...
                    </p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {g.bids.map((b, i) => b !== null && (
                        <span key={i} style={{ fontSize: '0.94rem', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, color: 'var(--cream)' }}>
                          {LABELS[i]}: {b === 0 ? 'Nil' : b}
                        </span>
                      ))}
                    </div>
                  </div>
            ) : (
              /* Trick area */
              <div style={{ position: 'relative', width: isMobile ? 220 : 320, height: isMobile ? 200 : 280, flexShrink: 0 }}>
                {[
                  { player: 2, pos: { top: 0, left: '50%', transform: 'translateX(-50%)' } },
                  { player: 0, pos: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
                  { player: 1, pos: { left: 0, top: '50%', transform: 'translateY(-50%)' } },
                  { player: 3, pos: { right: 0, top: '50%', transform: 'translateY(-50%)' } },
                ].map(({ player, pos }) => {
                  const played = g.trick.find(t => t.player === player)
                  const isWinner = currentWinner === player
                  return (
                    <div key={player} style={{ position: 'absolute', ...pos }}>
                      {played ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ border: isWinner ? '2.5px solid #c9a84c' : '2px solid transparent', borderRadius: 9, boxShadow: isWinner ? '0 0 14px rgba(201,168,76,0.6)' : 'none' }}>
                            <SCard card={played.card} w={tCW} h={tCH} />
                          </div>
                          <div style={{ fontSize: '0.94rem', color: isWinner ? '#c9a84c' : 'rgba(245,240,232,0.4)', marginTop: 2, fontWeight: isWinner ? 700 : 400 }}>
                            {LABELS[player]}{isWinner ? ' 👑' : ''}
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: tCW, height: tCH, borderRadius: 8, border: '2px dashed rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.02rem', color: 'rgba(245,240,232,0.15)' }}>{LABELS[player][0]}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Last trick winner label when trick cleared */}
                {g.trick.length === 0 && g.lastWinner !== null && showLastTrick === false && g.trickNo > 0 && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.35)' }}>
                      {LABELS[g.lastWinner]} won trick {g.trickNo}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EAST */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
            {g.currentPlayer === 3 && g.phase === 'playing' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'spulse 1.2s ease-in-out infinite' }} />
            )}
            <FaceDownHand count={g.hands[3]?.length || 0} vertical cardW={sCW} cardH={sCH} overlap={sOL} />
            <span style={{ fontSize: '0.98rem', fontWeight: 700, color: g.currentPlayer === 3 ? '#c9a84c' : 'rgba(245,240,232,0.45)', writingMode: 'vertical-rl' }}>
              {isMobile ? 'E' : `East${g.bids[3] !== null ? ` · ${g.bids[3]}` : ''}`}
            </span>
          </div>
        </div>

        {/* SOUTH — your hand */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 3 : 5, padding: isMobile ? '2px 6px 8px' : '4px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isMyTurn && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5DCAA5', animation: 'spulse 1.2s ease-in-out infinite' }} />}
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', fontWeight: 600, color: isMyTurn ? '#5DCAA5' : 'rgba(245,240,232,0.7)' }}>
              South (You){g.bids[0] !== null ? ` · bid ${g.bids[0]} · won ${g.tricksWon[0]}` : ''}
            </span>
          </div>
          {/* Hand by suit */}
          <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', maxWidth: '100%' }}>
            {['♠','♥','♦','♣'].map(suit => {
              const cards = (g.hands[0] || []).filter(c => c.suit === suit)
              if (!cards.length) return null
              const col = suit === '♥' || suit === '♦' ? '#c0392b' : 'rgba(255,255,255,0.7)'
              return (
                <div key={suit} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 3 }}>
                  <span style={{ fontSize: isMobile ? '0.9rem' : '1.2rem', color: col, fontWeight: 700, flexShrink: 0 }}>{suit}</span>
                  <div style={{ position: 'relative', height: myCH + 12, width: myCW + (cards.length - 1) * myOL }}>
                    {cards.map((card, i) => {
                      const isValid = validCards.some(c => c.rank === card.rank && c.suit === card.suit)
                      const isSel = selected && selected.rank === card.rank && selected.suit === card.suit
                      return (
                        <div key={`${card.rank}${card.suit}`} style={{ position: 'absolute', left: i * myOL, zIndex: isSel ? 50 : i }}>
                          <SCard
                            card={card}
                            selected={isSel}
                            valid={isMyTurn ? isValid : undefined}
                            w={myCW} h={myCH}
                            onClick={() => handleCardClick(card)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          {isMyTurn && <p style={{ fontSize: '0.98rem', color: 'rgba(245,240,232,0.3)' }}>Tap to select · Tap again to play</p>}
        </div>
      </div>

      {/* Right panel desktop */}
      {!isMobile && (
        <div style={{ position: 'fixed', right: 0, top: 56, bottom: 0, width: 200, background: 'rgba(0,0,0,0.4)', borderLeft: '1px solid rgba(201,168,76,0.1)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>This Hand</p>
            {[{ label:'You', i:0, col:'#5DCAA5' },{ label:'Partner', i:2, col:'#5DCAA5' },{ label:'West', i:1, col:'#c0392b' },{ label:'East', i:3, col:'#c0392b' }].map(({ label, i, col }) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.94rem', color: 'rgba(245,240,232,0.6)' }}>{label}</span>
                <span style={{ fontSize: '0.94rem', color: col, fontWeight: 600 }}>
                  {g.bids[i] !== null ? `${g.bids[i] === 0 ? 'Nil' : g.bids[i]} · ${g.tricksWon[i]}✓` : '—'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Score</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.96rem', color: '#5DCAA5' }}>NS (We)</span>
              <span style={{ fontSize: '1.04rem', color: '#5DCAA5', fontWeight: 700 }}>{scores[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.96rem', color: '#c0392b' }}>EW (They)</span>
              <span style={{ fontSize: '1.04rem', color: '#c0392b', fontWeight: 700 }}>{scores[1]}</span>
            </div>
            <div style={{ fontSize: '0.98rem', color: 'rgba(245,240,232,0.35)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>First to 500 wins</div>
          </div>
          {g.phase === 'playing' && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>Tricks</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.94rem', color: 'rgba(245,240,232,0.5)' }}>Trick</span>
                <span style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 700 }}>{g.trickNo + 1}/13</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.94rem', color: '#5DCAA5' }}>NS won</span>
                <span style={{ fontSize: '1rem', color: '#5DCAA5', fontWeight: 700 }}>{g.tricksWon[0]+g.tricksWon[2]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.94rem', color: '#c0392b' }}>EW won</span>
                <span style={{ fontSize: '1rem', color: '#c0392b', fontWeight: 700 }}>{g.tricksWon[1]+g.tricksWon[3]}</span>
              </div>
            </div>
          )}
          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>How to Play</p>
            <p style={{ fontSize: '1.02rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>
              ♠ Always trump. Bid your tricks, make your contract. Bags count against you. First to 500 wins.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
