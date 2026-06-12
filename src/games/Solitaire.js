import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ─── Card utilities ───────────────────────────────────────────────
const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function isRed(suit) { return RED_SUITS.includes(suit) }
function cardColor(suit) { return isRed(suit) ? '#c0392b' : '#1a1a2e' }
function cardValue(val) { return VALUES.indexOf(val) }

function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ suit, value, id: `${value}${suit}`, faceUp: false })
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function dealGame() {
  const deck = shuffle(createDeck())
  const tableau = Array.from({ length: 7 }, () => [])
  let idx = 0
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] }
      card.faceUp = row === col
      tableau[col].push(card)
    }
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }))
  return { tableau, stock, waste: [], foundations: [[], [], [], []] }
}

// Each foundation index maps to a suit: 0=♠ 1=♥ 2=♦ 3=♣
const FOUNDATION_SUITS = ['♠', '♥', '♦', '♣']

function canPlaceOnFoundation(card, foundation, foundationIndex) {
  const requiredSuit = FOUNDATION_SUITS[foundationIndex]
  if (foundation.length === 0) return card.value === 'A' && card.suit === requiredSuit
  const top = foundation[foundation.length - 1]
  return top.suit === card.suit && cardValue(card.value) === cardValue(top.value) + 1
}

function canPlaceOnTableau(card, column) {
  if (column.length === 0) return card.value === 'K'
  const top = column[column.length - 1]
  if (!top.faceUp) return false
  return isRed(card.suit) !== isRed(top.suit) && cardValue(card.value) === cardValue(top.value) - 1
}

function checkWin(foundations) {
  return foundations.every(f => f.length === 13)
}

// ─── Playing Card ─────────────────────────────────────────────────
function PlayingCard({ card, selected = false, style = {}, onClick }) {
  if (!card) return null
  const W = 80, H = 112

  if (!card.faceUp) {
    return (
      <div onClick={onClick} style={{
        width: W, height: H, borderRadius: 8,
        background: 'linear-gradient(135deg, #1a3a6a 0%, #0f2245 100%)',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 10px)',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0, ...style,
      }} />
    )
  }

  return (
    <div onClick={onClick} style={{
      width: W, height: H, borderRadius: 8,
      background: selected ? '#fffde7' : '#ffffff',
      border: selected ? '2.5px solid #c9a84c' : '1px solid #ccc',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.4), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.25)',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none', flexShrink: 0, position: 'relative',
      transform: selected ? 'translateY(-10px)' : 'none',
      transition: 'transform 0.15s, box-shadow 0.15s',
      ...style,
    }}>
      {/* Top left */}
      <div style={{ position: 'absolute', top: 5, left: 7, lineHeight: 1.1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: 13, color: cardColor(card.suit), lineHeight: 1 }}>{card.suit}</div>
      </div>
      {/* Center suit */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 36, color: cardColor(card.suit), lineHeight: 1 }}>
        {card.suit}
      </div>
      {/* Bottom right */}
      <div style={{ position: 'absolute', bottom: 5, right: 7, lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: 13, color: cardColor(card.suit), lineHeight: 1 }}>{card.suit}</div>
      </div>
    </div>
  )
}

