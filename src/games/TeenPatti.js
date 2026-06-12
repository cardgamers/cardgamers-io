import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────
const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const VALUE_RANK = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}
const SUIT_COLORS = {'♠':'#1a1a2e','♥':'#c0392b','♦':'#c0392b','♣':'#1a1a2e'}

const BOT_NAMES = ['Raju', 'Priya', 'Vikram']
const BOT_AVATARS = ['🧔', '👩', '👨‍💼']

// ─── Hand rankings ────────────────────────────────────────────────
// Trail (Three of a kind) > Pure Sequence > Sequence > Color > Pair > High Card
function getHandRank(cards) {
  if (cards.length !== 3) return { rank: 0, name: 'High Card' }
  const values = cards.map(c => VALUE_RANK[c.value]).sort((a,b) => b-a)
  const suits = cards.map(c => c.suit)
  const isFlush = suits.every(s => s === suits[0])
  const isStraight = (values[0]-values[1]===1 && values[1]-values[2]===1) ||
    (values[0]===14 && values[1]===3 && values[2]===2) // A-2-3
  const isTrips = values[0]===values[1] && values[1]===values[2]
  const isPair = values[0]===values[1] || values[1]===values[2]

  if (isTrips) return { rank: 6, name: 'Trail 🔥', values }
  if (isFlush && isStraight) return { rank: 5, name: 'Pure Sequence', values }
  if (isStraight) return { rank: 4, name: 'Sequence', values }
  if (isFlush) return { rank: 3, name: 'Color', values }
  if (isPair) return { rank: 2, name: 'Pair', values }
  return { rank: 1, name: 'High Card', values }
}

function compareHands(hand1, hand2) {
  const r1 = getHandRank(hand1)
  const r2 = getHandRank(hand2)
  if (r1.rank !== r2.rank) return r1.rank > r2.rank ? 1 : -1
  // Same rank — compare values
  for (let i = 0; i < r1.values.length; i++) {
    if (r1.values[i] !== r2.values[i]) return r1.values[i] > r2.values[i] ? 1 : -1
  }
  return 0
}

// ─── Deck ────────────────────────────────────────────────────────
function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ suit, value, id: `${value}${suit}` })
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i=a.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]]
  }
  return a
}

