import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  SUIT_SYMBOLS, SUIT_COLORS, DENOMINATIONS, DENOM_SYMBOLS, DENOM_COLORS,
  PARTNERS, NEXT_PLAYER, VALUE_RANK,
  dealHands, countHCP, getBotBid, getBotCardPlay,
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

// ─── Auction ──────────────────────────────────────────────────────
function Auction({ auction, dealer }) {
  const pos = ['W','N','E','S']
  const pad = [...Array(pos.indexOf(dealer)).fill(null), ...auction]
  return (
    <div style={{ background:'rgba(0,0,0,0.5)', borderRadius:8, padding:8, minWidth:160 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginBottom:3 }}>
        {['W','N','E','You'].map(p => <div key={p} style={{ textAlign:'center', fontSize:'0.6rem', color:'rgba(245,240,232,0.45)', fontWeight:600 }}>{p}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {pad.map((b, i) => {
          const col = b && b.type === 'bid' ? (DENOM_COLORS[b.denomination] === '#1a1a2e' ? 'white' : DENOM_COLORS[b.denomination]) : 'rgba(245,240,232,0.3)'
          return (
            <div key={i} style={{ textAlign:'center', padding:'2px 1px', borderRadius:3, fontSize:'0.7rem', fontWeight:500, background: b ? 'rgba(255,255,255,0.06)' : 'transparent', color:col }}>
              {b ? (b.type==='pass' ? 'P' : b.type==='double' ? 'X' : `${b.level}${DENOM_SYMBOLS[b.denomination]}`) : ''}
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
  const ok = (lv, d) => { if (!last) return true; if (lv > last.level) return true; if (lv === last.level) return dn.indexOf(d) > dn.indexOf(last.denomination); return false }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <p style={{ fontSize:'0.65rem', color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Make a Bid</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:2 }}>
        {[1,2,3,4,5,6,7].flatMap(lv => dn.map(d => {
          const valid = ok(lv, d)
          const tc = d === 'NT' ? (valid ? 'rgba(100,160,255,0.9)' : 'rgba(100,160,255,0.2)') : (DENOM_COLORS[d] === '#1a1a2e' ? (valid ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)') : (valid ? DENOM_COLORS[d] : 'rgba(192,57,43,0.25)'))
          return (
            <button key={`${lv}${d}`} onClick={() => valid && onBid(lv, d)} style={{
              width:'100%', height:30, borderRadius:4,
              border:`1px solid ${valid ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)'}`,
              background: valid ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
              cursor: valid ? 'pointer' : 'not-allowed',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:'0.6rem', color: valid ? 'rgba(245,240,232,0.7)' : 'rgba(255,255,255,0.12)', lineHeight:1.1 }}>{lv}</span>
              <span style={{ fontSize:'0.7rem', color:tc, lineHeight:1.1, fontWeight:700 }}>{DENOM_SYMBOLS[d]}</span>
            </button>
          )
        }))}
      </div>
      <button onClick={onPass} style={{ padding:'6px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'var(--cream)', borderRadius:5, cursor:'pointer', fontWeight:500, fontSize:'0.8rem' }}>Pass</button>
    </div>
  )
}

// ─── Dummy face-up hand ───────────────────────────────────────────
function DummyCards({ hand, currentTrick, contract, currentLeader, onPlay, canPlay }) {
  if (!hand) return null
  const legalCards = canPlay ? getLegalCards(hand, currentTrick, contract?.denomination === 'NT' ? null : contract?.denomination) : null
  return (
    <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
      {['S','H','D','C'].map(suit => {
        const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        return (
          <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ fontSize:'0.75rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.7)' : SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</span>
            <div style={{ display:'flex', gap:1 }}>
              {cards.map(c => {
                const isLegal = !legalCards || legalCards.some(x => x.id === c.id)
                return <BCard key={c.id} card={c} w={42} h={59} legal={isLegal ? undefined : false} onClick={() => canPlay && isLegal && onPlay(c)} />
              })}
            </div>
          </div>
        )
      })}
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
    if (!g) return
    const pos = g.phase === 'bidding' ? g.currentBidder : g.currentLeader
    if (!pos || pos === 'S') return
    if (g.phase === 'playing' && g.dummy === pos && g.contract?.declarer === 'S') return
    clearTimeout(botTimer.current)
    const delay = difficulty === 'easy' ? 1400 : difficulty === 'medium' ? 900 : 500
    botTimer.current = setTimeout(() => {
      setGame(prev => {
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))
        if (ng.phase === 'bidding') {
          processBid(ng, getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability))
        } else if (ng.phase === 'playing') {
          const card = getBotCardPlay(ng.hands[ng.currentLeader], ng.currentTrick, ng.contract?.denomination === 'NT' ? null : ng.contract?.denomination, ng.contract, ng.currentLeader, ng.trickHistory)
          processPlay(ng, ng.currentLeader, card)
        }
        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(() => {
    if (!game) return
    const isBotTurn = game.phase === 'bidding' ? game.currentBidder !== 'S' : game.phase === 'playing' && (game.currentLeader !== 'S' && !(game.contract?.declarer === 'S' && game.currentLeader === game.dummy))
    if (isBotTurn) doBotAction(game)
    return () => clearTimeout(botTimer.current)
  }, [game, doBotAction])

  function startGame() {
    setGame(createBridgeGame(gameMode, 'S', difficulty, { N:'Alex', E:'Sam', W:'Jordan' }))
    setScreen('game')
    setSelectedCard(null)
  }

  function handleBid(lv, dn) {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    setGame(prev => { const ng = JSON.parse(JSON.stringify(prev)); processBid(ng, { level:lv, denomination:dn, type:'bid' }); return ng })
  }

  function handlePass() {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
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
    setGame(prev => { const ng = JSON.parse(JSON.stringify(prev)); processPlay(ng, player, card); return ng })
    setSelectedCard(null)
  }

  // ── Menu ──────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem' }}>
      <div style={{ maxWidth:500, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem' }}>♠</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'var(--cream)', margin:'0.5rem 0' }}>Bridge</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>The ultimate card game. Play against bots or real opponents.</p>
        </div>
        <div style={{ marginBottom:'1.25rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Game Type</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {[{id:'rubber',name:'Rubber Bridge',desc:'Classic casual play'},{id:'duplicate',name:'Duplicate Bridge',desc:'Competitive scoring'}].map(m => (
              <div key={m.id} onClick={() => setGameMode(m.id)} style={{ background: gameMode===m.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${gameMode===m.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:3, fontSize:'0.95rem' }}>{m.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Bot Difficulty</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'easy',name:'Easy',desc:'Learning'},{id:'medium',name:'Medium',desc:'Casual'},{id:'hard',name:'Hard',desc:'Challenge',plus:true}].map(d => (
              <div key={d.id} onClick={() => (!d.plus||isPlusUser) && setDifficulty(d.id)} style={{ background: difficulty===d.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${difficulty===d.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:(!d.plus||isPlusUser)?'pointer':'not-allowed', textAlign:'center', opacity:d.plus&&!isPlusUser?0.6:1, position:'relative' }}>
                {d.plus && !isPlusUser && <div style={{ position:'absolute', top:-8, right:-8, background:'var(--gold)', color:'var(--felt-dark)', fontSize:'0.58rem', fontWeight:700, padding:'2px 6px', borderRadius:10 }}>PLUS</div>}
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:2, fontSize:'0.95rem' }}>{d.name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{d.desc}</div>
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

  const botName = (p) => p === 'N' ? (game.botNames?.N||'Alex') : p === 'E' ? (game.botNames?.E||'Sam') : (game.botNames?.W||'Jordan')
  const currentTurnName = game.phase === 'bidding' ? (game.currentBidder === 'S' ? 'You' : botName(game.currentBidder)) : game.phase === 'playing' ? (game.currentLeader === 'S' ? 'You' : botName(game.currentLeader)) : ''
  const isMyTurn = isMyBidTurn || isMyPlayTurn || isDummyTurn

  // ── Game screen ───────────────────────────────────────────────────
  return (
    <div style={{ paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', background:'#0f2219', overflow:'hidden' }}>

      {/* Result */}
      {game.phase === 'complete' && game.scoring && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#234d38', border:'2px solid var(--gold)', borderRadius:18, padding:'2rem', textAlign:'center', maxWidth:380, width:'90%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made ? '🎉' : '😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.7rem', color:'var(--gold)', marginBottom:'0.5rem' }}>{game.scoring.made ? 'Contract Made!' : 'Contract Defeated!'}</h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.2rem' }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':game.contract.declarer}</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>NS: {game.tricks.NS} · EW: {game.tricks.EW}</p>
            <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--gold)', margin:'0.75rem 0' }}>{game.scoring.made ? `+${game.scoring.declarerScore}` : `-${game.scoring.defenderScore}`} pts</div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={() => setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:44, background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={() => setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'var(--gold)', fontWeight:700 }}>♠ Bridge</span>
          {game.contract && <span style={{ fontSize:'0.72rem', background:'rgba(255,255,255,0.08)', color:'var(--cream)', padding:'2px 9px', borderRadius:20 }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'You':game.contract.declarer}</span>}
        </div>
        <span style={{ fontSize:'0.8rem', color: isMyTurn ? '#5DCAA5' : 'var(--text-muted)', fontWeight: isMyTurn ? 600 : 400 }}>
          {isMyTurn ? (isDummyTurn ? '🟢 Play from dummy' : '🟢 Your turn') : `⏳ ${currentTurnName}'s turn`}
        </span>
        <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.78rem' }}>
          <span style={{ color:'#5DCAA5' }}>NS: {game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW: {game.tricks.EW}</span>
          {game.contract && <span style={{ color:'var(--text-muted)' }}>Need: {game.contract.tricksNeeded}</span>}
        </div>
      </div>

      {/* TABLE — fixed height layout, no scrolling */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left: game table */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 12px 8px 12px', gap:6, overflow:'hidden', minWidth:0 }}>

          {/* NORTH */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
            <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>
              {botName('N')} (N) {game.contract?.declarer==='N' ? '— Declarer' : game.dummy==='N' && game.dummyRevealed ? '— Dummy' : ''}
            </span>
            {game.dummy === 'N' && game.dummyRevealed
              ? <DummyCards hand={game.hands['N']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onPlay={(c) => handleCardClick(c, true)} canPlay={isDummyTurn && game.currentLeader==='N'} />
              : <div style={{ display:'flex', gap:2 }}>{Array.from({length:Math.min(game.hands['N']?.length||13,10)}).map((_,i)=><BCard key={i} faceDown w={38} h={53} />)}</div>
            }
          </div>

          {/* MIDDLE ROW */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, overflow:'hidden', minHeight:0 }}>

            {/* WEST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
              <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', writingMode:'vertical-rl', transform:'rotate(180deg)', marginBottom:4 }}>{botName('W')} (W)</span>
              {game.dummy === 'W' && game.dummyRevealed
                ? <DummyCards hand={game.hands['W']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onPlay={(c) => handleCardClick(c, true)} canPlay={isDummyTurn && game.currentLeader==='W'} />
                : <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{Array.from({length:Math.min(game.hands['W']?.length||13,7)}).map((_,i)=><BCard key={i} faceDown w={38} h={53} />)}</div>
              }
            </div>

            {/* CENTER */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minWidth:0 }}>

              {/* Trick */}
              <div style={{ position:'relative', width:180, height:150, flexShrink:0 }}>
                {['N','S','E','W'].map(p => {
                  const play = game.currentTrick.find(t => t.position === p)
                  const pos = { N:{top:0,left:'50%',transform:'translateX(-50%)'}, S:{bottom:0,left:'50%',transform:'translateX(-50%)'}, E:{right:0,top:'50%',transform:'translateY(-50%)'}, W:{left:0,top:'50%',transform:'translateY(-50%)'} }
                  return (
                    <div key={p} style={{ position:'absolute', ...pos[p] }}>
                      {play ? <BCard card={play.card} w={44} h={62} /> : <div style={{ width:44, height:62, borderRadius:5, border:'1.5px dashed rgba(201,168,76,0.15)' }} />}
                    </div>
                  )
                })}
              </div>

              {/* Auction */}
              <Auction auction={game.auction} dealer={game.dealer} />

              {/* Bidding or status */}
              {game.phase === 'bidding' && isMyBidTurn && (
                <BidPanel auction={game.auction} onBid={handleBid} onPass={handlePass} />
              )}
              {game.phase === 'bidding' && !isMyBidTurn && (
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center' }}>
                  Waiting for {botName(game.currentBidder)}...
                </p>
              )}
            </div>

            {/* EAST */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
              <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', writingMode:'vertical-rl', marginBottom:4 }}>{botName('E')} (E)</span>
              {game.dummy === 'E' && game.dummyRevealed
                ? <DummyCards hand={game.hands['E']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onPlay={(c) => handleCardClick(c, true)} canPlay={isDummyTurn && game.currentLeader==='E'} />
                : <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{Array.from({length:Math.min(game.hands['E']?.length||13,7)}).map((_,i)=><BCard key={i} faceDown w={38} h={53} />)}</div>
              }
            </div>
          </div>

          {/* SOUTH — your hand */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, paddingBottom:8 }}>
            <span style={{ fontSize:'0.65rem', color: isMyPlayTurn ? '#5DCAA5' : 'var(--text-muted)' }}>
              You (S) · {countHCP(myHand)} HCP {isDeclarer ? '— Declarer' : ''} {isMyPlayTurn ? '— Your turn' : ''}
            </span>
            {/* Hand grouped by suit horizontally */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-end' }}>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                return (
                  <div key={suit} style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
                    <span style={{ fontSize:'0.85rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.6)' : SUIT_COLORS[suit], marginRight:1, alignSelf:'center' }}>{SUIT_SYMBOLS[suit]}</span>
                    {cards.map(card => {
                      const isSelected = selectedCard?.id === card.id
                      const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
                      return (
                        <BCard
                          key={card.id}
                          card={card}
                          w={58} h={82}
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
                )
              })}
            </div>
            {isMyPlayTurn && <p style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.35)', marginTop:2 }}>Click card to select, click again to play</p>}
          </div>
        </div>

        {/* Right panel — info only */}
        <div style={{ width:170, background:'rgba(0,0,0,0.35)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflow:'auto' }}>
          {game.phase === 'playing' && (
            <>
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
                <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Tricks</p>
                <p style={{ fontSize:'0.85rem', color:'#5DCAA5' }}>NS: {game.tricks.NS} won</p>
                <p style={{ fontSize:'0.85rem', color:'#c0392b' }}>EW: {game.tricks.EW} won</p>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:3 }}>Need {game.contract?.tricksNeeded} to make</p>
              </div>
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
                <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Your cards</p>
                {['S','H','D','C'].map(suit => {
                  const cards = myHand.filter(c => c.suit === suit)
                  if (!cards.length) return null
                  return (
                    <p key={suit} style={{ fontSize:'0.75rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit], marginBottom:1 }}>
                      {SUIT_SYMBOLS[suit]} {cards.sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value]).map(c=>c.value).join(' ')}
                    </p>
                  )
                })}
              </div>
            </>
          )}
          {game.phase === 'bidding' && (
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:8 }}>
              <p style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Your hand</p>
              <p style={{ fontSize:'0.8rem', color:'var(--cream)', marginBottom:3 }}>HCP: {countHCP(myHand)}</p>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c => c.suit === suit)
                if (!cards.length) return null
                return (
                  <p key={suit} style={{ fontSize:'0.75rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit], marginBottom:1 }}>
                    {SUIT_SYMBOLS[suit]} {cards.sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value]).map(c=>c.value).join(' ')}
                  </p>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
