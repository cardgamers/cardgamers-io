import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { saveGameResult } from '../lib/saveGameResult'

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

function dealGame() {
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
    foundations: [[],[],[],[]]
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

// ─── Responsive sizing ────────────────────────────────────────────
function useLayout() {
  const [layout, setLayout] = useState(() => calcLayout())
  function calcLayout() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Card width based on viewport — 7 columns + 6 gaps must fit
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
  const isRed = label==='♥'||label==='♦'
  const isBlack = label==='♠'||label==='♣'
  const bc = isRed ? 'rgba(192,57,43,0.5)' : isBlack ? 'rgba(200,200,200,0.4)' : 'rgba(201,168,76,0.35)'
  const tc = isRed ? 'rgba(192,57,43,0.6)' : isBlack ? 'rgba(200,200,200,0.5)' : 'rgba(201,168,76,0.5)'
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

// ─── Hint engine ─────────────────────────────────────────────────
function findHint(game) {
  const { tableau, waste, foundations } = game

  // 1. Move waste top to foundation
  if (waste.length > 0) {
    const card = waste[waste.length-1]
    for (let fi=0; fi<4; fi++) {
      if (canPlaceOnFoundation(card, foundations[fi], fi)) {
        return `Move ${card.value}${card.suit} from waste → foundation`
      }
    }
  }

  // 2. Move tableau top card to foundation
  for (let ci=0; ci<7; ci++) {
    const col = tableau[ci]
    if (!col.length) continue
    const card = col[col.length-1]
    if (!card.faceUp) continue
    for (let fi=0; fi<4; fi++) {
      if (canPlaceOnFoundation(card, foundations[fi], fi)) {
        return `Move ${card.value}${card.suit} from column ${ci+1} → foundation`
      }
    }
  }

  // 3. Move waste to tableau
  if (waste.length > 0) {
    const card = waste[waste.length-1]
    for (let ci=0; ci<7; ci++) {
      if (canPlaceOnTableau(card, tableau[ci])) {
        return `Move ${card.value}${card.suit} from waste → column ${ci+1}`
      }
    }
  }

  // 4. Move between tableau columns
  for (let from=0; from<7; from++) {
    const col = tableau[from]
    for (let ci=col.length-1; ci>=0; ci--) {
      if (!col[ci].faceUp) break
      const card = col[ci]
      for (let to=0; to<7; to++) {
        if (to===from) continue
        if (canPlaceOnTableau(card, tableau[to])) {
          // Only suggest if it uncovers a face-down card or moves a King to empty
          if (ci > 0 && !col[ci-1].faceUp) {
            return `Move ${card.value}${card.suit} from column ${from+1} → column ${to+1}`
          }
          if (card.value==='K' && tableau[to].length===0 && col.length > 1) {
            return `Move K${card.suit} to empty column ${to+1}`
          }
        }
      }
    }
  }

  // 5. Draw from stock
  if (game.stock.length > 0) return 'Draw from stock'
  if (game.waste.length > 0) return 'Reset stock and draw'

  return 'No obvious moves — try undoing some moves'
}

function HintButton({ game }) {
  const [hint, setHint] = useState(null)
  const [showing, setShowing] = useState(false)

  function showHint() {
    const h = findHint(game)
    setHint(h)
    setShowing(true)
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

// ─── Main Solitaire ───────────────────────────────────────────────
export default function Solitaire() {
  const [game, setGame] = useState(() => dealGame())
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState([])
  const [resultSaved, setResultSaved] = useState(false)
  const [lastClickTime, setLastClickTime] = useState({})
  const layout = useLayout()
  const { W, H, fs, ss, faceDownH, faceUpOverlap, gap } = layout

  useEffect(() => {
    if (!won || resultSaved) return
    saveGameResult('solitaire', true, score, 15, { moves, duration_seconds: time })
    setResultSaved(true)
  }, [won, resultSaved, score, moves, time])

  useEffect(() => {
    if (won) return
    const t = setInterval(() => setTime(s => s+1), 1000)
    return () => clearInterval(t)
  }, [won])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  function saveHist() { setHistory(h => [...h, JSON.parse(JSON.stringify(game))]) }

  function undo() {
    if (!history.length) return
    setGame(history[history.length-1])
    setHistory(h => h.slice(0,-1))
    setSelected(null)
  }

  function newGame() {
    setGame(dealGame()); setSelected(null)
    setMoves(0); setScore(0); setTime(0)
    setWon(false); setHistory([]); setResultSaved(false)
  }

  // Auto-move to foundation
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
    saveHist()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (ng.stock.length===0) {
        ng.stock = [...ng.waste].reverse().map(c => ({...c, faceUp:false}))
        ng.waste = []
      } else {
        const card = ng.stock.pop()
        card.faceUp = true
        ng.waste.push(card)
      }
      return ng
    })
    setMoves(m => m+1)
    setSelected(null)
  }

  function handleWaste() {
    const top = game.waste[game.waste.length-1]
    if (!top) return

    const now = Date.now()
    const key = 'waste'
    if (now - (lastClickTime[key]||0) < 350) {
      // Double click — auto to foundation
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
    const col = game.tableau[colIdx]
    const card = col[cardIdx]

    // Flip face-down card
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

    // Double click on top card — auto to foundation
    if (isTopCard && now - (lastClickTime[key]||0) < 350) {
      setLastClickTime(l => ({...l, [key]:0}))
      tryAutoFoundation(card, 'tableau', colIdx, cardIdx)
      return
    }
    setLastClickTime(l => ({...l, [key]:now}))

    // Move selected cards here
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

    // Select this card/stack
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

  // Calculate tableau column heights for proper layout
  function colHeight(col) {
    if (col.length === 0) return H
    const faceDown = col.filter(c => !c.faceUp).length
    const faceUp = col.filter(c => c.faceUp).length
    return faceDown * faceDownH + faceUp * faceUpOverlap + H
  }

  return (
    <div style={{ paddingTop:56, height:'100vh', display:'flex', flexDirection:'column', background:'#0d4a2a', overflow:'hidden', userSelect:'none' }}>

      {won && <Confetti />}

      {/* Win overlay */}
      {won && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'linear-gradient(135deg,#1a3d28,#0f2a1a)', border:'2px solid #c9a84c', borderRadius:20, padding:'2.5rem 2rem', textAlign:'center', maxWidth:380, width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'0.75rem' }}>🏆</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#c9a84c', marginBottom:'0.25rem' }}>You Won!</h2>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.85rem', marginBottom:'1.5rem' }}>
              Score: <strong style={{ color:'#c9a84c' }}>{score}</strong> &nbsp;·&nbsp;
              Moves: <strong style={{ color:'#c9a84c' }}>{moves}</strong> &nbsp;·&nbsp;
              Time: <strong style={{ color:'#c9a84c' }}>{fmt(time)}</strong>
            </p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={newGame}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`0 ${isMobile?'0.6rem':'1.25rem'}`, height:44, background:'rgba(0,0,0,0.35)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <Link to="/lobby" style={{ color:'rgba(245,240,232,0.45)', fontSize:'0.8rem', textDecoration:'none' }}>← Back</Link>
          {!isMobile && <span style={{ fontFamily:"'Playfair Display',serif", color:'#c9a84c', fontWeight:700 }}>♣ Solitaire</span>}
        </div>
        <div style={{ display:'flex', gap:isMobile?'0.6rem':'1.25rem', alignItems:'center' }}>
          {[['Score',score],['Moves',moves],['Time',fmt(time)]].map(([l,v]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.55rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
              <div style={{ fontSize:isMobile?'0.8rem':'0.95rem', fontWeight:700, color:'#f5f0e8' }}>{v}</div>
            </div>
          ))}
          <button onClick={undo} disabled={!history.length} style={{ padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', color:history.length?'#f5f0e8':'rgba(245,240,232,0.3)', cursor:history.length?'pointer':'not-allowed' }}>↩ Undo</button>
          <button onClick={newGame} style={{ padding:'4px 10px', borderRadius:6, fontSize:'0.75rem', background:'#c9a84c', border:'none', color:'#1a1a1a', fontWeight:700, cursor:'pointer' }}>New</button>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, overflow:'auto', padding:`${isMobile?'0.5rem':'0.75rem'} ${isMobile?'0.4rem':'0.75rem'}` }}>

        {/* Top row */}
        <div style={{ display:'flex', gap:gap, marginBottom:isMobile?'0.5rem':'0.75rem', alignItems:'center', width:'100%' }}>

          {/* Stock */}
          <div onClick={drawStock} style={{ cursor:'pointer', flexShrink:0, position:'relative' }}>
            {game.stock.length > 0
              ? <Card card={{faceUp:false}} W={W} H={H} fs={fs} ss={ss} />
              : <Slot label="↺" onClick={drawStock} W={W} H={H} />
            }
            <div style={{ position:'absolute', bottom:-14, left:'50%', transform:'translateX(-50%)', fontSize:'0.55rem', color:'rgba(245,240,232,0.3)', whiteSpace:'nowrap' }}>
              {game.stock.length > 0 ? game.stock.length : 'Reset'}
            </div>
          </div>

          {/* Waste — show top card clearly */}
          <div style={{ position:'relative', width:W, height:H, flexShrink:0 }} onClick={handleWaste}>
            {game.waste.length === 0
              ? <Slot label="" W={W} H={H} />
              : <Card card={game.waste[game.waste.length-1]} selected={wasteSel} W={W} H={H} fs={fs} ss={ss} />
            }
          </div>

          {/* Spacer — 3 column widths to align foundations above cols 4-7 */}
          <div style={{ flex:1 }} />

          {/* Foundations — 4 slots aligned above right 4 tableau columns */}
          {game.foundations.map((f, fi) => (
            <div key={fi} onClick={() => handleFoundation(fi)} style={{ cursor:'pointer', flexShrink:0, flex:1, maxWidth:W }}>
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
                      <Card
                        card={card}
                        selected={isSel(colIdx, cardIdx)}
                        W={W} H={H} fs={fs} ss={ss}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        </div>{/* end tableau scroll */}

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