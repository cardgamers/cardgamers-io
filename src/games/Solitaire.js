import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ─── Card utilities ───────────────────────────────────────────────
const SUITS = ['♠', '♥', '♦', '♣']
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function isRed(suit) { return RED_SUITS.includes(suit) }
function cardColor(suit) { return isRed(suit) ? '#c0392b' : '#1a1a2e' }
function cardValue(val) { return VALUES.indexOf(val) }

function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, id: `${value}${suit}`, faceUp: false })
    }
  }
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

function canPlaceOnFoundation(card, foundation) {
  if (foundation.length === 0) return card.value === 'A'
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

// ─── Card component ───────────────────────────────────────────────
function PlayingCard({ card, small = false, selected = false, style = {}, onClick, draggable }) {
  if (!card) return null
  const w = small ? 56 : 85
  const h = small ? 78 : 119

  if (!card.faceUp) {
    return (
      <div onClick={onClick} style={{
        width: w, height: h, borderRadius: 6,
        background: '#1a3a6a',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }} />
    )
  }

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      style={{
        width: w, height: h, borderRadius: 6,
        background: selected ? '#fffbe6' : 'white',
        border: selected ? '2px solid var(--gold)' : '1px solid #ddd',
        boxShadow: selected ? '0 0 0 2px var(--gold)' : '0 1px 3px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 3, left: 5, lineHeight: 1 }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 700, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 11 : 14, color: cardColor(card.suit), lineHeight: 1 }}>{card.suit}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 3, right: 5, lineHeight: 1, transform: 'rotate(180deg)' }}>
        <div style={{ fontSize: small ? 11 : 14, fontWeight: 700, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 11 : 14, color: cardColor(card.suit), lineHeight: 1 }}>{card.suit}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: small ? 22 : 34, color: cardColor(card.suit), lineHeight: 1 }}>
        {card.suit}
      </div>
    </div>
  )
}

function EmptySlot({ label, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 70, height: 98, borderRadius: 6,
      border: '2px dashed rgba(201,168,76,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(201,168,76,0.4)', fontSize: '1.2rem',
      cursor: onClick ? 'pointer' : 'default',
      flexShrink: 0,
      ...style,
    }}>
      {label}
    </div>
  )
}

