import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { saveGameResult } from '../lib/saveGameResult'
import { usePageMeta } from '../hooks/usePageMeta'

const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const RED_SUITS = ['♥','♦']
const FOUNDATION_SUITS = ['♠','♥','♦','♣']

function isRed(suit) { return RED_SUITS.includes(suit) }
function cardColor(suit) { return isRed(suit) ? '#c0392b' : '#1a1a2e' }
function cardValue(val) { return VALUES.indexOf(val) }

function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ suit, value, id:`${value}${suit}`, faceUp:false })
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i=a.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]]
  }
  return a
}

function dealGame(drawMode = 1) {
  const deck = shuffle(createDeck())
  const tableau = Array.from({length:7},()=>[])
  let idx = 0
  for (let col=0;col<7;col++)
    for (let row=0;row<=col;row++) {
      const card = {...deck[idx++]}
      card.faceUp = row===col
      tableau[col].push(card)
    }
  return {
    tableau,
    stock: deck.slice(idx).map(c=>({...c,faceUp:false})),
    waste: [],
    foundations: [[],[],[],[]],
    drawMode,
  }
}

function canPlaceOnFoundation(card, foundation, fi) {
  const req = FOUNDATION_SUITS[fi]
  if (foundation.length===0) return card.value==='A' && card.suit===req
  const top = foundation[foundation.length-1]
  return top.suit===card.suit && cardValue(card.value)===cardValue(top.value)+1
}

function canPlaceOnTableau(card, column) {
  if (column.length===0) return card.value==='K'
  const top = column[column.length-1]
  if (!top.faceUp) return false
  return isRed(card.suit)!==isRed(top.suit) && cardValue(card.value)===cardValue(top.value)-1
}

function checkWin(foundations) { return foundations.every(f=>f.length===13) }

// ─── Stuck detector ───────────────────────────────────────────────
function isStuck(game) {
  const { tableau, stock, waste, foundations } = game

  // If stock still has cards, not stuck
  if (stock.length > 0) return false

  // Check waste top card
  const wasteTop = waste.length > 0 ? waste[waste.length - 1] : null

  // Can waste top go to foundation?
  if (wasteTop) {
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(wasteTop, foundations[fi], fi)) return false
    }
    // Can waste top go to tableau?
    for (let ci = 0; ci < 7; ci++) {
      if (canPlaceOnTableau(wasteTop, tableau[ci])) return false
    }
  }

  // Can any remaining waste cards be cycled? Only if there are more waste cards
  if (waste.length > 1) return false

  // Check tableau cards
  for (let ci = 0; ci < 7; ci++) {
    const col = tableau[ci]
    // Any face-down cards left to flip at the bottom of a column?
    for (let i = 0; i < col.length; i++) {
      if (!col[i].faceUp && i === col.length - 1) return false
    }
    // Check each face-up card
    for (let i = col.length - 1; i >= 0; i--) {
      if (!col[i].faceUp) break
      const card = col[i]
      // Can go to foundation?
      if (i === col.length - 1) {
        for (let fi = 0; fi < 4; fi++) {
          if (canPlaceOnFoundation(card, foundations[fi], fi)) return false
        }
      }
      // Can move to another tableau column?
      for (let tci = 0; tci < 7; tci++) {
        if (tci === ci) continue
        if (canPlaceOnTableau(card, tableau[tci])) {
          // Only count as a move if it uncovers a face-down card or moves to empty with purpose
          if (i > 0 && !col[i - 1].faceUp) return false
          if (card.value === 'K' && tableau[tci].length === 0 && col.length > 1) return false
        }
      }
    }
  }

  return true
}

