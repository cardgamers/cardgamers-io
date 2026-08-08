import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { saveGameResult } from '../lib/saveGameResult'

// Players: 0=South(human), 1=West, 2=North(partner), 3=East
const LABELS = ['You', 'West', 'North', 'East']
const SUITS = ['♠','♥','♦','♣']
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const RANK_VAL = Object.fromEntries(RANKS.map((r,i) => [r,i]))

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 600)
  useEffect(() => {
    const h = () => setV(window.innerWidth < 600)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return v
}

// ── Deck helpers ──────────────────────────────────────────────────
function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, value: RANK_VAL[rank] })
  return deck
}

function shuffle(d) {
  const a = [...d]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

function sortHand(hand) {
  return [...hand].sort((a,b) => {
    const so = {'♠':3,'♥':2,'♦':1,'♣':0}
    if (a.suit !== b.suit) return so[b.suit] - so[a.suit]
    return b.value - a.value
  })
}

function cardId(c) { return `${c.rank}${c.suit}` }

// ── Card penalty value ────────────────────────────────────────────
function penaltyOf(card) {
  if (card.suit === '♥') return 1
  if (card.suit === '♠' && card.rank === 'Q') return 13
  return 0
}

// ── Valid cards to play ───────────────────────────────────────────
function getValid(hand, trick, heartsBroken, trickNo) {
  // First trick — 2♣ must lead; can't play Hearts or Q♠
  if (trickNo === 0 && trick.length === 0) {
    return hand.filter(c => c.suit === '♣' && c.rank === '2')
  }
  if (trickNo === 0 && trick.length > 0) {
    const safe = hand.filter(c => c.suit !== '♥' && !(c.suit === '♠' && c.rank === 'Q'))
    return safe.length > 0 ? safe : hand
  }
  if (trick.length === 0) {
    // Leading: can't lead Hearts unless broken or only Hearts left
    if (!heartsBroken) {
      const nonHearts = hand.filter(c => c.suit !== '♥')
      return nonHearts.length > 0 ? nonHearts : hand
    }
    return hand
  }
  // Following suit
  const led = trick[0].card.suit
  const follow = hand.filter(c => c.suit === led)
  return follow.length > 0 ? follow : hand
}

// ── Trick winner ──────────────────────────────────────────────────
function trickWinner(trick) {
  const led = trick[0].card.suit
  let best = trick[0]
  for (const t of trick) {
    if (t.card.suit === led && t.card.value > best.card.value) best = t
  }
  return best.player
}

// ── Score a completed hand ────────────────────────────────────────
function scoreHand(pointsWon) {
  // Check shoot the moon
  const shotMoon = pointsWon.some(p => p === 26)
  if (shotMoon) {
    return pointsWon.map(p => p === 26 ? 0 : 26)
  }
  return pointsWon
}

// ── Bot card play ─────────────────────────────────────────────────
function botPlay(hand, trick, heartsBroken, trickNo, position) {
  const valid = getValid(hand, trick, heartsBroken, trickNo)
  if (valid.length === 1) return valid[0]

  // Leading
  if (trick.length === 0) {
    // Lead lowest safe card (avoid Hearts, prefer low clubs/diamonds)
    const safe = valid.filter(c => c.suit !== '♥' && !(c.suit === '♠' && c.rank === 'Q'))
    const pool = safe.length > 0 ? safe : valid
    return pool.reduce((a,b) => a.value < b.value ? a : b)
  }

  const led = trick[0].card.suit
  const following = valid.filter(c => c.suit === led)
  const currentWinner = (() => {
    let best = trick[0]
    for (const t of trick) {
      if (t.card.suit === led && t.card.value > best.card.value) best = t
    }
    return best
  })()
  const partnerWinning = (currentWinner.player % 2) === (position % 2)

  if (following.length > 0) {
    // Following suit
    const isLast = trick.length === 3
    // Try to avoid winning if possible — play highest card that doesn't win
    const losing = following.filter(c => c.value < currentWinner.card.value)
    if (losing.length > 0 && !isLast) {
      // Play highest losing card
      return losing.reduce((a,b) => a.value > b.value ? a : b)
    }
    if (isLast) {
      // Last to play — dump penalty cards if we must win, otherwise play lowest
      const mustWin = following.every(c => c.value > currentWinner.card.value)
      if (!mustWin) return following.reduce((a,b) => a.value < b.value ? a : b)
      // We'll win — play lowest winner to minimise future leading high
      return following.reduce((a,b) => a.value < b.value ? a : b)
    }
    return following.reduce((a,b) => a.value < b.value ? a : b)
  }

  // Void in led suit — discard penalty cards first
  // Priority: Q♠ > highest Heart > lowest safe card
  const qSpade = valid.find(c => c.suit === '♠' && c.rank === 'Q')
  if (qSpade) return qSpade

  const hearts = valid.filter(c => c.suit === '♥').sort((a,b) => b.value - a.value)
  if (hearts.length > 0) return hearts[0] // discard highest heart

  // Discard highest risky spade (K♠, A♠) if partner not winning
  const dangerSpades = valid.filter(c => c.suit === '♠' && c.value >= RANK_VAL['K'])
  if (dangerSpades.length > 0 && !partnerWinning) return dangerSpades[0]

  return valid.reduce((a,b) => a.value < b.value ? a : b)
}

// ── Pure state: new game ──────────────────────────────────────────
function newGameState() {
  const deck = shuffle(createDeck())
  const hands = [
    deck.slice(0,13), deck.slice(13,26),
    deck.slice(26,39), deck.slice(39,52)
  ].map(h => sortHand(h))

  // Find who has 2♣
  let leader = 0
  for (let i = 0; i < 4; i++) {
    if (hands[i].some(c => c.suit === '♣' && c.rank === '2')) { leader = i; break }
  }

  return {
    hands,
    phase: 'playing',    // playing | handEnd
    trick: [],
    trickNo: 0,
    currentPlayer: leader,
    heartsBroken: false,
    trickWon: [0,0,0,0],
    pointsWon: [0,0,0,0],
    lastTrick: null,
    lastWinner: null,
    trickResolved: false,
  }
}

function deepClone(g) { return JSON.parse(JSON.stringify(g)) }

// ── Pure: apply a card play ───────────────────────────────────────
function applyCard(g, playerIdx, card) {
  const ng = deepClone(g)
  ng.hands[playerIdx] = ng.hands[playerIdx].filter(c => cardId(c) !== cardId(card))
  ng.trick = [...ng.trick, { player: playerIdx, card }]

  if (card.suit === '♥') ng.heartsBroken = true
  if (card.suit === '♠' && card.rank === 'Q') ng.heartsBroken = true

  if (ng.trick.length === 4) {
    const winner = trickWinner(ng.trick)
    ng.trickWon[winner] += 1
    const pts = ng.trick.reduce((sum, t) => sum + penaltyOf(t.card), 0)
    ng.pointsWon[winner] += pts
    ng.lastTrick = ng.trick
    ng.lastWinner = winner
    ng.trickNo += 1
    ng.currentPlayer = winner
    ng.trickResolved = true
    if (ng.trickNo === 13) ng.phase = 'handEnd'
  } else {
    ng.currentPlayer = (playerIdx + 1) % 4
  }
  return ng
}

function clearResolvedTrick(g) {
  const ng = deepClone(g)
  ng.trick = []
  ng.trickResolved = false
  return ng
}

// ── Card component ────────────────────────────────────────────────
function HCard({ card, selected, valid, onClick, w=72, h=100, faceDown }) {
  if (faceDown) return (
    <div style={{
      width:w, height:h, borderRadius:7, flexShrink:0,
      background:'linear-gradient(135deg,#7a1f2b,#4a0f18)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 2px,transparent 2px,transparent 10px)',
      border:'1.5px solid rgba(255,255,255,0.25)', boxShadow:'0 2px 5px rgba(0,0,0,0.45)',
    }} />
  )
  if (!card) return null
  const isRed = card.suit === '♥' || card.suit === '♦'
  const isInvalid = valid === false
  const col = isInvalid ? (isRed ? '#a05050' : '#555566') : (isRed ? '#c0392b' : '#1a1a2e')
  const isPenalty = card.suit === '♥' || (card.suit === '♠' && card.rank === 'Q')
  const fs = Math.max(8, Math.round(w*0.16))
  const ss = Math.max(12, Math.round(w*0.28))
  return (
    <div onClick={valid && onClick ? onClick : undefined} style={{
      width:w, height:h, borderRadius:7, flexShrink:0,
      background: selected ? '#fffde7' : isInvalid ? '#d8d8d8' : 'white',
      border: selected ? '2.5px solid #c9a84c' : isPenalty && !isInvalid ? '1.5px solid rgba(192,57,43,0.4)' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 2px rgba(201,168,76,0.5),0 6px 16px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.2)',
      cursor: valid && onClick ? 'pointer' : 'default',
      userSelect:'none', position:'relative',
      transform: selected ? 'translateY(-10px)' : 'none',
      transition:'transform 0.12s, box-shadow 0.12s',
      opacity: isInvalid ? 0.65 : 1,
    }}>
      <div style={{position:'absolute',top:3,left:4,lineHeight:1.1}}>
        <div style={{fontSize:fs,fontWeight:800,color:col,lineHeight:1}}>{card.rank}</div>
        <div style={{fontSize:fs,color:col,lineHeight:1}}>{card.suit}</div>
      </div>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:ss,color:col,lineHeight:1,opacity:0.85}}>{card.suit}</div>
      <div style={{position:'absolute',bottom:3,right:4,transform:'rotate(180deg)',lineHeight:1.1}}>
        <div style={{fontSize:fs,fontWeight:800,color:col,lineHeight:1}}>{card.rank}</div>
        <div style={{fontSize:fs,color:col,lineHeight:1}}>{card.suit}</div>
      </div>
    </div>
  )
}

