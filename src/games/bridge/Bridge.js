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

// ─── Card ─────────────────────────────────────────────────────────
function BCard({ card, selected, legal, onClick, w=72, h=101, faceDown }) {
  const fs = w < 50 ? 9 : w < 65 ? 11 : 13
  const ss = w < 50 ? 18 : w < 65 ? 22 : 28
  const notLegal = legal === false
  if (faceDown) return (
    <div style={{ width:w, height:h, borderRadius:7, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }} />
  )
  if (!card) return null
  const col = SUIT_COLORS[card.suit]
  return (
    <div onClick={!notLegal && onClick ? onClick : undefined} style={{
      width:w, height:h, borderRadius:7, flexShrink:0,
      background: selected?'#fffde7':notLegal?'#ddd':'white',
      border: selected?'3px solid #c9a84c':'1px solid #ccc',
      boxShadow: selected?'0 0 0 3px rgba(201,168,76,0.5),0 6px 16px rgba(0,0,0,0.4)':'0 2px 6px rgba(0,0,0,0.3)',
      cursor: !notLegal&&onClick?'pointer':'default',
      userSelect:'none', position:'relative',
      transform: selected?'translateY(-16px)':'none',
      transition:'transform 0.15s', opacity:notLegal?0.35:1,
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

// ─── Thinking dots ────────────────────────────────────────────────
function ThinkingDots() {
  const [d, setD] = useState(1)
  useEffect(() => { const t = setInterval(()=>setD(x=>x===3?1:x+1),500); return()=>clearInterval(t) },[])
  return <span>{'●'.repeat(d)}{'○'.repeat(3-d)}</span>
}

// ─── Bid bubble ───────────────────────────────────────────────────
function BidBubble({ bid, thinking }) {
  if (!bid && !thinking) return null
  const text = thinking?'...':bid.type==='pass'?'Pass':bid.type==='double'?'Dbl':`${bid.level}${DENOM_SYMBOLS[bid.denomination]}`
  const col = thinking?'var(--gold)':bid.type==='bid'?'white':'rgba(245,240,232,0.5)'
  return (
    <div style={{ background:'rgba(0,0,0,0.85)', border:`1.5px solid ${thinking?'var(--gold)':'rgba(255,255,255,0.2)'}`, borderRadius:8, padding:'3px 10px', fontSize:'0.82rem', fontWeight:700, color:col, whiteSpace:'nowrap' }}>
      {thinking?<ThinkingDots/>:text}
    </div>
  )
}

// ─── Auction history ──────────────────────────────────────────────
function AuctionHistory({ auction, dealer }) {
  const pos = ['W','N','E','S']
  const pad = [...Array(pos.indexOf(dealer)).fill(null), ...auction]
  if (!auction.length) return <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', padding:'6px 0' }}>Bidding starting...</p>
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3, marginBottom:4 }}>
        {['W','N','E','You'].map(p=><div key={p} style={{ textAlign:'center', fontSize:'0.62rem', color:'rgba(245,240,232,0.4)', fontWeight:600 }}>{p}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3 }}>
        {pad.map((b,i)=>{
          const col = b?.type==='bid'?'white':'rgba(245,240,232,0.35)'
          return <div key={i} style={{ textAlign:'center', padding:'3px 1px', borderRadius:3, fontSize:'0.75rem', fontWeight:600, background:b?'rgba(255,255,255,0.07)':'transparent', color:col, minHeight:22, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {b?(b.type==='pass'?'P':b.type==='double'?'X':`${b.level}${DENOM_SYMBOLS[b.denomination]}`):''}</div>
        })}
      </div>
    </div>
  )
}

// ─── Step bid panel ───────────────────────────────────────────────
function BidPanel({ auction, onBid, onPass }) {
  const [selLevel, setSelLevel] = useState(null)
  const [selDenom, setSelDenom] = useState(null)
  const dn = ['C','D','H','S','NT']
  const last = auction.reduce((l,b)=>b.type==='bid'?b:l, null)
  const levelOk = lv => !last || lv > last.level || lv === last.level
  const denomOk = (lv,d) => { if(!last)return true; if(lv>last.level)return true; if(lv===last.level)return dn.indexOf(d)>dn.indexOf(last.denomination); return false }

  const denomColors = { C:'rgba(255,255,255,0.9)', D:'#e74c3c', H:'#e74c3c', S:'rgba(255,255,255,0.9)', NT:'#7eb5f5' }

  return (
    <div style={{ background:'rgba(0,0,0,0.8)', borderRadius:14, padding:'14px 16px', border:'1px solid rgba(201,168,76,0.25)', width:'100%', maxWidth:320 }}>
      <p style={{ fontSize:'0.7rem', color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, textAlign:'center' }}>Your Bid</p>

      {/* Step 1: Level */}
      <div style={{ marginBottom:12 }}>
        <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.45)', marginBottom:7 }}>
          Step 1 — Level {selLevel&&<span style={{ color:'var(--gold)' }}>· {selLevel} selected</span>}
        </p>
        <div style={{ display:'flex', gap:6 }}>
          {[1,2,3,4,5,6,7].map(lv=>{
            const valid = levelOk(lv)
            const sel = selLevel===lv
            return <button key={lv} onClick={()=>valid&&(setSelLevel(lv),setSelDenom(null))} style={{
              flex:1, height:42, borderRadius:8, fontSize:'1.1rem', fontWeight:700,
              background:sel?'var(--gold)':valid?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)',
              border:sel?'2px solid var(--gold)':`1.5px solid ${valid?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.06)'}`,
              color:sel?'var(--felt-dark)':valid?'white':'rgba(255,255,255,0.2)',
              cursor:valid?'pointer':'not-allowed',
            }}>{lv}</button>
          })}
        </div>
      </div>

      {/* Step 2: Denomination */}
      <div style={{ marginBottom:12, opacity:selLevel?1:0.4 }}>
        <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.45)', marginBottom:7 }}>
          Step 2 — Suit {selDenom&&<span style={{ color:'var(--gold)' }}>· {DENOM_SYMBOLS[selDenom]} selected</span>}
        </p>
        <div style={{ display:'flex', gap:6 }}>
          {dn.map(d=>{
            const valid = selLevel?denomOk(selLevel,d):false
            const sel = selDenom===d
            return <button key={d} onClick={()=>valid&&setSelDenom(d)} style={{
              flex:1, height:42, borderRadius:8, fontSize:'1.1rem', fontWeight:700,
              background:sel?'rgba(201,168,76,0.25)':valid?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.02)',
              border:sel?'2px solid var(--gold)':`1.5px solid ${valid?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.04)'}`,
              color:sel?'var(--gold)':valid?denomColors[d]:'rgba(255,255,255,0.12)',
              cursor:valid?'pointer':'not-allowed',
            }}>{DENOM_SYMBOLS[d]}</button>
          })}
        </div>
      </div>

      {/* Confirm + Pass */}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>{if(selLevel&&selDenom){onBid(selLevel,selDenom);setSelLevel(null);setSelDenom(null)}}} disabled={!selLevel||!selDenom} style={{
          flex:2, padding:'10px', borderRadius:8, fontWeight:700, fontSize:'0.9rem',
          background:selLevel&&selDenom?'var(--gold)':'rgba(255,255,255,0.05)',
          border:`1.5px solid ${selLevel&&selDenom?'var(--gold)':'rgba(255,255,255,0.1)'}`,
          color:selLevel&&selDenom?'var(--felt-dark)':'rgba(255,255,255,0.2)',
          cursor:selLevel&&selDenom?'pointer':'not-allowed',
        }}>{selLevel&&selDenom?`Bid ${selLevel}${DENOM_SYMBOLS[selDenom]} ✓`:'Select above'}</button>
        <button onClick={()=>{setSelLevel(null);setSelDenom(null);onPass()}} style={{
          flex:1, padding:'10px', borderRadius:8, fontWeight:600, fontSize:'0.9rem',
          background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(255,255,255,0.2)',
          color:'rgba(245,240,232,0.8)', cursor:'pointer',
        }}>Pass</button>
      </div>
    </div>
  )
}