// ─── Main Solitaire Game ──────────────────────────────────────────
export default function Solitaire() {
  const [game, setGame] = useState(() => dealGame())
  const [selected, setSelected] = useState(null) // { source, cardIndex }
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(true)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!running || won) return
    const t = setInterval(() => setTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [running, won])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
    setMoves(0)
    setScore(0)
    setTime(0)
    setRunning(true)
    setWon(false)
    setHistory([])
  }

  function addScore(pts) { setScore(s => s + pts) }

  // Draw from stock
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

  // Try to auto-move card to foundation
  function tryAutoFoundation(card, source) {
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, game.foundations[fi])) {
        saveHistory()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          // Remove from source
          if (source.type === 'waste') {
            ng.waste.pop()
          } else if (source.type === 'tableau') {
            ng.tableau[source.col].pop()
            // Flip new top card
            const col = ng.tableau[source.col]
            if (col.length > 0 && !col[col.length - 1].faceUp) {
              col[col.length - 1].faceUp = true
            }
          }
          ng.foundations[fi].push(card)
          return ng
        })
        addScore(10)
        setMoves(m => m + 1)
        return true
      }
    }
    return false
  }

  function handleWasteClick() {
    const wasteTop = game.waste[game.waste.length - 1]
    if (!wasteTop) return
    if (selected?.source.type === 'waste') { setSelected(null); return }
    // Try auto-foundation first on double click logic (single click = select)
    setSelected({ card: wasteTop, source: { type: 'waste' }, cards: [wasteTop] })
  }

  function handleFoundationClick(fi) {
    if (!selected) return
    const card = selected.cards[0]
    if (selected.cards.length > 1) return // can't move multiple to foundation
    if (canPlaceOnFoundation(card, game.foundations[fi])) {
      saveHistory()
      setGame(g => {
        const ng = JSON.parse(JSON.stringify(g))
        if (selected.source.type === 'waste') {
          ng.waste.pop()
        } else if (selected.source.type === 'tableau') {
          ng.tableau[selected.source.col].pop()
          const col = ng.tableau[selected.source.col]
          if (col.length > 0 && !col[col.length - 1].faceUp) col[col.length - 1].faceUp = true
        }
        ng.foundations[fi].push(card)
        if (checkWin(ng.foundations)) setWon(true)
        return ng
      })
      addScore(10)
      setMoves(m => m + 1)
      setSelected(null)
    }
  }

  function handleTableauClick(colIdx, cardIdx) {
    const col = game.tableau[colIdx]
    const card = col[cardIdx]

    if (!card.faceUp) {
      // Flip face-down card if it's top
      if (cardIdx === col.length - 1) {
        saveHistory()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          ng.tableau[colIdx][cardIdx].faceUp = true
          return ng
        })
        addScore(5)
        setMoves(m => m + 1)
      }
      return
    }

    // If something selected already, try to place
    if (selected) {
      if (selected.source.type === 'tableau' && selected.source.col === colIdx) {
        setSelected(null); return
      }
      // Try to place selected cards onto this column
      const movingCards = selected.cards
      const targetCol = game.tableau[colIdx]
      if (canPlaceOnTableau(movingCards[0], targetCol)) {
        saveHistory()
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g))
          // Remove from source
          if (selected.source.type === 'waste') {
            ng.waste.pop()
          } else if (selected.source.type === 'tableau') {
            const srcCol = ng.tableau[selected.source.col]
            ng.tableau[selected.source.col] = srcCol.slice(0, selected.source.cardIdx)
            const newSrc = ng.tableau[selected.source.col]
            if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) newSrc[newSrc.length - 1].faceUp = true
          }
          ng.tableau[colIdx].push(...movingCards)
          return ng
        })
        addScore(5)
        setMoves(m => m + 1)
        setSelected(null)
        return
      }
      setSelected(null)
      return
    }

    // Select this card (and all cards below it)
    const cards = col.slice(cardIdx)
    setSelected({ card, cards, source: { type: 'tableau', col: colIdx, cardIdx } })
  }

  function handleEmptyTableauClick(colIdx) {
    if (!selected) return
    const movingCards = selected.cards
    if (movingCards[0].value !== 'K') return
    saveHistory()
    setGame(g => {
      const ng = JSON.parse(JSON.stringify(g))
      if (selected.source.type === 'waste') {
        ng.waste.pop()
      } else if (selected.source.type === 'tableau') {
        const srcCol = ng.tableau[selected.source.col]
        ng.tableau[selected.source.col] = srcCol.slice(0, selected.source.cardIdx)
        const newSrc = ng.tableau[selected.source.col]
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) newSrc[newSrc.length - 1].faceUp = true
      }
      ng.tableau[colIdx].push(...movingCards)
      return ng
    })
    setMoves(m => m + 1)
    setSelected(null)
  }

  const isSelected = (colIdx, cardIdx) => {
    return selected?.source.type === 'tableau' && selected.source.col === colIdx && cardIdx >= selected.source.cardIdx
  }
  const wasteSelected = selected?.source.type === 'waste'

  const OVERLAP = 22

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--felt-dark)' }}>
      {/* Win screen */}
      {won && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--felt-light)', border: '2px solid var(--gold)', borderRadius: 20, padding: '3rem', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>You won!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Score: {score} · Moves: {moves} · Time: {formatTime(time)}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={newGame}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Back to Lobby</Link>
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap" style={{ padding: '1.5rem' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/lobby" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--cream)' }}>♣ Solitaire</h1>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {[['Score', score], ['Moves', moves], ['Time', formatTime(time)]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--cream)' }}>{v}</div>
              </div>
            ))}
            <button onClick={undo} className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>↩ Undo</button>
            <button onClick={newGame} className="btn-gold" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>New Game</button>
          </div>
        </div>

        {/* Game board */}
        <div style={{ overflowX: 'auto', paddingBottom: '2rem' }}>
          <div style={{ minWidth: 560 }}>
            {/* Top row: Stock, Waste, Foundations */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
              {/* Stock */}
              <div onClick={drawFromStock} style={{ cursor: 'pointer' }}>
                {game.stock.length > 0
                  ? <PlayingCard card={{ faceUp: false }} />
                  : <EmptySlot label="↺" onClick={drawFromStock} />
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
                    : <EmptySlot label={SUITS[fi]} style={{ color: cardColor(SUITS[fi]), borderColor: `${cardColor(SUITS[fi])}44` }} />
                  }
                </div>
              ))}
            </div>

            {/* Tableau */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              {game.tableau.map((col, colIdx) => (
                <div key={colIdx} style={{ position: 'relative', width: 70 }}>
                  {col.length === 0
                    ? <EmptySlot label="K" onClick={() => handleEmptyTableauClick(colIdx)} />
                    : col.map((card, cardIdx) => (
                      <div
                        key={card.id}
                        style={{
                          position: cardIdx === 0 ? 'relative' : 'absolute',
                          top: cardIdx === 0 ? 0 : cardIdx * OVERLAP,
                          zIndex: cardIdx,
                          marginBottom: cardIdx === col.length - 1 ? col.length * OVERLAP + 70 : 0,
                        }}
                        onClick={() => handleTableauClick(colIdx, cardIdx)}
                      >
                        <PlayingCard
                          card={card}
                          selected={isSelected(colIdx, cardIdx)}
                        />
                      </div>
                    ))
                  }
                  {/* Invisible click target for empty column */}
                  {col.length === 0 && null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help text */}
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(245,240,232,0.25)', marginTop: '1rem' }}>
          Click a card to select it, then click a destination. Click stock pile to draw. Double-click top waste card to auto-send to foundation.
        </p>
      </div>
    </div>
  )
}