// ─── Responsive sizing ────────────────────────────────────────────
function useLayout() {
  const [layout, setLayout] = useState(() => calcLayout())
  function calcLayout() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxW = Math.floor((vw - 32) / 7) - 4
    const W = Math.min(Math.max(maxW, 44), 110)
    const H = Math.round(W * 1.4)
    const fs = Math.max(8, Math.round(W * 0.16))
    const ss = Math.max(14, Math.round(W * 0.32))
    const faceDownH = Math.round(H * 0.18)
    const faceUpOverlap = Math.round(H * 0.22)
    const gap = Math.max(4, Math.round(vw * 0.006))
    return { W, H, fs, ss, faceDownH, faceUpOverlap, gap, vw, vh }
  }
  useEffect(() => {
    const h = () => setLayout(calcLayout())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return layout
}

// ─── Card component ───────────────────────────────────────────────
function Card({ card, selected, onClick, W, H, fs, ss, style={} }) {
  if (!card) return null
  if (!card.faceUp) return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a 0%,#0f2245 100%)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 10px)',
      border:'1.5px solid rgba(255,255,255,0.18)',
      boxShadow:'0 2px 5px rgba(0,0,0,0.45)',
      cursor:onClick?'pointer':'default', ...style
    }} />
  )
  const col = cardColor(card.suit)
  return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6, flexShrink:0,
      background: selected ? '#fffde7' : '#ffffff',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #d0d0d0',
      boxShadow: selected
        ? '0 0 0 2px rgba(201,168,76,0.5), 0 6px 16px rgba(0,0,0,0.35)'
        : '0 2px 5px rgba(0,0,0,0.2)',
      cursor: onClick ? 'pointer' : 'default',
      userSelect:'none', position:'relative',
      transform: selected ? 'translateY(-8px)' : 'none',
      transition:'transform 0.12s, box-shadow 0.12s',
      ...style
    }}>
      <div style={{ position:'absolute', top:3, left:4, lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:ss, color:col, lineHeight:1, opacity:0.9 }}>{card.suit}</div>
      <div style={{ position:'absolute', bottom:3, right:4, transform:'rotate(180deg)', lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Empty slot ───────────────────────────────────────────────────
function Slot({ label, onClick, W, H, children }) {
  const isRedSuit = label==='♥'||label==='♦'
  const isBlack = label==='♠'||label==='♣'
  const bc = isRedSuit ? 'rgba(192,57,43,0.5)' : isBlack ? 'rgba(200,200,200,0.4)' : 'rgba(201,168,76,0.35)'
  const tc = isRedSuit ? 'rgba(192,57,43,0.6)' : isBlack ? 'rgba(200,200,200,0.5)' : 'rgba(201,168,76,0.5)'
  return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6,
      border:`2px dashed ${bc}`,
      background:'rgba(255,255,255,0.03)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:tc, fontSize:H>70?'1.4rem':'1rem',
      cursor:onClick?'pointer':'default', flexShrink:0, position:'relative',
    }}>
      {children || label}
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#c9a84c','#e74c3c','#2ecc71','#3498db','#9b59b6','#f39c12']
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:300, overflow:'hidden' }}>
      {Array.from({length:60}).map((_,i) => (
        <div key={i} style={{
          position:'absolute',
          left:`${Math.random()*100}%`,
          top:`-${Math.random()*20+5}%`,
          width: Math.random()*10+5,
          height: Math.random()*10+5,
          background: colors[Math.floor(Math.random()*colors.length)],
          borderRadius: Math.random()>0.5?'50%':'2px',
          animation:`fall ${Math.random()*2+2}s linear ${Math.random()*2}s infinite`,
          opacity: Math.random()*0.8+0.2,
        }} />
      ))}
      <style>{`@keyframes fall { from{transform:translateY(0) rotate(0deg)} to{transform:translateY(110vh) rotate(720deg)} }`}</style>
    </div>
  )
}

// ─── Hint engine ──────────────────────────────────────────────────
function findHint(game) {
  const { tableau, waste, foundations } = game
  if (waste.length > 0) {
    const card = waste[waste.length-1]
    for (let fi=0; fi<4; fi++) {
      if (canPlaceOnFoundation(card, foundations[fi], fi)) return `Move ${card.value}${card.suit} from waste → foundation`
    }
  }
  for (let ci=0; ci<7; ci++) {
    const col = tableau[ci]
    if (!col.length) continue
    const card = col[col.length-1]
    if (!card.faceUp) continue
    for (let fi=0; fi<4; fi++) {
      if (canPlaceOnFoundation(card, foundations[fi], fi)) return `Move ${card.value}${card.suit} from column ${ci+1} → foundation`
    }
  }
  if (waste.length > 0) {
    const card = waste[waste.length-1]
    for (let ci=0; ci<7; ci++) {
      if (canPlaceOnTableau(card, tableau[ci])) return `Move ${card.value}${card.suit} from waste → column ${ci+1}`
    }
  }
  for (let from=0; from<7; from++) {
    const col = tableau[from]
    for (let ci=col.length-1; ci>=0; ci--) {
      if (!col[ci].faceUp) break
      const card = col[ci]
      for (let to=0; to<7; to++) {
        if (to===from) continue
        if (canPlaceOnTableau(card, tableau[to])) {
          if (ci > 0 && !col[ci-1].faceUp) return `Move ${card.value}${card.suit} from column ${from+1} → column ${to+1}`
          if (card.value==='K' && tableau[to].length===0 && col.length > 1) return `Move K${card.suit} to empty column ${to+1}`
        }
      }
    }
  }
  if (game.stock.length > 0) return 'Draw from stock'
  if (game.waste.length > 0) return 'Reset stock and draw'
  return 'No obvious moves — try undoing some moves'
}

