import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { saveGameResult } from '../lib/saveGameResult'
import {
  dealGame, bestMeldArrangement, deadwoodCards, deadwoodValue,
  botDecideAction, botChooseDiscard, botShouldKnock, botShouldGin,
  calcScore
} from './GinRummyEngine'

const SUIT_SYM = { S: '♠', H: '♥', D: '♦', C: '♣' }
const SUIT_COLOR = { S: '#1a1a2e', H: '#c0392b', D: '#c0392b', C: '#1a1a2e' }
const CW = 80  // card width
const CH = 112 // card height

function Card({ card, selected, onClick, faceDown, highlight, dim, ghost }) {
  if (!card) return null
  if (faceDown) return (
    <div style={{
      width: CW, height: CH, borderRadius: 10, flexShrink: 0,
      background: 'linear-gradient(135deg,#1e3a5f,#0d2040)',
      border: '2px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      opacity: dim ? 0.5 : 1,
    }} />
  )
  const col = SUIT_COLOR[card.suit]
  return (
    <div onClick={onClick} style={{
      width: CW, height: CH, borderRadius: 10, flexShrink: 0,
      background: selected ? '#fffbe6' : highlight ? 'rgba(93,202,165,0.12)' : 'white',
      border: `2px solid ${selected ? '#c9a84c' : highlight ? '#5DCAA5' : 'rgba(0,0,0,0.12)'}`,
      boxShadow: selected
        ? '0 0 0 3px rgba(201,168,76,0.4), 0 8px 20px rgba(0,0,0,0.4)'
        : highlight ? '0 0 0 2px rgba(93,202,165,0.3), 0 4px 12px rgba(0,0,0,0.3)'
        : '0 4px 12px rgba(0,0,0,0.25)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative', flexShrink: 0,
      transform: selected ? 'translateY(-16px) scale(1.04)' : 'translateY(0) scale(1)',
      transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      opacity: dim ? 0.35 : 1,
      userSelect: 'none',
    }}>
      <div style={{ position:'absolute', top:5, left:6 }}>
        <div style={{ fontSize:14, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:12, color:col, lineHeight:1 }}>{SUIT_SYM[card.suit]}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:32, color:col, opacity:0.6 }}>{SUIT_SYM[card.suit]}</div>
      <div style={{ position:'absolute', bottom:5, right:6, transform:'rotate(180deg)' }}>
        <div style={{ fontSize:14, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:12, color:col, lineHeight:1 }}>{SUIT_SYM[card.suit]}</div>
      </div>
    </div>
  )
}

function MeldGroup({ cards, small }) {
  const w = small ? 52 : CW
  const h = small ? 73 : CH
  return (
    <div style={{ display:'flex', gap: small ? 3 : 4, padding:'6px 8px', background:'rgba(93,202,165,0.08)', border:'1px solid rgba(93,202,165,0.3)', borderRadius:10 }}>
      {cards.map((c, i) => <Card key={i} card={c} />)}
    </div>
  )
}

