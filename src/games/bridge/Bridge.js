import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  SUITS, SUIT_SYMBOLS, SUIT_COLORS, DENOMINATIONS, DENOM_SYMBOLS, DENOM_COLORS,
  POSITIONS, PARTNERS, NEXT_PLAYER, VALUE_RANK,
  dealHands, countHCP, getBotBid, getBotCardPlay, isValidBid,
  isAuctionOver, getContract, getTrickWinner, calculateRubberScore,
  calculateDuplicateScore, createBridgeGame, getLegalCards
} from './BridgeEngine'

// ─── Card component ───────────────────────────────────────────────
function BCard({ card, selected, legal, onClick, size = 'md', faceDown }) {
  const sizes = { sm: [44, 62], md: [60, 84], lg: [72, 101] }
  const [W, H] = sizes[size]
  const fs = size === 'sm' ? 10 : size === 'md' ? 12 : 14
  const ss = size === 'sm' ? 20 : size === 'md' ? 26 : 32
  const notLegal = legal === false

  if (faceDown) return (
    <div style={{
      width: W, height: H, borderRadius: 6, flexShrink: 0,
      background: 'linear-gradient(135deg, #1a3a6a, #0f2245)',
      backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border: '1.5px solid rgba(255,255,255,0.2)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    }} />
  )

  if (!card) return null
  const col = SUIT_COLORS[card.suit]
  return (
    <div onClick={!notLegal && onClick ? onClick : undefined} style={{
      width: W, height: H, borderRadius: 6, flexShrink: 0,
      background: selected ? '#fffde7' : notLegal ? '#e8e8e8' : 'white',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.5),0 6px 16px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.25)',
      cursor: !notLegal && onClick ? 'pointer' : 'default',
      userSelect: 'none', position: 'relative',
      transform: selected ? 'translateY(-14px)' : 'none',
      transition: 'transform 0.15s',
      opacity: notLegal ? 0.4 : 1,
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
function AuctionTable({ auction, dealer }) {
  const positions = ['W','N','E','S']
  const dealerIdx = positions.indexOf(dealer)
  const padded = [...Array(dealerIdx).fill(null), ...auction]
  return (
    <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:10, padding:'8px', minWidth:180 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginBottom:4 }}>
        {['W','N','E','You'].map(p => (
          <div key={p} style={{ textAlign:'center', fontSize:'0.65rem', color:'rgba(245,240,232,0.5)', fontWeight:600 }}>{p}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {padded.map((bid, i) => {
          const col = bid && bid.type === 'bid' ? (DENOM_COLORS[bid.denomination] === '#1a1a2e' ? 'white' : DENOM_COLORS[bid.denomination]) : 'rgba(245,240,232,0.35)'
          return (
            <div key={i} style={{ textAlign:'center', padding:'2px 1px', borderRadius:3, fontSize:'0.75rem', fontWeight:500, background: bid ? 'rgba(255,255,255,0.07)' : 'transparent', color: col }}>
              {bid ? (bid.type==='pass' ? 'P' : bid.type==='double' ? 'X' : bid.type==='redouble' ? 'XX' : `${bid.level}${DENOM_SYMBOLS[bid.denomination]}`) : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bidding panel ────────────────────────────────────────────────
function BiddingPanel({ auction, onBid, onPass }) {
  const denomOrder = ['C','D','H','S','NT']
  const getLastBid = () => { for (let i=auction.length-1;i>=0;i--) if(auction[i].type==='bid') return auction[i]; return null }
  const last = getLastBid()
  const valid = (lv, dn) => { if (!last) return true; if (lv > last.level) return true; if (lv === last.level) return denomOrder.indexOf(dn) > denomOrder.indexOf(last.denomination); return false }

  return (
    <div style={{ background:'rgba(0,0,0,0.5)', borderRadius:12, padding:'12px', display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:'0.7rem', color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Your Bid</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:3 }}>
        {[1,2,3,4,5,6,7].flatMap(lv =>
          denomOrder.map(dn => {
            const ok = valid(lv, dn)
            const col = DENOM_COLORS[dn] === '#1a1a2e' ? (ok ? 'white' : 'rgba(255,255,255,0.2)') : (ok ? DENOM_COLORS[dn] : 'rgba(192,57,43,0.3)')
            return (
              <button key={`${lv}${dn}`} onClick={() => ok && onBid(lv, dn)} style={{
                width:38, height:32, borderRadius:5, border:`1px solid ${ok ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                background: ok ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                cursor: ok ? 'pointer' : 'not-allowed',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0,
              }}>
                <span style={{ fontSize:'0.65rem', color: ok ? 'rgba(245,240,232,0.8)' : 'rgba(255,255,255,0.15)', lineHeight:1.2 }}>{lv}</span>
                <span style={{ fontSize:'0.75rem', color:col, lineHeight:1.2, fontWeight:600 }}>{DENOM_SYMBOLS[dn]}</span>
              </button>
            )
          })
        )}
      </div>
      <button onClick={onPass} style={{ padding:'7px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'var(--cream)', borderRadius:6, cursor:'pointer', fontWeight:500, fontSize:'0.85rem' }}>
        Pass
      </button>
    </div>
  )
}

// ─── Horizontal hand (player's hand at bottom) ────────────────────
function HorizontalHand({ hand, selectedCard, onCardClick, legalCards, isMyTurn }) {
  if (!hand) return null
  const suits = ['S','H','D','C']
  // Group by suit, display inline with suit separator
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, flexWrap:'wrap', justifyContent:'center' }}>
      {suits.map((suit, si) => {
        const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        return (
          <div key={suit} style={{ display:'flex', alignItems:'flex-end', gap:2, marginRight: si < 3 ? 8 : 0 }}>
            <div style={{ display:'flex', gap:2 }}>
              {cards.map(card => {
                const isSelected = selectedCard?.id === card.id
                const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
                return (
                  <BCard
                    key={card.id}
                    card={card}
                    selected={isSelected}
                    legal={isLegal ? undefined : false}
                    size="md"
                    onClick={() => isMyTurn && isLegal && onCardClick && onCardClick(card)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dummy hand (shown face up, horizontal) ───────────────────────
function DummyHand({ hand, currentTrick, contract, currentLeader, onCardClick, isDeclarerTurn }) {
  if (!hand) return null
  const suits = ['S','H','D','C']
  const legalCards = isDeclarerTurn ? getLegalCards(hand, currentTrick, contract?.denomination === 'NT' ? null : contract?.denomination) : null

  return (
    <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
      {suits.map(suit => {
        const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
        if (!cards.length) return null
        return (
          <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:'0.8rem', color:SUIT_COLORS[suit] === '#1a1a2e' ? 'white' : SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</span>
            <div style={{ display:'flex', gap:1 }}>
              {cards.map(card => {
                const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
                return (
                  <BCard
                    key={card.id}
                    card={card}
                    legal={isLegal ? undefined : false}
                    size="sm"
                    onClick={() => isDeclarerTurn && isLegal && onCardClick && onCardClick(card)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Side hand (face down, vertical) ─────────────────────────────
function SideHand({ count = 13 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      {Array.from({length: Math.min(count, 8)}).map((_,i) => <BCard key={i} faceDown size="sm" />)}
      {count > 8 && <div style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', textAlign:'center' }}>+{count-8}</div>}
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
  const [message, setMessage] = useState('')
  const botTimerRef = useRef(null)
  const isPlusUser = profile?.plan === 'plus' || profile?.plan === 'club'

  function processBid(ng, bid) {
    ng.auction.push({ ...bid, position: ng.currentBidder })
    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) { ng.phase = 'complete'; return }
      ng.contract = contract
      ng.dummy = PARTNERS[contract.declarer]
      ng.phase = 'playing'
      const positions = ['S','W','N','E']
      const idx = positions.indexOf(contract.declarer)
      ng.currentLeader = positions[(idx + 1) % 4]
      ng.dummyRevealed = false
    } else {
      const positions = ['S','W','N','E']
      const idx = positions.indexOf(ng.currentBidder)
      ng.currentBidder = positions[(idx + 1) % 4]
    }
  }

  function processCardPlay(ng, player, card) {
    ng.hands[player] = ng.hands[player].filter(c => c.id !== card.id)
    ng.currentTrick.push({ position: player, card })
    if (!ng.dummyRevealed && ng.currentTrick.length === 1) ng.dummyRevealed = true

    if (ng.currentTrick.length === 4) {
      const winner = getTrickWinner(ng.currentTrick, ng.contract.denomination === 'NT' ? null : ng.contract.denomination)
      const wPos = winner.position
      const wSide = (wPos==='N'||wPos==='S') ? 'NS' : 'EW'
      ng.tricks[wSide]++
      ng.trickHistory.push({ trick:[...ng.currentTrick], winner:wPos })
      ng.currentTrick = []
      ng.currentLeader = wPos
      const total = ng.tricks.NS + ng.tricks.EW
      if (total === 13) {
        const declSide = (ng.contract.declarer==='N'||ng.contract.declarer==='S') ? 'NS' : 'EW'
        const scoring = ng.mode === 'rubber'
          ? calculateRubberScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
          : calculateDuplicateScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
        ng.phase = 'complete'
        ng.scoring = scoring
      }
    } else {
      ng.currentLeader = NEXT_PLAYER[player]
    }
  }

  const doBotAction = useCallback((g) => {
    if (!g) return
    const pos = g.phase === 'bidding' ? g.currentBidder : g.currentLeader
    if (!pos || pos === 'S') return
    // Declarer plays dummy too
    if (g.phase === 'playing' && g.dummy === pos && g.contract) {
      const declarer = g.contract.declarer
      if (declarer === 'S') return // Human declarer plays dummy
    }
    clearTimeout(botTimerRef.current)
    const delay = difficulty === 'easy' ? 1400 : difficulty === 'medium' ? 900 : 500
    botTimerRef.current = setTimeout(() => {
      setGame(prev => {
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))
        if (ng.phase === 'bidding') {
          const bid = getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability)
          processBid(ng, bid)
        } else if (ng.phase === 'playing') {
          const player = ng.currentLeader
          const hand = ng.hands[player]
          const card = getBotCardPlay(hand, ng.currentTrick, ng.contract?.denomination === 'NT' ? null : ng.contract?.denomination, ng.contract, player, ng.trickHistory)
          processCardPlay(ng, player, card)
        }
        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(() => {
    if (!game) return
    const needsBot = game.phase === 'bidding'
      ? game.currentBidder !== 'S'
      : game.phase === 'playing' && (game.currentLeader !== 'S' || (game.dummy === 'S' && game.contract?.declarer !== 'S'))
    if (needsBot) doBotAction(game)
    return () => clearTimeout(botTimerRef.current)
  }, [game, doBotAction])

  function startGame() {
    const g = createBridgeGame(gameMode, 'S', difficulty, { N:'Alex', E:'Sam', W:'Jordan' })
    setGame(g)
    setScreen('game')
    setMessage(g.dealer === 'S' ? 'You deal. Your bid.' : `${g.dealer} deals. ${g.dealer === g.currentBidder ? g.dealer : g.currentBidder} bids first.`)
  }

  function handleBid(level, denom) {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processBid(ng, { level, denomination: denom, type: 'bid' })
      return ng
    })
  }

  function handlePass() {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processBid(ng, { type: 'pass', level: 0, denomination: 'PASS' })
      return ng
    })
  }

  function handleCardClick(card, fromDummy = false) {
    if (!game || game.phase !== 'playing') return
    // Player plays from their own hand OR from dummy if they're declarer
    const isDeclarerPlayingDummy = fromDummy && game.contract?.declarer === 'S' && game.currentLeader === game.dummy
    if (!isDeclarerPlayingDummy && game.currentLeader !== 'S') return

    const player = isDeclarerPlayingDummy ? game.dummy : 'S'
    const hand = game.hands[player]
    const legal = getLegalCards(hand, game.currentTrick, game.contract?.denomination === 'NT' ? null : game.contract?.denomination)
    if (!legal.some(c => c.id === card.id)) return

    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processCardPlay(ng, player, card)
      return ng
    })
    setSelectedCard(null)
  }

  // ── Menu ──
  if (screen === 'menu') return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem 1.5rem' }}>
      <div style={{ maxWidth:520, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>♠</div>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'2.2rem', color:'var(--cream)', marginBottom:'0.5rem' }}>Bridge</h1>
          <p style={{ color:'var(--text-muted)' }}>The ultimate card game. Play against bots or real opponents.</p>
        </div>
        <div style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>Game Type</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {[{id:'rubber',name:'Rubber Bridge',desc:'Classic casual play'},{id:'duplicate',name:'Duplicate Bridge',desc:'Competitive scoring'}].map(m => (
              <div key={m.id} onClick={() => setGameMode(m.id)} style={{ background: gameMode===m.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${gameMode===m.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:12, padding:'1rem', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{m.name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'2rem' }}>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>Bot Difficulty</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'easy',name:'Easy',desc:'Learning'},{id:'medium',name:'Medium',desc:'Casual'},{id:'hard',name:'Hard',desc:'Challenge',plus:true}].map(d => (
              <div key={d.id} onClick={() => (!d.plus || isPlusUser) && setDifficulty(d.id)} style={{ background: difficulty===d.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)', border:`2px solid ${difficulty===d.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius:12, padding:'1rem', cursor:(!d.plus||isPlusUser)?'pointer':'not-allowed', textAlign:'center', opacity:d.plus&&!isPlusUser?0.6:1, position:'relative' }}>
                {d.plus && !isPlusUser && <div style={{ position:'absolute', top:-8, right:-8, background:'var(--gold)', color:'var(--felt-dark)', fontSize:'0.6rem', fontWeight:700, padding:'2px 6px', borderRadius:10 }}>PLUS</div>}
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{d.name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
          {!isPlusUser && <p style={{ fontSize:'0.75rem', color:'var(--gold)', marginTop:'0.5rem', textAlign:'center' }}><Link to="/upgrade" style={{ color:'var(--gold)' }}>Upgrade to Plus</Link> to unlock Hard</p>}
        </div>
        <button className="btn-gold" onClick={startGame} style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'0.9rem' }}>♠ Deal Cards</button>
        <Link to="/lobby" style={{ display:'block', textAlign:'center', marginTop:'1rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>← Back to Lobby</Link>
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

  const statusMsg = game.phase === 'bidding'
    ? (isMyBidTurn ? '🟢 Your bid' : `Waiting for ${game.currentBidder === 'N' ? 'Alex' : game.currentBidder === 'E' ? 'Sam' : 'Jordan'}...`)
    : game.phase === 'playing'
    ? (isMyPlayTurn ? '🟢 Your turn to play' : isDummyTurn ? '🟢 Play from dummy' : `Waiting for ${game.currentLeader === 'N' ? 'Alex' : game.currentLeader === 'E' ? 'Sam' : 'Jordan'}...`)
    : ''

  return (
    <div style={{ paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', background:'#0f2219', overflow:'hidden' }}>

      {/* Result overlay */}
      {game.phase === 'complete' && game.scoring && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--felt-light)', border:'2px solid var(--gold)', borderRadius:20, padding:'2.5rem', textAlign:'center', maxWidth:400, width:'90%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made ? '🎉' : '😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem', color:'var(--gold)', marginBottom:'0.5rem' }}>
              {game.scoring.made ? 'Contract Made!' : 'Contract Defeated!'}
            </h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.25rem' }}>
              {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer === 'S' ? 'You' : game.contract.declarer}
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'0.5rem' }}>NS: {game.tricks.NS} tricks · EW: {game.tricks.EW} tricks</p>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--gold)', margin:'1rem 0' }}>
              {game.scoring.made ? `+${game.scoring.declarerScore}` : `-${game.scoring.defenderScore}`} points
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={() => setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 1rem', background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0, gap:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display', serif", color:'var(--gold)', fontWeight:700, fontSize:'0.95rem' }}>♠ Bridge</span>
          {game.contract && (
            <span style={{ fontSize:'0.75rem', color:'var(--cream)', background:'rgba(255,255,255,0.1)', padding:'2px 10px', borderRadius:20 }}>
              {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer === 'S' ? 'You' : game.contract.declarer}
              {game.contract.doubled ? ' Dbl' : ''}
            </span>
          )}
        </div>
        <div style={{ fontSize:'0.8rem', fontWeight:500, color: (isMyBidTurn||isMyPlayTurn||isDummyTurn) ? 'var(--green-accent)' : 'var(--text-muted)' }}>
          {statusMsg}
        </div>
        <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.8rem' }}>
          <span style={{ color:'var(--green-accent)' }}>NS ♠: {game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW ♥: {game.tricks.EW}</span>
        </div>
      </div>

      {/* Game table */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', gap:'0' }}>

        {/* Main table */}
        <div style={{ flex:1, display:'grid', gridTemplateRows:'auto 1fr auto', gridTemplateColumns:'auto 1fr auto', gap:'8px', padding:'12px', overflow:'hidden' }}>

          {/* North label + hand */}
          <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
              Alex (N) {game.contract?.declarer === 'N' ? '— Declarer' : game.dummy === 'N' && game.dummyRevealed ? '— Dummy' : ''}
            </div>
            {game.dummy === 'N' && game.dummyRevealed
              ? <DummyHand hand={game.hands['N']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onCardClick={(c) => handleCardClick(c, true)} isDeclarerTurn={isDummyTurn && game.currentLeader === 'N'} />
              : <div style={{ display:'flex', gap:2 }}>{Array.from({length: Math.min(game.hands['N']?.length||13,10)}).map((_,i) => <BCard key={i} faceDown size="sm" />)}</div>
            }
          </div>

          {/* West */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>Jordan (W)</div>
            {game.dummy === 'W' && game.dummyRevealed
              ? <DummyHand hand={game.hands['W']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onCardClick={(c) => handleCardClick(c, true)} isDeclarerTurn={isDummyTurn && game.currentLeader === 'W'} />
              : <SideHand count={game.hands['W']?.length || 13} />
            }
          </div>

          {/* Center */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
            {/* Current trick */}
            <div style={{ position:'relative', width:200, height:160, flexShrink:0 }}>
              {['N','S','E','W'].map(pos => {
                const play = game.currentTrick.find(t => t.position === pos)
                const offsets = {
                  N: { top:0, left:'50%', transform:'translateX(-50%)' },
                  S: { bottom:0, left:'50%', transform:'translateX(-50%)' },
                  E: { right:0, top:'50%', transform:'translateY(-50%)' },
                  W: { left:0, top:'50%', transform:'translateY(-50%)' }
                }
                return (
                  <div key={pos} style={{ position:'absolute', ...offsets[pos] }}>
                    {play
                      ? <BCard card={play.card} size="sm" />
                      : <div style={{ width:44, height:62, borderRadius:5, border:'1.5px dashed rgba(201,168,76,0.15)' }} />
                    }
                  </div>
                )
              })}
            </div>

            {/* Auction or contract info */}
            {game.phase === 'bidding' && <AuctionTable auction={game.auction} dealer={game.dealer} />}
            {game.phase === 'playing' && game.contract && (
              <div style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                <div style={{ color:'var(--cream)', fontWeight:600, marginBottom:2 }}>
                  {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} contract
                </div>
                <div>Need {game.contract.tricksNeeded} tricks</div>
              </div>
            )}
          </div>

          {/* East */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', writingMode:'vertical-rl' }}>Sam (E)</div>
            {game.dummy === 'E' && game.dummyRevealed
              ? <DummyHand hand={game.hands['E']} currentTrick={game.currentTrick} contract={game.contract} currentLeader={game.currentLeader} onCardClick={(c) => handleCardClick(c, true)} isDeclarerTurn={isDummyTurn && game.currentLeader === 'E'} />
              : <SideHand count={game.hands['E']?.length || 13} />
            }
          </div>

          {/* South — player's hand */}
          <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ fontSize:'0.7rem', color: isMyPlayTurn ? 'var(--green-accent)' : 'var(--text-muted)' }}>
              You (S) · HCP: {countHCP(myHand)} {isMyPlayTurn ? '— Your turn' : isDeclarer ? '— Declarer' : ''}
            </div>
            <HorizontalHand
              hand={myHand}
              selectedCard={selectedCard}
              onCardClick={handleCardClick}
              legalCards={legalCards}
              isMyTurn={isMyPlayTurn}
            />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width:200, background:'rgba(0,0,0,0.35)', borderLeft:'1px solid rgba(201,168,76,0.1)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'auto', padding:'8px' }}>
          {game.phase === 'bidding' && isMyBidTurn && (
            <BiddingPanel auction={game.auction} onBid={handleBid} onPass={handlePass} />
          )}
          {game.phase === 'bidding' && !isMyBidTurn && (
            <div style={{ padding:'1rem 0', textAlign:'center' }}>
              <AuctionTable auction={game.auction} dealer={game.dealer} />
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.75rem' }}>
                Waiting for {game.currentBidder === 'N' ? 'Alex' : game.currentBidder === 'E' ? 'Sam' : 'Jordan'}...
              </p>
            </div>
          )}
          {game.phase === 'playing' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <AuctionTable auction={game.auction} dealer={game.dealer} />
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px', fontSize:'0.8rem' }}>
                <p style={{ color:'var(--text-muted)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Tricks won</p>
                <p style={{ color:'var(--green-accent)' }}>NS: {game.tricks.NS}</p>
                <p style={{ color:'#c0392b' }}>EW: {game.tricks.EW}</p>
                <p style={{ color:'var(--text-muted)', marginTop:4, fontSize:'0.75rem' }}>Need: {game.contract?.tricksNeeded}</p>
              </div>
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px', fontSize:'0.75rem' }}>
                <p style={{ color:'var(--text-muted)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Your hand</p>
                {['S','H','D','C'].map(suit => (
                  <p key={suit} style={{ color: SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(245,240,232,0.8)' : SUIT_COLORS[suit] }}>
                    {SUIT_SYMBOLS[suit]} {myHand.filter(c=>c.suit===suit).map(c=>c.value).join(' ')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
