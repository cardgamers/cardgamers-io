import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  SUITS, SUIT_SYMBOLS, SUIT_COLORS, VALUES, VALUE_RANK,
  DENOMINATIONS, DENOM_SYMBOLS, DENOM_COLORS, POSITIONS, PARTNERS, NEXT_PLAYER,
  dealHands, sortCards, countHCP, getDistribution, isBalanced,
  getBotBid, getBotCardPlay, isValidBid, isAuctionOver, getContract,
  getTrickWinner, calculateRubberScore, calculateDuplicateScore, createBridgeGame,
  getLegalCards
} from './BridgeEngine'

const SEAT_LABELS = { S: 'You', N: 'Partner', E: 'East', W: 'West' }

// ─── Playing Card ─────────────────────────────────────────────────
function BridgeCard({ card, selected, legal, onClick, small, faceDown }) {
  const W = small ? 52 : 72
  const H = small ? 73 : 101

  if (faceDown) return (
    <div style={{
      width: W, height: H, borderRadius: 6,
      background: 'linear-gradient(135deg, #1a3a6a, #0f2245)',
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 10px)',
      border: '1.5px solid rgba(255,255,255,0.15)',
      flexShrink: 0,
    }} />
  )

  if (!card) return null
  const color = SUIT_COLORS[card.suit]
  const notLegal = legal === false

  return (
    <div onClick={!notLegal ? onClick : undefined} style={{
      width: W, height: H, borderRadius: 6,
      background: selected ? '#fffde7' : notLegal ? '#f0f0f0' : 'white',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.5), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
      cursor: !notLegal && onClick ? 'pointer' : 'default',
      userSelect: 'none', flexShrink: 0, position: 'relative',
      transform: selected ? 'translateY(-12px)' : 'none',
      transition: 'transform 0.15s',
      opacity: notLegal ? 0.45 : 1,
    }}>
      <div style={{ position: 'absolute', top: 3, left: 5, lineHeight: 1.1 }}>
        <div style={{ fontSize: small ? 10 : 13, fontWeight: 800, color, lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 10 : 12, color, lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: small ? 22 : 30, color, lineHeight: 1 }}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div style={{ position: 'absolute', bottom: 3, right: 5, transform: 'rotate(180deg)', lineHeight: 1.1 }}>
        <div style={{ fontSize: small ? 10 : 13, fontWeight: 800, color, lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 10 : 12, color, lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  )
}

// ─── Bid button ───────────────────────────────────────────────────
function BidButton({ level, denom, onClick, disabled, isSelected }) {
  const color = DENOM_COLORS[denom]
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 44, height: 36, borderRadius: 6,
      background: isSelected ? '#c9a84c' : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
      border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.08)' : isSelected ? '#c9a84c' : 'rgba(255,255,255,0.2)'}`,
      color: isSelected ? '#0f2219' : disabled ? 'rgba(255,255,255,0.2)' : 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.8rem', fontWeight: 600,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 1,
    }}>
      <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{level}</span>
      <span style={{ fontSize: '0.85rem', color: isSelected ? '#0f2219' : color, lineHeight: 1 }}>{DENOM_SYMBOLS[denom]}</span>
    </button>
  )
}