export default function Rummy() {
  usePageMeta('/game/rummy')
  const [g, setG] = useState(null)
  const [selected, setSelected] = useState(null)
  const [sortMode, setSortMode] = useState('suit') // 'suit' | 'rank'
  const [scores, setScores] = useState({ player: 0, bot: 0 })
  const [roundResult, setRoundResult] = useState(null)
  const [resultSaved, setResultSaved] = useState(false)
  const [botThinking, setBotThinking] = useState(false)
  const botTimer = useRef(null)

  function sortHand(hand) {
    if (sortMode === 'suit') {
      const order = ['S', 'H', 'D', 'C']
      return [...hand].sort((a, b) => {
        if (a.suit !== b.suit) return order.indexOf(a.suit) - order.indexOf(b.suit)
        return a.idx - b.idx
      })
    }
    return [...hand].sort((a, b) => {
      if (a.idx !== b.idx) return a.idx - b.idx
      return a.suit.localeCompare(b.suit)
    })
  }

  function startNewRound() {
    clearTimeout(botTimer.current)
    const game = dealGame()
    game.playerHand = sortHand(game.playerHand)
    setG(game)
    setSelected(null)
    setRoundResult(null)
    setResultSaved(false)
    setBotThinking(false)
  }

  useEffect(() => { startNewRound() }, [])

  // Re-sort when sort mode changes
  useEffect(() => {
    if (!g || roundResult) return
    setG(prev => ({ ...prev, playerHand: sortHand(prev.playerHand) }))
    setSelected(null)
  }, [sortMode])

  // Bot turn
  useEffect(() => {
    if (!g || g.phase !== 'bot-turn') return
    setBotThinking(true)
    clearTimeout(botTimer.current)

    // Phase 1: Bot draws
    botTimer.current = setTimeout(() => {
      setG(prev => {
        if (!prev || prev.phase !== 'bot-turn') return prev
        const ng = JSON.parse(JSON.stringify(prev))
        const topDiscard = ng.discard[ng.discard.length - 1]
        const { drawFromDiscard } = botDecideAction(ng.botHand, topDiscard)

        if (drawFromDiscard && ng.discard.length > 0) {
          ng.botHand.push(ng.discard.pop())
        } else if (ng.stock.length > 0) {
          ng.botHand.push(ng.stock.pop())
        }
        ng.botDrawn = true
        ng.message = 'Bot is thinking...'
        return ng
      })

      // Phase 2: Bot discards after short pause
      botTimer.current = setTimeout(() => {
        setG(prev => {
          if (!prev || !prev.botDrawn) return prev
          const ng = JSON.parse(JSON.stringify(prev))

          if (botShouldGin(ng.botHand)) {
            ng.phase = 'showdown'
            ng.knocker = 'bot'
            ng.isGin = true
            ng.message = 'Bot has Gin! 🎉'
            setBotThinking(false)
            return ng
          }
          if (botShouldKnock(ng.botHand)) {
            const discard = botChooseDiscard(ng.botHand)
            ng.botHand = ng.botHand.filter(c => c.id !== discard.id)
            ng.discard.push(discard)
            ng.phase = 'showdown'
            ng.knocker = 'bot'
            ng.isGin = false
            ng.message = `Bot knocks with ${discard.value}${SUIT_SYM[discard.suit]}`
            setBotThinking(false)
            return ng
          }

          const discard = botChooseDiscard(ng.botHand)
          ng.botHand = ng.botHand.filter(c => c.id !== discard.id)
          ng.discard.push(discard)
          ng.botDrawn = false
          ng.phase = 'player-draw'
          ng.turn = (ng.turn || 0) + 1
          ng.message = `Bot discarded ${discard.value}${SUIT_SYM[discard.suit]} — your turn to draw`
          setBotThinking(false)
          return ng
        })
      }, 600)
    }, 700)

    return () => clearTimeout(botTimer.current)
  }, [g?.phase])

  // Showdown
  useEffect(() => {
    if (!g || g.phase !== 'showdown') return
    const { knocker, isGin, playerHand, botHand } = g
    const knockerHand = knocker === 'player' ? playerHand : botHand
    const opponentHand = knocker === 'player' ? botHand : playerHand
    const result = calcScore(knockerHand, opponentHand, isGin)
    const playerWon = (knocker === 'player' && result.result !== 'undercut') ||
                      (knocker === 'bot' && result.result === 'undercut')
    const playerPoints = playerWon ? result.knockerScore || result.opponentScore : 0
    const botPoints = !playerWon ? result.knockerScore || result.opponentScore : 0

    const newScores = { player: scores.player + playerPoints, bot: scores.bot + botPoints }
    setScores(newScores)
    setRoundResult({
      ...result, knocker, playerWon, isGin,
      playerMelds: bestMeldArrangement(playerHand).melds,
      botMelds: bestMeldArrangement(botHand).melds,
      playerDeadwood: deadwoodCards(playerHand),
      botDeadwood: deadwoodCards(botHand),
      playerDW: deadwoodValue(deadwoodCards(playerHand)),
      botDW: deadwoodValue(deadwoodCards(botHand)),
      newScores,
    })
  }, [g?.phase])

  // Save result
  useEffect(() => {
    if (!roundResult || resultSaved) return
    saveGameResult('rummy', roundResult.playerWon, roundResult.newScores.player, roundResult.playerWon ? 15 : -8, {})
    setResultSaved(true)
  }, [roundResult, resultSaved])

  function handleDrawStock() {
    if (!g || g.phase !== 'player-draw' || g.stock.length === 0) return
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      const card = ng.stock.pop()
      ng.playerHand = sortHand([...ng.playerHand, card])
      ng.drawn = card.id
      ng.drawnFrom = 'stock'
      ng.phase = 'player-discard'
      ng.message = `Drew ${card.value}${SUIT_SYM[card.suit]} — select a card to discard`
      return ng
    })
    setSelected(null)
  }

  function handleDrawDiscard() {
    if (!g || g.phase !== 'player-draw' || g.discard.length === 0) return
    setG(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      const card = ng.discard.pop()
      ng.playerHand = sortHand([...ng.playerHand, card])
      ng.drawn = card.id
      ng.drawnFrom = 'discard'
      ng.phase = 'player-discard'
      ng.message = `Picked up ${card.value}${SUIT_SYM[card.suit]} — select a card to discard`
      return ng
    })
    setSelected(null)
  }

  function handleCardClick(idx) {
    if (!g || g.phase !== 'player-discard') return
    setSelected(prev => prev === idx ? null : idx)
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
      ng.botDrawn = false
      ng.phase = 'bot-turn'
      ng.message = 'Bot is thinking...'
      return ng
    })
    setSelected(null)
  }

  function handleKnock() {
    if (!g || g.phase !== 'player-discard' || selected === null) return
    const remaining = g.playerHand.filter((_, i) => i !== selected)
    const dw = deadwoodValue(deadwoodCards(remaining))
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
      ng.message = isGin ? '🎉 Gin!' : '✊ You knocked!'
      return ng
    })
    setSelected(null)
  }

  // Compute meld highlights
  const { melds } = g ? bestMeldArrangement(g.playerHand) : { melds: [] }
  const meldIds = new Set(melds.flat().map(c => c.id))
  const playerDW = g ? deadwoodValue(deadwoodCards(g.playerHand)) : 0

  const canKnock = g?.phase === 'player-discard' && selected !== null &&
    deadwoodValue(deadwoodCards(g.playerHand.filter((_, i) => i !== selected))) <= 10
  const isGinReady = canKnock &&
    deadwoodValue(deadwoodCards(g.playerHand.filter((_, i) => i !== selected))) === 0

  if (!g) return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'#0d4a2a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--gold)', fontSize:'1.1rem' }}>Dealing cards...</p>
    </div>
  )

  return (
    <div style={{ paddingTop:56, height:'100vh', display:'flex', flexDirection:'column', background:'#0d4a2a', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:48, background:'rgba(0,0,0,0.55)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <Link to="/lobby" style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.9rem', textDecoration:'none' }}>← Menu</Link>
          <span style={{ color:'var(--gold)', fontWeight:700, fontSize:'1rem' }}>♥ Gin Rummy</span>
          {botThinking && <span style={{ fontSize:'0.72rem', color:'rgba(201,168,76,0.5)', fontStyle:'italic' }}>Bot thinking...</span>}
        </div>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#5DCAA5' }}>{scores.player}</div>
            <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase' }}>You</div>
          </div>
          <div style={{ width:1, height:28, background:'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#c0392b' }}>{scores.bot}</div>
            <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase' }}>Bot</div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ background:'rgba(0,0,0,0.25)', padding:'5px 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <span style={{ fontSize:'0.8rem', color:'var(--gold)', fontWeight:500 }}>{g.message}</span>
        <div style={{ display:'flex', gap:6 }}>
          {['suit','rank'].map(m => (
            <button key={m} onClick={() => setSortMode(m)} style={{
              padding:'2px 8px', borderRadius:5, fontSize:'0.65rem', fontWeight:600,
              background: sortMode === m ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)',
              border: sortMode === m ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: sortMode === m ? 'var(--gold)' : 'rgba(245,240,232,0.4)',
              cursor:'pointer',
            }}>Sort by {m}</button>
          ))}
        </div>
      </div>

      {/* Main table */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'1rem 1.5rem', overflow:'hidden' }}>

        {/* Bot hand — top */}
        <div>
          <div style={{ fontSize:'0.68rem', color:'rgba(245,240,232,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            Opponent · {g.botHand.length} cards
          </div>
          <div style={{ display:'flex', gap:3 }}>
            {g.botHand.map((c, i) => <Card key={i} card={c} faceDown />)}
          </div>
        </div>

        {/* Center — stock, discard, action buttons */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'3rem' }}>

          {/* Left action area */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:120 }}>
            {g.phase === 'player-discard' && selected !== null && (
              <>
                <button onClick={handleDiscard} style={{
                  padding:'10px 20px', borderRadius:10, background:'rgba(255,255,255,0.12)',
                  border:'1.5px solid rgba(255,255,255,0.25)', color:'white',
                  fontWeight:700, cursor:'pointer', fontSize:'0.88rem',
                }}>
                  Discard ↓
                </button>
                {canKnock && (
                  <button onClick={handleKnock} style={{
                    padding:'10px 20px', borderRadius:10,
                    background: isGinReady ? 'rgba(201,168,76,0.9)' : 'rgba(201,168,76,0.75)',
                    border:'none', color:'#0d2a1a', fontWeight:800, cursor:'pointer', fontSize:'0.88rem',
                  }}>
                    {isGinReady ? '🎉 Gin!' : '✊ Knock'}
                  </button>
                )}
              </>
            )}
            {g.phase === 'player-draw' && (
              <div style={{ fontSize:'0.75rem', color:'rgba(201,168,76,0.6)', textAlign:'center', fontStyle:'italic' }}>
                Draw a card<br/>to start your turn
              </div>
            )}
          </div>

          {/* Stock pile */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginBottom:6 }}>
              Stock · {g.stock.length}
            </div>
            <div
              onClick={g.phase === 'player-draw' ? handleDrawStock : undefined}
              style={{
                cursor: g.phase === 'player-draw' && g.stock.length > 0 ? 'pointer' : 'default',
                transform: g.phase === 'player-draw' ? 'scale(1.06)' : 'scale(1)',
                transition:'transform 0.15s',
                filter: g.phase === 'player-draw' ? 'brightness(1.3)' : 'none',
              }}
            >
              {g.stock.length > 0
                ? <Card card={g.stock[g.stock.length-1]} faceDown />
                : <div style={{ width:CW, height:CH, borderRadius:10, border:'2px dashed rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)', fontSize:'0.7rem' }}>Empty</div>
              }
            </div>
            {g.phase === 'player-draw' && g.stock.length > 0 && (
              <div style={{ fontSize:'0.6rem', color:'#5DCAA5', marginTop:5, fontWeight:600 }}>Tap to draw</div>
            )}
          </div>

          {/* Discard pile */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginBottom:6 }}>
              Discard
            </div>
            <div
              onClick={g.phase === 'player-draw' && g.discard.length > 0 ? handleDrawDiscard : undefined}
              style={{
                cursor: g.phase === 'player-draw' && g.discard.length > 0 ? 'pointer' : 'default',
                transform: g.phase === 'player-draw' ? 'scale(1.06)' : 'scale(1)',
                transition:'transform 0.15s',
                filter: g.phase === 'player-draw' ? 'brightness(1.2)' : 'none',
              }}
            >
              {g.discard.length > 0
                ? <Card card={g.discard[g.discard.length-1]} />
                : <div style={{ width:CW, height:CH, borderRadius:10, border:'2px dashed rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)', fontSize:'0.7rem' }}>Empty</div>
              }
            </div>
            {g.phase === 'player-draw' && g.discard.length > 0 && (
              <div style={{ fontSize:'0.6rem', color:'#5DCAA5', marginTop:5, fontWeight:600 }}>Tap to pick up</div>
            )}
          </div>

          {/* Right info */}
          <div style={{ minWidth:120, textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.35)', textTransform:'uppercase', marginBottom:4 }}>Your deadwood</div>
            <div style={{ fontSize:'2rem', fontWeight:800, color: playerDW === 0 ? '#5DCAA5' : playerDW <= 10 ? 'var(--gold)' : 'rgba(245,240,232,0.7)' }}>
              {playerDW}
            </div>
            {playerDW <= 10 && playerDW > 0 && (
              <div style={{ fontSize:'0.65rem', color:'var(--gold)', marginTop:2 }}>Ready to knock!</div>
            )}
            {playerDW === 0 && (
              <div style={{ fontSize:'0.65rem', color:'#5DCAA5', marginTop:2 }}>Gin possible!</div>
            )}
          </div>
        </div>

        {/* Player hand — bottom */}
        <div>
          <div style={{ fontSize:'0.68rem', color:'rgba(245,240,232,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
            <span>Your hand · {g.playerHand.length} cards</span>
            {g.phase === 'player-discard' && <span style={{ color:'rgba(201,168,76,0.6)' }}>Select card to discard{canKnock ? ' or knock' : ''}</span>}
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {g.playerHand.map((card, i) => (
              <Card
                key={card.id}
                card={card}
                selected={selected === i}
                highlight={meldIds.has(card.id)}
                onClick={() => handleCardClick(i)}
                dim={g.phase === 'player-draw'}
              />
            ))}
          </div>
          <div style={{ marginTop:6, display:'flex', gap:'1rem' }}>
            <span style={{ fontSize:'0.68rem', color:'rgba(93,202,165,0.6)' }}>🟢 Cards in melds</span>
            <span style={{ fontSize:'0.68rem', color:'rgba(245,240,232,0.3)' }}>White = deadwood</span>
          </div>
        </div>
      </div>

      {/* Round result overlay */}
      {roundResult && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:200, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'linear-gradient(135deg,#1a3d28,#0d2018)', border:`2px solid ${roundResult.playerWon ? '#c9a84c' : '#c0392b'}`, borderRadius:20, padding:'2rem', maxWidth:560, width:'100%', marginTop:'auto', marginBottom:'auto' }}>

            {/* Result header */}
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>
                {roundResult.isGin && roundResult.knocker === 'player' ? '🎉' :
                 roundResult.result === 'undercut' && roundResult.knocker === 'bot' ? '🎊' :
                 roundResult.playerWon ? '✊' : '😔'}
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', color: roundResult.playerWon ? 'var(--gold)' : '#c0392b', margin:'0 0 0.25rem' }}>
                {roundResult.isGin && roundResult.knocker === 'player' ? 'Gin!' :
                 roundResult.isGin && roundResult.knocker === 'bot' ? 'Bot Has Gin!' :
                 roundResult.result === 'undercut' && roundResult.knocker === 'bot' ? 'You Undercut the Bot!' :
                 roundResult.result === 'undercut' ? 'Undercut! Bot Wins.' :
                 roundResult.knocker === 'player' ? 'You Knocked!' : 'Bot Knocked!'}
              </h2>
              <p style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.85rem', margin:0 }}>
                {roundResult.result === 'gin' ? `+25 gin bonus + ${roundResult.knocker === 'player' ? roundResult.botDW : roundResult.playerDW} deadwood` :
                 roundResult.result === 'undercut' ? '+25 undercut bonus' :
                 `Deadwood difference: ${Math.abs(roundResult.playerDW - roundResult.botDW)} points`}
              </p>
            </div>

            {/* Hands comparison */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Your Hand', melds: roundResult.playerMelds, dw: roundResult.playerDeadwood, dwVal: roundResult.playerDW, isYou: true },
                { label:"Bot's Hand", melds: roundResult.botMelds, dw: roundResult.botDeadwood, dwVal: roundResult.botDW, isYou: false },
              ].map(({ label, melds, dw, dwVal, isYou }) => (
                <div key={label}>
                  <div style={{ fontSize:'0.7rem', color: isYou ? 'var(--gold)' : 'rgba(245,240,232,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
                  {melds.length > 0 && (
                    <div style={{ marginBottom:8 }}>
                      <div style={{ fontSize:'0.62rem', color:'#5DCAA5', marginBottom:4 }}>Melds</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {melds.map((m, i) => (
                          <div key={i} style={{ display:'flex', gap:3, background:'rgba(93,202,165,0.08)', border:'1px solid rgba(93,202,165,0.25)', borderRadius:8, padding:'4px 6px' }}>
                            {m.map((c, j) => (
                              <div key={j} style={{ fontSize:'0.78rem', fontWeight:700, color: SUIT_COLOR[c.suit], background:'white', borderRadius:5, padding:'2px 5px', border:'1px solid rgba(0,0,0,0.1)' }}>
                                {c.value}{SUIT_SYM[c.suit]}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {dw.length > 0 && (
                    <div>
                      <div style={{ fontSize:'0.62rem', color:'#c0392b', marginBottom:4 }}>Deadwood · {dwVal} pts</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {dw.map((c, i) => (
                          <div key={i} style={{ fontSize:'0.78rem', fontWeight:600, color: SUIT_COLOR[c.suit], background:'rgba(255,255,255,0.08)', borderRadius:5, padding:'2px 5px', border:'1px solid rgba(255,255,255,0.15)' }}>
                            {c.value}{SUIT_SYM[c.suit]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {melds.length === 0 && dw.length === 0 && (
                    <p style={{ fontSize:'0.75rem', color:'rgba(245,240,232,0.3)', fontStyle:'italic' }}>No cards shown</p>
                  )}
                </div>
              ))}
            </div>

            {/* Score */}
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'0.85rem 1rem', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:8 }}>Running Score</div>
              <div style={{ display:'flex', justifyContent:'center', gap:'3rem' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.8rem', fontWeight:800, color:'#5DCAA5' }}>{roundResult.newScores.player}</div>
                  <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)' }}>You</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.8rem', fontWeight:800, color:'#c0392b' }}>{roundResult.newScores.bot}</div>
                  <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)' }}>Bot</div>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startNewRound} style={{ fontSize:'0.95rem', padding:'0.7rem 1.75rem' }}>Next Round →</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
