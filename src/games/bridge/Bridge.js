import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { saveGameResult } from '../../lib/saveGameResult'
import {
  SUIT_SYMBOLS, SUIT_COLORS, DENOM_SYMBOLS,
  PARTNERS, NEXT_PLAYER, VALUE_RANK,
  countHCP, getBotBid, getBotCardPlay,
  isAuctionOver, getContract, getTrickWinner, calculateRubberScore,
  calculateDuplicateScore, createBridgeGame, getLegalCards
} from './BridgeEngine'

// ─── Suit colour helper ───────────────────────────────────────────
function suitColor(denom) {
  if (denom === 'H' || denom === 'D') return '#e74c3c'
  if (denom === 'NT') return '#7eb5f5'
  return '#ffffff'
}

// ─── Full card (used in trick area and last trick overlay) ────────
function BCard({ card, selected, legal, onClick, w=80, h=112, faceDown }) {
  const notLegal = legal === false
  if (faceDown) return (
    <div style={{ width:w, height:h, borderRadius:8, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }} />
  )
  if (!card) return null
  const col = SUIT_COLORS[card.suit]
  const fs = Math.max(10, Math.round(w * 0.17))
  const ss = Math.max(16, Math.round(w * 0.32))
  return (
    <div onClick={!notLegal && onClick ? onClick : undefined} style={{
      width:w, height:h, borderRadius:8, flexShrink:0,
      background: selected ? '#fffde7' : notLegal ? '#ccc' : 'white',
      border: selected ? '3px solid #c9a84c' : '1px solid #bbb',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.6),0 8px 20px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)',
      cursor: !notLegal && onClick ? 'pointer' : 'default',
      userSelect: 'none', position: 'relative',
      transform: selected ? 'translateY(-18px)' : 'none',
      transition: 'transform 0.15s, box-shadow 0.15s',
      opacity: notLegal ? 0.3 : 1,
    }}>
      <div style={{ position:'absolute', top:4, left:5, lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:ss, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      <div style={{ position:'absolute', bottom:4, right:5, transform:'rotate(180deg)', lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  )
}

// ─── BBO-style fanned hand — cards overlapping, rank+suit visible ─
function FannedHand({ cards, legalCards, selectedCard, onCardClick, faceDown, vertical=false, cardW=72, cardH=100, overlap=22 }) {
  const n = cards.length
  if (n === 0) return null

  if (faceDown) {
    if (vertical) {
      return (
        <div style={{ position:'relative', width:cardW, height: cardH + (n-1)*overlap, flexShrink:0 }}>
          {Array.from({length:n}).map((_,i) => (
            <div key={i} style={{ position:'absolute', top: i*overlap }}>
              <BCard faceDown w={cardW} h={cardH} />
            </div>
          ))}
        </div>
      )
    }
    return (
      <div style={{ position:'relative', height:cardH, width: cardW + (n-1)*overlap, flexShrink:0 }}>
        {Array.from({length:n}).map((_,i) => (
          <div key={i} style={{ position:'absolute', left: i*overlap }}>
            <BCard faceDown w={cardW} h={cardH} />
          </div>
        ))}
      </div>
    )
  }

  // Face up fanned
  const totalW = cardW + (n-1)*overlap
  return (
    <div style={{ position:'relative', height:cardH+20, width:totalW, flexShrink:0 }}>
      {cards.map((card, i) => {
        const isSelected = selectedCard?.id === card.id
        const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
        return (
          <div key={card.id} style={{ position:'absolute', left: i*overlap, zIndex: isSelected ? 50 : i, transition:'transform 0.12s' }}>
            <BCard
              card={card}
              w={cardW} h={cardH}
              selected={isSelected}
              legal={isLegal ? undefined : false}
              onClick={() => onCardClick && onCardClick(card)}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Dummy hand — sorted by suit, face up ─────────────────────────
function DummyHand({ hand, currentTrick, contract, onPlay, canPlay, horizontal=true }) {
  if (!hand) return null
  const trump = contract?.denomination === 'NT' ? null : contract?.denomination
  const legal = canPlay ? getLegalCards(hand, currentTrick, trump) : null

  if (horizontal) {
    // Sorted by suit in columns
    return (
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        {['S','H','D','C'].map(suit => {
          const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
          if (!cards.length) return null
          const col = SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit]
          return (
            <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:'1rem', color:col, fontWeight:700 }}>{SUIT_SYMBOLS[suit]}</span>
              <FannedHand
                cards={cards}
                legalCards={legal}
                onCardClick={c => canPlay && onPlay(c)}
                cardW={80} cardH={112} overlap={26}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Vertical dummy (for East/West)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
      {['S','H','D','C'].map(suit => {
        const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        const col = SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit]
        return (
          <div key={suit} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:'0.8rem', color:col, fontWeight:700, width:14 }}>{SUIT_SYMBOLS[suit]}</span>
            <FannedHand
              cards={cards}
              legalCards={legal}
              onCardClick={c => canPlay && onPlay(c)}
              cardW={40} cardH={56} overlap={16}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Thinking dots ────────────────────────────────────────────────
function ThinkingDots() {
  const [d, setD] = useState(1)
  useEffect(() => { const t = setInterval(()=>setD(x=>x===3?1:x+1),500); return()=>clearInterval(t) },[])
  return <span>{'●'.repeat(d)}{'○'.repeat(3-d)}</span>
}

// ─── Bid bubble next to player name ──────────────────────────────
function BidBubble({ bid, thinking }) {
  if (!bid && !thinking) return null
  const isPass = bid?.type === 'pass'
  const isDbl = bid?.type === 'double'
  return (
    <div style={{ background:'#1a1a1a', border:`2px solid ${thinking?'var(--gold)':isPass?'rgba(255,255,255,0.2)':'rgba(201,168,76,0.5)'}`, borderRadius:8, padding:'6px 14px', fontSize:'1.05rem', fontWeight:800, whiteSpace:'nowrap', minWidth:48, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
      {thinking ? <span style={{ color:'var(--gold)' }}><ThinkingDots/></span>
        : isPass ? <span style={{ color:'rgba(255,255,255,0.6)' }}>P</span>
        : isDbl ? <span style={{ color:'#e74c3c' }}>X</span>
        : <span><span style={{ color:'white' }}>{bid.level}</span><span style={{ color:suitColor(bid.denomination) }}>{DENOM_SYMBOLS[bid.denomination]}</span></span>
      }
    </div>
  )
}

// ─── Auction history panel ────────────────────────────────────────
function AuctionHistory({ auction, dealer }) {
  const pos = ['W','N','E','S']
  const pad = [...Array(pos.indexOf(dealer)).fill(null), ...auction]
  if (!auction.length) return <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', padding:'6px 0' }}>Bidding starting...</p>
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginBottom:4 }}>
        {['W','N','E','You'].map(p=><div key={p} style={{ textAlign:'center', fontSize:'0.6rem', color:'rgba(245,240,232,0.35)', fontWeight:700, letterSpacing:'0.05em' }}>{p}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {pad.map((b,i)=>(
          <div key={i} style={{ textAlign:'center', padding:'4px 2px', borderRadius:4, fontSize:'0.78rem', fontWeight:700, background:b?'rgba(255,255,255,0.06)':'transparent', minHeight:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {b ? (
              b.type==='pass' ? <span style={{ color:'rgba(255,255,255,0.3)' }}>P</span>
              : b.type==='double' ? <span style={{ color:'#e74c3c' }}>X</span>
              : <span><span style={{ color:'white' }}>{b.level}</span><span style={{ color:suitColor(b.denomination) }}>{DENOM_SYMBOLS[b.denomination]}</span></span>
            ) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bid panel (BBO-style grid) ───────────────────────────────────
function BidPanel({ auction, onBid, onPass }) {
  const [selLevel, setSelLevel] = useState(null)
  const dn = ['C','D','H','S','NT']
  const last = auction.reduce((l,b)=>b.type==='bid'?b:l, null)

  function isValid(lv, d) {
    if (!last) return true
    if (lv > last.level) return true
    if (lv === last.level) return dn.indexOf(d) > dn.indexOf(last.denomination)
    return false
  }

  const denomDisplay = { C:'♣', D:'♦', H:'♥', S:'♠', NT:'NT' }
  const denomCol = { C:'#fff', D:'#e74c3c', H:'#e74c3c', S:'#fff', NT:'#7eb5f5' }

  return (
    <div style={{ background:'rgba(0,0,0,0.85)', borderRadius:14, padding:'12px 14px', border:'1px solid rgba(201,168,76,0.3)', width:'100%', maxWidth:360 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:'0.7rem', color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Your Bid</p>
        <button onClick={onPass} style={{ padding:'6px 18px', borderRadius:8, fontWeight:700, fontSize:'0.85rem', background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.25)', color:'rgba(245,240,232,0.8)', cursor:'pointer' }}>Pass</button>
      </div>
      {/* Level row */}
      <div style={{ display:'flex', gap:5, marginBottom:8 }}>
        {[1,2,3,4,5,6,7].map(lv => {
          const anyValid = dn.some(d => isValid(lv, d))
          const sel = selLevel === lv
          return (
            <button key={lv} onClick={()=>anyValid&&setSelLevel(sel?null:lv)} style={{
              flex:1, height:36, borderRadius:7, fontSize:'1rem', fontWeight:700,
              background: sel ? 'var(--gold)' : anyValid ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
              border: sel ? '2px solid var(--gold)' : `1.5px solid ${anyValid?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.04)'}`,
              color: sel ? 'var(--felt-dark)' : anyValid ? 'white' : 'rgba(255,255,255,0.15)',
              cursor: anyValid ? 'pointer' : 'not-allowed',
            }}>{lv}</button>
          )
        })}
      </div>
      {/* Denom row — only show when level selected */}
      {selLevel && (
        <div style={{ display:'flex', gap:5 }}>
          {dn.map(d => {
            const valid = isValid(selLevel, d)
            return (
              <button key={d} onClick={()=>valid&&(onBid(selLevel,d),setSelLevel(null))} style={{
                flex:1, height:44, borderRadius:8, fontSize:'1.3rem', fontWeight:700,
                background: valid ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                border: `2px solid ${valid?denomCol[d]+'55':'rgba(255,255,255,0.04)'}`,
                color: valid ? denomCol[d] : 'rgba(255,255,255,0.1)',
                cursor: valid ? 'pointer' : 'not-allowed',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e=>{ if(valid) e.target.style.background='rgba(255,255,255,0.2)' }}
              onMouseLeave={e=>{ if(valid) e.target.style.background='rgba(255,255,255,0.1)' }}
              >{denomDisplay[d]}</button>
            )
          })}
        </div>
      )}
      {!selLevel && <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.3)', textAlign:'center', marginTop:4 }}>Select a level above, then choose a suit</p>}
    </div>
  )
}

// ─── Main Bridge component ────────────────────────────────────────
export default function Bridge() {
  const { profile } = useAuth()
  const [screen, setScreen] = useState('menu')
  const [gameMode, setGameMode] = useState('rubber')
  const [difficulty, setDifficulty] = useState('medium')
  const [game, setGame] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [botThinking, setBotThinking] = useState(null)
  const [lastTrick, setLastTrick] = useState(null)
  const [showLastTrick, setShowLastTrick] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const botTimer = useRef(null)
  const lastTrickTimer = useRef(null)
  const isPlusUser = profile?.plan==='plus'||profile?.plan==='club'

  useEffect(() => {
    if (!game || game.phase !== 'complete' || !game.scoring || resultSaved) return
    const isDeclarer = game.contract?.declarer === 'S'
    const isNS = game.contract?.declarer === 'N' || game.contract?.declarer === 'S'
    const playerWon = isDeclarer ? game.scoring.made : !game.scoring.made
    let ratingChange = 0
    if (isDeclarer) {
      if (game.scoring.made) {
        const level = game.contract.level
        const overtricks = game.tricks[isNS?'NS':'EW'] - game.contract.tricksNeeded
        ratingChange = 20 + (level * 5) + (overtricks * 3)
        if (level === 6) ratingChange += 50
        if (level === 7) ratingChange += 100
        if (game.vulnerability?.[isNS?'NS':'EW']) ratingChange = Math.round(ratingChange * 1.3)
      } else {
        const undertricks = game.contract.tricksNeeded - game.tricks[isNS?'NS':'EW']
        ratingChange = -(10 + undertricks * 8)
      }
    } else {
      ratingChange = !game.scoring.made ? 15 : -5
    }
    saveGameResult('bridge', playerWon, game.scoring.declarerScore || game.scoring.defenderScore || 0, ratingChange, {
      contract: `${game.contract.level}${game.contract.denomination}`,
      declarer: game.contract.declarer,
      made: game.scoring.made,
      mode: game.mode,
    })
    setResultSaved(true)
  }, [game, resultSaved])

  function getPlayerLastBid(pos, auction) {
    const bids = auction.filter(b=>b.position===pos)
    return bids.length ? bids[bids.length-1] : null
  }

  function processBid(ng, bid) {
    ng.auction.push({...bid, position:ng.currentBidder})
    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) { ng.phase = 'redeal'; return }
      ng.contract = contract
      ng.dummy = PARTNERS[contract.declarer]
      ng.phase = 'playing'
      const pos = ['S','W','N','E']
      ng.currentLeader = pos[(pos.indexOf(contract.declarer)+1)%4]
      ng.dummyRevealed = false
    } else {
      const pos = ['S','W','N','E']
      ng.currentBidder = pos[(pos.indexOf(ng.currentBidder)+1)%4]
    }
  }

  function processPlay(ng, player, card) {
    ng.hands[player] = ng.hands[player].filter(c=>c.id!==card.id)
    ng.currentTrick.push({position:player, card})
    if (!ng.dummyRevealed) ng.dummyRevealed = true
    if (ng.currentTrick.length===4) {
      const winner = getTrickWinner(ng.currentTrick, ng.contract.denomination==='NT'?null:ng.contract.denomination)
      const side = (winner.position==='N'||winner.position==='S')?'NS':'EW'
      ng.tricks[side]++
      ng.trickHistory.push({trick:[...ng.currentTrick], winner:winner.position})
      setLastTrick({trick:[...ng.currentTrick], winner:winner.position})
      setShowLastTrick(true)
      clearTimeout(lastTrickTimer.current)
      lastTrickTimer.current = setTimeout(()=>setShowLastTrick(false), 2500)
      ng.currentTrick = []
      ng.currentLeader = winner.position
      if (ng.tricks.NS+ng.tricks.EW===13) {
        const declSide = (ng.contract.declarer==='N'||ng.contract.declarer==='S')?'NS':'EW'
        ng.scoring = ng.mode==='rubber'
          ? calculateRubberScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
          : calculateDuplicateScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
        ng.phase = 'complete'
      }
    } else {
      ng.currentLeader = NEXT_PLAYER[player]
    }
  }

  const doBotAction = useCallback((g) => {
    if (!g||g.phase==='complete') return
    let actingPos = null
    if (g.phase==='bidding'&&g.currentBidder!=='S') actingPos = g.currentBidder
    else if (g.phase==='playing') {
      const l = g.currentLeader
      if (l!=='S'&&l!==g.dummy) actingPos = l
      else if (l===g.dummy&&g.contract?.declarer!=='S') actingPos = l
    }
    if (!actingPos) return
    setBotThinking(actingPos)
    clearTimeout(botTimer.current)
    const delay = (difficulty==='easy'?2800:difficulty==='medium'?2000:1200)+Math.random()*800
    botTimer.current = setTimeout(()=>{
      setBotThinking(null)
      setGame(prev=>{
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))
        if (ng.phase==='bidding') {
          processBid(ng, getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability, ng.difficulty))
        } else if (ng.phase==='playing') {
          const card = getBotCardPlay(ng.hands[ng.currentLeader], ng.currentTrick, ng.contract?.denomination==='NT'?null:ng.contract?.denomination, ng.contract, ng.currentLeader, ng.trickHistory, ng.difficulty)
          processPlay(ng, ng.currentLeader, card)
        }
        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(()=>{
    if (!game) return
    if (game.phase==='redeal') {
      setGame(createBridgeGame(game.mode,'S',game.difficulty,game.botNames))
      return
    }
    if (game.phase==='complete') return
    const isBotBid = game.phase==='bidding'&&game.currentBidder!=='S'
    const isBotPlay = game.phase==='playing'&&((game.currentLeader!=='S'&&game.currentLeader!==game.dummy)||(game.currentLeader===game.dummy&&game.contract?.declarer!=='S'))
    if (isBotBid||isBotPlay) doBotAction(game)
    return ()=>{ clearTimeout(botTimer.current); setBotThinking(null) }
  }, [game, doBotAction])

  function startGame() {
    setGame(createBridgeGame(gameMode,'S',difficulty,{N:'Alex',E:'Sam',W:'Jordan'}))
    setScreen('game'); setSelectedCard(null); setBotThinking(null)
    setLastTrick(null); setShowLastTrick(false); setResultSaved(false)
  }
  function handleBid(lv,dn) {
    if (!game||game.phase!=='bidding'||game.currentBidder!=='S') return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processBid(ng,{level:lv,denomination:dn,type:'bid'});return ng})
  }
  function handlePass() {
    if (!game||game.phase!=='bidding'||game.currentBidder!=='S') return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processBid(ng,{type:'pass',level:0,denomination:'PASS'});return ng})
  }
  function handleCardClick(card, fromDummy) {
    if (!game||game.phase!=='playing') return
    const isDummyPlay = fromDummy&&game.contract?.declarer==='S'&&game.currentLeader===game.dummy
    if (!isDummyPlay&&game.currentLeader!=='S') return
    const player = isDummyPlay?game.dummy:'S'
    const hand = game.hands[player]
    const trump = game.contract?.denomination==='NT'?null:game.contract?.denomination
    const legal = getLegalCards(hand, game.currentTrick, trump)
    if (!legal.some(c=>c.id===card.id)) return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processPlay(ng,player,card);return ng})
    setSelectedCard(null)
  }

  function handleSouthCardClick(card) {
    if (!game||game.phase!=='playing'||game.currentLeader!=='S') return
    const hand = game.hands['S']
    const trump = game.contract?.denomination==='NT'?null:game.contract?.denomination
    const legal = getLegalCards(hand, game.currentTrick, trump)
    if (!legal.some(c=>c.id===card.id)) return
    if (selectedCard?.id===card.id) {
      handleCardClick(card, false)
    } else {
      setSelectedCard(card)
    }
  }

  // ── Menu ──────────────────────────────────────────────────────────
  if (screen==='menu') return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem' }}>
      <div style={{ maxWidth:500, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
          <div style={{ fontSize:'2.5rem' }}>♠</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'var(--cream)', margin:'0.4rem 0' }}>Bridge</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>The ultimate card game. Play against bots or real opponents.</p>
        </div>
        <div style={{ marginBottom:'1.25rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Game Type</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {[{id:'rubber',name:'Rubber Bridge',desc:'Classic casual play'},{id:'duplicate',name:'Duplicate Bridge',desc:'Competitive scoring'}].map(m=>(
              <div key={m.id} onClick={()=>setGameMode(m.id)} style={{ background:gameMode===m.id?'rgba(201,168,76,0.15)':'var(--felt-light)', border:`2px solid ${gameMode===m.id?'var(--gold)':'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:3 }}>{m.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Bot Difficulty</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'easy',name:'Easy',desc:'~4s thinking'},{id:'medium',name:'Medium',desc:'~3s thinking'},{id:'hard',name:'Hard',desc:'~2s thinking',plus:true}].map(d=>(
              <div key={d.id} onClick={()=>(!d.plus||isPlusUser)&&setDifficulty(d.id)} style={{ background:difficulty===d.id?'rgba(201,168,76,0.15)':'var(--felt-light)', border:`2px solid ${difficulty===d.id?'var(--gold)':'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:(!d.plus||isPlusUser)?'pointer':'not-allowed', textAlign:'center', opacity:d.plus&&!isPlusUser?0.6:1, position:'relative' }}>
                {d.plus&&!isPlusUser&&<div style={{ position:'absolute', top:-8, right:-8, background:'var(--gold)', color:'var(--felt-dark)', fontSize:'0.58rem', fontWeight:700, padding:'2px 6px', borderRadius:10 }}>PLUS</div>}
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{d.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
          {!isPlusUser&&<p style={{ fontSize:'0.72rem', color:'var(--gold)', marginTop:'0.4rem', textAlign:'center' }}><Link to="/upgrade" style={{ color:'var(--gold)' }}>Upgrade to Plus</Link> to unlock Hard</p>}
        </div>
        <button className="btn-gold" onClick={startGame} style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'0.85rem' }}>♠ Deal Cards</button>
        <Link to="/lobby" style={{ display:'block', textAlign:'center', marginTop:'0.9rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>← Back to Lobby</Link>
      </div>
    </div>
  )

  if (!game) return null

  const myHand = game.hands['S'] || []
  const trump = game.contract?.denomination === 'NT' ? null : game.contract?.denomination
  const isMyBidTurn = game.phase==='bidding' && game.currentBidder==='S'
  const isMyPlayTurn = game.phase==='playing' && game.currentLeader==='S'
  const isDeclarer = game.contract?.declarer==='S'
  const isDummyTurn = game.phase==='playing' && game.currentLeader===game.dummy && isDeclarer
  const legalCards = isMyPlayTurn ? getLegalCards(myHand, game.currentTrick, trump) : null
  const isMyTurn = isMyBidTurn || isMyPlayTurn || isDummyTurn
  const botName = p => p==='N'?'Alex':p==='E'?'Sam':'Jordan'

  const dummyPos = game.dummy
  const dummyHand = dummyPos ? game.hands[dummyPos] : null
  const showDummy = game.dummyRevealed && dummyHand

  // ── Card visibility rules ─────────────────────────────────────
  // N dummy (S declares): show N face up
  // S dummy (N declares): show S face up at bottom
  // E dummy (W declares): show E face up on right
  // W dummy (E declares): show W face up on left
  const isNorthDummy = dummyPos==='N' && showDummy
  const isWestDummy  = dummyPos==='W' && showDummy
  const isEastDummy  = dummyPos==='E' && showDummy

  // Player label helper
  function playerLabel(pos) {
    const isDummy = dummyPos===pos && showDummy
    const isDecl = game.contract?.declarer===pos
    const name = pos==='S' ? 'You' : botName(pos)
    return `${name} (${pos})${isDummy?' ★ Dummy':isDecl?' ★ Declarer':''}`
  }

  function labelColor(pos) {
    if (dummyPos===pos && showDummy) return 'var(--gold)'
    if (game.contract?.declarer===pos) return 'var(--gold)'
    if (pos==='S' && isMyTurn) return '#5DCAA5'
    return 'rgba(245,240,232,0.55)'
  }

  return (
    <div style={{ paddingTop:56, height:'100vh', display:'flex', flexDirection:'column', background:'#0d1f14', overflow:'hidden' }}>

      {/* ── Result overlay ── */}
      {game.phase==='complete' && game.scoring && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#1a3d28', border:'2px solid var(--gold)', borderRadius:18, padding:'2rem', textAlign:'center', maxWidth:400, width:'90%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made?'🎉':'😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', color:'var(--gold)', marginBottom:'0.4rem' }}>{game.scoring.made?'Contract Made!':'Contract Defeated!'}</h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.2rem' }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':botName(game.contract.declarer)}</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'0.5rem' }}>NS: {game.tricks.NS} tricks · EW: {game.tricks.EW} tricks</p>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--gold)', margin:'0.75rem 0' }}>
              {game.scoring.made ? `NS +${game.scoring.declarerScore}` : `EW +${game.scoring.defenderScore}`} pts
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={()=>setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Last trick overlay ── */}
      {showLastTrick && lastTrick && (
        <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:150, background:'rgba(0,0,0,0.93)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:16, padding:'20px 28px', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.6)' }}>
          <p style={{ fontSize:'0.85rem', color:'var(--gold)', fontWeight:700, marginBottom:12 }}>
            {lastTrick.winner==='S'?'You won':botName(lastTrick.winner)+' won'} the trick 👑
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'flex-end' }}>
            {lastTrick.trick.map((t,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', color:t.position===lastTrick.winner?'var(--gold)':'rgba(245,240,232,0.4)', marginBottom:4, fontWeight:t.position===lastTrick.winner?700:400 }}>
                  {t.position==='S'?'You':botName(t.position)}{t.position===lastTrick.winner?' 👑':''}
                </div>
                <BCard card={t.card} w={72} h={100} />
              </div>
            ))}
          </div>
          <p style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.2)', marginTop:10 }}>Next trick starting...</p>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:44, background:'rgba(0,0,0,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={()=>setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'var(--gold)', fontWeight:700 }}>♠ Bridge</span>
          {game.contract && (
            <span style={{ fontSize:'0.72rem', background:'rgba(255,255,255,0.08)', color:'var(--cream)', padding:'3px 12px', borderRadius:20 }}>
              <span style={{ color:'white' }}>{game.contract.level}</span>
              <span style={{ color:suitColor(game.contract.denomination) }}>{DENOM_SYMBOLS[game.contract.denomination]}</span>
              <span style={{ color:'var(--text-muted)' }}> · {game.contract.declarer==='S'?'You':botName(game.contract.declarer)} declares</span>
            </span>
          )}
        </div>
        <div style={{ fontSize:'0.82rem', fontWeight:600 }}>
          {isMyTurn
            ? <span style={{ color:'#5DCAA5' }}>🟢 {isDummyTurn?'Play dummy':'Your turn'}</span>
            : botThinking
            ? <span style={{ color:'var(--gold)' }}>{botName(botThinking)} thinking <ThinkingDots/></span>
            : <span style={{ color:'var(--text-muted)' }}>Waiting...</span>}
        </div>
        <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.82rem', fontWeight:600 }}>
          <span style={{ color:'#5DCAA5' }}>NS: {game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW: {game.tricks.EW}</span>
          {game.contract && <span style={{ color:'rgba(245,240,232,0.4)' }}>Need {game.contract.tricksNeeded}</span>}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* NORTH */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 12px 4px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:labelColor('N') }}>{playerLabel('N')}</span>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('N',game.auction)} thinking={botThinking==='N'} />}
            </div>
            {isNorthDummy
              ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='N'} horizontal />
              : <FannedHand cards={game.hands['N']||[]} faceDown cardW={72} cardH={101} overlap={24} />
            }
          </div>

          {/* MIDDLE ROW */}
          <div style={{ flex:1, display:'flex', alignItems:'stretch', overflow:'hidden', minHeight:0, padding:'0 8px', gap:8 }}>

            {/* WEST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', gap:6, flexShrink:0, width:isWestDummy?'auto':70, paddingTop:8 }}>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('W',game.auction)} thinking={botThinking==='W'} />}
              <span style={{ fontSize:'0.65rem', fontWeight:700, color:labelColor('W'), writingMode:'vertical-rl', transform:'rotate(180deg)', maxHeight:100 }}>{playerLabel('W')}</span>
              {isWestDummy
                ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='W'} horizontal={false} />
                : <FannedHand cards={game.hands['W']||[]} faceDown vertical cardW={56} cardH={78} overlap={14} />
              }
            </div>

            {/* CENTER */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minWidth:0 }}>

              {/* Bidding */}
              {game.phase==='bidding' && (
                isMyBidTurn
                  ? <BidPanel auction={game.auction} onBid={handleBid} onPass={handlePass} />
                  : <div style={{ textAlign:'center', padding:'16px 24px', background:'rgba(0,0,0,0.45)', borderRadius:14, border:'1px solid rgba(201,168,76,0.1)' }}>
                      <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:8 }}>Waiting for {botName(game.currentBidder)}...</p>
                      {botThinking && <ThinkingDots/>}
                    </div>
              )}

              {/* Trick area */}
              {game.phase==='playing' && (
                <div style={{ position:'relative', width:280, height:240, flexShrink:0 }}>
                  {['N','S','E','W'].map(p => {
                    const play = game.currentTrick.find(t=>t.position===p)
                    const offsets = {
                      N:{top:0,left:'50%',transform:'translateX(-50%)'},
                      S:{bottom:0,left:'50%',transform:'translateX(-50%)'},
                      E:{right:0,top:'50%',transform:'translateY(-50%)'},
                      W:{left:0,top:'50%',transform:'translateY(-50%)'}
                    }
                    return (
                      <div key={p} style={{ position:'absolute', ...offsets[p] }}>
                        {play
                          ? <div style={{ textAlign:'center' }}>
                              <BCard card={play.card} w={92} h={129} />
                              <div style={{ fontSize:'0.62rem', color:'rgba(245,240,232,0.45)', marginTop:3 }}>{p==='S'?'You':botName(p)}</div>
                            </div>
                          : <div style={{ width:92, height:129, borderRadius:8, border:'2px dashed rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:'0.62rem', color:'rgba(245,240,232,0.15)' }}>{p==='S'?'You':botName(p)}</span>
                            </div>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {game.phase==='playing' && isDeclarer && (
                <p style={{ fontSize:'0.68rem', color:'rgba(201,168,76,0.6)', textAlign:'center' }}>★ You declared — tap a card from your hand or dummy to play</p>
              )}
            </div>

            {/* EAST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', gap:6, flexShrink:0, width:isEastDummy?'auto':70, paddingTop:8 }}>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('E',game.auction)} thinking={botThinking==='E'} />}
              <span style={{ fontSize:'0.65rem', fontWeight:700, color:labelColor('E'), writingMode:'vertical-rl', maxHeight:100 }}>{playerLabel('E')}</span>
              {isEastDummy
                ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='E'} horizontal={false} />
                : <FannedHand cards={game.hands['E']||[]} faceDown vertical cardW={56} cardH={78} overlap={14} />
              }
            </div>
          </div>

          {/* SOUTH — your hand */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'4px 12px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:labelColor('S') }}>
                {playerLabel('S')} · {countHCP(myHand)} HCP{isMyPlayTurn?' · Your turn':''}
              </span>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('S',game.auction)} />}
            </div>
            {/* South hand — always show face up, sorted by suit */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-end' }}>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                const col = SUIT_COLORS[suit]==='#1a1a2e' ? 'rgba(255,255,255,0.6)' : SUIT_COLORS[suit]
                return (
                  <div key={suit} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:'1.4rem', color:col, fontWeight:700, flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
                    <FannedHand
                      cards={cards}
                      legalCards={legalCards}
                      selectedCard={selectedCard}
                      onCardClick={handleSouthCardClick}
                      cardW={100} cardH={140} overlap={30}
                    />
                  </div>
                )
              })}
            </div>
            {game.dummy==='S' && game.dummyRevealed && (
              <p style={{ fontSize:'0.72rem', color:'rgba(201,168,76,0.5)', fontStyle:'italic' }}>
                {botName(game.contract?.declarer)} is playing your hand as dummy
              </p>
            )}
            {isMyPlayTurn && <p style={{ fontSize:'0.62rem', color:'rgba(245,240,232,0.2)' }}>Tap to select · Tap again to play</p>}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width:172, background:'rgba(0,0,0,0.4)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflowY:'auto' }}>
          <div>
            <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Bidding History</p>
            <AuctionHistory auction={game.auction} dealer={game.dealer} />
          </div>
          {game.phase==='playing' && (
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px 10px' }}>
              <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Tricks</p>
              <p style={{ fontSize:'1rem', color:'#5DCAA5', marginBottom:2, fontWeight:700 }}>NS: {game.tricks.NS}</p>
              <p style={{ fontSize:'1rem', color:'#c0392b', marginBottom:4, fontWeight:700 }}>EW: {game.tricks.EW}</p>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Need {game.contract?.tricksNeeded}</p>
            </div>
          )}
          <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'8px 10px' }}>
            <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Your Hand · {countHCP(myHand)} HCP</p>
            {['S','H','D','C'].map(suit => {
              const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
              if (!cards.length) return null
              const col = SUIT_COLORS[suit]==='#1a1a2e' ? 'rgba(255,255,255,0.85)' : SUIT_COLORS[suit]
              return <p key={suit} style={{ fontSize:'0.82rem', color:col, marginBottom:3 }}>{SUIT_SYMBOLS[suit]} {cards.map(c=>c.value).join(' ')}</p>
            })}
          </div>
          <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
            <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Vulnerability</p>
            <p style={{ fontSize:'0.8rem', color:game.vulnerability?.NS?'#c0392b':'#5DCAA5', marginBottom:3 }}>NS: {game.vulnerability?.NS?'Vul':'Not vul'}</p>
            <p style={{ fontSize:'0.8rem', color:game.vulnerability?.EW?'#c0392b':'#5DCAA5' }}>EW: {game.vulnerability?.EW?'Vul':'Not vul'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
