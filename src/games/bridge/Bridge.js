import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  SUIT_SYMBOLS, SUIT_COLORS, DENOM_SYMBOLS, DENOM_COLORS,
  PARTNERS, NEXT_PLAYER, VALUE_RANK,
  countHCP, getBotBid, getBotCardPlay,
  isAuctionOver, getContract, getTrickWinner, calculateRubberScore,
  calculateDuplicateScore, createBridgeGame, getLegalCards
} from './BridgeEngine'

// ─── Card ─────────────────────────────────────────────────────────
function BCard({ card, selected, legal, onClick, w=60, h=84, faceDown }) {
  const fs = w < 50 ? 9 : w < 65 ? 11 : 13
  const ss = w < 50 ? 18 : w < 65 ? 22 : 28
  const notLegal = legal === false
  if (faceDown) return (
    <div style={{ width:w, height:h, borderRadius:6, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border:'1.5px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 4px rgba(0,0,0,0.3)' }} />
  )
  if (!card) return null
  const col = SUIT_COLORS[card.suit]
  return (
    <div onClick={!notLegal && onClick ? onClick : undefined} style={{
      width:w, height:h, borderRadius:6, flexShrink:0,
      background: selected ? '#fffde7' : notLegal ? '#e0e0e0' : 'white',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.5),0 4px 12px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.25)',
      cursor: !notLegal && onClick ? 'pointer' : 'default',
      userSelect:'none', position:'relative',
      transform: selected ? 'translateY(-12px)' : 'none',
      transition:'transform 0.15s', opacity: notLegal ? 0.4 : 1,
    }}>
      <div style={{ position:'absolute', top:3, left:4, lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:ss, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      <div style={{ position:'absolute', bottom:3, right:4, transform:'rotate(180deg)', lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  )
}

// ─── Auction table ────────────────────────────────────────────────
function Auction({ auction, dealer }) {
  const pos = ['W','N','E','S']
  const pad = [...Array(pos.indexOf(dealer)).fill(null), ...auction]
  return (
    <div style={{ background:'rgba(0,0,0,0.5)', borderRadius:8, padding:'8px 10px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginBottom:3 }}>
        {['W','N','E','You'].map(p => <div key={p} style={{ textAlign:'center', fontSize:'0.6rem', color:'rgba(245,240,232,0.45)', fontWeight:600 }}>{p}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {pad.map((b, i) => {
          const col = b && b.type === 'bid'
            ? (DENOM_COLORS[b.denomination] === '#1a1a2e' ? 'white' : DENOM_COLORS[b.denomination])
            : 'rgba(245,240,232,0.3)'
          return (
            <div key={i} style={{ textAlign:'center', padding:'2px 1px', borderRadius:3, fontSize:'0.72rem', fontWeight:500, background: b ? 'rgba(255,255,255,0.06)' : 'transparent', color:col }}>
              {b ? (b.type==='pass' ? 'Pass' : b.type==='double' ? 'Dbl' : `${b.level}${DENOM_SYMBOLS[b.denomination]}`) : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bid panel ────────────────────────────────────────────────────
function BidPanel({ auction, onBid, onPass }) {
  const dn = ['C','D','H','S','NT']
  const last = auction.reduce((l, b) => b.type === 'bid' ? b : l, null)
  const ok = (lv, d) => {
    if (!last) return true
    if (lv > last.level) return true
    if (lv === last.level) return dn.indexOf(d) > dn.indexOf(last.denomination)
    return false
  }
  return (
    <div style={{ background:'rgba(0,0,0,0.6)', borderRadius:10, padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:'0.65rem', color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Your Bid</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:3 }}>
        {[1,2,3,4,5,6,7].flatMap(lv => dn.map(d => {
          const valid = ok(lv, d)
          const tc = d === 'NT'
            ? (valid ? '#7eb5f5' : 'rgba(100,160,255,0.2)')
            : DENOM_COLORS[d] === '#1a1a2e'
              ? (valid ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)')
              : (valid ? DENOM_COLORS[d] : 'rgba(192,57,43,0.25)')
          return (
            <button key={`${lv}${d}`} onClick={() => valid && onBid(lv, d)} style={{
              width:'100%', height:30, borderRadius:4,
              border:`1px solid ${valid ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
              background: valid ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)',
              cursor: valid ? 'pointer' : 'not-allowed',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0,
              transition:'background 0.1s',
            }}>
              <span style={{ fontSize:'0.58rem', color: valid ? 'rgba(245,240,232,0.65)' : 'rgba(255,255,255,0.1)', lineHeight:1.2 }}>{lv}</span>
              <span style={{ fontSize:'0.72rem', color:tc, lineHeight:1.2, fontWeight:700 }}>{DENOM_SYMBOLS[d]}</span>
            </button>
          )
        }))}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onPass} style={{ flex:1, padding:'7px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'var(--cream)', borderRadius:6, cursor:'pointer', fontWeight:500, fontSize:'0.82rem' }}>Pass</button>
      </div>
    </div>
  )
}

// ─── Dummy face-up hand ───────────────────────────────────────────
function DummyCards({ hand, currentTrick, contract, onPlay, canPlay }) {
  if (!hand) return null
  const legal = canPlay ? getLegalCards(hand, currentTrick, contract?.denomination === 'NT' ? null : contract?.denomination) : null
  return (
    <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
      {['S','H','D','C'].map(suit => {
        const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        return (
          <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:'0.75rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.7)' : SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</span>
            <div style={{ display:'flex', gap:2 }}>
              {cards.map(c => {
                const isLegal = !legal || legal.some(x => x.id === c.id)
                return <BCard key={c.id} card={c} w={44} h={62} legal={isLegal ? undefined : false} onClick={() => canPlay && isLegal && onPlay(c)} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Thinking indicator ───────────────────────────────────────────
function ThinkingDots() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setDots(d => d === 3 ? 1 : d + 1), 500)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color:'var(--gold)', fontSize:'0.8rem' }}>{'●'.repeat(dots)}{'○'.repeat(3-dots)}</span>
}

// ─── Main Bridge component ────────────────────────────────────────
export default function Bridge() {
  const { profile } = useAuth()
  const [screen, setScreen] = useState('menu')
  const [gameMode, setGameMode] = useState('rubber')
  const [difficulty, setDifficulty] = useState('medium')
  const [game, setGame] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [botThinking, setBotThinking] = useState(false)
  const botTimer = useRef(null)
  const isPlusUser = profile?.plan === 'plus' || profile?.plan === 'club'

  function processBid(ng, bid) {
    ng.auction.push({ ...bid, position: ng.currentBidder })
    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) { ng.phase = 'complete'; return }
      ng.contract = contract
      ng.dummy = PARTNERS[contract.declarer]
      ng.phase = 'playing'
      const pos = ['S','W','N','E']
      ng.currentLeader = pos[(pos.indexOf(contract.declarer) + 1) % 4]
      ng.dummyRevealed = false
    } else {
      const pos = ['S','W','N','E']
      ng.currentBidder = pos[(pos.indexOf(ng.currentBidder) + 1) % 4]
    }
  }

  function processPlay(ng, player, card) {
    ng.hands[player] = ng.hands[player].filter(c => c.id !== card.id)
    ng.currentTrick.push({ position: player, card })
    if (!ng.dummyRevealed) ng.dummyRevealed = true
    if (ng.currentTrick.length === 4) {
      const winner = getTrickWinner(ng.currentTrick, ng.contract.denomination === 'NT' ? null : ng.contract.denomination)
      const side = (winner.position==='N'||winner.position==='S') ? 'NS' : 'EW'
      ng.tricks[side]++
      ng.trickHistory.push({ trick:[...ng.currentTrick], winner:winner.position })
      ng.currentTrick = []
      ng.currentLeader = winner.position
      if (ng.tricks.NS + ng.tricks.EW === 13) {
        const declSide = (ng.contract.declarer==='N'||ng.contract.declarer==='S') ? 'NS' : 'EW'
        ng.scoring = ng.mode === 'rubber'
          ? calculateRubberScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
          : calculateDuplicateScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
        ng.phase = 'complete'
      }
    } else {
      ng.currentLeader = NEXT_PLAYER[player]
    }
  }

  const doBotAction = useCallback((g) => {
    if (!g || g.phase === 'complete') return
    
    // Determine who acts next
    let actingPos = null
    if (g.phase === 'bidding' && g.currentBidder !== 'S') {
      actingPos = g.currentBidder
    } else if (g.phase === 'playing') {
      const leader = g.currentLeader
      // Bot plays: if leader is not S, OR if leader is dummy and declarer is not S
      const isDummyPlayedByBot = leader === g.dummy && g.contract?.declarer !== 'S'
      const isRegularBotPlay = leader !== 'S' && leader !== g.dummy
      const isDeclarerPlayingDummy = leader === g.dummy && g.contract?.declarer !== 'S'
      if (isRegularBotPlay || isDummyPlayedByBot) actingPos = leader
    }
    
    if (!actingPos) return

    // 3-4 second thinking delay for bots
    const baseDelay = difficulty === 'easy' ? 2500 : difficulty === 'medium' ? 2000 : 1200
    const jitter = Math.random() * 1500
    const delay = baseDelay + jitter

    setBotThinking(true)
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      setBotThinking(false)
      setGame(prev => {
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))
        if (ng.phase === 'bidding') {
          processBid(ng, getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability))
        } else if (ng.phase === 'playing') {
          const player = ng.currentLeader
          const card = getBotCardPlay(ng.hands[player], ng.currentTrick, ng.contract?.denomination === 'NT' ? null : ng.contract?.denomination, ng.contract, player, ng.trickHistory)
          processPlay(ng, player, card)
        }
        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(() => {
    if (!game || game.phase === 'complete') return
    const isBotBidTurn = game.phase === 'bidding' && game.currentBidder !== 'S'
    const isBotPlayTurn = game.phase === 'playing' && (
      (game.currentLeader !== 'S' && game.currentLeader !== game.dummy) ||
      (game.currentLeader === game.dummy && game.contract?.declarer !== 'S')
    )
    if (isBotBidTurn || isBotPlayTurn) doBotAction(game)
    return () => { clearTimeout(botTimer.current); setBotThinking(false) }
  }, [game, doBotAction])

  function startGame() {
    setGame(createBridgeGame(gameMode, 'S', difficulty, { N:'Alex', E:'Sam', W:'Jordan' }))
    setScreen('game')
    setSelectedCard(null)
    setBotThinking(false)
  }

  function handleBid(lv, dn) {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    clearTimeout(botTimer.current)
    setBotThinking(false)
    setGame(prev => { const ng = JSON.parse(JSON.stringify(prev)); processBid(ng, { level:lv, denomination:dn, type:'bid' }); return ng })
  }

  function handlePass() {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    clearTimeout(botTimer.current)
    setBotThinking(false)
    setGame(prev => { const ng = JSON.parse(JSON.stringify(prev)); processBid(ng, { type:'pass', level:0, denomination:'PASS' }); return ng })
  }

  function handleCardClick(card, fromDummy) {
    if (!game || game.phase !== 'playing') return
    const isDummyPlay = fromDummy && game.contract?.declarer === 'S' && game.currentLeader === game.dummy
    if (!isDummyPlay && game.currentLeader !== 'S') return
    const player = isDummyPlay ? game.dummy : 'S'
    const hand = game.hands[player]
    const legal = getLegalCards(hand, game.currentTrick, game.contract?.denomination === 'NT' ? null : game.contract?.denomination)
    if (!legal.some(c => c.id === card.id)) return
    clearTimeout(botTimer.current)
    setBotThinking(false)
    setGame(prev => { const ng = JSON.parse(JSON.stringify(prev)); processPlay(ng, player, card); return ng })
    setSelectedCard(null)
  }

  // ── Menu ──────────────────────────────────────────────────────────
  if (screen === 'menu') return (
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
            {[{id:'rubber',name:'Rubber Bridge',desc:'Classic casual play'},{id:'duplicate',name:'Duplicate Bridge',desc:'Competitive scoring'}].map(m => (
              <div key={m.id} onClick={() => setGameMode(m.id)} style={{ background: gameMode===m.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${gameMode===m.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:3 }}>{m.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Bot Difficulty</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'easy',name:'Easy',desc:'Thinking: ~4s'},{id:'medium',name:'Medium',desc:'Thinking: ~3s'},{id:'hard',name:'Hard',desc:'Thinking: ~2s',plus:true}].map(d => (
              <div key={d.id} onClick={() => (!d.plus||isPlusUser) && setDifficulty(d.id)} style={{ background: difficulty===d.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${difficulty===d.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:(!d.plus||isPlusUser)?'pointer':'not-allowed', textAlign:'center', opacity:d.plus&&!isPlusUser?0.6:1, position:'relative' }}>
                {d.plus && !isPlusUser && <div style={{ position:'absolute', top:-8, right:-8, background:'var(--gold)', color:'var(--felt-dark)', fontSize:'0.58rem', fontWeight:700, padding:'2px 6px', borderRadius:10 }}>PLUS</div>}
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{d.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
          {!isPlusUser && <p style={{ fontSize:'0.72rem', color:'var(--gold)', marginTop:'0.4rem', textAlign:'center' }}><Link to="/upgrade" style={{ color:'var(--gold)' }}>Upgrade to Plus</Link> to unlock Hard</p>}
        </div>
        <button className="btn-gold" onClick={startGame} style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'0.85rem' }}>♠ Deal Cards</button>
        <Link to="/lobby" style={{ display:'block', textAlign:'center', marginTop:'0.9rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>← Back to Lobby</Link>
      </div>
    </div>
  )

  if (!game) return null

  const myHand = game.hands['S'] || []
  const isMyBidTurn = game.phase === 'bidding' && game.currentBidder === 'S'
  const isMyPlayTurn = game.phase === 'playing' && game.currentLeader === 'S'
  const isDeclarer = game.contract?.declarer === 'S'
  const isDummyTurn = game.phase === 'playing' && game.currentLeader === game.dummy && isDeclarer
  const legalCards = isMyPlayTurn ? getLegalCards(myHand, game.currentTrick, game.contract?.denomination === 'NT' ? null : game.contract?.denomination) : null
  const isMyTurn = isMyBidTurn || isMyPlayTurn || isDummyTurn

  const botName = p => p==='N' ? 'Alex' : p==='E' ? 'Sam' : 'Jordan'
  const currentName = game.phase==='bidding' ? (game.currentBidder==='S'?'You':botName(game.currentBidder)) : (game.currentLeader==='S'?'You':botName(game.currentLeader))

  return (
    <div style={{ paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', background:'#0f2219', overflow:'hidden' }}>

      {/* Result overlay */}
      {game.phase === 'complete' && game.scoring && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#234d38', border:'2px solid var(--gold)', borderRadius:18, padding:'2rem', textAlign:'center', maxWidth:380, width:'90%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made ? '🎉' : '😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.7rem', color:'var(--gold)', marginBottom:'0.4rem' }}>{game.scoring.made ? 'Contract Made!' : 'Contract Defeated!'}</h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.2rem' }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':game.contract.declarer}</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'0.5rem' }}>NS: {game.tricks.NS} tricks · EW: {game.tricks.EW} tricks</p>
            <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--gold)', margin:'0.75rem 0' }}>
              {game.scoring.made ? `NS +${game.scoring.declarerScore}` : `EW +${game.scoring.defenderScore}`} pts
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={() => setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:42, background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={() => setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.78rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'var(--gold)', fontWeight:700, fontSize:'0.95rem' }}>♠ Bridge</span>
          {game.contract && (
            <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.08)', color:'var(--cream)', padding:'2px 9px', borderRadius:20 }}>
              {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':game.contract.declarer}
              {isDeclarer ? ' · You play dummy too' : ''}
            </span>
          )}
        </div>
        <div style={{ fontSize:'0.78rem', fontWeight:600 }}>
          {isMyTurn
            ? <span style={{ color:'#5DCAA5' }}>🟢 {isDummyTurn ? 'Play from dummy' : 'Your turn'}</span>
            : botThinking
            ? <span style={{ color:'var(--gold)' }}>{currentName} is thinking <ThinkingDots /></span>
            : <span style={{ color:'var(--text-muted)' }}>{currentName}'s turn</span>
          }
        </div>
        <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.75rem' }}>
          <span style={{ color:'#5DCAA5' }}>NS: {game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW: {game.tricks.EW}</span>
          {game.contract && <span style={{ color:'var(--text-muted)' }}>Need {game.contract.tricksNeeded}</span>}
        </div>
      </div>

      {/* Main layout: table + right panel */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Game table — 3 row grid: North / Middle(W+Center+E) / South */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 12px', gap:8, overflow:'hidden', minWidth:0 }}>

          {/* NORTH */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
            <span style={{ fontSize:'0.62rem', color: game.contract?.declarer==='N' ? 'var(--gold)' : 'var(--text-muted)' }}>
              {botName('N')} (N) {game.contract?.declarer==='N' ? '★ Declarer' : game.dummy==='N' && game.dummyRevealed ? '— Dummy' : ''}
            </span>
            {game.dummy === 'N' && game.dummyRevealed
              ? <DummyCards hand={game.hands['N']} currentTrick={game.currentTrick} contract={game.contract} onPlay={c => handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='N'} />
              : <div style={{ display:'flex', gap:2 }}>{Array.from({length:Math.min(game.hands['N']?.length||13,10)}).map((_,i)=><BCard key={i} faceDown w={36} h={50} />)}</div>
            }
          </div>

          {/* MIDDLE ROW */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, overflow:'hidden', minHeight:0 }}>

            {/* WEST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, flexShrink:0 }}>
              <span style={{ fontSize:'0.58rem', color: game.contract?.declarer==='W' ? 'var(--gold)' : 'var(--text-muted)', writingMode:'vertical-rl', transform:'rotate(180deg)', marginBottom:4 }}>
                {botName('W')} (W)
              </span>
              {game.dummy === 'W' && game.dummyRevealed
                ? <DummyCards hand={game.hands['W']} currentTrick={game.currentTrick} contract={game.contract} onPlay={c => handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='W'} />
                : <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{Array.from({length:Math.min(game.hands['W']?.length||13,7)}).map((_,i)=><BCard key={i} faceDown w={36} h={50} />)}</div>
              }
            </div>

            {/* CENTER TABLE */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minWidth:0, overflow:'hidden' }}>

              {/* Bidding panel — top of center when it's your bid turn */}
              {game.phase === 'bidding' && isMyBidTurn && (
                <BidPanel auction={game.auction} onBid={handleBid} onPass={handlePass} />
              )}

              {game.phase === 'bidding' && !isMyBidTurn && botThinking && (
                <div style={{ textAlign:'center', padding:'8px 16px', background:'rgba(0,0,0,0.4)', borderRadius:8 }}>
                  <p style={{ fontSize:'0.8rem', color:'var(--gold)', marginBottom:4 }}>{botName(game.currentBidder)} is thinking...</p>
                  <ThinkingDots />
                </div>
              )}

              {/* Current trick — 4 card slots in compass layout */}
              <div style={{ position:'relative', width:170, height:140, flexShrink:0 }}>
                {['N','S','E','W'].map(p => {
                  const play = game.currentTrick.find(t => t.position === p)
                  const offsets = {
                    N:{top:0,left:'50%',transform:'translateX(-50%)'},
                    S:{bottom:0,left:'50%',transform:'translateX(-50%)'},
                    E:{right:0,top:'50%',transform:'translateY(-50%)'},
                    W:{left:0,top:'50%',transform:'translateY(-50%)'}
                  }
                  return (
                    <div key={p} style={{ position:'absolute', ...offsets[p] }}>
                      {play
                        ? <BCard card={play.card} w={44} h={62} />
                        : <div style={{ width:44, height:62, borderRadius:5, border:'1.5px dashed rgba(201,168,76,0.12)' }} />
                      }
                    </div>
                  )
                })}
              </div>

              {/* Contract info during play */}
              {game.phase === 'playing' && game.contract && (
                <div style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)', background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'5px 12px' }}>
                  <span style={{ color:'var(--cream)', fontWeight:600 }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]}</span>
                  {' '} — {game.contract.declarer==='S'?'You':botName(game.contract.declarer)} declares
                  {isDeclarer ? <span style={{ color:'var(--gold)', display:'block', fontSize:'0.7rem' }}>Click your cards AND dummy's cards to play</span> : ''}
                </div>
              )}
            </div>

            {/* EAST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, flexShrink:0 }}>
              <span style={{ fontSize:'0.58rem', color: game.contract?.declarer==='E' ? 'var(--gold)' : 'var(--text-muted)', writingMode:'vertical-rl', marginBottom:4 }}>
                {botName('E')} (E)
              </span>
              {game.dummy === 'E' && game.dummyRevealed
                ? <DummyCards hand={game.hands['E']} currentTrick={game.currentTrick} contract={game.contract} onPlay={c => handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='E'} />
                : <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{Array.from({length:Math.min(game.hands['E']?.length||13,7)}).map((_,i)=><BCard key={i} faceDown w={36} h={50} />)}</div>
              }
            </div>
          </div>

          {/* SOUTH — your hand */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:5, paddingBottom:6 }}>
            <span style={{ fontSize:'0.62rem', color: (isMyPlayTurn||isMyBidTurn) ? '#5DCAA5' : isDeclarer ? 'var(--gold)' : 'var(--text-muted)' }}>
              You (S) · {countHCP(myHand)} HCP
              {isDeclarer ? ' · ★ Declarer — play both hands' : ''}
              {isMyPlayTurn ? ' · Your turn to play' : ''}
              {isMyBidTurn ? ' · Your turn to bid' : ''}
            </span>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-end' }}>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                return (
                  <div key={suit} style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
                    <span style={{ fontSize:'0.85rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.55)' : SUIT_COLORS[suit], marginRight:2, alignSelf:'center', flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
                    <div style={{ display:'flex', gap:2 }}>
                      {cards.map(card => {
                        const isSelected = selectedCard?.id === card.id
                        const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
                        return (
                          <BCard
                            key={card.id}
                            card={card}
                            w={56} h={79}
                            selected={isSelected}
                            legal={isLegal ? undefined : false}
                            onClick={() => {
                              if (!isMyPlayTurn || !isLegal) return
                              if (isSelected) { handleCardClick(card); setSelectedCard(null) }
                              else setSelectedCard(card)
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {isMyPlayTurn && <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.3)' }}>Tap to select · Tap again to play</p>}
          </div>
        </div>

        {/* RIGHT PANEL — auction + hand info */}
        <div style={{ width:175, background:'rgba(0,0,0,0.35)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:8, flexShrink:0, overflow:'auto' }}>

          {/* Auction history */}
          <div>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Auction</p>
            <Auction auction={game.auction} dealer={game.dealer} />
          </div>

          {/* Tricks during play */}
          {game.phase === 'playing' && (
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
              <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Tricks won</p>
              <p style={{ fontSize:'0.85rem', color:'#5DCAA5', marginBottom:2 }}>NS: {game.tricks.NS}</p>
              <p style={{ fontSize:'0.85rem', color:'#c0392b', marginBottom:2 }}>EW: {game.tricks.EW}</p>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>Contract needs {game.contract?.tricksNeeded}</p>
            </div>
          )}

          {/* Your hand */}
          <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Your hand · {countHCP(myHand)} HCP</p>
            {['S','H','D','C'].map(suit => {
              const cards = myHand.filter(c => c.suit === suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
              if (!cards.length) return null
              return (
                <p key={suit} style={{ fontSize:'0.73rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit], marginBottom:2, lineHeight:1.4 }}>
                  {SUIT_SYMBOLS[suit]} {cards.map(c=>c.value).join(' ')}
                </p>
              )
            })}
          </div>

          {/* Vulnerability */}
          <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:8 }}>
            <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Vulnerability</p>
            <p style={{ fontSize:'0.72rem', color: game.vulnerability?.NS ? '#c0392b' : '#5DCAA5' }}>NS: {game.vulnerability?.NS ? 'Vul' : 'Not vul'}</p>
            <p style={{ fontSize:'0.72rem', color: game.vulnerability?.EW ? '#c0392b' : '#5DCAA5' }}>EW: {game.vulnerability?.EW ? 'Vul' : 'Not vul'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