function FaceDownHand({ count, vertical=false, cardW=56, cardH=78, overlap=16 }) {
  if (!count) return null
  if (vertical) return (
    <div style={{position:'relative',width:cardW,height:cardH+(count-1)*overlap,flexShrink:0}}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} style={{position:'absolute',top:i*overlap}}>
          <HCard faceDown w={cardW} h={cardH} />
        </div>
      ))}
    </div>
  )
  return (
    <div style={{position:'relative',height:cardH,width:cardW+(count-1)*overlap,flexShrink:0}}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} style={{position:'absolute',left:i*overlap}}>
          <HCard faceDown w={cardW} h={cardH} />
        </div>
      ))}
    </div>
  )
}

// ── Main Hearts component ─────────────────────────────────────────
export default function Hearts() {
  usePageMeta('/game/hearts')
  const isMobile = useIsMobile()

  const [g, setG] = useState(null)
  const [scores, setScores] = useState([0,0,0,0])  // cumulative scores
  const [selected, setSelected] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [showLastTrick, setShowLastTrick] = useState(false)
  const [handResults, setHandResults] = useState(null) // show between hands

  const botTimer = useRef(null)
  const lastTrickTimer = useRef(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `@keyframes hpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}`
    document.head.appendChild(style)
    return () => { try { document.head.removeChild(style) } catch(e){} }
  }, [])

  function startNewHand() {
    clearTimeout(botTimer.current)
    clearTimeout(lastTrickTimer.current)
    setG(newGameState())
    setSelected(null)
    setShowLastTrick(false)
    setHandResults(null)
  }

  useEffect(() => { startNewHand() }, [])

  // Hand complete — score and check game over
  useEffect(() => {
    if (!g || g.phase !== 'handEnd') return
    const handScores = scoreHand([...g.pointsWon])
    const shotMoon = g.pointsWon.some(p => p === 26)
    const newScores = scores.map((s,i) => s + handScores[i])
    setHandResults({ handScores, shotMoon, newScores })
    setScores(newScores)
    if (newScores.some(s => s >= 100)) {
      setGameOver(true)
      if (!resultSaved) {
        const playerWon = newScores[0] === Math.min(...newScores)
        saveGameResult('hearts', playerWon, Math.max(0, 100-newScores[0]), playerWon ? 20 : -10, {})
        setResultSaved(true)
      }
    }
  }, [g?.phase])

  // Clear resolved trick after pause
  useEffect(() => {
    if (!g || !g.trickResolved) return
    clearTimeout(lastTrickTimer.current)
    lastTrickTimer.current = setTimeout(() => {
      setG(prev => {
        if (!prev || !prev.trickResolved) return prev
        return clearResolvedTrick(prev)
      })
    }, 1600)
    return () => clearTimeout(lastTrickTimer.current)
  }, [g?.trickResolved, g?.trickNo])

  // Bot play
  useEffect(() => {
    if (!g || g.phase !== 'playing' || g.currentPlayer === 0 || g.trickResolved) return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      setG(prev => {
        if (!prev || prev.phase !== 'playing' || prev.currentPlayer === 0 || prev.trickResolved) return prev
        const card = botPlay(prev.hands[prev.currentPlayer], prev.trick, prev.heartsBroken, prev.trickNo, prev.currentPlayer)
        return applyCard(prev, prev.currentPlayer, card)
      })
    }, 750)
    return () => clearTimeout(botTimer.current)
  }, [g])

  function handleCardClick(card) {
    if (!g || g.phase !== 'playing' || g.currentPlayer !== 0 || g.trickResolved) return
    const valid = getValid(g.hands[0], g.trick, g.heartsBroken, g.trickNo)
    if (!valid.find(c => cardId(c) === cardId(card))) return
    if (selected && cardId(selected) === cardId(card)) {
      setSelected(null)
      setG(prev => applyCard(prev, 0, card))
    } else {
      setSelected(card)
    }
  }

  if (!g) return (
    <div style={{paddingTop:80,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0d1f14'}}>
      <p style={{color:'var(--gold)'}}>Dealing...</p>
    </div>
  )

  const isMyTurn = g.phase === 'playing' && g.currentPlayer === 0 && !g.trickResolved
  const validCards = isMyTurn ? getValid(g.hands[0], g.trick, g.heartsBroken, g.trickNo) : []
  const trickComplete = g.trick.length === 4
  const currentWinner = trickComplete ? trickWinner(g.trick) : null
  const myPenalties = g.pointsWon[0]

  // Card sizes
  const nCW = isMobile ? 40 : 56; const nCH = isMobile ? 56 : 78; const nOL = isMobile ? 12 : 16
  const sCW = isMobile ? 34 : 44; const sCH = isMobile ? 48 : 62; const sOL = isMobile ? 9 : 12
  const myCW = isMobile ? 52 : 76; const myCH = isMobile ? 73 : 106; const myOL = isMobile ? 15 : 22
  const tCW = isMobile ? 44 : 62; const tCH = isMobile ? 62 : 87

  return (
    <div style={{paddingTop:56,height:'100vh',display:'flex',flexDirection:'column',background:'#0d1f14',overflow:'hidden'}}>

      {/* ── Game Over overlay ── */}
      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#1a3d28',border:'2px solid var(--gold)',borderRadius:18,padding:'2rem',textAlign:'center',maxWidth:420,width:'90%'}}>
            <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>{scores[0]===Math.min(...scores)?'🏆':'💔'}</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',color:'var(--gold)',marginBottom:'0.75rem'}}>
              {scores[0]===Math.min(...scores)?'You Win!':'Game Over'}
            </h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:'1.25rem'}}>
              {LABELS.map((label,i) => (
                <div key={i} style={{background:'rgba(0,0,0,0.25)',borderRadius:8,padding:'8px 12px',border:scores[i]===Math.min(...scores)?'1px solid var(--gold)':'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:'0.72rem',color:'rgba(245,240,232,0.5)'}}>{label}</div>
                  <div style={{fontSize:'1.1rem',fontWeight:700,color:scores[i]===Math.min(...scores)?'var(--gold)':scores[i]>=100?'#c0392b':'var(--cream)'}}>{scores[i]} pts</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:'0.82rem',color:'rgba(245,240,232,0.5)',marginBottom:'1.25rem'}}>Lowest score wins · 100+ pts eliminated</p>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'center'}}>
              <button className="btn-gold" onClick={() => { setGameOver(false); setScores([0,0,0,0]); setResultSaved(false); startNewHand() }}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hand results overlay ── */}
      {handResults && !gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#1a3d28',border:'2px solid var(--gold)',borderRadius:18,padding:'1.75rem',textAlign:'center',maxWidth:380,width:'90%'}}>
            {handResults.shotMoon && (
              <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>🌙</div>
            )}
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',color:'var(--gold)',marginBottom:'0.25rem'}}>
              {handResults.shotMoon ? 'Shoot the Moon!' : 'Hand Complete'}
            </h2>
            {handResults.shotMoon && (
              <p style={{fontSize:'0.82rem',color:'rgba(245,240,232,0.6)',marginBottom:'0.75rem'}}>Someone took all 26 penalty points — everyone else gets 26!</p>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,margin:'0.75rem 0'}}>
              {LABELS.map((label,i) => (
                <div key={i} style={{background:'rgba(0,0,0,0.25)',borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:'0.68rem',color:'rgba(245,240,232,0.45)'}}>{label}</div>
                  <div style={{fontSize:'0.9rem',color:handResults.handScores[i]>0?'#c0392b':'#5DCAA5',fontWeight:600}}>+{handResults.handScores[i]} pts</div>
                  <div style={{fontSize:'0.72rem',color:'var(--gold)'}}>Total: {handResults.newScores[i]}</div>
                </div>
              ))}
            </div>
            <button className="btn-gold" onClick={startNewHand} style={{width:'100%',justifyContent:'center',marginTop:'0.5rem'}}>
              Next Hand →
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 0.75rem',height:44,background:'rgba(0,0,0,0.6)',borderBottom:'1px solid rgba(201,168,76,0.12)',flexShrink:0,gap:6}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flex:1,minWidth:0}}>
          <Link to="/lobby" style={{color:'var(--text-muted)',fontSize:'0.85rem',textDecoration:'none',flexShrink:0}}>← Menu</Link>
          <span style={{fontFamily:"'Playfair Display',serif",color:'#e74c3c',fontWeight:700,flexShrink:0}}>♥</span>
          <span style={{fontSize:'0.8rem',background:'rgba(255,255,255,0.08)',color:'white',padding:'2px 8px',borderRadius:20,flexShrink:0}}>
            ♥ Hearts{g.heartsBroken ? ' · broken' : ' · not broken'}
          </span>
        </div>
        <div style={{fontSize:'0.82rem',fontWeight:600,flexShrink:0}}>
          {isMyTurn
            ? <span style={{color:'#5DCAA5'}}>🟢 Your turn</span>
            : g.phase === 'playing'
            ? <span style={{color:'var(--gold)'}}>{LABELS[g.currentPlayer]} thinking...</span>
            : null
          }
        </div>
        <div style={{display:'flex',gap:'0.75rem',fontSize:'0.82rem',fontWeight:600,flexShrink:0,alignItems:'center'}}>
          {scores.map((s,i) => (
            <span key={i} style={{color:i===0?'#5DCAA5':s>=80?'#c0392b':'rgba(245,240,232,0.6)',fontSize:'0.78rem'}}>
              {LABELS[i][0]}:{s}
            </span>
          ))}
          <span style={{color:'rgba(245,240,232,0.3)'}}>|</span>
          <span style={{color:'#e74c3c',fontSize:'0.78rem'}}>♥:{myPenalties}</span>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0,paddingRight:isMobile?0:200}}>

        {/* NORTH */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:isMobile?'4px 6px 2px':'8px 12px 4px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {g.currentPlayer===2&&!g.trickResolved&&<div style={{width:8,height:8,borderRadius:'50%',background:'#c9a84c',animation:'hpulse 1.2s ease-in-out infinite'}}/>}
            <span style={{fontSize:isMobile?'0.78rem':'0.88rem',fontWeight:600,color:g.currentPlayer===2?'#c9a84c':'rgba(245,240,232,0.55)'}}>
              North · {g.pointsWon[2]}♥
            </span>
          </div>
          <FaceDownHand count={g.hands[2]?.length||0} cardW={nCW} cardH={nCH} overlap={nOL} />
        </div>

        {/* MIDDLE ROW */}
        <div style={{flex:1,display:'flex',alignItems:'stretch',overflow:'hidden',minHeight:0,padding:isMobile?'0 8px':'0 20px',gap:isMobile?6:14}}>

          {/* WEST */}
          <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,flexShrink:0}}>
            <span style={{fontSize:'0.72rem',fontWeight:700,color:g.currentPlayer===1?'#c9a84c':'rgba(245,240,232,0.45)',writingMode:'vertical-rl',transform:'rotate(180deg)'}}>
              {isMobile?'W':`West · ${g.pointsWon[1]}♥`}
            </span>
            <FaceDownHand count={g.hands[1]?.length||0} vertical cardW={sCW} cardH={sCH} overlap={sOL} />
            {g.currentPlayer===1&&!g.trickResolved&&<div style={{width:8,height:8,borderRadius:'50%',background:'#c9a84c',animation:'hpulse 1.2s ease-in-out infinite'}}/>}
          </div>

          {/* CENTER — trick area */}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}}>
            <div style={{position:'relative',width:isMobile?220:300,height:isMobile?200:260,flexShrink:0}}>
              {[
                {player:2,pos:{top:0,left:'50%',transform:'translateX(-50%)'}},
                {player:0,pos:{bottom:0,left:'50%',transform:'translateX(-50%)'}},
                {player:1,pos:{left:0,top:'50%',transform:'translateY(-50%)'}},
                {player:3,pos:{right:0,top:'50%',transform:'translateY(-50%)'}},
              ].map(({player,pos}) => {
                const played = g.trick.find(t => t.player === player)
                const isWinner = currentWinner === player
                return (
                  <div key={player} style={{position:'absolute',...pos}}>
                    {played ? (
                      <div style={{textAlign:'center'}}>
                        <div style={{border:isWinner?'2.5px solid #c9a84c':'2px solid transparent',borderRadius:9,boxShadow:isWinner?'0 0 14px rgba(201,168,76,0.6)':'none'}}>
                          <HCard card={played.card} w={tCW} h={tCH} />
                        </div>
                        <div style={{fontSize:'0.68rem',color:isWinner?'#c9a84c':'rgba(245,240,232,0.4)',marginTop:2,fontWeight:isWinner?700:400}}>
                          {LABELS[player]}{isWinner?' 👑':''}
                          {penaltyOf(played.card)>0&&<span style={{color:'#e74c3c',marginLeft:3}}>+{penaltyOf(played.card)}</span>}
                        </div>
                      </div>
                    ) : (
                      <div style={{width:tCW,height:tCH,borderRadius:8,border:'2px dashed rgba(201,168,76,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:'0.65rem',color:'rgba(245,240,232,0.15)'}}>{LABELS[player][0]}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {g.trick.length===0&&g.lastWinner!==null&&g.trickNo>0&&(
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
                  <div style={{fontSize:'0.75rem',color:'rgba(245,240,232,0.35)'}}>{LABELS[g.lastWinner]} won trick {g.trickNo}</div>
                </div>
              )}
            </div>
          </div>

          {/* EAST */}
          <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,flexShrink:0}}>
            {g.currentPlayer===3&&!g.trickResolved&&<div style={{width:8,height:8,borderRadius:'50%',background:'#c9a84c',animation:'hpulse 1.2s ease-in-out infinite'}}/>}
            <FaceDownHand count={g.hands[3]?.length||0} vertical cardW={sCW} cardH={sCH} overlap={sOL} />
            <span style={{fontSize:'0.72rem',fontWeight:700,color:g.currentPlayer===3?'#c9a84c':'rgba(245,240,232,0.45)',writingMode:'vertical-rl'}}>
              {isMobile?'E':`East · ${g.pointsWon[3]}♥`}
            </span>
          </div>
        </div>

        {/* SOUTH — your hand */}
        <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:isMobile?3:5,padding:isMobile?'2px 6px 8px':'4px 12px 12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {isMyTurn&&<div style={{width:8,height:8,borderRadius:'50%',background:'#5DCAA5',animation:'hpulse 1.2s ease-in-out infinite'}}/>}
            <span style={{fontSize:isMobile?'0.78rem':'0.9rem',fontWeight:600,color:isMyTurn?'#5DCAA5':'rgba(245,240,232,0.7)'}}>
              South (You) · {g.pointsWon[0]}♥ taken
            </span>
          </div>
          <div style={{display:'flex',gap:isMobile?6:10,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-end',maxWidth:'100%'}}>
            {['♠','♥','♦','♣'].map(suit => {
              const cards = (g.hands[0]||[]).filter(c => c.suit===suit)
              if (!cards.length) return null
              const col = suit==='♥'||suit==='♦' ? '#c0392b' : 'rgba(255,255,255,0.7)'
              return (
                <div key={suit} style={{display:'flex',alignItems:'center',gap:isMobile?2:3}}>
                  <span style={{fontSize:isMobile?'0.9rem':'1.2rem',color:col,fontWeight:700,flexShrink:0}}>{suit}</span>
                  <div style={{position:'relative',height:myCH+12,width:myCW+(cards.length-1)*myOL}}>
                    {cards.map((card,i) => {
                      const isValid = validCards.some(c => cardId(c)===cardId(card))
                      const isSel = selected && cardId(selected)===cardId(card)
                      return (
                        <div key={cardId(card)} style={{position:'absolute',left:i*myOL,zIndex:isSel?50:i}}>
                          <HCard card={card} selected={isSel} valid={isMyTurn?isValid:undefined} w={myCW} h={myCH} onClick={() => handleCardClick(card)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          {isMyTurn&&<p style={{fontSize:'0.72rem',color:'rgba(245,240,232,0.3)'}}>Tap to select · Tap again to play</p>}
        </div>
      </div>

      {/* Right panel desktop */}
      {!isMobile && (
        <div style={{position:'fixed',right:0,top:56,bottom:0,width:200,background:'rgba(0,0,0,0.4)',borderLeft:'1px solid rgba(201,168,76,0.1)',padding:'10px 8px',display:'flex',flexDirection:'column',gap:10,overflowY:'auto'}}>
          <div style={{background:'rgba(0,0,0,0.25)',borderRadius:8,padding:'8px 10px'}}>
            <p style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,fontWeight:700}}>Scores</p>
            {LABELS.map((label,i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center'}}>
                <span style={{fontSize:'0.84rem',color:i===0?'#5DCAA5':'rgba(245,240,232,0.6)'}}>{label}</span>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:'0.9rem',color:scores[i]>=80?'#c0392b':i===0?'#5DCAA5':'rgba(245,240,232,0.7)',fontWeight:600}}>{scores[i]}</span>
                  <span style={{fontSize:'0.72rem',color:'#e74c3c',marginLeft:4}}>+{g.pointsWon[i]}♥</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'8px 10px'}}>
            <p style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6,fontWeight:700}}>This Hand</p>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:'0.84rem',color:'rgba(245,240,232,0.5)'}}>Trick</span>
              <span style={{fontSize:'0.88rem',color:'var(--gold)',fontWeight:700}}>{g.trickNo+1}/13</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:'0.84rem',color:'rgba(245,240,232,0.5)'}}>♥ broken</span>
              <span style={{fontSize:'0.88rem',color:g.heartsBroken?'#c0392b':'#5DCAA5',fontWeight:600}}>{g.heartsBroken?'Yes':'No'}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:'0.84rem',color:'rgba(245,240,232,0.5)'}}>Q♠ played</span>
              <span style={{fontSize:'0.88rem',color:'rgba(245,240,232,0.6)'}}>{g.trick.some(t=>t.card.suit==='♠'&&t.card.rank==='Q')||g.trickNo>0?'—':'No'}</span>
            </div>
          </div>
          <div style={{background:'rgba(0,0,0,0.15)',borderRadius:8,padding:'8px 10px'}}>
            <p style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6,fontWeight:700}}>How to Play</p>
            <p style={{fontSize:'0.78rem',color:'rgba(245,240,232,0.4)',lineHeight:1.5}}>
              Avoid ♥ cards (1pt each) and Q♠ (13pts). Lowest score wins. First to 100pts loses. Shoot the Moon: take ALL ♥+Q♠ to give everyone else 26pts!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
