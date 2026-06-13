import { useState, useEffect, useCallback } from 'react'
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
  return { tableau, stock:deck.slice(idx).map(c=>({...c,faceUp:false})), waste:[], foundations:[[],[],[],[]] }
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

// ─── Responsive card sizes ────────────────────────────────────────
function useCardSize() {
  const [size, setSize] = useState(() => getSize())
  function getSize() {
    const w = window.innerWidth
    if (w < 400) return { W:42, H:59, fs:9, ss:16, overlap:20 }
    if (w < 600) return { W:50, H:70, fs:10, ss:18, overlap:22 }
    if (w < 900) return { W:62, H:87, fs:11, ss:22, overlap:26 }
    return { W:80, H:112, fs:14, ss:32, overlap:30 }
  }
  useEffect(() => {
    const handler = () => setSize(getSize())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return size
}

// ─── Playing Card ─────────────────────────────────────────────────
function PlayingCard({ card, selected, style={}, onClick, W, H, fs, ss }) {
  if (!card) return null

  if (!card.faceUp) return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border:'1.5px solid rgba(255,255,255,0.2)',
      boxShadow:'0 2px 4px rgba(0,0,0,0.4)',
      cursor:onClick?'pointer':'default', ...style
    }} />
  )

  const col = cardColor(card.suit)
  return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6, flexShrink:0,
      background:selected?'#fffde7':'#ffffff',
      border:selected?`2.5px solid #c9a84c`:'1px solid #ccc',
      boxShadow:selected?'0 0 0 3px rgba(201,168,76,0.4),0 4px 12px rgba(0,0,0,0.3)':'0 2px 6px rgba(0,0,0,0.25)',
      cursor:onClick?'pointer':'default',
      userSelect:'none', position:'relative',
      transform:selected?'translateY(-10px)':'none',
      transition:'transform 0.15s', ...style
    }}>
      <div style={{ position:'absolute', top:2, left:4, lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:ss, color:col, lineHeight:1 }}>{card.suit}</div>
      <div style={{ position:'absolute', bottom:2, right:4, transform:'rotate(180deg)', lineHeight:1.1 }}>
        <div style={{ fontSize:fs, fontWeight:800, color:col, lineHeight:1 }}>{card.value}</div>
        <div style={{ fontSize:fs, color:col, lineHeight:1 }}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Empty Slot ───────────────────────────────────────────────────
function EmptySlot({ label, onClick, W, H }) {
  const isRedSuit = label==='♥'||label==='♦'
  const isBlackSuit = label==='♠'||label==='♣'
  const borderColor = isRedSuit?'rgba(192,57,43,0.6)':isBlackSuit?'rgba(220,220,220,0.5)':'rgba(201,168,76,0.4)'
  const color = isRedSuit?'rgba(192,57,43,0.7)':isBlackSuit?'rgba(220,220,220,0.6)':'rgba(201,168,76,0.5)'
  return (
    <div onClick={onClick} style={{
      width:W, height:H, borderRadius:6,
      border:`2px dashed ${borderColor}`,
      background:'rgba(255,255,255,0.04)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color, fontSize:H>80?'1.5rem':'1rem', cursor:onClick?'pointer':'default', flexShrink:0,
    }}>{label}</div>
  )
}

