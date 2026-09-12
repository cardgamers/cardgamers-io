import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { saveGameResult } from '../lib/saveGameResult'
import {
  dealGame, bestMeldArrangement, deadwoodCards, deadwoodValue,
  botDecideAction, botChooseDiscard, botShouldKnock, botShouldGin,
  calcScore, isValidMeld, VALUE_RANK
} from './GinRummyEngine'

const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' }
const SUIT_COLORS = { S: '#1a1a2e', H: '#c0392b', D: '#c0392b', C: '#1a1a2e' }
const CARD_W = 72
const CARD_H = 101

function PlayingCard({ card, selected, onClick, faceDown, highlight, dim, small }) {
  if (!card) return null
  const w = small ? 54 : CARD_W
  const h = small ? 76 : CARD_H
  if (faceDown) return (
    <div style={{ width: w, height: h, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg,#1a3a6a,#0f2245)',
      border: '2px solid rgba(255,255,255,0.2)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)', opacity: dim ? 0.4 : 1 }} />
  )
  const col = SUIT_COLORS[card.suit]
  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: 8, flexShrink: 0,
      background: selected ? '#fffde7' : highlight ? '#e8f5e9' : 'white',
      border: `2px solid ${selected ? '#c9a84c' : highlight ? '#2e7d32' : '#ddd'}`,
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.5)' : highlight ? '0 0 0 2px rgba(46,125,50,0.4)' : '0 2px 6px rgba(0,0,0,0.25)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative', flexShrink: 0,
      transform: selected ? 'translateY(-12px)' : 'none',
      transition: 'transform 0.15s',
      opacity: dim ? 0.4 : 1,
    }}>
      <div style={{ position:'absolute', top:4, left:5 }}>
        <div style={{ fontSize: small ? 11 : 13, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 10 : 12, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize: small ? 20 : 28, color:col, opacity:0.7 }}>{SUIT_SYMBOLS[card.suit]}</div>
      <div style={{ position:'absolute', bottom:4, right:5, transform:'rotate(180deg)' }}>
        <div style={{ fontSize: small ? 11 : 13, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 10 : 12, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  )
}

function MeldDisplay({ cards, label }) {
  return (
    <div style={{ textAlign:'center' }}>
      {label && <div style={{ fontSize:'0.65rem', color:'#5DCAA5', marginBottom:4, fontWeight:700 }}>{label}</div>}
      <div style={{ display:'flex', gap:3, background:'rgba(93,202,165,0.1)', border:'1px solid rgba(93,202,165,0.3)', borderRadius:8, padding:'6px 8px' }}>
        {cards.map((c, i) => <PlayingCard key={i} card={c} small />)}
      </div>
    </div>
  )
}