// ─── Card component ───────────────────────────────────────────────
function TPCard({ card, faceDown, small, selected, onClick }) {
  const W = small ? 54 : 72
  const H = small ? 76 : 101
  const fs = small ? 10 : 13
  const ss = small ? 20 : 28

  if (faceDown) return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:8, flexShrink:0, cursor:onClick?'pointer':'default',
      background:'linear-gradient(135deg, #8B0000, #4a0000)',
      backgroundImage:`
        radial-gradient(circle at 50% 50%, rgba(255,215,0,0.15) 0%, transparent 60%),
        repeating-linear-gradient(45deg, rgba(255,215,0,0.05) 0px, rgba(255,215,0,0.05) 2px, transparent 2px, transparent 8px)
      `,
      border:'2px solid rgba(255,215,0,0.4)',
      boxShadow:'0 3px 8px rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: small ? '1rem' : '1.4rem',
    }}>🪔</div>
  )

  if (!card) return null
  const col = SUIT_COLORS[card.suit]

  return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:8, flexShrink:0,
      background: selected ? '#fffde7' : 'white',
      border: selected ? '3px solid #FFD700' : '1px solid #ddd',
      boxShadow: selected ? '0 0 0 3px rgba(255,215,0,0.5), 0 6px 16px rgba(0,0,0,0.4)' : '0 3px 8px rgba(0,0,0,0.3)',
      cursor: onClick ? 'pointer' : 'default',
      userSelect:'none', position:'relative',
      transform: selected ? 'translateY(-12px)' : 'none',
      transition:'transform 0.15s',
    }}>
      <div style={{ position:'absolute', top:3, left:5, lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:ss, color:col }}>{card.suit}</div>
      <div style={{ position:'absolute', bottom:3, right:5, transform:'rotate(180deg)', lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Chip display ─────────────────────────────────────────────────
function Chips({ amount }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(0,0,0,0.4)', borderRadius:20, padding:'3px 10px', border:'1px solid rgba(255,215,0,0.3)' }}>
      <span style={{ fontSize:'0.8rem' }}>🪙</span>
      <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#FFD700' }}>{amount}</span>
    </div>
  )
}

// ─── Player seat ──────────────────────────────────────────────────
function PlayerSeat({ player, isUser, isCurrent, isWinner, gamePhase }) {
  const { name, avatar, chips, bet, cards, folded, seen, isBlind } = player

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      opacity: folded ? 0.45 : 1,
      transition:'opacity 0.3s',
    }}>
      {/* Avatar + status */}
      <div style={{ position:'relative' }}>
        <div style={{
          width:52, height:52, borderRadius:'50%',
          background: isCurrent ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'linear-gradient(135deg,#8B0000,#4a0000)',
          border: `3px solid ${isCurrent ? '#FFD700' : isWinner ? '#FFD700' : 'rgba(255,215,0,0.3)'}`,
          boxShadow: isCurrent ? '0 0 16px rgba(255,215,0,0.6)' : 'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.6rem', transition:'all 0.3s',
        }}>
          {avatar}
        </div>
        {folded && <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'#ff6b6b' }}>PACK</div>}
        {isWinner && <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', fontSize:'1.2rem' }}>👑</div>}
      </div>

      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'0.8rem', fontWeight:600, color: isUser ? '#FFD700' : '#f5f0e8' }}>{name}</div>
        {isBlind && !seen && !folded && <div style={{ fontSize:'0.6rem', color:'rgba(255,215,0,0.6)', fontWeight:500 }}>Blind</div>}
        {seen && !folded && <div style={{ fontSize:'0.6rem', color:'rgba(100,200,100,0.8)', fontWeight:500 }}>Seen</div>}
      </div>

      <Chips amount={chips} />

      {bet > 0 && (
        <div style={{ fontSize:'0.7rem', color:'rgba(255,215,0,0.7)' }}>Bet: {bet}</div>
      )}

      {/* Cards */}
      <div style={{ display:'flex', gap:3 }}>
        {cards && cards.map((card, i) => (
          <TPCard
            key={i}
            card={isUser && gamePhase !== 'showdown' ? card : null}
            faceDown={!isUser || gamePhase === 'showdown' ? true : false}
            small
          />
        ))}
        {(!cards || cards.length === 0) && [0,1,2].map(i => (
          <div key={i} style={{ width:54, height:76, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px dashed rgba(255,215,0,0.15)' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Teen Patti Game ─────────────────────────────────────────
export default function TeenPatti() {
  const { profile } = useAuth()
  const [screen, setScreen] = useState('menu')
  const [players, setPlayers] = useState([])
  const [pot, setPot] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0) // index
  const [phase, setPhase] = useState('betting') // betting | showdown | result
  const [bootAmount] = useState(10)
  const [currentBet, setCurrentBet] = useState(10)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  const [seen, setSeen] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [variant, setVariant] = useState('classic')
  const botTimer = useRef(null)

  function initGame() {
    const deck = shuffle(createDeck())
    const newPlayers = [
      { id:0, name: profile?.username || 'You', avatar:'🎮', chips:500, bet:0, cards:deck.slice(0,3), folded:false, seen:false, isUser:true, isBlind:true },
      { id:1, name:BOT_NAMES[0], avatar:BOT_AVATARS[0], chips:500, bet:0, cards:deck.slice(3,6), folded:false, seen:false, isUser:false, isBlind:true },
      { id:2, name:BOT_NAMES[1], avatar:BOT_AVATARS[1], chips:500, bet:0, cards:deck.slice(6,9), folded:false, seen:false, isUser:false, isBlind:true },
      { id:3, name:BOT_NAMES[2], avatar:BOT_AVATARS[2], chips:500, bet:0, cards:deck.slice(9,12), folded:false, seen:false, isUser:false, isBlind:true },
    ]
    // Everyone puts boot amount in pot
    newPlayers.forEach(p => { p.chips -= bootAmount; p.bet = bootAmount })
    setPlayers(newPlayers)
    setPot(bootAmount * 4)
    setCurrentPlayer(0)
    setCurrentBet(bootAmount)
    setPhase('betting')
    setWinner(null)
    setMessage('Your turn! Chaal, Pack, or See your cards.')
    setSeen(false)
    setResultSaved(false)
    setScreen('game')
  }

  // ── Bot action ────────────────────────────────────────────────
  const doBotAction = useCallback((playerIdx, playersState, currentBetAmt, potAmt) => {
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      const bot = playersState[playerIdx]
      if (!bot || bot.folded || bot.isUser) return

      const handRank = getHandRank(bot.cards)
      const rand = Math.random()

      // Bot decision based on hand strength
      let action
      if (handRank.rank >= 5) action = 'chaal' // Strong hand — always chaal
      else if (handRank.rank >= 3) action = rand < 0.85 ? 'chaal' : 'pack'
      else if (handRank.rank >= 2) action = rand < 0.6 ? 'chaal' : 'pack'
      else action = rand < 0.35 ? 'chaal' : 'pack'

      // Occasionally request show
      if (handRank.rank >= 4 && rand < 0.2 && !bot.isBlind) action = 'show'

      setPlayers(prev => {
        const next = JSON.parse(JSON.stringify(prev))
        const p = next[playerIdx]

        if (action === 'pack') {
          p.folded = true
          setMessage(`${p.name} packed.`)
        } else if (action === 'chaal') {
          const chaalAmt = p.isBlind ? currentBetAmt : currentBetAmt * 2
          const actual = Math.min(chaalAmt, p.chips)
          p.chips -= actual
          p.bet += actual
          setPot(pot => pot + actual)
          setCurrentBet(p.isBlind ? currentBetAmt : currentBetAmt)
          p.isBlind = false
          setMessage(`${p.name} chaal'd ${actual} chips.`)
        } else if (action === 'show') {
          // Trigger showdown
          setPhase('showdown')
          return next
        }

        // Check if only one player left
        const active = next.filter(p => !p.folded)
        if (active.length === 1) {
          setWinner(active[0])
          setPhase('result')
          setMessage(`${active[0].name} wins the pot! Everyone else packed.`)
          return next
        }

        // Next player
        let nextIdx = (playerIdx + 1) % next.length
        while (next[nextIdx].folded) nextIdx = (nextIdx + 1) % next.length
        setCurrentPlayer(nextIdx)
        if (next[nextIdx].isUser) {
          setMessage(`Your turn! Chaal, Pack, or See your cards.`)
        }
        return next
      })
    }, 1500 + Math.random() * 1500)
  }, [])

  useEffect(() => {
    if (phase !== 'betting' || !players.length) return
    const current = players[currentPlayer]
    if (!current || current.isUser || current.folded) return
    doBotAction(currentPlayer, players, currentBet, pot)
    return () => clearTimeout(botTimer.current)
  }, [currentPlayer, players, phase, doBotAction, currentBet, pot])

  // ── Showdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'showdown') return
    const active = players.filter(p => !p.folded)
    let winnerPlayer = active[0]
    for (let i=1;i<active.length;i++) {
      if (compareHands(active[i].cards, winnerPlayer.cards) > 0) winnerPlayer = active[i]
    }
    setWinner(winnerPlayer)
    setPhase('result')
    setMessage(`${winnerPlayer.isUser ? 'You' : winnerPlayer.name} win${winnerPlayer.isUser?'':'s'} with ${getHandRank(winnerPlayer.cards).name}!`)
  }, [phase])

  // ── Save result ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'result' || !winner || resultSaved) return
    async function save() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const playerWon = winner.isUser
        const ratingChange = playerWon ? 20 : -10
        await supabase.from('game_history').insert({
          user_id: user.id, game_type: 'teen_patti',
          result: playerWon ? 'win' : 'loss',
          score: playerWon ? pot : 0,
          rating_change: ratingChange,
          played_at: new Date().toISOString(),
        })
        const { data: prof } = await supabase.from('profiles').select('games_played,games_won,rating,username,plan').eq('id', user.id).single()
        if (prof) {
          const newRating = Math.max(100, (prof.rating||1000) + ratingChange)
          const newPlayed = (prof.games_played||0) + 1
          const newWon = (prof.games_won||0) + (playerWon?1:0)
          await supabase.from('profiles').update({ games_played:newPlayed, games_won:newWon, rating:newRating }).eq('id', user.id)
          await supabase.from('leaderboard').upsert({ user_id:user.id, username:prof.username, rating:newRating, games_played:newPlayed, games_won:newWon, win_pct:Math.round(newWon/newPlayed*100), plan:prof.plan }, { onConflict:'user_id' })
        }
        setResultSaved(true)
      } catch(e) { console.error(e) }
    }
    save()
  }, [phase, winner, resultSaved, pot])

  // ── Player actions ────────────────────────────────────────────
  function handleSeeCards() {
    setSeen(true)
    setPlayers(prev => {
      const next = [...prev]
      next[0] = { ...next[0], seen:true, isBlind:false }
      return next
    })
    setMessage('You\'ve seen your cards. Chaal costs double now.')
  }

  function handleChaal() {
    const me = players[0]
    const chaalAmt = seen ? currentBet * 2 : currentBet
    if (me.chips < chaalAmt) { setMessage('Not enough chips!'); return }

    setPlayers(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next[0].chips -= chaalAmt
      next[0].bet += chaalAmt
      return next
    })
    setPot(p => p + chaalAmt)

    // Next player
    let nextIdx = 1
    while (players[nextIdx]?.folded) nextIdx = (nextIdx + 1) % players.length
    setCurrentPlayer(nextIdx)
    setMessage(`You chaal'd ${chaalAmt}. ${players[nextIdx]?.name}'s turn...`)
  }

  function handlePack() {
    setPlayers(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next[0].folded = true
      return next
    })
    setPhase('result')
    // Find winner among remaining
    const remaining = players.filter((p,i) => i !== 0 && !p.folded)
    if (remaining.length === 1) {
      setWinner(remaining[0])
      setMessage(`You packed. ${remaining[0].name} wins!`)
    } else {
      // Bots play out
      let w = remaining[0]
      for (let i=1;i<remaining.length;i++) {
        if (compareHands(remaining[i].cards, w.cards) > 0) w = remaining[i]
      }
      setWinner(w)
      setMessage(`You packed. ${w.name} wins with ${getHandRank(w.cards).name}!`)
    }
  }

  function handleShow() {
    setPhase('showdown')
  }

  // ── Menu screen ───────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem',
      background:'radial-gradient(ellipse at center top, #3d0000 0%, #1a0000 50%, #0a0000 100%)' }}>
      <div style={{ maxWidth:500, width:'100%', textAlign:'center' }}>
        {/* Decorative header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🪔 ♠ 🪔</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.8rem', color:'#FFD700',
            textShadow:'0 0 20px rgba(255,215,0,0.5)', margin:'0.25rem 0' }}>Teen Patti</h1>
          <p style={{ color:'rgba(255,215,0,0.6)', fontSize:'1rem', fontStyle:'italic' }}>
            तीन पत्ती — The Royal Indian Card Game
          </p>
        </div>

        {/* Variant selector */}
        <div style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.75rem', color:'rgba(255,215,0,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>Choose Variant</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[
              { id:'classic', name:'Classic', desc:'Standard rules', emoji:'🃏' },
              { id:'muflis', name:'Muflis', desc:'Lowest hand wins', emoji:'🔄' },
              { id:'ak47', name:'AK47', desc:'A K 4 7 are wild', emoji:'🃏' },
            ].map(v => (
              <div key={v.id} onClick={() => setVariant(v.id)} style={{
                background: variant===v.id ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                border:`2px solid ${variant===v.id ? '#FFD700' : 'rgba(255,215,0,0.2)'}`,
                borderRadius:12, padding:'0.9rem 0.75rem', cursor:'pointer',
              }}>
                <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{v.emoji}</div>
                <div style={{ fontWeight:600, color: variant===v.id ? '#FFD700' : '#f5f0e8', fontSize:'0.9rem', marginBottom:2 }}>{v.name}</div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,215,0,0.5)' }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={initGame} style={{
          width:'100%', padding:'1rem', borderRadius:12, fontSize:'1.1rem', fontWeight:700,
          background:'linear-gradient(135deg,#FFD700,#FFA500)',
          border:'none', color:'#1a0000', cursor:'pointer',
          boxShadow:'0 4px 20px rgba(255,215,0,0.4)',
          letterSpacing:'0.05em',
        }}>
          🎴 Deal Cards — खेलें!
        </button>

        <Link to="/lobby" style={{ display:'block', textAlign:'center', marginTop:'1rem', color:'rgba(255,215,0,0.5)', fontSize:'0.85rem' }}>
          ← Back to Lobby
        </Link>

        {/* Hand rankings guide */}
        <div style={{ marginTop:'2rem', background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'1rem', border:'1px solid rgba(255,215,0,0.15)' }}>
          <p style={{ fontSize:'0.72rem', color:'rgba(255,215,0,0.6)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>Hand Rankings (High to Low)</p>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {[
              ['🔥 Trail', 'Three of a kind — highest possible hand'],
              ['Pure Sequence', 'Three consecutive same-suit cards'],
              ['Sequence (Run)', 'Three consecutive cards, mixed suits'],
              ['Color (Flush)', 'Three same-suit cards'],
              ['Pair', 'Two cards of same value'],
              ['High Card', 'Highest card wins'],
            ].map(([name, desc]) => (
              <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(255,215,0,0.08)' }}>
                <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#FFD700' }}>{name}</span>
                <span style={{ fontSize:'0.72rem', color:'rgba(255,215,0,0.5)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Game screen ───────────────────────────────────────────────
  const me = players[0]
  const activePlayers = players.filter(p => !p.folded)
  const isMyTurn = currentPlayer === 0 && phase === 'betting'

  return (
    <div style={{
      paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden',
      background:'radial-gradient(ellipse at center, #2d0000 0%, #1a0000 40%, #0a0000 100%)',
    }}>
      {/* Result overlay */}
      {phase === 'result' && winner && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'linear-gradient(135deg,#3d0000,#1a0000)', border:'2px solid #FFD700', borderRadius:20, padding:'2.5rem', textAlign:'center', maxWidth:420, width:'90%',
            boxShadow:'0 0 40px rgba(255,215,0,0.3)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>{winner.isUser ? '🏆' : '😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#FFD700', marginBottom:'0.5rem' }}>
              {winner.isUser ? 'आप जीत गये! You Won!' : `${winner.name} Wins!`}
            </h2>
            {winner && winner.cards && (
              <p style={{ color:'rgba(255,215,0,0.7)', marginBottom:'0.5rem' }}>
                {getHandRank(winner.cards).name}
              </p>
            )}
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:'1rem' }}>
              {winner.cards?.map((c,i) => <TPCard key={i} card={c} />)}
            </div>
            <p style={{ fontSize:'1.4rem', fontWeight:700, color:'#FFD700', marginBottom:'1.5rem' }}>
              🪙 Pot: {pot} chips
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={initGame} style={{ padding:'0.7rem 1.5rem', borderRadius:10, background:'linear-gradient(135deg,#FFD700,#FFA500)', border:'none', color:'#1a0000', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}>
                फिर खेलें! Play Again
              </button>
              <button onClick={() => setScreen('menu')} style={{ padding:'0.7rem 1.5rem', borderRadius:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,215,0,0.3)', color:'#FFD700', fontWeight:600, cursor:'pointer', fontSize:'0.95rem' }}>
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 1rem', background:'rgba(0,0,0,0.6)', borderBottom:'1px solid rgba(255,215,0,0.2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={() => setScreen('menu')} style={{ background:'none', border:'none', color:'rgba(255,215,0,0.6)', cursor:'pointer', fontSize:'0.8rem' }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'#FFD700', fontWeight:700 }}>🪔 Teen Patti</span>
          <span style={{ fontSize:'0.7rem', color:'rgba(255,215,0,0.5)', background:'rgba(255,215,0,0.1)', padding:'2px 8px', borderRadius:20, textTransform:'capitalize' }}>{variant}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.6rem', color:'rgba(255,215,0,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Pot</div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#FFD700' }}>🪙 {pot}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.6rem', color:'rgba(255,215,0,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Boot</div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'rgba(255,215,0,0.7)' }}>{currentBet}</div>
          </div>
        </div>
      </div>

      {/* Message bar */}
      <div style={{ background: isMyTurn ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.3)', padding:'0.4rem 1rem', textAlign:'center', fontSize:'0.85rem', color: isMyTurn ? '#FFD700' : 'rgba(255,215,0,0.5)', borderBottom:'1px solid rgba(255,215,0,0.1)', flexShrink:0 }}>
        {message}
      </div>

      {/* Game table */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

        {/* Decorative table felt */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at center, rgba(139,0,0,0.3) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

        {/* Players arranged around table */}
        <div style={{ flex:1, display:'grid', gridTemplateAreas:'"top top top" "left center right" "bottom bottom bottom"', gridTemplateColumns:'1fr 2fr 1fr', gridTemplateRows:'auto 1fr auto', gap:'0.5rem', padding:'0.75rem', zIndex:1, position:'relative' }}>

          {/* Top players (bots 1 and 2) */}
          <div style={{ gridArea:'top', display:'flex', justifyContent:'space-around', alignItems:'flex-start' }}>
            {players.slice(1,3).map((p,i) => (
              <PlayerSeat key={p.id} player={p} isCurrent={currentPlayer===i+1} isWinner={winner?.id===p.id} gamePhase={phase} />
            ))}
          </div>

          {/* Left (bot 3) */}
          <div style={{ gridArea:'left', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {players[3] && <PlayerSeat player={players[3]} isCurrent={currentPlayer===3} isWinner={winner?.id===players[3].id} gamePhase={phase} />}
          </div>

          {/* Center — pot */}
          <div style={{ gridArea:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ background:'rgba(0,0,0,0.5)', borderRadius:16, padding:'0.75rem 1.5rem', border:'1px solid rgba(255,215,0,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:'0.65rem', color:'rgba(255,215,0,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Total Pot</div>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:'#FFD700' }}>🪙 {pot}</div>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,215,0,0.4)', marginTop:2 }}>{activePlayers.length} players active</div>
            </div>
          </div>

          {/* Right empty */}
          <div style={{ gridArea:'right' }} />

          {/* Bottom — player */}
          <div style={{ gridArea:'bottom', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            {me && (
              <>
                <PlayerSeat player={{...me, cards: me.cards}} isUser isCurrent={isMyTurn} isWinner={winner?.id===me.id} gamePhase={phase} />

                {/* Player's cards face up */}
                {!seen && phase === 'betting' && (
                  <div style={{ display:'flex', gap:6 }}>
                    {me.cards.map((_,i) => <TPCard key={i} faceDown />)}
                  </div>
                )}
                {seen && (
                  <div style={{ display:'flex', gap:6 }}>
                    {me.cards.map((c,i) => <TPCard key={i} card={c} />)}
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            {isMyTurn && (
              <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', justifyContent:'center' }}>
                {!seen && (
                  <button onClick={handleSeeCards} style={{
                    padding:'0.6rem 1.2rem', borderRadius:10, fontWeight:700, fontSize:'0.88rem',
                    background:'rgba(255,215,0,0.15)', border:'2px solid rgba(255,215,0,0.4)',
                    color:'#FFD700', cursor:'pointer',
                  }}>👁 See Cards (देखें)</button>
                )}
                <button onClick={handleChaal} style={{
                  padding:'0.6rem 1.2rem', borderRadius:10, fontWeight:700, fontSize:'0.88rem',
                  background:'linear-gradient(135deg,#2d7a2d,#1a4d1a)', border:'2px solid rgba(100,200,100,0.4)',
                  color:'white', cursor:'pointer',
                }}>✅ Chaal ({seen ? currentBet*2 : currentBet})</button>
                <button onClick={handlePack} style={{
                  padding:'0.6rem 1.2rem', borderRadius:10, fontWeight:700, fontSize:'0.88rem',
                  background:'rgba(200,50,50,0.2)', border:'2px solid rgba(200,50,50,0.4)',
                  color:'#ff8888', cursor:'pointer',
                }}>❌ Pack (हार मान लें)</button>
                {seen && activePlayers.length === 2 && (
                  <button onClick={handleShow} style={{
                    padding:'0.6rem 1.2rem', borderRadius:10, fontWeight:700, fontSize:'0.88rem',
                    background:'linear-gradient(135deg,#FFD700,#FFA500)', border:'none',
                    color:'#1a0000', cursor:'pointer',
                  }}>🃏 Show (दिखाओ)</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