// ─── Main Game ────────────────────────────────────────────────────
export default function Solitaire() {
  const [game, setGame] = useState(()=>dealGame())
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState([])
  const [resultSaved, setResultSaved] = useState(false)
  const { W, H, fs, ss, overlap } = useCardSize()

  useEffect(() => {
    if (!won || resultSaved) return
    saveGameResult('solitaire', true, score, 15, { moves, duration_seconds: time })
    setResultSaved(true)
  }, [won, resultSaved, score, moves, time])

  useEffect(() => {
    if (won) return
    const t = setInterval(()=>setTime(s=>s+1),1000)
    return ()=>clearInterval(t)
  }, [won])

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  function saveHistory() { setHistory(h=>[...h,JSON.parse(JSON.stringify(game))]) }

  function undo() {
    if (!history.length) return
    setGame(history[history.length-1])
    setHistory(h=>h.slice(0,-1))
    setMoves(m=>Math.max(0,m-1))
  }

  function newGame() {
    setGame(dealGame()); setSelected(null)
    setMoves(0); setScore(0); setTime(0)
    setWon(false); setHistory([]); setResultSaved(false)
  }

  function drawFromStock() {
    saveHistory()
    setGame(g=>{
      const ng = JSON.parse(JSON.stringify(g))
      if (ng.stock.length===0) {
        ng.stock = ng.waste.reverse().map(c=>({...c,faceUp:false}))
        ng.waste = []
      } else {
        const card = ng.stock.pop()
        card.faceUp = true
        ng.waste.push(card)
      }
      return ng
    })
    setMoves(m=>m+1); setSelected(null)
  }

  function handleWasteClick() {
    const top = game.waste[game.waste.length-1]
    if (!top) return
    if (selected?.source.type==='waste') { setSelected(null); return }
    setSelected({card:top, source:{type:'waste'}, cards:[top]})
  }

  function handleFoundationClick(fi) {
    if (!selected) return
    const card = selected.cards[0]
    if (selected.cards.length>1) return
    if (canPlaceOnFoundation(card, game.foundations[fi], fi)) {
      saveHistory()
      setGame(g=>{
        const ng = JSON.parse(JSON.stringify(g))
        if (selected.source.type==='waste') ng.waste.pop()
        else if (selected.source.type==='tableau') {
          ng.tableau[selected.source.col].pop()
          const col = ng.tableau[selected.source.col]
          if (col.length>0 && !col[col.length-1].faceUp) col[col.length-1].faceUp=true
        }
        ng.foundations[fi].push(card)
        if (checkWin(ng.foundations)) setWon(true)
        return ng
      })
      setScore(s=>s+10); setMoves(m=>m+1); setSelected(null)
    }
  }

  function handleTableauClick(colIdx, cardIdx) {
    const col = game.tableau[colIdx]
    const card = col[cardIdx]

    if (!card.faceUp) {
      if (cardIdx===col.length-1) {
        saveHistory()
        setGame(g=>{
          const ng=JSON.parse(JSON.stringify(g))
          ng.tableau[colIdx][cardIdx].faceUp=true
          return ng
        })
        setScore(s=>s+5); setMoves(m=>m+1)
      }
      return
    }

    if (selected) {
      if (selected.source.type==='tableau'&&selected.source.col===colIdx) { setSelected(null); return }
      const movingCards = selected.cards
      if (canPlaceOnTableau(movingCards[0], game.tableau[colIdx])) {
        saveHistory()
        setGame(g=>{
          const ng=JSON.parse(JSON.stringify(g))
          if (selected.source.type==='waste') ng.waste.pop()
          else if (selected.source.type==='tableau') {
            ng.tableau[selected.source.col]=ng.tableau[selected.source.col].slice(0,selected.source.cardIdx)
            const src=ng.tableau[selected.source.col]
            if (src.length>0&&!src[src.length-1].faceUp) src[src.length-1].faceUp=true
          }
          ng.tableau[colIdx].push(...movingCards)
          return ng
        })
        setScore(s=>s+5); setMoves(m=>m+1); setSelected(null)
        return
      }
      setSelected(null); return
    }
    setSelected({card, cards:col.slice(cardIdx), source:{type:'tableau',col:colIdx,cardIdx}})
  }

  function handleEmptyTableauClick(colIdx) {
    if (!selected||selected.cards[0].value!=='K') return
    saveHistory()
    setGame(g=>{
      const ng=JSON.parse(JSON.stringify(g))
      if (selected.source.type==='waste') ng.waste.pop()
      else if (selected.source.type==='tableau') {
        ng.tableau[selected.source.col]=ng.tableau[selected.source.col].slice(0,selected.source.cardIdx)
        const src=ng.tableau[selected.source.col]
        if (src.length>0&&!src[src.length-1].faceUp) src[src.length-1].faceUp=true
      }
      ng.tableau[colIdx].push(...selected.cards)
      return ng
    })
    setMoves(m=>m+1); setSelected(null)
  }

  // Auto-send to foundation on double-tap/click
  function handleAutoFoundation(card, sourceType, sourceCol) {
    for (let fi=0;fi<4;fi++) {
      if (canPlaceOnFoundation(card, game.foundations[fi], fi)) {
        saveHistory()
        setGame(g=>{
          const ng=JSON.parse(JSON.stringify(g))
          if (sourceType==='waste') ng.waste.pop()
          else if (sourceType==='tableau') {
            ng.tableau[sourceCol].pop()
            const col=ng.tableau[sourceCol]
            if (col.length>0&&!col[col.length-1].faceUp) col[col.length-1].faceUp=true
          }
          ng.foundations[fi].push(card)
          if (checkWin(ng.foundations)) setWon(true)
          return ng
        })
        setScore(s=>s+10); setMoves(m=>m+1); setSelected(null)
        return true
      }
    }
    return false
  }

  const isSelected = (col,idx) => selected?.source.type==='tableau'&&selected.source.col===col&&idx>=selected.source.cardIdx
  const wasteSelected = selected?.source.type==='waste'
  const isMobile = window.innerWidth < 600

  return (
    <div style={{ paddingTop:64, height:'100vh', display:'flex', flexDirection:'column', background:'#0f2219', overflow:'hidden' }}>

      {/* Win overlay */}
      {won && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#234d38', border:'2px solid #c9a84c', borderRadius:20, padding:'2.5rem', textAlign:'center', maxWidth:380, width:'90%' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🏆</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'#c9a84c', marginBottom:'0.5rem' }}>You Won!</h2>
            <p style={{ color:'rgba(245,240,232,0.7)', marginBottom:'1.5rem' }}>Score: {score} · Moves: {moves} · Time: {formatTime(time)}</p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={newGame}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`0.5rem ${isMobile?'0.75rem':'1.5rem'}`, background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <Link to="/lobby" style={{ color:'rgba(245,240,232,0.5)', fontSize:'0.8rem', textDecoration:'none' }}>← Back</Link>
          {!isMobile && <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:700, color:'#f5f0e8' }}>♣ Solitaire</h1>}
        </div>
        <div style={{ display:'flex', gap:isMobile?'0.75rem':'1.5rem', alignItems:'center' }}>
          {[['Score',score],['Moves',moves],['Time',formatTime(time)]].map(([l,v])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
              <div style={{ fontSize:isMobile?'0.85rem':'1rem', fontWeight:600, color:'#f5f0e8' }}>{v}</div>
            </div>
          ))}
          <button onClick={undo} className="btn-outline" style={{ padding:isMobile?'0.3rem 0.6rem':'0.35rem 0.8rem', fontSize:'0.75rem' }}>↩</button>
          <button onClick={newGame} className="btn-gold" style={{ padding:isMobile?'0.3rem 0.6rem':'0.35rem 0.8rem', fontSize:'0.75rem' }}>New</button>
        </div>
      </div>

      {/* Game board */}
      <div style={{ flex:1, overflow:'auto', padding:`0.75rem ${isMobile?'0.4rem':'1rem'}` }}>
        <div>
          {/* Top row: stock + waste + spacer + foundations */}
          <div style={{ display:'flex', gap:isMobile?'0.3rem':'0.5rem', marginBottom:isMobile?'0.75rem':'1rem', alignItems:'flex-start' }}>
            {/* Stock */}
            <div onClick={drawFromStock} style={{ cursor:'pointer', position:'relative', flexShrink:0 }}>
              {game.stock.length>0
                ? <PlayingCard card={{faceUp:false}} W={W} H={H} fs={fs} ss={ss} />
                : <EmptySlot label="↺" onClick={drawFromStock} W={W} H={H} />
              }
              {!isMobile && (
                <div style={{ position:'absolute', bottom:-16, left:'50%', transform:'translateX(-50%)', fontSize:'0.58rem', color:'rgba(245,240,232,0.35)', whiteSpace:'nowrap' }}>
                  {game.stock.length>0?'Tap to draw':'Tap to reset'}
                </div>
              )}
            </div>
            {/* Waste */}
            <div onClick={handleWasteClick} style={{ cursor:'pointer', flexShrink:0 }}>
              {game.waste.length>0
                ? <PlayingCard card={game.waste[game.waste.length-1]} selected={wasteSelected} W={W} H={H} fs={fs} ss={ss} />
                : <EmptySlot label="" W={W} H={H} />
              }
            </div>
            <div style={{ flex:1 }} />
            {/* Foundations */}
            {game.foundations.map((f,fi)=>(
              <div key={fi} onClick={()=>handleFoundationClick(fi)} style={{ cursor:'pointer', flexShrink:0 }}>
                {f.length>0
                  ? <PlayingCard card={f[f.length-1]} W={W} H={H} fs={fs} ss={ss} />
                  : <EmptySlot label={SUITS[fi]} W={W} H={H} />
                }
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ display:'flex', gap:isMobile?'0.3rem':'0.5rem', alignItems:'flex-start', justifyContent:'space-between' }}>
            {game.tableau.map((col,colIdx)=>(
              <div key={colIdx} style={{ position:'relative', width:W, flexShrink:0, flex:1, maxWidth:isMobile?56:110 }}>
                {col.length===0
                  ? <EmptySlot label="K" onClick={()=>handleEmptyTableauClick(colIdx)} W={W} H={H} />
                  : col.map((card,cardIdx)=>(
                    <div key={card.id} style={{
                      position:cardIdx===0?'relative':'absolute',
                      top:cardIdx===0?0:cardIdx*overlap,
                      zIndex:cardIdx,
                      marginBottom:cardIdx===col.length-1?col.length*overlap+H+10:0,
                    }} onClick={()=>handleTableauClick(colIdx,cardIdx)}>
                      <PlayingCard card={card} selected={isSelected(colIdx,cardIdx)} W={W} H={H} fs={fs} ss={ss} />
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ textAlign:'center', padding:'0.3rem', fontSize:'0.68rem', color:'rgba(245,240,232,0.2)', flexShrink:0 }}>
        {isMobile ? 'Tap to select · Tap again to move · Tap deck to draw' : 'Click to select · Click destination to move · Click deck to draw'}
      </div>
    </div>
  )
}
