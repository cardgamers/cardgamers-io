import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'

const RED_SUITS = ['H', 'D']
const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' }

function cardColor(suit) { return RED_SUITS.includes(suit) ? '#c0392b' : '#1a1a2e' }

function Card({ card, selected, onClick, small }) {
  if (!card) return null
  const w = small ? 48 : 65
  const h = small ? 68 : 92
  return (
    <div onClick={onClick} style={{
      width: w, height: h, borderRadius: 6,
      background: selected ? '#fffbe6' : 'white',
      border: selected ? '2px solid var(--gold)' : '1px solid #ddd',
      boxShadow: selected ? '0 0 0 3px var(--gold)' : '0 2px 4px rgba(0,0,0,0.3)',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none', flexShrink: 0, position: 'relative',
      transform: selected ? 'translateY(-8px)' : 'none',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}>
      <div style={{ position: 'absolute', top: 3, left: 4, lineHeight: 1 }}>
        <div style={{ fontSize: small ? 9 : 11, fontWeight: 700, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 9 : 11, color: cardColor(card.suit), lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: small ? 20 : 28, color: cardColor(card.suit), lineHeight: 1 }}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div style={{ position: 'absolute', bottom: 3, right: 4, lineHeight: 1, transform: 'rotate(180deg)' }}>
        <div style={{ fontSize: small ? 9 : 11, fontWeight: 700, color: cardColor(card.suit), lineHeight: 1 }}>{card.value}</div>
        <div style={{ fontSize: small ? 9 : 11, color: cardColor(card.suit), lineHeight: 1 }}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  )
}

function CardBack({ small }) {
  const w = small ? 48 : 65
  const h = small ? 68 : 92
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: '#1a3a6a',
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)',
      border: '2px solid rgba(255,255,255,0.15)',
      flexShrink: 0,
    }} />
  )
}

// ─── Lobby screen ─────────────────────────────────────────────────
function RummyLobby({ socket, username, onJoinGame }) {
  const [rooms, setRooms] = useState([])
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')

  useEffect(() => {
    socket.emit('get_rooms', { gameType: 'rummy' })
    socket.on('rooms_list', setRooms)
    const interval = setInterval(() => socket.emit('get_rooms', { gameType: 'rummy' }), 5000)
    return () => { socket.off('rooms_list', setRooms); clearInterval(interval) }
  }, [socket])

  function createRoom() {
    socket.emit('create_room', { gameType: 'rummy', roomName: roomName || `${username}'s Table`, username, maxPlayers: 2 })
    socket.once('room_created', ({ roomId }) => onJoinGame(roomId))
  }

  function joinRoom(roomId) {
    socket.emit('join_room', { roomId, username })
    socket.once('room_updated', () => onJoinGame(roomId))
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--cream)', marginBottom: 4 }}>♥ Rummy Tables</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join a table or create your own</p>
        </div>
        <button className="btn-gold" onClick={() => setCreating(!creating)}>+ New Table</button>
      </div>

      {creating && (
        <div style={{ background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Create a new Rummy table (2 players)</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder={`${username}'s Table`} style={{ flex: 1 }} />
            <button className="btn-gold" onClick={createRoom}>Create</button>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>♥</div>
          <p style={{ marginBottom: '0.5rem' }}>No tables open right now</p>
          <p style={{ fontSize: '0.875rem' }}>Create one and wait for an opponent — or share the link with a friend!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rooms.map(room => (
            <div key={room.id} style={{ background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>{room.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Host: {room.host} · {room.players}/{room.maxPlayers} players</div>
              </div>
              <button className="btn-gold" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }} onClick={() => joinRoom(room.id)}>Join →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Waiting room ─────────────────────────────────────────────────
function WaitingRoom({ room, socket, username }) {
  const [chat, setChat] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    socket.on('chat_message', m => setChat(c => [...c, m]))
    return () => socket.off('chat_message')
  }, [socket])

  function sendChat(e) {
    e.preventDefault()
    if (!msg.trim()) return
    socket.emit('send_chat', { roomId: room.id, message: msg, username })
    setMsg('')
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '0.5rem' }}>Waiting for opponent</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Share this room code with a friend:</p>
      <div style={{ background: 'var(--felt-light)', border: '2px solid var(--gold)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'inline-block' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.2em' }}>{room.id}</span>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        {room.players.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green-accent)' }} />
            <span style={{ color: 'var(--cream)' }}>{p.username} {p.username === username ? '(you)' : ''}</span>
          </div>
        ))}
        {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ color: 'var(--text-muted)' }}>Waiting...</span>
          </div>
        ))}
      </div>
      {/* Simple chat while waiting */}
      <div style={{ background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem', textAlign: 'left' }}>
        <div style={{ height: 80, overflowY: 'auto', marginBottom: '0.5rem' }}>
          {chat.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chat with your opponent here...</p> : chat.map((m, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.8)', marginBottom: 2 }}><strong style={{ color: 'var(--gold)' }}>{m.username}:</strong> {m.message}</div>
          ))}
        </div>
        <form onSubmit={sendChat} style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Say hi..." style={{ flex: 1, fontSize: '0.875rem', padding: '0.4rem 0.75rem' }} />
          <button type="submit" className="btn-gold" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Send</button>
        </form>
      </div>
    </div>
  )
}