// ─── Auction display ──────────────────────────────────────────────
function AuctionBox({ auction, dealer }) {
  const positions = ['W', 'N', 'E', 'S']
  const dealerIdx = positions.indexOf(dealer)
  const paddedAuction = [...Array(dealerIdx).fill(null), ...auction]

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '0.75rem', minWidth: 200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, marginBottom: 4 }}>
        {positions.map(p => (
          <div key={p} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', fontWeight: 600, padding: '2px 0' }}>
            {p === 'S' ? 'You' : p}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
        {paddedAuction.map((bid, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '3px 2px', borderRadius: 4,
            fontSize: '0.8rem', fontWeight: 500,
            background: bid ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: bid
              ? bid.type === 'pass' ? 'rgba(245,240,232,0.4)'
              : DENOM_COLORS[bid.denomination] === '#1a1a2e' ? 'white' : DENOM_COLORS[bid.denomination]
              : 'transparent',
          }}>
            {bid
              ? bid.type === 'pass' ? 'Pass'
              : bid.type === 'double' ? 'X'
              : bid.type === 'redouble' ? 'XX'
              : `${bid.level}${DENOM_SYMBOLS[bid.denomination]}`
              : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Hand display ─────────────────────────────────────────────────
function HandDisplay({ hand, position, selectedCard, onCardClick, legalCards, isCurrentPlayer, faceDown, small, horizontal }) {
  if (!hand) return null

  const suits = ['S', 'H', 'D', 'C']

  if (faceDown) {
    const count = hand.length || 13
    return (
      <div style={{ display: 'flex', gap: horizontal ? '2px' : '0', flexDirection: horizontal ? 'row' : 'column' }}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <BridgeCard key={i} faceDown small={small} />
        ))}
        {count > 6 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, color: 'rgba(245,240,232,0.5)', fontSize: '0.75rem' }}>+{count-6}</div>}
      </div>
    )
  }

  // Organize by suit
  const bySuit = {}
  for (const suit of suits) {
    bySuit[suit] = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {suits.map(suit => (
        bySuit[suit].length > 0 && (
          <div key={suit} style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', color: SUIT_COLORS[suit], width: 18, flexShrink: 0 }}>{SUIT_SYMBOLS[suit]}</span>
            {bySuit[suit].map(card => {
              const isSelected = selectedCard?.id === card.id
              const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
              return (
                <BridgeCard
                  key={card.id}
                  card={card}
                  selected={isSelected}
                  legal={isLegal ? undefined : false}
                  onClick={() => isCurrentPlayer && isLegal && onCardClick && onCardClick(card)}
                  small={small}
                />
              )
            })}
          </div>
        )
      ))}
    </div>
  )
}