// ─── Dummy hand (face up, horizontal by suit) ─────────────────────
function DummyHand({ hand, currentTrick, contract, onPlay, canPlay }) {
  if (!hand) return null
  const legal = canPlay ? getLegalCards(hand, currentTrick, contract?.denomination==='NT'?null:contract?.denomination) : null
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
      {['S','H','D','C'].map(suit=>{
        const cards = hand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        return (
          <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:'0.8rem', color:SUIT_COLORS[suit]==='#1a1a2e'?'rgba(255,255,255,0.7)':SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</span>
            <div style={{ display:'flex', gap:2 }}>
              {cards.map(c=>{
                const isLegal = !legal||legal.some(x=>x.id===c.id)
                return <BCard key={c.id} card={c} w={48} h={67} legal={isLegal?undefined:false} onClick={()=>canPlay&&isLegal&&onPlay(c)} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Compact face-down hand ───────────────────────────────────────
function FaceDownHand({ count=13, horizontal=true }) {
  const n = Math.min(count, 13)
  if (horizontal) {
    return (
      <div style={{ position:'relative', height:52, width:Math.min(n*16+36,240), flexShrink:0 }}>
        {Array.from({length:n}).map((_,i)=>(
          <div key={i} style={{ position:'absolute', left:i*16 }}>
            <BCard faceDown w={38} h={52} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ position:'relative', width:42, height:Math.min(n*14+45,190), flexShrink:0 }}>
      {Array.from({length:n}).map((_,i)=>(
        <div key={i} style={{ position:'absolute', top:i*14 }}>
          <BCard faceDown w={38} h={52} />
        </div>
      ))}
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

  // Save result when hand completes
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
    return bids.length?bids[bids.length-1]:null
  }

  function processBid(ng, bid) {
    ng.auction.push({...bid, position:ng.currentBidder})
    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) {
        // All passed — mark for redeal, handled in useEffect
        ng.phase = 'redeal'
        return
      }
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
      lastTrickTimer.current = setTimeout(()=>setShowLastTrick(false), 3000)
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

  const doBotAction = useCallback((g)=>{
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
    const delay = (difficulty==='easy'?2800:difficulty==='medium'?2000:1200)+Math.random()*1200
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
    // Handle all-pass redeal
    if (game.phase==='redeal') {
      const fresh = createBridgeGame(game.mode,'S',game.difficulty,game.botNames)
      setGame(fresh)
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
    const legal = getLegalCards(hand, game.currentTrick, game.contract?.denomination==='NT'?null:game.contract?.denomination)
    if (!legal.some(c=>c.id===card.id)) return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processPlay(ng,player,card);return ng})
    setSelectedCard(null)
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
  const myHand = game.hands['S']||[]
  const isMyBidTurn = game.phase==='bidding'&&game.currentBidder==='S'
  const isMyPlayTurn = game.phase==='playing'&&game.currentLeader==='S'
  const isDeclarer = game.contract?.declarer==='S'
  const isDummyTurn = game.phase==='playing'&&game.currentLeader===game.dummy&&isDeclarer
  const legalCards = isMyPlayTurn?getLegalCards(myHand,game.currentTrick,game.contract?.denomination==='NT'?null:game.contract?.denomination):null
  const isMyTurn = isMyBidTurn||isMyPlayTurn||isDummyTurn
  const botName = p=>p==='N'?'Alex':p==='E'?'Sam':'Jordan'

  // KEY INSIGHT: dummy hand always shows at North position visually
  // regardless of who is actually dummy
  const dummyPos = game.dummy
  const dummyHand = dummyPos ? game.hands[dummyPos] : null
  const showDummy = game.dummyRevealed && dummyHand

  // North visual slot shows: dummy hand if revealed, else North's face-down cards
  // West/East always show face-down compact stacks
  // The actual positions shown as labels reflect true positions

  return (
    <div style={{ paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', background:'#0f2219', overflow:'hidden' }}>

      {/* Result overlay */}
      {game.phase==='complete'&&game.scoring&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#234d38', border:'2px solid var(--gold)', borderRadius:18, padding:'2rem', textAlign:'center', maxWidth:400, width:'90%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made?'🎉':'😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', color:'var(--gold)', marginBottom:'0.4rem' }}>{game.scoring.made?'Contract Made!':'Contract Defeated!'}</h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.2rem' }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':botName(game.contract.declarer)}</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'0.5rem' }}>NS: {game.tricks.NS} tricks · EW: {game.tricks.EW} tricks</p>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--gold)', margin:'0.75rem 0' }}>
              {game.scoring.made?`NS +${game.scoring.declarerScore}`:`EW +${game.scoring.defenderScore}`} pts
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={()=>setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Last trick overlay */}
      {showLastTrick&&lastTrick&&(
        <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:150, background:'rgba(0,0,0,0.93)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:16, padding:'20px 28px', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.6)' }}>
          <p style={{ fontSize:'0.85rem', color:'var(--gold)', fontWeight:700, marginBottom:12 }}>
            {lastTrick.winner==='S'?'You won':''+botName(lastTrick.winner)+' won'} the trick 👑
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'flex-end' }}>
            {lastTrick.trick.map((t,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', color:t.position===lastTrick.winner?'var(--gold)':'rgba(245,240,232,0.4)', marginBottom:4, fontWeight:t.position===lastTrick.winner?700:400 }}>
                  {t.position==='S'?'You':botName(t.position)}{t.position===lastTrick.winner?' 👑':''}
                </div>
                <BCard card={t.card} w={78} h={110} />
              </div>
            ))}
          </div>
          <p style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.25)', marginTop:10 }}>Next trick starting...</p>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:44, background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={()=>setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'var(--gold)', fontWeight:700 }}>♠ Bridge</span>
          {game.contract&&<span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.08)', color:'var(--cream)', padding:'2px 10px', borderRadius:20 }}>
            {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} · {game.contract.declarer==='S'?'You':botName(game.contract.declarer)} declares{isDeclarer?' · Play both hands':''}
          </span>}
        </div>
        <div style={{ fontSize:'0.82rem', fontWeight:600 }}>
          {isMyTurn?<span style={{ color:'#5DCAA5' }}>🟢 {isDummyTurn?'Play from dummy':'Your turn'}</span>
            :botThinking?<span style={{ color:'var(--gold)' }}>{botName(botThinking)} thinking <ThinkingDots /></span>
            :<span style={{ color:'var(--text-muted)' }}>Waiting...</span>}
        </div>
        <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.78rem' }}>
          <span style={{ color:'#5DCAA5' }}>NS: {game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW: {game.tricks.EW}</span>
          {game.contract&&<span style={{ color:'var(--text-muted)' }}>Need {game.contract.tricksNeeded}</span>}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 12px', gap:6, overflow:'hidden', minWidth:0 }}>

          {/* NORTH SLOT — shows dummy if revealed, else North face-down */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                {showDummy
                  ? `${dummyPos==='S'?'You':botName(dummyPos)} (${dummyPos}) — Dummy ★`
                  : `${botName('N')} (N)${game.contract?.declarer==='N'?' ★ Declarer':''}`
                }
              </span>
              {game.phase==='bidding'&&<BidBubble bid={getPlayerLastBid('N',game.auction)} thinking={botThinking==='N'} />}
            </div>
            {showDummy
              ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn&&game.currentLeader===dummyPos} />
              : <FaceDownHand count={game.hands['N']?.length||13} horizontal />
            }
          </div>

          {/* MIDDLE */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, overflow:'hidden', minHeight:0 }}>

            {/* WEST — always compact vertical stack */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:'0.6rem', color:game.contract?.declarer==='W'?'var(--gold)':'var(--text-muted)', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
                  {botName('W')} (W){game.contract?.declarer==='W'?' ★':''}
                </span>
                {game.phase==='bidding'&&<BidBubble bid={getPlayerLastBid('W',game.auction)} thinking={botThinking==='W'} />}
              </div>
              <FaceDownHand count={game.hands['W']?.length||13} horizontal={false} />
            </div>

            {/* CENTER */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minWidth:0 }}>

              {/* Bidding */}
              {game.phase==='bidding'&&(
                isMyBidTurn
                  ? <BidPanel auction={game.auction} onBid={handleBid} onPass={handlePass} />
                  : <div style={{ textAlign:'center', padding:'14px 20px', background:'rgba(0,0,0,0.4)', borderRadius:12, border:'1px solid rgba(201,168,76,0.1)' }}>
                      <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', marginBottom:6 }}>Waiting for {botName(game.currentBidder)}...</p>
                      {botThinking&&<ThinkingDots />}
                    </div>
              )}

              {/* Trick area */}
              {game.phase==='playing'&&(
                <div style={{ position:'relative', width:260, height:210, flexShrink:0 }}>
                  {['N','S','E','W'].map(p=>{
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
                              <BCard card={play.card} w={70} h={98} />
                              <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)', marginTop:2 }}>{p==='S'?'You':botName(p)}</div>
                            </div>
                          : <div style={{ width:70, height:98, borderRadius:7, border:'2px dashed rgba(201,168,76,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.18)' }}>{p==='S'?'You':botName(p)}</span>
                            </div>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {game.phase==='playing'&&isDeclarer&&(
                <p style={{ fontSize:'0.7rem', color:'var(--gold)', textAlign:'center' }}>★ You declared — click your cards AND dummy's cards to play</p>
              )}
            </div>

            {/* EAST — always compact vertical stack */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {game.phase==='bidding'&&<BidBubble bid={getPlayerLastBid('E',game.auction)} thinking={botThinking==='E'} />}
                <span style={{ fontSize:'0.6rem', color:game.contract?.declarer==='E'?'var(--gold)':'var(--text-muted)', writingMode:'vertical-rl' }}>
                  {botName('E')} (E){game.contract?.declarer==='E'?' ★':''}
                </span>
              </div>
              <FaceDownHand count={game.hands['E']?.length||13} horizontal={false} />
            </div>
          </div>

          {/* SOUTH — your hand */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:5, paddingBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.68rem', color:isMyTurn?'#5DCAA5':isDeclarer?'var(--gold)':'var(--text-muted)' }}>
                You (S) · {countHCP(myHand)} HCP{isDeclarer?' · ★ Declarer':''}{isMyPlayTurn?' · Your turn':''}
              </span>
              {game.phase==='bidding'&&<BidBubble bid={getPlayerLastBid('S',game.auction)} />}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-end' }}>
              {['S','H','D','C'].map(suit=>{
                const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                return (
                  <div key={suit} style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
                    <span style={{ fontSize:'1rem', color:SUIT_COLORS[suit]==='#1a1a2e'?'rgba(255,255,255,0.55)':SUIT_COLORS[suit], marginRight:2, alignSelf:'center', flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
                    <div style={{ display:'flex', gap:3 }}>
                      {cards.map(card=>{
                        const isSelected = selectedCard?.id===card.id
                        const isLegal = !legalCards||legalCards.some(c=>c.id===card.id)
                        return (
                          <BCard key={card.id} card={card} w={64} h={90} selected={isSelected} legal={isLegal?undefined:false}
                            onClick={()=>{ if(!isMyPlayTurn||!isLegal)return; if(isSelected){handleCardClick(card);setSelectedCard(null)}else setSelectedCard(card) }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {isMyPlayTurn&&<p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.25)' }}>Click to select · Click again to play</p>}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width:180, background:'rgba(0,0,0,0.35)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflowY:'auto' }}>
          <div>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:600 }}>Bidding History</p>
            <AuctionHistory auction={game.auction} dealer={game.dealer} />
          </div>
          {game.phase==='playing'&&(
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px 10px' }}>
              <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, fontWeight:600 }}>Tricks</p>
              <p style={{ fontSize:'0.9rem', color:'#5DCAA5', marginBottom:2 }}>NS: {game.tricks.NS}</p>
              <p style={{ fontSize:'0.9rem', color:'#c0392b', marginBottom:4 }}>EW: {game.tricks.EW}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Need {game.contract?.tricksNeeded}</p>
            </div>
          )}
          <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'8px 10px' }}>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, fontWeight:600 }}>Your Hand · {countHCP(myHand)} HCP</p>
            {['S','H','D','C'].map(suit=>{
              const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
              if (!cards.length) return null
              return <p key={suit} style={{ fontSize:'0.8rem', color:SUIT_COLORS[suit]==='#1a1a2e'?'rgba(255,255,255,0.85)':SUIT_COLORS[suit], marginBottom:3 }}>{SUIT_SYMBOLS[suit]} {cards.map(c=>c.value).join(' ')}</p>
            })}
          </div>
          <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, fontWeight:600 }}>Vulnerability</p>
            <p style={{ fontSize:'0.78rem', color:game.vulnerability?.NS?'#c0392b':'#5DCAA5', marginBottom:2 }}>NS: {game.vulnerability?.NS?'Vul':'Not vul'}</p>
            <p style={{ fontSize:'0.78rem', color:game.vulnerability?.EW?'#c0392b':'#5DCAA5' }}>EW: {game.vulnerability?.EW?'Vul':'Not vul'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