// ─── Main game ────────────────────────────────────────────────────
function RummyGame({ gameState, socket, roomId, username, room, onGameOver }) {
  const [selectedCards, setSelectedCards] = useState([])
  const [chat, setChat] = useState([])
  const [msg, setMsg] = useState('')
  const [lastAction, setLastAction] = useState('')

  useEffect(() => {
    socket.on('chat_message', m => setChat(c => [...c.slice(-30), m]))
    socket.on('game_over', onGameOver)
    return () => { socket.off('chat_message'); socket.off('game_over', onGameOver) }
  }, [socket, onGameOver])

  function toggleCard(cardId) {
    setSelectedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId])
  }

  function draw(from) {
    socket.emit('rummy_draw', { roomId, from })
    setLastAction(`Drew from ${from === 'discard' ? 'discard pile' : 'draw pile'}`)
    setSelectedCards([])
  }

  function discard() {
    if (selectedCards.length !== 1) { setLastAction('Select exactly 1 card to discard'); return }
    socket.emit('rummy_discard', { roomId, cardId: selectedCards[0] })
    setSelectedCards([])
    setLastAction('Discarded a card')
  }

  function knock() {
    socket.emit('rummy_knock', { roomId })
  }

  function sendChat(e) {
    e.preventDefault()
    if (!msg.trim()) return
    socket.emit('send_chat', { roomId, message: msg, username })
    setMsg('')
  }

  const myTurn = gameState.myTurn
  const handValue = gameState.myHand.reduce((s, c) => s + (['J','Q','K'].includes(c.value) ? 10 : c.value === 'A' ? 1 : parseInt(c.value)), 0)

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: 'var(--felt-dark)', overflow: 'hidden' }}>

      {/* Status bar */}
      <div style={{ background: myTurn ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {room.players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: gameState.currentTurnId === p.id ? 'var(--green-accent)' : 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '0.8rem', color: gameState.currentTurnId === p.id ? 'var(--cream)' : 'var(--text-muted)', fontWeight: gameState.currentTurnId === p.id ? 600 : 400 }}>
                {p.username} {p.username === username ? '(you)' : `(${gameState.opponentCardCounts[p.id] || 0} cards)`}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: myTurn ? 'var(--green-accent)' : 'var(--text-muted)', fontWeight: 600 }}>
          {myTurn ? `Your turn — ${gameState.phase === 'draw' ? 'Draw a card' : 'Discard a card'}` : `${gameState.currentTurnName}'s turn`}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Game area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>

          {/* Center - draw and discard */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            {/* Draw pile */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Draw pile ({gameState.drawPileCount})
              </div>
              <div onClick={() => myTurn && gameState.phase === 'draw' && draw('draw')} style={{ cursor: myTurn && gameState.phase === 'draw' ? 'pointer' : 'default', opacity: myTurn && gameState.phase === 'draw' ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                <CardBack />
              </div>
            </div>

            {/* Discard pile */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discard pile</div>
              <div onClick={() => myTurn && gameState.phase === 'draw' && draw('discard')} style={{ cursor: myTurn && gameState.phase === 'draw' ? 'pointer' : 'default', opacity: myTurn && gameState.phase === 'draw' ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                {gameState.discardTop ? <Card card={gameState.discardTop} /> : <div style={{ width: 65, height: 92, borderRadius: 6, border: '2px dashed rgba(201,168,76,0.3)' }} />}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {myTurn && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {gameState.phase === 'discard' && (
                <>
                  <button className="btn-gold" onClick={discard} disabled={selectedCards.length !== 1} style={{ opacity: selectedCards.length === 1 ? 1 : 0.5 }}>
                    Discard Selected
                  </button>
                  {handValue <= 10 && (
                    <button className="btn-outline" onClick={knock}>
                      Knock ({handValue} pts)
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {lastAction && <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{lastAction}</p>}

          {/* My hand */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '1rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your hand · {gameState.myHand.length} cards · {handValue} pts</span>
              {selectedCards.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{selectedCards.length} selected</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {gameState.myHand.map(card => (
                <Card key={card.id} card={card} selected={selectedCards.includes(card.id)} onClick={() => gameState.phase === 'discard' && myTurn && toggleCard(card.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div style={{ width: 220, background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chat</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
            {chat.map((m, i) => (
              <div key={i} style={{ marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{m.username}: </span>
                <span style={{ color: 'rgba(245,240,232,0.7)' }}>{m.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} style={{ padding: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.4rem' }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message..." style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} />
            <button type="submit" style={{ background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--felt-dark)', fontWeight: 600 }}>→</button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Main Rummy component ─────────────────────────────────────────
export default function Rummy() {
  const { profile } = useAuth()
  const { socket, connected } = useSocket()
  const navigate = useNavigate()
  const [screen, setScreen] = useState('lobby') // lobby | waiting | playing
  const [room, setRoom] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [gameOver, setGameOver] = useState(null)

  const username = profile?.username || 'Player'

  useEffect(() => {
    if (!socket) return
    socket.on('room_updated', (updatedRoom) => setRoom(updatedRoom))
    socket.on('game_started', () => setScreen('playing'))
    socket.on('game_state', (state) => setGameState(state))
    socket.on('player_left', () => { setGameOver({ message: 'Your opponent left the game.' }); setScreen('gameover') })
    return () => {
      socket.off('room_updated')
      socket.off('game_started')
      socket.off('game_state')
      socket.off('player_left')
    }
  }, [socket])

  function handleJoinGame(roomId) {
    socket.on('room_updated', (r) => { setRoom(r); setScreen('waiting') })
  }

  function handleGameOver(result) {
    setGameOver(result)
    setScreen('gameover')
  }

  if (!connected) return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>♥</div>
        <p>Connecting to game server...</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>If this takes too long, the server may be starting up. Please wait.</p>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: screen === 'playing' ? 64 : 80, minHeight: '100vh' }}>
      {screen === 'gameover' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--felt-light)', border: '2px solid var(--gold)', borderRadius: 20, padding: '3rem', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{gameOver?.winner ? '🏆' : '👋'}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
              {gameOver?.winnerName === username ? 'You won!' : gameOver?.winnerName ? `${gameOver.winnerName} wins!` : 'Game Over'}
            </h2>
            {gameOver?.message && <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{gameOver.message}</p>}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-gold" onClick={() => { setScreen('lobby'); setRoom(null); setGameState(null); setGameOver(null) }}>Play Again</button>
              <Link to="/lobby" className="btn-outline">Lobby</Link>
            </div>
          </div>
        </div>
      )}

      {screen === 'lobby' && (
        <RummyLobby socket={socket} username={username} onJoinGame={handleJoinGame} />
      )}

      {screen === 'waiting' && room && (
        <WaitingRoom room={room} socket={socket} username={username} />
      )}

      {screen === 'playing' && gameState && room && (
        <RummyGame gameState={gameState} socket={socket} roomId={room.id} username={username} room={room} onGameOver={handleGameOver} />
      )}
    </div>
  )
}