function HintButton({ game }) {
  const [hint, setHint] = useState(null)
  const [showing, setShowing] = useState(false)
  function showHint() {
    const h = findHint(game)
    setHint(h); setShowing(true)
    setTimeout(() => setShowing(false), 4000)
  }
  return (
    <div>
      <button onClick={showHint} style={{ width:'100%', padding:'8px', borderRadius:8, background:'rgba(201,168,76,0.15)', border:'1.5px solid rgba(201,168,76,0.5)', color:'#c9a84c', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
        💡 Show hint
      </button>
      {showing && hint && (
        <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, fontSize:'0.75rem', color:'rgba(245,240,232,0.8)', lineHeight:1.4 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

// ─── New Game / Mode selector dialog ─────────────────────────────
function NewGameDialog({ onStart, onCancel, showCancel = true }) {
  const [drawMode, setDrawMode] = useState(1)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'linear-gradient(135deg,#1a3d28,#0f2a1a)', border:'2px solid #c9a84c', borderRadius:20, padding:'2rem 1.75rem', maxWidth:420, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>♣</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', color:'#c9a84c', marginBottom:'0.3rem' }}>New Game</h2>
        <p style={{ fontSize:'0.82rem', color:'rgba(245,240,232,0.5)', marginBottom:'1.5rem' }}>Choose your difficulty</p>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:'1.75rem' }}>
          {/* Draw 1 */}
          <div onClick={() => setDrawMode(1)} style={{
            background: drawMode===1 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${drawMode===1 ? '#c9a84c' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:12, padding:'1rem 1.25rem', cursor:'pointer', textAlign:'left',
            transition:'all 0.15s',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontWeight:700, color:'var(--cream)', fontSize:'1rem' }}>Draw 1</div>
              <div style={{ display:'flex', gap:6 }}>
                <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:20, background:'rgba(93,202,165,0.15)', color:'#5DCAA5', fontWeight:600 }}>Beginner Friendly</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, marginBottom:6 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#5DCAA5' }}>~80%</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)' }}>Theoretically winnable</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#c9a84c' }}>~40%</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)' }}>Average player win rate</div>
              </div>
            </div>
            <p style={{ fontSize:'0.78rem', color:'rgba(245,240,232,0.45)', lineHeight:1.5, margin:0 }}>
              One card flipped at a time from the stock. More moves available, easier to plan ahead.
            </p>
          </div>

          {/* Draw 3 */}
          <div onClick={() => setDrawMode(3)} style={{
            background: drawMode===3 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${drawMode===3 ? '#c9a84c' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:12, padding:'1rem 1.25rem', cursor:'pointer', textAlign:'left',
            transition:'all 0.15s',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontWeight:700, color:'var(--cream)', fontSize:'1rem' }}>Draw 3</div>
              <div style={{ display:'flex', gap:6 }}>
                <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:20, background:'rgba(192,57,43,0.15)', color:'#e74c3c', fontWeight:600 }}>Classic / Hard</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, marginBottom:6 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#c0392b' }}>~20%</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)' }}>Theoretically winnable</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#c9a84c' }}>~8%</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.4)' }}>Average player win rate</div>
              </div>
            </div>
            <p style={{ fontSize:'0.78rem', color:'rgba(245,240,232,0.45)', lineHeight:1.5, margin:0 }}>
              Three cards flipped at a time — only every third card is accessible. The original casino version.
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
          <button
            onClick={() => onStart(drawMode)}
            className="btn-gold"
            style={{ fontSize:'0.95rem', padding:'0.7rem 2rem' }}
          >
            Deal Cards ♣
          </button>
          {showCancel && (
            <button
              onClick={onCancel}
              style={{ padding:'0.7rem 1.5rem', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(245,240,232,0.6)', cursor:'pointer', fontSize:'0.88rem' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stuck dialog ─────────────────────────────────────────────────
function StuckDialog({ onNewGame, onUndo, canUndo }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'linear-gradient(135deg,#1a3d28,#0f2a1a)', border:'2px solid rgba(192,57,43,0.6)', borderRadius:20, padding:'2rem 1.75rem', maxWidth:380, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🚫</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', color:'#e74c3c', marginBottom:'0.5rem' }}>No More Moves</h2>
        <p style={{ fontSize:'0.88rem', color:'rgba(245,240,232,0.6)', lineHeight:1.7, marginBottom:'0.5rem' }}>
          This game has no remaining moves available and can no longer be completed.
        </p>
        <p style={{ fontSize:'0.78rem', color:'rgba(245,240,232,0.4)', lineHeight:1.6, marginBottom:'1.5rem' }}>
          Don't worry — roughly 20% of Klondike Solitaire deals are unwinnable even with perfect play.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <button
            onClick={onNewGame}
            className="btn-gold"
            style={{ fontSize:'0.95rem', padding:'0.7rem', width:'100%' }}
          >
            Start New Game
          </button>
          {canUndo && (
            <button
              onClick={onUndo}
              style={{ padding:'0.65rem', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(245,240,232,0.7)', cursor:'pointer', fontSize:'0.88rem', width:'100%' }}
            >
              ↩ Undo Last Move
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Solitaire ───────────────────────────────────────────────
export default function Solitaire() {
  usePageMeta('/game/solitaire')
  const [showNewGameDialog, setShowNewGameDialog] = useState(true)
  const [game, setGame] = useState(null)
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState([])
  const [resultSaved, setResultSaved] = useState(false)
  const [percentiles, setPercentiles] = useState(null)
  const [totalWins, setTotalWins] = useState(0)
  const [lastClickTime, setLastClickTime] = useState({})
  const [showStuck, setShowStuck] = useState(false)
  const [stuckChecked, setStuckChecked] = useState(false)
  const layout = useLayout()
  const { W, H, fs, ss, faceDownH, faceUpOverlap, gap } = layout

  // Check for stuck state after every move
  useEffect(() => {
    if (!game || won || showStuck || showNewGameDialog) return
    // Debounce — only check after moves settle
    const t = setTimeout(() => {
      if (isStuck(game)) setShowStuck(true)
    }, 600)
    return () => clearTimeout(t)
  }, [game, won, showStuck, showNewGameDialog])

  useEffect(() => {
    if (!won || resultSaved) return
    async function saveAndRank() {
      await saveGameResult('solitaire', true, score, 15, { moves, duration_seconds: time })
      setResultSaved(true)
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.REACT_APP_SUPABASE_URL,
          process.env.REACT_APP_SUPABASE_ANON_KEY
        )
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
          .from('game_history')
          .select('duration_seconds, moves, score')
          .eq('game_type', 'solitaire')
          .eq('result', 'win')
          .not('duration_seconds', 'is', null)
        const { data: myWins } = await supabase
          .from('game_history')
          .select('id')
          .eq('game_type', 'solitaire')
          .eq('result', 'win')
          .eq('user_id', user.id)
        setTotalWins(myWins?.length || 1)
        if (data && data.length >= 1 && (myWins?.length || 0) >= 3) {
          const times = data.map(d => d.duration_seconds).sort((a,b) => a-b)
          const timeRank = times.filter(t => t <= time).length
          const timePct = Math.round((1 - timeRank / times.length) * 100)
          const movesArr = data.map(d => d.moves).filter(Boolean).sort((a,b) => a-b)
          const movesRank = movesArr.filter(m => m <= moves).length
          const movesPct = movesArr.length >= 3 ? Math.round((1 - movesRank / movesArr.length) * 100) : null
          const scores = data.map(d => d.score).sort((a,b) => a-b)
          const scoreRank = scores.filter(s => s < score).length
          const scorePct = Math.round((scoreRank / scores.length) * 100)
          setPercentiles({ time: timePct, moves: movesPct, score: scorePct, totalGames: data.length })
        }
      } catch(e) { console.log('Percentile fetch failed:', e) }
    }
    saveAndRank()
  }, [won, resultSaved, score, moves, time])

  useEffect(() => {
    if (won || !game) return
    const t = setInterval(() => setTime(s => s+1), 1000)
    return () => clearInterval(t)
  }, [won, game])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  function saveHist() { setHistory(h => [...h, JSON.parse(JSON.stringify(game))]) }

  function undo() {
    if (!history.length) return
    setGame(history[history.length-1])
    setHistory(h => h.slice(0,-1))
    setSelected(null)
    setShowStuck(false)
  }

  function startNewGame(drawMode) {
    setGame(dealGame(drawMode))
    setSelected(null)
    setMoves(0); setScore(0); setTime(0)
    setWon(false); setHistory([]); setResultSaved(false)
    setPercentiles(null); setTotalWins(0)
    setShowStuck(false)
    setShowNewGameDialog(false)
  }

  function tryAutoFoundation(card, sourceType, sourceCol, sourceIdx) {
    for (let fi=0; fi<4; fi++) {
      if (canPlaceOnFoundation(card, game.foundations[fi], fi)) {
        saveHist()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          if (sourceType==='waste') ng.waste.pop()
          else if (sourceType==='tableau') {
            ng.tableau[sourceCol].pop()
            const c = ng.tableau[sourceCol]
            if (c.length>0 && !c[c.length-1].faceUp) c[c.length-1].faceUp = true
          }
          ng.foundations[fi].push(card)
          if (checkWin(ng.foundations)) setWon(true)
          return ng
        })
        setScore(s => s+15)
        setMoves(m => m+1)
        setSelected(null)
        return true
      }
    }
    return false
  }

  function drawStock() {
    if (!game) return
    saveHist()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      const drawCount = ng.drawMode || 1
      if (ng.stock.length===0) {
        // Draw 3: shuffle waste on reset — harder, more casino-like
        // Draw 1: reverse order (standard Klondike)
        const resetCards = ng.waste.map(c => ({...c, faceUp:false}))
        if (ng.drawMode === 3) {
          for (let i = resetCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [resetCards[i], resetCards[j]] = [resetCards[j], resetCards[i]]
          }
          ng.stock = resetCards
        } else {
          ng.stock = [...resetCards].reverse()
        }
        ng.waste = []
      } else {
        const toDraw = Math.min(drawCount, ng.stock.length)
        for (let i = 0; i < toDraw; i++) {
          const card = ng.stock.pop()
          card.faceUp = true
          ng.waste.push(card)
        }
      }
      return ng
    })
    setMoves(m => m+1)
    setSelected(null)
  }

  function handleWaste() {
    if (!game) return
    const top = game.waste[game.waste.length-1]
    if (!top) return
    const now = Date.now()
    const key = 'waste'
    if (now - (lastClickTime[key]||0) < 350) {
      setLastClickTime(l => ({...l, [key]:0}))
      tryAutoFoundation(top, 'waste', null, null)
      return
    }
    setLastClickTime(l => ({...l, [key]:now}))
    if (selected?.source.type==='waste') { setSelected(null); return }
    setSelected({ card:top, source:{type:'waste'}, cards:[top] })
  }

  function handleFoundation(fi) {
    if (!selected || selected.cards.length>1) return
    const card = selected.cards[0]
    if (!canPlaceOnFoundation(card, game.foundations[fi], fi)) return
    saveHist()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (selected.source.type==='waste') ng.waste.pop()
      else if (selected.source.type==='tableau') {
        ng.tableau[selected.source.col].pop()
        const c = ng.tableau[selected.source.col]
        if (c.length>0 && !c[c.length-1].faceUp) c[c.length-1].faceUp = true
      }
      ng.foundations[fi].push(card)
      if (checkWin(ng.foundations)) setWon(true)
      return ng
    })
    setScore(s => s+15)
    setMoves(m => m+1)
    setSelected(null)
  }

  function handleTableau(colIdx, cardIdx) {
    if (!game) return
    const col = game.tableau[colIdx]
    const card = col[cardIdx]
    if (!card.faceUp) {
      if (cardIdx !== col.length-1) return
      saveHist()
      setGame(g => {
        const ng = JSON.parse(JSON.stringify(g))
        ng.tableau[colIdx][cardIdx].faceUp = true
        return ng
      })
      setScore(s => s+5)
      setMoves(m => m+1)
      setSelected(null)
      return
    }
    const now = Date.now()
    const key = `${colIdx}-${cardIdx}`
    const isTopCard = cardIdx === col.length-1
    if (isTopCard && now - (lastClickTime[key]||0) < 350) {
      setLastClickTime(l => ({...l, [key]:0}))
      tryAutoFoundation(card, 'tableau', colIdx, cardIdx)
      return
    }
    setLastClickTime(l => ({...l, [key]:now}))
    if (selected) {
      if (selected.source.type==='tableau' && selected.source.col===colIdx && cardIdx>=selected.source.cardIdx) {
        setSelected(null); return
      }
      const movingCards = selected.cards
      if (canPlaceOnTableau(movingCards[0], col)) {
        saveHist()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          if (selected.source.type==='waste') {
            ng.waste.pop()
          } else if (selected.source.type==='tableau') {
            ng.tableau[selected.source.col] = ng.tableau[selected.source.col].slice(0, selected.source.cardIdx)
            const src = ng.tableau[selected.source.col]
            if (src.length>0 && !src[src.length-1].faceUp) src[src.length-1].faceUp = true
          }
          ng.tableau[colIdx].push(...movingCards)
          return ng
        })
        setScore(s => s+5)
        setMoves(m => m+1)
        setSelected(null)
        return
      }
      setSelected(null)
      return
    }
    setSelected({ card, cards:col.slice(cardIdx), source:{type:'tableau', col:colIdx, cardIdx} })
  }

  function handleEmptyCol(colIdx) {
    if (!selected || selected.cards[0].value !== 'K') return
    saveHist()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (selected.source.type==='waste') {
        ng.waste.pop()
      } else if (selected.source.type==='tableau') {
        ng.tableau[selected.source.col] = ng.tableau[selected.source.col].slice(0, selected.source.cardIdx)
        const src = ng.tableau[selected.source.col]
        if (src.length>0 && !src[src.length-1].faceUp) src[src.length-1].faceUp = true
      }
      ng.tableau[colIdx].push(...selected.cards)
      return ng
    })
    setMoves(m => m+1)
    setSelected(null)
  }

  const isSel = (col,idx) => selected?.source.type==='tableau' && selected.source.col===col && idx>=selected.source.cardIdx
  const wasteSel = selected?.source.type==='waste'
  const isMobile = layout.vw < 600

  function colHeight(col) {
    if (col.length === 0) return H
    const faceDown = col.filter(c => !c.faceUp).length
    const faceUp = col.filter(c => c.faceUp).length
    return faceDown * faceDownH + faceUp * faceUpOverlap + H
  }

  // Draw 3 waste display — show up to 3 fanned cards, only top is clickable
  function renderWaste() {
    if (!game) return null
    const drawMode = game.drawMode || 1
    const waste = game.waste
    if (waste.length === 0) return <Slot label="" W={W} H={H} />

    if (drawMode === 1) {
      return <Card card={waste[waste.length-1]} selected={wasteSel} W={W} H={H} fs={fs} ss={ss} />
    }

    // Draw 3 — show up to last 3 fanned
    const visible = waste.slice(-3)
    const fanOffset = Math.round(W * 0.22)
    const totalW = W + (visible.length - 1) * fanOffset
    return (
      <div style={{ position:'relative', width:totalW, height:H, flexShrink:0 }} onClick={handleWaste}>
        {visible.map((card, i) => {
          const isTop = i === visible.length - 1
          return (
            <div key={card.id} style={{ position:'absolute', left: i * fanOffset, zIndex: i }}>
              <Card
                card={card}
                selected={isTop && wasteSel}
                W={W} H={H} fs={fs} ss={ss}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Show new game dialog on first load
  if (showNewGameDialog) {
    return <NewGameDialog onStart={startNewGame} showCancel={false} onCancel={() => {}} />
  }

  if (!game) return null

  return (
    <div style={{ paddingTop:56, height:'100vh', display:'flex', flexDirection:'column', background:'#0d4a2a', overflow:'hidden', userSelect:'none' }}>

      {won && <Confetti />}

      {/* New game dialog */}
      {showNewGameDialog && (
        <NewGameDialog
          onStart={startNewGame}
          onCancel={() => setShowNewGameDialog(false)}
          showCancel={true}
        />
      )}

      {/* Stuck dialog */}
      {showStuck && !won && (
        <StuckDialog
          onNewGame={() => setShowNewGameDialog(true)}
          onUndo={() => { undo(); setShowStuck(false) }}
          canUndo={history.length > 0}
        />
      )}

      {/* Win overlay */}
      {won && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'linear-gradient(135deg,#1a3d28,#0f2a1a)', border:'2px solid #c9a84c', borderRadius:20, padding:'2.5rem 2rem', textAlign:'center', maxWidth:380, width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'0.75rem' }}>🏆</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#c9a84c', marginBottom:'0.25rem' }}>You Won!</h2>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.82rem', marginBottom:'0.5rem' }}>
              {game.drawMode === 3 ? '🔥 Draw 3 — impressive!' : 'Draw 1'}
            </p>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.85rem', marginBottom:'1rem' }}>
              Score: <strong style={{ color:'#c9a84c' }}>{score}</strong> &nbsp;·&nbsp;
              Moves: <strong style={{ color:'#c9a84c' }}>{moves}</strong> &nbsp;·&nbsp;
              Time: <strong style={{ color:'#c9a84c' }}>{fmt(time)}</strong>
            </p>
            {percentiles && (
              <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:12, padding:'0.85rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'1rem', justifyContent:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.4rem', fontWeight:800, color: percentiles.time <= 25 ? '#5DCAA5' : percentiles.time <= 50 ? '#c9a84c' : 'rgba(245,240,232,0.6)' }}>
                    Top {Math.max(1, percentiles.time)}%
                  </div>
                  <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginTop:2 }}>Speed</div>
                </div>
                {percentiles.moves !== null && (
                  <div style={{ textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:'1rem' }}>
                    <div style={{ fontSize:'1.4rem', fontWeight:800, color: percentiles.moves <= 25 ? '#5DCAA5' : percentiles.moves <= 50 ? '#c9a84c' : 'rgba(245,240,232,0.6)' }}>
                      Top {Math.max(1, percentiles.moves)}%
                    </div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginTop:2 }}>Efficiency</div>
                  </div>
                )}
                <div style={{ textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:'1rem' }}>
                  <div style={{ fontSize:'1.4rem', fontWeight:800, color: percentiles.score >= 75 ? '#5DCAA5' : percentiles.score >= 50 ? '#c9a84c' : 'rgba(245,240,232,0.6)' }}>
                    Top {Math.max(1, 100 - percentiles.score)}%
                  </div>
                  <div style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.4)', marginTop:2 }}>Score</div>
                </div>
              </div>
            )}
            {percentiles && (
              <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.3)', marginBottom:'1rem' }}>
                Based on {percentiles.totalGames} completed games
              </p>
            )}
            {!percentiles && resultSaved && (
              <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', textAlign:'center' }}>
                <p style={{ fontSize:'0.8rem', color:'rgba(245,240,232,0.6)', marginBottom:4 }}>🔒 Percentile ranking locked</p>
                <p style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.35)' }}>
                  {totalWins >= 2 ? 'Play 1 more game to unlock!' : totalWins >= 1 ? 'Play 2 more games to unlock!' : 'Play 3 games to unlock your percentile ranking!'}
                </p>
                <div style={{ marginTop:8, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
                  <div style={{ height:4, background:'#c9a84c', borderRadius:2, width:`${Math.min(100,(totalWins/3)*100)}%`, transition:'width 0.5s' }} />
                </div>
                <p style={{ fontSize:'0.62rem', color:'rgba(245,240,232,0.25)', marginTop:4 }}>{totalWins}/3 wins</p>
              </div>
            )}
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={() => setShowNewGameDialog(true)}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`0 ${isMobile?'0.6rem':'1.25rem'}`, height:44, background:'rgba(0,0,0,0.35)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <Link to="/lobby" style={{ color:'rgba(245,240,232,0.45)', fontSize:'0.8rem', textDecoration:'none' }}>← Back</Link>
          {!isMobile && (
            <span style={{ fontFamily:"'Playfair Display',serif", color:'#c9a84c', fontWeight:700 }}>
              ♣ Solitaire
              <span style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.35)', marginLeft:6, fontFamily:'sans-serif', fontWeight:400 }}>
                Draw {game.drawMode || 1}
              </span>
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:isMobile?'0.6rem':'1.25rem', alignItems:'center' }}>
          {[['Score',score],['Moves',moves],['Time',fmt(time)]].map(([l,v]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.55rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
              <div style={{ fontSize:isMobile?'0.8rem':'0.95rem', fontWeight:700, color:'#f5f0e8' }}>{v}</div>
            </div>
          ))}
          <button onClick={undo} disabled={!history.length} style={{ padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', color:history.length?'#f5f0e8':'rgba(245,240,232,0.3)', cursor:history.length?'pointer':'not-allowed' }}>↩ Undo</button>
          <button onClick={() => setShowNewGameDialog(true)} style={{ padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', background:'#c9a84c', border:'none', color:'#1a1a1a', fontWeight:700, cursor:'pointer' }}>New</button>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, overflow:'auto', padding:`${isMobile?'0.5rem':'0.75rem'} ${isMobile?'0.4rem':'0.75rem'}` }}>

          {/* Top row */}
          <div style={{ display:'flex', gap:gap, marginBottom:isMobile?'0.5rem':'0.75rem', alignItems:'flex-start', width:'100%' }}>
            {/* Stock */}
            <div onClick={drawStock} style={{ cursor:'pointer', flex:1, maxWidth:W, position:'relative' }}>
              {game.stock.length > 0
                ? <Card card={{faceUp:false}} W={W} H={H} fs={fs} ss={ss} />
                : <Slot label="↺" onClick={drawStock} W={W} H={H} />
              }
              <div style={{ textAlign:'center', fontSize:'0.55rem', color:'rgba(245,240,232,0.3)', marginTop:2 }}>
                {game.stock.length > 0 ? game.stock.length : 'Reset'}
              </div>
            </div>

            {/* Waste */}
            <div onClick={game.drawMode === 1 ? handleWaste : undefined} style={{ cursor:'pointer', flex:1, maxWidth: game.drawMode === 3 ? W * 1.5 : W }}>
              {renderWaste()}
            </div>

            {/* Spacer */}
            <div style={{ flex:1, maxWidth:W }} />

            {/* Foundations */}
            {game.foundations.map((f, fi) => (
              <div key={fi} onClick={() => handleFoundation(fi)} style={{ cursor:'pointer', flex:1, maxWidth:W }}>
                {f.length > 0
                  ? <Card card={f[f.length-1]} W={W} H={H} fs={fs} ss={ss} />
                  : <Slot label={SUITS[fi]} W={W} H={H} />
                }
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ display:'flex', gap:gap, alignItems:'flex-start', width:'100%' }}>
            {game.tableau.map((col, colIdx) => {
              if (col.length === 0) return (
                <div key={colIdx} style={{ flex:1, maxWidth:W, minWidth:W }}>
                  <Slot label="K" onClick={() => handleEmptyCol(colIdx)} W={W} H={H} />
                </div>
              )
              return (
                <div key={colIdx} style={{ flex:1, maxWidth:W, minWidth:W, position:'relative', height: colHeight(col) + 10 }}>
                  {col.map((card, cardIdx) => {
                    const prevFaceDown = col.slice(0, cardIdx).filter(c => !c.faceUp).length
                    const prevFaceUp = col.slice(0, cardIdx).filter(c => c.faceUp).length
                    const top = prevFaceDown * faceDownH + prevFaceUp * faceUpOverlap
                    return (
                      <div key={card.id} style={{ position:'absolute', top, left:0, zIndex:cardIdx+1 }}
                        onClick={() => handleTableau(colIdx, cardIdx)}>
                        <Card card={card} selected={isSel(colIdx, cardIdx)} W={W} H={H} fs={fs} ss={ss} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        {!isMobile && (
          <div style={{ width:200, background:'rgba(0,0,0,0.3)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'1rem 0.85rem', display:'flex', flexDirection:'column', gap:12, flexShrink:0, overflowY:'auto' }}>
            <div>
              <p style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>Hint</p>
              <HintButton game={game} />
            </div>
            <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'10px' }}>
              <p style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>This game</p>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Mode</span>
                <span style={{ fontSize:'0.78rem', color:'#c9a84c', fontWeight:700 }}>Draw {game.drawMode || 1}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Score</span>
                <span style={{ fontSize:'0.82rem', color:'#c9a84c', fontWeight:700 }}>{score}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Moves</span>
                <span style={{ fontSize:'0.82rem', color:'#c9a84c', fontWeight:700 }}>{moves}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Time</span>
                <span style={{ fontSize:'0.82rem', color:'#c9a84c', fontWeight:700 }}>{fmt(time)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Stock left</span>
                <span style={{ fontSize:'0.82rem', color:'#c9a84c', fontWeight:700 }}>{game.stock.length}</span>
              </div>
            </div>
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px' }}>
              <p style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>Foundation</p>
              {game.foundations.map((f, fi) => (
                <div key={fi} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:'0.82rem', color: fi===1||fi===2 ? '#c0392b' : 'rgba(255,255,255,0.8)' }}>{SUITS[fi]}</span>
                  <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>
                    {f.length === 0 ? '—' : f.length === 13 ? '✅' : 'A → ' + f[f.length-1].value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:6, borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.5)' }}>Progress</span>
                  <span style={{ fontSize:'0.82rem', color:'#5DCAA5', fontWeight:700 }}>{game.foundations.reduce((s,f)=>s+f.length,0)}/52</span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
                  <div style={{ height:4, background:'#5DCAA5', borderRadius:2, width:(game.foundations.reduce((s,f)=>s+f.length,0)/52*100)+'%', transition:'width 0.3s' }} />
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(0,0,0,0.15)', borderRadius:8, padding:'10px' }}>
              <p style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>How to play</p>
              <p style={{ fontSize:'0.7rem', color:'rgba(245,240,232,0.4)', lineHeight:1.5 }}>
                Build 4 piles from A to K by suit. Place cards in descending order, alternating red and black. Only Kings can start empty columns. Double-click to auto-send to foundation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