// ─── Main Bridge Game ─────────────────────────────────────────────
export default function Bridge() {
  const { profile } = useAuth()
  const [screen, setScreen] = useState('menu') // menu | game | result
  const [gameMode, setGameMode] = useState('rubber') // rubber | duplicate
  const [difficulty, setDifficulty] = useState('medium')
  const [game, setGame] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedBid, setSelectedBid] = useState(null)
  const [message, setMessage] = useState('')
  const [trickResult, setTrickResult] = useState(null)
  const [handResult, setHandResult] = useState(null)
  const botTimerRef = useRef(null)

  const isPlusUser = profile?.plan === 'plus' || profile?.plan === 'club'

  // ── Bot action ──
  const doBotAction = useCallback((g) => {
    if (!g) return
    const pos = g.phase === 'bidding' ? g.currentBidder : g.currentLeader
    if (!pos || pos === 'S') return // Human's turn

    clearTimeout(botTimerRef.current)
    const delay = difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 800 : 400

    botTimerRef.current = setTimeout(() => {
      setGame(prev => {
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))

        if (ng.phase === 'bidding') {
          const botBid = getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability)
          processBid(ng, botBid)
        } else if (ng.phase === 'playing') {
          const player = ng.currentLeader
          const hand = player === ng.dummy ? ng.hands[ng.dummy] : ng.hands[player]
          const legal = getLegalCards(hand, ng.currentTrick, ng.contract?.denomination)
          const card = getBotCardPlay(hand, ng.currentTrick, ng.contract?.denomination, ng.contract, player, ng.trickHistory)
          processCardPlay(ng, player, card)
        }

        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(() => {
    if (!game) return
    if (game.phase === 'bidding' && game.currentBidder !== 'S') {
      doBotAction(game)
    } else if (game.phase === 'playing' && game.currentLeader !== 'S') {
      doBotAction(game)
    }
    return () => clearTimeout(botTimerRef.current)
  }, [game, doBotAction])

  function processBid(ng, bid) {
    ng.auction.push({ ...bid, position: ng.currentBidder })

    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) {
        // All passed — redeal
        ng.phase = 'complete'
        setMessage('All passed — no contract. Redealing...')
        return
      }
      ng.contract = contract
      ng.dummy = PARTNERS[contract.declarer]
      ng.phase = 'playing'
      // Opening lead by defender to left of declarer
      const positions = ['S','W','N','E']
      const declarerIdx = positions.indexOf(contract.declarer)
      ng.currentLeader = positions[(declarerIdx + 1) % 4]
      ng.dummyRevealed = false
      setMessage(`Contract: ${contract.level}${DENOM_SYMBOLS[contract.denomination]} by ${contract.declarer === 'S' ? 'You' : contract.declarer}. ${ng.currentLeader === 'S' ? 'Your lead.' : `${ng.currentLeader} leads.`}`)
    } else {
      // Advance bidder
      const positions = ['S','W','N','E']
      const idx = positions.indexOf(ng.currentBidder)
      ng.currentBidder = positions[(idx + 1) % 4]
    }
  }

  function processCardPlay(ng, player, card) {
    // Remove card from hand
    ng.hands[player] = ng.hands[player].filter(c => c.id !== card.id)
    ng.currentTrick.push({ position: player, card })

    // Reveal dummy after opening lead
    if (!ng.dummyRevealed && ng.currentTrick.length === 1) {
      ng.dummyRevealed = true
    }

    if (ng.currentTrick.length === 4) {
      // Trick complete
      const winner = getTrickWinner(ng.currentTrick, ng.contract.denomination === 'NT' ? null : ng.contract.denomination)
      const winnerPos = winner.position
      const winnerSide = (winnerPos === 'N' || winnerPos === 'S') ? 'NS' : 'EW'
      ng.tricks[winnerSide]++
      ng.trickHistory.push({ trick: [...ng.currentTrick], winner: winnerPos })
      ng.currentTrick = []
      ng.currentLeader = winnerPos

      // Check if hand is complete
      const totalTricks = ng.tricks.NS + ng.tricks.EW
      if (totalTricks === 13) {
        // Hand complete
        const scoring = ng.mode === 'rubber'
          ? calculateRubberScore(ng.contract, ng.tricks[ng.contract.declarer === 'N' || ng.contract.declarer === 'S' ? 'NS' : 'EW'], ng.vulnerability)
          : calculateDuplicateScore(ng.contract, ng.tricks[ng.contract.declarer === 'N' || ng.contract.declarer === 'S' ? 'NS' : 'EW'], ng.vulnerability)

        ng.phase = 'complete'
        ng.scoring = scoring
      }
    } else {
      // Next player
      ng.currentLeader = NEXT_PLAYER[player]
    }
  }

  function startGame() {
    const botNames = { N: 'Alex', E: 'Sam', W: 'Jordan' }
    const g = createBridgeGame(gameMode, 'S', difficulty, botNames)
    setGame(g)
    setScreen('game')
    setMessage(`${g.dealer} deals. Bidding starts with ${g.dealer === 'S' ? 'You' : g.dealer}.`)
  }

  function handleBidClick(level, denom) {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    const bid = { level, denomination: denom, type: 'bid' }
    if (!isValidBid(bid, game.auction)) return

    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processBid(ng, bid)
      return ng
    })
    setSelectedBid(null)
  }

  function handlePass() {
    if (!game || game.phase !== 'bidding' || game.currentBidder !== 'S') return
    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processBid(ng, { type: 'pass', level: 0, denomination: 'PASS' })
      return ng
    })
  }

  function handleCardClick(card) {
    if (!game || game.phase !== 'playing') return
    if (game.currentLeader !== 'S') return

    const legal = getLegalCards(game.hands['S'], game.currentTrick, game.contract?.denomination === 'NT' ? null : game.contract?.denomination)
    if (!legal.some(c => c.id === card.id)) return

    setGame(prev => {
      const ng = JSON.parse(JSON.stringify(prev))
      processCardPlay(ng, 'S', card)
      return ng
    })
    setSelectedCard(null)
  }

  // ── Menu screen ──
  if (screen === 'menu') return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>♠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '0.5rem' }}>Bridge</h1>
          <p style={{ color: 'var(--text-muted)' }}>The ultimate card game. Play against bots or real opponents.</p>
        </div>

        {/* Game mode */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Game Type</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { id: 'rubber', name: 'Rubber Bridge', desc: 'Classic casual play' },
              { id: 'duplicate', name: 'Duplicate Bridge', desc: 'Competitive scoring' },
            ].map(m => (
              <div key={m.id} onClick={() => setGameMode(m.id)} style={{
                background: gameMode === m.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)',
                border: `2px solid ${gameMode === m.id ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 12, padding: '1rem', cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Bot Difficulty</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              { id: 'easy', name: 'Easy', desc: 'Learning' },
              { id: 'medium', name: 'Medium', desc: 'Casual' },
              { id: 'hard', name: 'Hard', desc: 'Challenge', plusOnly: true },
            ].map(d => (
              <div key={d.id} onClick={() => (!d.plusOnly || isPlusUser) && setDifficulty(d.id)} style={{
                background: difficulty === d.id ? 'rgba(201,168,76,0.15)' : 'var(--felt-light)',
                border: `2px solid ${difficulty === d.id ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 12, padding: '1rem', cursor: (!d.plusOnly || isPlusUser) ? 'pointer' : 'not-allowed',
                textAlign: 'center', opacity: d.plusOnly && !isPlusUser ? 0.6 : 1, position: 'relative',
              }}>
                {d.plusOnly && !isPlusUser && (
                  <div style={{ position: 'absolute', top: -8, right: -8, background: 'var(--gold)', color: 'var(--felt-dark)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>PLUS</div>
                )}
                <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
          {!isPlusUser && (
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.5rem', textAlign: 'center' }}>
              <Link to="/upgrade" style={{ color: 'var(--gold)' }}>Upgrade to Plus</Link> to unlock Hard difficulty
            </p>
          )}
        </div>

        <button className="btn-gold" onClick={startGame} style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}>
          ♠ Deal Cards
        </button>
        <Link to="/lobby" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Back to Lobby</Link>
      </div>
    </div>
  )

  if (!game) return null

  const myHand = game.hands['S']
  const dummyHand = game.dummy ? game.hands[game.dummy] : null
  const isMyTurn = game.phase === 'bidding' ? game.currentBidder === 'S' : game.currentLeader === 'S'
  const legalCards = game.phase === 'playing' && isMyTurn
    ? getLegalCards(myHand, game.currentTrick, game.contract?.denomination === 'NT' ? null : game.contract?.denomination)
    : null

  // Get last bid for validation
  const getLastBid = () => {
    for (let i = game.auction.length - 1; i >= 0; i--) {
      if (game.auction[i].type === 'bid') return game.auction[i]
    }
    return null
  }
  const lastBid = getLastBid()
  const denomOrder = ['C','D','H','S','NT']

  function isBidValid(level, denom) {
    if (!lastBid) return true
    if (level > lastBid.level) return true
    if (level === lastBid.level) return denomOrder.indexOf(denom) > denomOrder.indexOf(lastBid.denomination)
    return false
  }

  // ── Game screen ──
  return (
    <div style={{ paddingTop: 64, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f2219', overflow: 'hidden' }}>

      {/* Hand complete overlay */}
      {game.phase === 'complete' && game.scoring && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--felt-light)', border: '2px solid var(--gold)', borderRadius: 20, padding: '2rem', textAlign: 'center', maxWidth: 420, width: '90%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{game.scoring.made ? '🎉' : '😔'}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              {game.scoring.made ? 'Contract Made!' : 'Contract Defeated!'}
            </h2>
            <p style={{ color: 'var(--cream)', marginBottom: '0.25rem' }}>
              Contract: {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer === 'S' ? 'You' : game.contract.declarer}
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              NS tricks: {game.tricks.NS} · EW tricks: {game.tricks.EW}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', margin: '1rem 0' }}>
              {game.scoring.made
                ? `NS scores ${game.scoring.declarerScore} points`
                : `EW scores ${game.scoring.defenderScore} points`
              }
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={() => setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(201,168,76,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setScreen('menu')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>← Menu</button>
          <span style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)', fontWeight: 700 }}>♠ Bridge</span>
          {game.contract && (
            <span style={{ fontSize: '0.8rem', color: 'var(--cream)', background: 'rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: 20 }}>
              Contract: {game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer === 'S' ? 'You' : game.contract.declarer}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--green-accent)' }}>NS: {game.tricks.NS} tricks</span>
          <span style={{ color: '#c0392b' }}>EW: {game.tricks.EW} tricks</span>
        </div>
      </div>

      {/* Message bar */}
      {message && (
        <div style={{ background: isMyTurn ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)', padding: '0.4rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: isMyTurn ? 'var(--green-accent)' : 'var(--text-muted)', flexShrink: 0 }}>
          {message}
        </div>
      )}

      {/* Main game area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Game table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', overflow: 'hidden', position: 'relative' }}>

          {/* North hand */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {game.botNames?.N || 'Alex'} (N) {game.contract?.declarer === 'N' ? '— Declarer' : game.dummy === 'N' && game.dummyRevealed ? '— Dummy' : ''}
              </div>
              {game.dummy === 'N' && game.dummyRevealed
                ? <HandDisplay hand={game.hands['N']} position="N" small />
                : <div style={{ display: 'flex', gap: 2 }}>{Array.from({length: Math.min(game.hands['N']?.length || 13, 8)}).map((_,i) => <BridgeCard key={i} faceDown small />)}</div>
              }
            </div>
          </div>

          {/* Middle row: West, Center table, East */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            {/* West */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {game.botNames?.W || 'Jordan'} (W)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({length: Math.min(game.hands['W']?.length || 13, 6)}).map((_,i) => <BridgeCard key={i} faceDown small />)}
              </div>
            </div>

            {/* Center table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>

              {/* Current trick */}
              <div style={{ position: 'relative', width: 200, height: 160 }}>
                {['N','S','E','W'].map(pos => {
                  const play = game.currentTrick.find(t => t.position === pos)
                  const offsets = { N: { top: 0, left: '50%', transform: 'translateX(-50%)' }, S: { bottom: 0, left: '50%', transform: 'translateX(-50%)' }, E: { right: 0, top: '50%', transform: 'translateY(-50%)' }, W: { left: 0, top: '50%', transform: 'translateY(-50%)' } }
                  return (
                    <div key={pos} style={{ position: 'absolute', ...offsets[pos] }}>
                      {play
                        ? <BridgeCard card={play.card} small />
                        : <div style={{ width: 52, height: 73, borderRadius: 6, border: '1.5px dashed rgba(201,168,76,0.2)' }} />
                      }
                    </div>
                  )
                })}
              </div>

              {/* Auction or bidding UI */}
              {game.phase === 'bidding' && (
                <AuctionBox auction={game.auction} dealer={game.dealer} />
              )}
            </div>

            {/* East */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {game.botNames?.E || 'Sam'} (E)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({length: Math.min(game.hands['E']?.length || 13, 6)}).map((_,i) => <BridgeCard key={i} faceDown small />)}
              </div>
            </div>
          </div>

          {/* South hand (player) */}
          <div style={{ flexShrink: 0, marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: isMyTurn ? 'var(--green-accent)' : 'var(--text-muted)', marginBottom: '4px' }}>
              You (S) {isMyTurn ? '— Your turn' : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HandDisplay
                hand={myHand}
                position="S"
                selectedCard={selectedCard}
                onCardClick={handleCardClick}
                legalCards={legalCards}
                isCurrentPlayer={isMyTurn && game.phase === 'playing'}
              />
            </div>
          </div>
        </div>

        {/* Right panel — bidding or info */}
        <div style={{ width: 220, background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(201,168,76,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto' }}>

          {game.phase === 'bidding' && isMyTurn && (
            <div style={{ padding: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Bid</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3, marginBottom: '0.75rem' }}>
                {[1,2,3,4,5,6,7].map(level =>
                  DENOMINATIONS.map(denom => (
                    <BidButton
                      key={`${level}${denom}`}
                      level={level}
                      denom={denom}
                      disabled={!isBidValid(level, denom)}
                      onClick={() => handleBidClick(level, denom)}
                    />
                  ))
                )}
              </div>
              <button onClick={handlePass} style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--cream)', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                Pass
              </button>
            </div>
          )}

          {game.phase === 'bidding' && !isMyTurn && (
            <div style={{ padding: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                Waiting for {game.currentBidder === 'N' ? game.botNames?.N : game.currentBidder === 'E' ? game.botNames?.E : game.botNames?.W} to bid...
              </p>
            </div>
          )}

          {/* Hand info */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Your Hand</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--cream)' }}>HCP: {countHCP(myHand || [])}</p>
            {['S','H','D','C'].map(suit => (
              <p key={suit} style={{ fontSize: '0.8rem', color: SUIT_COLORS[suit] === '#1a1a2e' ? 'white' : SUIT_COLORS[suit] }}>
                {SUIT_SYMBOLS[suit]}: {(myHand || []).filter(c => c.suit === suit).length} cards
              </p>
            ))}
          </div>

          {/* Trick count */}
          {game.phase === 'playing' && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Tricks</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--green-accent)' }}>NS: {game.tricks.NS}</p>
              <p style={{ fontSize: '0.85rem', color: '#c0392b' }}>EW: {game.tricks.EW}</p>
              {game.contract && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Need: {game.contract.tricksNeeded} tricks
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