// ─── Empty Slot ───────────────────────────────────────────────────
function EmptySlot({ label, onClick }) {
  const isRed = label === '♥' || label === '♦'
  const isBlack = label === '♠' || label === '♣'
  const borderColor = isRed ? 'rgba(192,57,43,0.6)' : isBlack ? 'rgba(220,220,220,0.5)' : 'rgba(201,168,76,0.4)'
  const color = isRed ? 'rgba(192,57,43,0.7)' : isBlack ? 'rgba(220,220,220,0.6)' : 'rgba(201,168,76,0.5)'
  return (
    <div onClick={onClick} style={{
      width: 80, height: 112, borderRadius: 8,
      border: `2px dashed ${borderColor}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: '2rem', cursor: onClick ? 'pointer' : 'default',
      flexShrink: 0,
    }}>
      {label}
    </div>
  )
}

// ─── Main Game ────────────────────────────────────────────────────
export default function Solitaire() {
  const [game, setGame] = useState(() => dealGame())
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (won) return
    const t = setInterval(() => setTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [won])

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function saveHistory() {
    setHistory(h => [...h, JSON.parse(JSON.stringify(game))])
  }

  function undo() {
    if (history.length === 0) return
    setGame(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
    setMoves(m => Math.max(0, m - 1))
  }

  function newGame() {
    setGame(dealGame())
    setSelected(null)
    setMoves(0); setScore(0); setTime(0)
    setWon(false); setHistory([])
  }

  function drawFromStock() {
    saveHistory()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (ng.stock.length === 0) {
        ng.stock = ng.waste.reverse().map(c => ({ ...c, faceUp: false }))
        ng.waste = []
      } else {
        const card = ng.stock.pop()
        card.faceUp = true
        ng.waste.push(card)
      }
      return ng
    })
    setMoves(m => m + 1)
    setSelected(null)
  }

  function handleWasteClick() {
    const wasteTop = game.waste[game.waste.length - 1]
    if (!wasteTop) return
    if (selected?.source.type === 'waste') { setSelected(null); return }
    setSelected({ card: wasteTop, source: { type: 'waste' }, cards: [wasteTop] })
  }

  function handleFoundationClick(fi) {
    if (!selected) return
    const card = selected.cards[0]
    if (selected.cards.length > 1) return
    if (canPlaceOnFoundation(card, game.foundations[fi], fi)) {
      saveHistory()
      setGame(g => {
        const ng = JSON.parse(JSON.stringify(g))
        if (selected.source.type === 'waste') ng.waste.pop()
        else if (selected.source.type === 'tableau') {
          ng.tableau[selected.source.col].pop()
          const col = ng.tableau[selected.source.col]
          if (col.length > 0 && !col[col.length - 1].faceUp) col[col.length - 1].faceUp = true
        }
        ng.foundations[fi].push(card)
        if (checkWin(ng.foundations)) setWon(true)
        return ng
      })
      setScore(s => s + 10)
      setMoves(m => m + 1)
      setSelected(null)
    }
  }

  function handleTableauClick(colIdx, cardIdx) {
    const col = game.tableau[colIdx]
    const card = col[cardIdx]

    if (!card.faceUp) {
      if (cardIdx === col.length - 1) {
        saveHistory()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          ng.tableau[colIdx][cardIdx].faceUp = true
          return ng
        })
        setScore(s => s + 5)
        setMoves(m => m + 1)
      }
      return
    }

    if (selected) {
      if (selected.source.type === 'tableau' && selected.source.col === colIdx) { setSelected(null); return }
      const movingCards = selected.cards
      if (canPlaceOnTableau(movingCards[0], game.tableau[colIdx])) {
        saveHistory()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          if (selected.source.type === 'waste') ng.waste.pop()
          else if (selected.source.type === 'tableau') {
            ng.tableau[selected.source.col] = ng.tableau[selected.source.col].slice(0, selected.source.cardIdx)
            const newSrc = ng.tableau[selected.source.col]
            if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) newSrc[newSrc.length - 1].faceUp = true
          }
          ng.tableau[colIdx].push(...movingCards)
          return ng
        })
        setScore(s => s + 5)
        setMoves(m => m + 1)
        setSelected(null)
        return
      }
      setSelected(null)
      return
    }

    const cards = col.slice(cardIdx)
    setSelected({ card, cards, source: { type: 'tableau', col: colIdx, cardIdx } })
  }

  function handleEmptyTableauClick(colIdx) {
    if (!selected) return
    if (selected.cards[0].value !== 'K') return
    saveHistory()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (selected.source.type === 'waste') ng.waste.pop()
      else if (selected.source.type === 'tableau') {
        ng.tableau[selected.source.col] = ng.tableau[selected.source.col].slice(0, selected.source.cardIdx)
        const newSrc = ng.tableau[selected.source.col]
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) newSrc[newSrc.length - 1].faceUp = true
      }
      ng.tableau[colIdx].push(...selected.cards)
      return ng
    })
    setMoves(m => m + 1)
    setSelected(null)
  }

  const isSelected = (colIdx, cardIdx) =>
    selected?.source.type === 'tableau' && selected.source.col === colIdx && cardIdx >= selected.source.cardIdx
  const wasteSelected = selected?.source.type === 'waste'
  const OVERLAP = 30
  const CARD_W = 80

  return (
    <div style={{ paddingTop: 64, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f2219', overflow: 'hidden' }}>

      {/* Win screen */}
      {won && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#234d38', border: '2px solid #c9a84c', borderRadius: 20, padding: '3rem', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#c9a84c', marginBottom: '0.5rem' }}>You Won!</h2>
            <p style={{ color: 'rgba(245,240,232,0.7)', marginBottom: '1.5rem' }}>Score: {score} · Moves: {moves} · Time: {formatTime(time)}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={newGame}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Back to Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(201,168,76,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/lobby" style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.875rem', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#f5f0e8' }}>♣ Solitaire</h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {[['Score', score], ['Moves', moves], ['Time', formatTime(time)]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f5f0e8' }}>{v}</div>
            </div>
          ))}
          <button onClick={undo} className="btn-outline" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>↩ Undo</button>
          <button onClick={newGame} className="btn-gold" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>New Game</button>
        </div>
      </div>

      {/* Game board — takes remaining height */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
        <div style={{ minWidth: 0 }}>

          {/* Top row */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', alignItems: 'flex-start', width: '100%' }}>
            {/* Stock */}
            <div onClick={drawFromStock} style={{ cursor: 'pointer', position: 'relative' }}>
              {game.stock.length > 0
                ? <>
                    <PlayingCard card={{ faceUp: false }} />
                    <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: 'rgba(245,240,232,0.4)', whiteSpace: 'nowrap' }}>
                      Click to draw
                    </div>
                  </>
                : <>
                    <EmptySlot label="↺" onClick={drawFromStock} />
                    <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: 'rgba(201,168,76,0.6)', whiteSpace: 'nowrap' }}>
                      Click to reset
                    </div>
                  </>
              }
            </div>
            {/* Waste */}
            <div onClick={handleWasteClick} style={{ cursor: 'pointer' }}>
              {game.waste.length > 0
                ? <PlayingCard card={game.waste[game.waste.length - 1]} selected={wasteSelected} />
                : <EmptySlot label="" />
              }
            </div>
            <div style={{ flex: 1 }} />
            {/* Foundations */}
            {game.foundations.map((f, fi) => (
              <div key={fi} onClick={() => handleFoundationClick(fi)} style={{ cursor: 'pointer' }}>
                {f.length > 0
                  ? <PlayingCard card={f[f.length - 1]} />
                  : <EmptySlot label={SUITS[fi]} />
                }
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {game.tableau.map((col, colIdx) => (
              <div key={colIdx} style={{ position: 'relative', width: CARD_W, flexShrink: 0, flex: 1, maxWidth: 110 }}>
                {col.length === 0
                  ? <EmptySlot label="K" onClick={() => handleEmptyTableauClick(colIdx)} />
                  : col.map((card, cardIdx) => (
                    <div key={card.id} style={{
                      position: cardIdx === 0 ? 'relative' : 'absolute',
                      top: cardIdx === 0 ? 0 : cardIdx * OVERLAP,
                      zIndex: cardIdx,
                      marginBottom: cardIdx === col.length - 1 ? col.length * OVERLAP + CARD_W + 20 : 0,
                    }}
                      onClick={() => handleTableauClick(colIdx, cardIdx)}
                    >
                      <PlayingCard card={card} selected={isSelected(colIdx, cardIdx)} />
                    </div>
                  ))
                }
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ textAlign: 'center', padding: '0.4rem', fontSize: '0.75rem', color: 'rgba(245,240,232,0.2)', flexShrink: 0 }}>
        Click a card to select · Click destination to move · Click stock to draw
      </div>
    </div>
  )
}