export default function Rummy() {
  usePageMeta('/game/rummy')
  const [g, setG] = useState(null)
  const [selected, setSelected] = useState(null) // index in playerHand
  const [scores, setScores] = useState({ player: 0, bot: 0 })
  const [roundResult, setRoundResult] = useState(null)
  const [showMelds, setShowMelds] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const botTimer = useRef(null)

  function startNewRound() {
    setG(dealGame())
    setSelected(null)
    setRoundResult(null)
    setShowMelds(false)
    setResultSaved(false)
  }

  useEffect(() => { startNewRound() }, [])

  // Bot turn logic
  useEffect(() => {
    if (!g || g.phase !== 'bot-turn') return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      setG(prev => {
        if (!prev || prev.phase !== 'bot-turn') return prev
        const ng = JSON.parse(JSON.stringify(prev))
        const topDiscard = ng.discard[ng.discard.length - 1]

        // Bot draw phase
        if (!ng.botDrawn) {
          const { drawFromDiscard } = botDecideAction(ng.botHand, topDiscard)
          if (drawFromDiscard && ng.discard.length > 0) {
            ng.botHand.push(ng.discard.pop())
            ng.botDrawFrom = 'discard'
          } else if (ng.stock.length > 0) {
            ng.botHand.push(ng.stock.pop())
            ng.botDrawFrom = 'stock'
          }
          ng.botDrawn = true
          ng.message = 'Bot is thinking...'
          return ng
        }

        // Bot discard phase
        if (ng.botDrawn) {
          // Check if bot can gin
          if (botShouldGin(ng.botHand)) {
            ng.phase = 'showdown'
            ng.knocker = 'bot'
            ng.isGin = true
            ng.message = 'Bot has Gin! 🎉'
            return ng
          }
          // Check if bot should knock
          if (botShouldKnock(ng.botHand)) {
            const discardCard = botChooseDiscard(ng.botHand)
            ng.botHand = ng.botHand.filter(c => c.id !== discardCard.id)
            ng.discard.push(discardCard)
            ng.phase = 'showdown'
            ng.knocker = 'bot'
            ng.isGin = false
            ng.message = `Bot knocks! Discarded ${discardCard.value}${SUIT_SYMBOLS[discardCard.suit]}`
            return ng
          }
          // Regular discard
          const discardCard = botChooseDiscard(ng.botHand)
          ng.botHand = ng.botHand.filter(c => c.id !== discardCard.id)
          ng.discard.push(discardCard)
          ng.botDrawn = false
          ng.botDrawFrom = null
          ng.phase = 'player-draw'
          ng.turn += 1
          ng.message = `Bot discarded ${discardCard.value}${SUIT_SYMBOLS[discardCard.suit]} — your turn`
          return ng
        }
        return prev
      })
    }, 1200)
    return () => clearTimeout(botTimer.current)
  }, [g?.phase, g?.botDrawn])

  // Showdown scoring
  useEffect(() => {
    if (!g || g.phase !== 'showdown') return
    const { knocker, isGin, playerHand, botHand } = g
    const knockerHand = knocker === 'player' ? playerHand : botHand
    const opponentHand = knocker === 'player' ? botHand : playerHand
    const result = calcScore(knockerHand, opponentHand, isGin)

    const newScores = {
      player: scores.player + (knocker === 'player' ? result.knockerScore : -result.opponentScore),
      bot: scores.bot + (knocker === 'bot' ? result.knockerScore : -result.opponentScore),
    }
    setScores(newScores)

    const playerWon = knocker === 'player' && (result.result === 'gin' || result.result === 'knock')
      || knocker === 'bot' && result.result === 'undercut'

    setRoundResult({
      ...result,
      knocker,
      playerWon,
      playerMelds: bestMeldArrangement(playerHand).melds,
      botMelds: bestMeldArrangement(botHand).melds,
      playerDeadwood: deadwoodCards(playerHand),
      botDeadwood: deadwoodCards(botHand),
    })
  }, [g?.phase])

  function handleDrawStock() {
    if (!g || g.phase !== 'player-draw' || g.stock.length === 0) return
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      const card = ng.stock.pop()
      ng.playerHand.push(card)
      ng.drawn = card
      ng.drawnFrom = 'stock'
      ng.phase = 'player-discard'
      ng.message = `Drew ${card.value}${SUIT_SYMBOLS[card.suit]} — now discard a card`
      return ng
    })
    setSelected(null)
  }

  function handleDrawDiscard() {
    if (!g || g.phase !== 'player-draw' || g.discard.length === 0) return
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      const card = ng.discard.pop()
      ng.playerHand.push(card)
      ng.drawn = card
      ng.drawnFrom = 'discard'
      ng.phase = 'player-discard'
      ng.message = `Picked up ${card.value}${SUIT_SYMBOLS[card.suit]} — now discard a card`
      return ng
    })
    setSelected(null)
  }

  function handleDiscard() {
    if (!g || g.phase !== 'player-discard' || selected === null) return
    const card = g.playerHand[selected]
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      ng.playerHand.splice(selected, 1)
      ng.discard.push(card)
      ng.drawn = null
      ng.drawnFrom = null
      ng.phase = 'bot-turn'
      ng.botDrawn = false
      ng.message = 'Bot is thinking...'
      return ng
    })
    setSelected(null)
  }

  function handleKnock() {
    if (!g || g.phase !== 'player-discard' || selected === null) return
    const dw = deadwoodValue(deadwoodCards(g.playerHand.filter((_, i) => i !== selected)))
    if (dw > 10) return
    const card = g.playerHand[selected]
    const isGin = dw === 0
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      ng.playerHand.splice(selected, 1)
      ng.discard.push(card)
      ng.phase = 'showdown'
      ng.knocker = 'player'
      ng.isGin = isGin
      ng.message = isGin ? 'Gin! 🎉' : 'Knock!'
      return ng
    })
    setSelected(null)
  }

  // Compute meld info for player's current hand
  const playerMeldInfo = g ? bestMeldArrangement(g.playerHand) : { melds: [], deadwood: 0 }
  const meldCardIds = new Set(playerMeldInfo.melds.flat().map(c => c.id))
  const playerDW = g ? deadwoodValue(deadwoodCards(g.playerHand)) : 0
  const canKnock = g?.phase === 'player-discard' && selected !== null &&
    deadwoodValue(deadwoodCards(g.playerHand.filter((_, i) => i !== selected))) <= 10
  const isGinReady = canKnock &&
    deadwoodValue(deadwoodCards(g.playerHand.filter((_, i) => i !== selected))) === 0

  if (!g) return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'#0d4a2a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--gold)' }}>Dealing...</p>
    </div>
  )

  return (
    <div style={{ paddingTop:56, minHeight:'100vh', background:'#0d4a2a', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:44, background:'rgba(0,0,0,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <Link to="/lobby" style={{ color:'var(--text-muted)', fontSize:'0.9rem', textDecoration:'none' }}>← Menu</Link>
          <span style={{ color:'var(--gold)', fontWeight:700 }}>♥ Gin Rummy</span>
        </div>
        <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.85rem', fontWeight:600 }}>
          <span style={{ color:'#5DCAA5' }}>You: {scores.player}</span>
          <span style={{ color:'#c0392b' }}>Bot: {scores.bot}</span>
        </div>
      </div>

      {/* Message bar */}
      <div style={{ background:'rgba(0,0,0,0.3)', padding:'6px 1rem', textAlign:'center', fontSize:'0.82rem', color:'var(--gold)', borderBottom:'1px solid rgba(201,168,76,0.1)', flexShrink:0 }}>
        {g.message}
      </div>

      {/* Main table */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'1rem', gap:'1rem', overflow:'auto' }}>

        {/* Bot hand */}
        <div>
          <div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
            Bot · {g.botHand.length} cards
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {g.botHand.map((_, i) => <PlayingCard key={i} card={g.botHand[i]} faceDown small />)}
          </div>
        </div>

        {/* Center — stock and discard */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'2rem', padding:'0.5rem 0' }}>
          {/* Stock */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginBottom:4 }}>Stock ({g.stock.length})</div>
            <div onClick={g.phase === 'player-draw' ? handleDrawStock : undefined}
              style={{ cursor: g.phase === 'player-draw' ? 'pointer' : 'default',
                transform: g.phase === 'player-draw' ? 'scale(1.05)' : 'none',
                transition:'transform 0.15s',
                filter: g.phase === 'player-draw' ? 'brightness(1.2)' : 'none' }}>
              {g.stock.length > 0
                ? <PlayingCard card={g.stock[g.stock.length - 1]} faceDown />
                : <div style={{ width:CARD_W, height:CARD_H, borderRadius:8, border:'2px dashed rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:'0.75rem' }}>Empty</div>
              }
            </div>
            {g.phase === 'player-draw' && g.stock.length > 0 && (
              <div style={{ fontSize:'0.6rem', color:'#5DCAA5', marginTop:4 }}>Tap to draw</div>
            )}
          </div>

          {/* Discard */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginBottom:4 }}>Discard</div>
            <div onClick={g.phase === 'player-draw' && g.discard.length > 0 ? handleDrawDiscard : undefined}
              style={{ cursor: g.phase === 'player-draw' && g.discard.length > 0 ? 'pointer' : 'default',
                transform: g.phase === 'player-draw' ? 'scale(1.05)' : 'none',
                transition:'transform 0.15s',
                filter: g.phase === 'player-draw' ? 'brightness(1.15)' : 'none' }}>
              {g.discard.length > 0
                ? <PlayingCard card={g.discard[g.discard.length - 1]} />
                : <div style={{ width:CARD_W, height:CARD_H, borderRadius:8, border:'2px dashed rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:'0.75rem' }}>Empty</div>
              }
            </div>
            {g.phase === 'player-draw' && g.discard.length > 0 && (
              <div style={{ fontSize:'0.6rem', color:'#5DCAA5', marginTop:4 }}>Tap to pick up</div>
            )}
          </div>
        </div>

        {/* Player hand info */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:'0.75rem', color:'rgba(245,240,232,0.5)' }}>
            Your hand · <span style={{ color: playerDW <= 10 ? '#5DCAA5' : 'rgba(245,240,232,0.5)' }}>Deadwood: {playerDW}</span>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {g.phase === 'player-discard' && selected !== null && (
              <button onClick={handleDiscard} style={{ padding:'6px 14px', borderRadius:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
                Discard ↓
              </button>
            )}
            {canKnock && (
              <button onClick={handleKnock} className="btn-gold" style={{ padding:'6px 14px', fontSize:'0.82rem' }}>
                {isGinReady ? '🎉 Gin!' : '✊ Knock'}
              </button>
            )}
          </div>
        </div>

        {/* Player hand */}
        <div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {g.playerHand.map((card, i) => (
              <PlayingCard
                key={card.id}
                card={card}
                selected={selected === i}
                highlight={meldCardIds.has(card.id)}
                onClick={g.phase === 'player-discard' ? () => setSelected(selected === i ? null : i) : undefined}
              />
            ))}
          </div>
          {g.phase === 'player-discard' && (
            <div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', marginTop:6 }}>
              🟡 Highlighted cards form melds · Select a card to discard
            </div>
          )}
        </div>

      </div>

      {/* Round result overlay */}
      {roundResult && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
          <div style={{ background:'linear-gradient(135deg,#1a3d28,#0f2a1a)', border:`2px solid ${roundResult.playerWon ? '#c9a84c' : '#c0392b'}`, borderRadius:20, padding:'2rem', maxWidth:480, width:'100%' }}>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>
                {roundResult.result === 'gin' && roundResult.knocker === 'player' ? '🎉' :
                 roundResult.result === 'undercut' && roundResult.knocker === 'bot' ? '🎉' :
                 roundResult.playerWon ? '✊' : '😔'}
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', color: roundResult.playerWon ? 'var(--gold)' : '#c0392b', marginBottom:'0.25rem' }}>
                {roundResult.result === 'gin' && roundResult.knocker === 'player' ? 'Gin!' :
                 roundResult.result === 'gin' && roundResult.knocker === 'bot' ? 'Bot has Gin!' :
                 roundResult.result === 'undercut' ? 'Undercut!' :
                 roundResult.knocker === 'player' ? 'You Knocked!' : 'Bot Knocked!'}
              </h2>
              <p style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.85rem' }}>
                {roundResult.result === 'undercut' ? "Opponent's deadwood was lower — they get the bonus!" :
                 roundResult.result === 'gin' ? '+25 bonus + opponent deadwood' :
                 'Deadwood difference scored'}
              </p>
            </div>

            {/* Melds display */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div>
                <div style={{ fontSize:'0.7rem', color:'var(--gold)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Your Melds</div>
                {roundResult.playerMelds.length > 0
                  ? roundResult.playerMelds.map((m, i) => <MeldDisplay key={i} cards={m} />)
                  : <p style={{ fontSize:'0.78rem', color:'rgba(245,240,232,0.3)' }}>No melds</p>
                }
                {roundResult.playerDeadwood.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:'0.65rem', color:'#c0392b', marginBottom:4 }}>Deadwood ({deadwoodValue(roundResult.playerDeadwood)} pts)</div>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                      {roundResult.playerDeadwood.map((c, i) => <PlayingCard key={i} card={c} small dim />)}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Bot's Melds</div>
                {roundResult.botMelds.length > 0
                  ? roundResult.botMelds.map((m, i) => <MeldDisplay key={i} cards={m} />)
                  : <p style={{ fontSize:'0.78rem', color:'rgba(245,240,232,0.3)' }}>No melds</p>
                }
                {roundResult.botDeadwood.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:'0.65rem', color:'#c0392b', marginBottom:4 }}>Deadwood ({deadwoodValue(roundResult.botDeadwood)} pts)</div>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                      {roundResult.botDeadwood.map((c, i) => <PlayingCard key={i} card={c} small dim />)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', marginBottom:6 }}>Running Score</div>
              <div style={{ display:'flex', justifyContent:'center', gap:'2rem' }}>
                <div><div style={{ fontSize:'1.4rem', fontWeight:700, color:'#5DCAA5' }}>{scores.player}</div><div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)' }}>You</div></div>
                <div><div style={{ fontSize:'1.4rem', fontWeight:700, color:'#c0392b' }}>{scores.bot}</div><div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)' }}>Bot</div></div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startNewRound}>Next Round →</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
