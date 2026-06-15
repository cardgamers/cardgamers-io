import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePageMeta } from '../../hooks/usePageMeta'
import { saveGameResult } from '../../lib/saveGameResult'
import {
  SUIT_SYMBOLS, SUIT_COLORS, DENOM_SYMBOLS,
  PARTNERS, NEXT_PLAYER, VALUE_RANK,
  countHCP, getBotBid, getBotCardPlay,
  isAuctionOver, getContract, getTrickWinner, calculateRubberScore, calculateIMPScore,
  calculateDuplicateScore, createBridgeGame, getLegalCards
} from './BridgeEngine'

// ─── Mobile detection hook ────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// ─── Suit colour helper ───────────────────────────────────────────
function suitColor(denom) {
  if (denom === 'H' || denom === 'D') return '#e74c3c'
  if (denom === 'NT') return '#7eb5f5'
  return '#ffffff'
}

// ─── Full card ────────────────────────────────────────────────────
function BCard({ card, selected, legal, onClick, w=80, h=112, faceDown }) {
  const notLegal = legal === false
  if (faceDown) return (
    <div style={{ width:w, height:h, borderRadius:8, flexShrink:0,
      background:'linear-gradient(135deg,#1a3a6a,#0f2245)',
      backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 2px,transparent 2px,transparent 10px)',
      border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }} />
  )
  if (!card) return null
  const col = SUIT_COLORS[card.suit]
  const fs = Math.max(10, Math.round(w * 0.17))
  const ss = Math.max(14, Math.round(w * 0.30))
  return (
    <div onClick={!notLegal && onClick ? onClick : undefined} style={{
      width:w, height:h, borderRadius:8, flexShrink:0,
      background: selected ? '#fffde7' : notLegal ? '#ccc' : 'white',
      border: selected ? '3px solid #c9a84c' : '1px solid #bbb',
      boxShadow: selected ? '0 0 0 3px rgba(201,168,76,0.6),0 8px 20px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)',
      cursor: !notLegal && onClick ? 'pointer' : 'default',
      userSelect: 'none', position: 'relative',
      transform: selected ? 'translateY(-12px)' : 'none',
      transition: 'transform 0.15s, box-shadow 0.15s',
      opacity: notLegal ? 0.3 : 1,
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

// ─── Fanned hand ──────────────────────────────────────────────────
function FannedHand({ cards, legalCards, selectedCard, onCardClick, faceDown, vertical=false, cardW=72, cardH=100, overlap=22 }) {
  const n = cards.length
  if (n === 0) return null

  if (faceDown) {
    if (vertical) {
      return (
        <div style={{ position:'relative', width:cardW, height: cardH + (n-1)*overlap, flexShrink:0 }}>
          {Array.from({length:n}).map((_,i) => (
            <div key={i} style={{ position:'absolute', top: i*overlap }}>
              <BCard faceDown w={cardW} h={cardH} />
            </div>
          ))}
        </div>
      )
    }
    return (
      <div style={{ position:'relative', height:cardH, width: cardW + (n-1)*overlap, flexShrink:0 }}>
        {Array.from({length:n}).map((_,i) => (
          <div key={i} style={{ position:'absolute', left: i*overlap }}>
            <BCard faceDown w={cardW} h={cardH} />
          </div>
        ))}
      </div>
    )
  }

  const totalW = cardW + (n-1)*overlap
  return (
    <div style={{ position:'relative', height:cardH+20, width:totalW, flexShrink:0 }}>
      {cards.map((card, i) => {
        const isSelected = selectedCard?.id === card.id
        const isLegal = !legalCards || legalCards.some(c => c.id === card.id)
        return (
          <div key={card.id} style={{ position:'absolute', left: i*overlap, zIndex: isSelected ? 50 : i, transition:'transform 0.12s' }}>
            <BCard
              card={card}
              w={cardW} h={cardH}
              selected={isSelected}
              legal={isLegal ? undefined : false}
              onClick={() => onCardClick && onCardClick(card)}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Dummy hand ───────────────────────────────────────────────────
function DummyHand({ hand, currentTrick, contract, onPlay, canPlay, horizontal=true, isMobile=false }) {
  if (!hand) return null
  const trump = contract?.denomination === 'NT' ? null : contract?.denomination
  const legal = canPlay ? getLegalCards(hand, currentTrick, trump) : null

  // Mobile: compact horizontal layout — suit symbol + cards in a row, all suits stacked
  if (isMobile) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {['S','H','D','C'].map(suit => {
          const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
          if (!cards.length) return null
          const col = SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit]
          return (
            <div key={suit} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ fontSize:'0.85rem', color:col, fontWeight:700, width:14, flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
              <FannedHand
                cards={cards}
                legalCards={legal}
                onCardClick={c => canPlay && onPlay(c)}
                cardW={44} cardH={62} overlap={14}
              />
            </div>
          )
        })}
      </div>
    )
  }

  if (horizontal) {
    return (
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        {['S','H','D','C'].map(suit => {
          const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
          if (!cards.length) return null
          const col = SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit]
          return (
            <div key={suit} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:'1rem', color:col, fontWeight:700 }}>{SUIT_SYMBOLS[suit]}</span>
              <FannedHand
                cards={cards}
                legalCards={legal}
                onCardClick={c => canPlay && onPlay(c)}
                cardW={80} cardH={112} overlap={26}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const leftSuits = ['S','H']
  const rightSuits = ['D','C']
  return (
    <div style={{ display:'flex', flexDirection:'row', gap:6, alignItems:'flex-start' }}>
      {[leftSuits, rightSuits].map((suitGroup, gi) => (
        <div key={gi} style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {suitGroup.map(suit => {
            const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
            if (!cards.length) return null
            const col = SUIT_COLORS[suit] === '#1a1a2e' ? 'rgba(255,255,255,0.8)' : SUIT_COLORS[suit]
            return (
              <div key={suit} style={{ display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ fontSize:'0.85rem', color:col, fontWeight:700, width:14, flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
                <FannedHand
                  cards={cards}
                  legalCards={legal}
                  onCardClick={c => canPlay && onPlay(c)}
                  cardW={58} cardH={81} overlap={20}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Thinking dots ────────────────────────────────────────────────
function ThinkingDots() {
  const [d, setD] = useState(1)
  useEffect(() => { const t = setInterval(()=>setD(x=>x===3?1:x+1),500); return()=>clearInterval(t) },[])
  return <span>{'●'.repeat(d)}{'○'.repeat(3-d)}</span>
}

// ─── Bid bubble ───────────────────────────────────────────────────
function BidBubble({ bid, thinking }) {
  if (!bid && !thinking) return null
  const isPass = bid?.type === 'pass'
  const isDbl = bid?.type === 'double'
  const bg = thinking ? '#1a1a1a' : 'white'
  const borderCol = thinking ? 'var(--gold)' : isPass ? 'rgba(0,0,0,0.15)' : 'rgba(201,168,76,0.9)'
  const denomCol = !isPass && !isDbl && (bid?.denomination==='H'||bid?.denomination==='D') ? '#c0392b' : bid?.denomination==='NT' ? '#1a56db' : '#1a1a1a'
  return (
    <div style={{ background:bg, border:`2px solid ${borderCol}`, borderRadius:8, padding:'4px 10px', fontSize:'0.95rem', fontWeight:800, whiteSpace:'nowrap', minWidth:40, textAlign:'center', boxShadow:'0 3px 10px rgba(0,0,0,0.4)' }}>
      {thinking ? <span style={{ color:'var(--gold)' }}><ThinkingDots/></span>
        : isPass ? <span style={{ color:'#666' }}>P</span>
        : isDbl ? <span style={{ color:'#c0392b' }}>X</span>
        : <span><span style={{ color:'#1a1a1a' }}>{bid.level}</span><span style={{ color:denomCol }}>{DENOM_SYMBOLS[bid.denomination]}</span></span>
      }
    </div>
  )
}

// ─── Auction history panel ────────────────────────────────────────
function AuctionHistory({ auction, dealer }) {
  const pos = ['W','N','E','S']
  const pad = [...Array(pos.indexOf(dealer)).fill(null), ...auction]
  if (!auction.length) return <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', padding:'6px 0' }}>Bidding starting...</p>
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginBottom:4 }}>
        {['W','N','E','S'].map(p=><div key={p} style={{ textAlign:'center', fontSize:'0.6rem', color:'rgba(245,240,232,0.35)', fontWeight:700, letterSpacing:'0.05em' }}>{p}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
        {pad.map((b,i)=>(
          <div key={i} style={{ textAlign:'center', padding:'3px 2px', borderRadius:4, fontSize:'0.78rem', fontWeight:700, background:b?'rgba(255,255,255,0.06)':'transparent', minHeight:22, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {b ? (
              b.type==='pass' ? <span style={{ color:'rgba(255,255,255,0.3)' }}>P</span>
              : b.type==='double' ? <span style={{ color:'#e74c3c' }}>X</span>
              : <span style={{ color:'white' }}>{b.level}<span style={{ color: b.denomination==='H'||b.denomination==='D'?'#e74c3c': b.denomination==='NT'?'#7eb5f5':'#ffffff' }}>{DENOM_SYMBOLS[b.denomination]}</span></span>
            ) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bid panel ────────────────────────────────────────────────────
function BidPanel({ auction, onBid, onPass, onDouble, canDouble, isMobile }) {
  const [selLevel, setSelLevel] = useState(null)
  const dn = ['C','D','H','S','NT']
  const last = auction.reduce((l,b)=>b.type==='bid'?b:l, null)

  function isValid(lv, d) {
    if (!last) return true
    if (lv > last.level) return true
    if (lv === last.level) return dn.indexOf(d) > dn.indexOf(last.denomination)
    return false
  }

  const denomDisplay = { C:'♣', D:'♦', H:'♥', S:'♠', NT:'NT' }
  const denomCol = { C:'#fff', D:'#e74c3c', H:'#e74c3c', S:'#fff', NT:'#7eb5f5' }

  return (
    <div style={{ background:'rgba(0,0,0,0.85)', borderRadius:12, padding: isMobile ? '8px 10px' : '12px 14px', border:'1px solid rgba(201,168,76,0.3)', width:'100%', maxWidth: isMobile ? '100%' : 360, boxSizing:'border-box' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <p style={{ fontSize:'0.68rem', color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Your Bid</p>
        <div style={{ display:'flex', gap:6 }}>
          {canDouble && <button onClick={onDouble} style={{ padding: isMobile ? '5px 12px' : '6px 16px', borderRadius:8, fontWeight:800, fontSize:'0.9rem', background:'rgba(192,57,43,0.15)', border:'2px solid #c0392b', color:'#e74c3c', cursor:'pointer', minHeight:40 }}>X</button>}
          <button onClick={onPass} style={{ padding: isMobile ? '5px 14px' : '6px 18px', borderRadius:8, fontWeight:700, fontSize:'0.85rem', background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.25)', color:'rgba(245,240,232,0.8)', cursor:'pointer', minHeight:40 }}>Pass</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:7 }}>
        {[1,2,3,4,5,6,7].map(lv => {
          const anyValid = dn.some(d => isValid(lv, d))
          const sel = selLevel === lv
          return (
            <button key={lv} onClick={()=>anyValid&&setSelLevel(sel?null:lv)} style={{
              flex:1, height: isMobile ? 40 : 36, borderRadius:7, fontSize: isMobile ? '1rem' : '1rem', fontWeight:700,
              background: sel ? 'var(--gold)' : anyValid ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
              border: sel ? '2px solid var(--gold)' : `1.5px solid ${anyValid?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.04)'}`,
              color: sel ? 'var(--felt-dark)' : anyValid ? 'white' : 'rgba(255,255,255,0.15)',
              cursor: anyValid ? 'pointer' : 'not-allowed',
            }}>{lv}</button>
          )
        })}
      </div>
      {selLevel && (
        <div style={{ display:'flex', gap:4 }}>
          {dn.map(d => {
            const valid = isValid(selLevel, d)
            return (
              <button key={d} onClick={()=>valid&&(onBid(selLevel,d),setSelLevel(null))} style={{
                flex:1, height: isMobile ? 48 : 44, borderRadius:8, fontSize: isMobile ? '1.2rem' : '1.3rem', fontWeight:700,
                background: valid ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                border: `2px solid ${valid?denomCol[d]+'55':'rgba(255,255,255,0.04)'}`,
                color: valid ? denomCol[d] : 'rgba(255,255,255,0.1)',
                cursor: valid ? 'pointer' : 'not-allowed',
                transition: 'background 0.1s',
              }}>{denomDisplay[d]}</button>
            )
          })}
        </div>
      )}
      {!selLevel && <p style={{ fontSize:'0.62rem', color:'rgba(245,240,232,0.3)', textAlign:'center', marginTop:4 }}>Select a level, then choose a suit</p>}
    </div>
  )
}

// ─── Mobile sidebar sheet (bottom slide-up) ───────────────────────
function MobileSidePanel({ game, myHand, showPanel, onClose }) {
  if (!showPanel) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
         onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
           style={{ background:'#0d1f14', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'16px 16px 0 0', padding:'16px 14px', maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 14px' }} />
        <div style={{ marginBottom:12 }}>
          <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Bidding History</p>
          <AuctionHistory auction={game.auction} dealer={game.dealer} />
        </div>
        {game.contract && (
          <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px 10px', marginBottom:10 }}>
            <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Contract</p>
            <p style={{ fontSize:'1rem', fontWeight:700, marginBottom:4 }}>
              <span style={{ color:'white' }}>{game.contract.level}</span>
              <span style={{ color: game.contract.denomination==='H'||game.contract.denomination==='D'?'#e74c3c':game.contract.denomination==='NT'?'#7eb5f5':'#ffffff' }}>{DENOM_SYMBOLS[game.contract.denomination]}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginLeft:4 }}>by {game.contract.declarer==='S'?'South':game.contract.declarer==='N'?'North':game.contract.declarer==='E'?'East':'West'}</span>
            </p>
            {game.phase==='playing' && <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:'0.72rem', color:'#5DCAA5' }}>NS won</span>
                <span style={{ fontSize:'0.82rem', color:'#5DCAA5', fontWeight:700 }}>{game.tricks.NS}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.72rem', color:'#c0392b' }}>EW won</span>
                <span style={{ fontSize:'0.82rem', color:'#c0392b', fontWeight:700 }}>{game.tricks.EW}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:4 }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Need</span>
                <span style={{ fontSize:'0.82rem', color:'var(--gold)', fontWeight:700 }}>{game.contract.tricksNeeded - game.tricks[(game.contract.declarer==='N'||game.contract.declarer==='S')?'NS':'EW']} more</span>
              </div>
            </>}
          </div>
        )}
        <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'8px 10px', marginBottom:10 }}>
          <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Your Hand · {countHCP(myHand)} HCP</p>
          {['S','H','D','C'].map(suit => {
            const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
            if (!cards.length) return null
            const col = SUIT_COLORS[suit]==='#1a1a2e' ? 'rgba(255,255,255,0.85)' : SUIT_COLORS[suit]
            return <p key={suit} style={{ fontSize:'0.82rem', color:col, marginBottom:3 }}>{SUIT_SYMBOLS[suit]} {cards.map(c=>c.value).join(' ')}</p>
          })}
        </div>
        <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
          <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Vulnerability</p>
          <p style={{ fontSize:'0.8rem', color:game.vulnerability?.NS?'#c0392b':'#5DCAA5', marginBottom:3 }}>NS: {game.vulnerability?.NS?'Vul':'Not vul'}</p>
          <p style={{ fontSize:'0.8rem', color:game.vulnerability?.EW?'#c0392b':'#5DCAA5' }}>EW: {game.vulnerability?.EW?'Vul':'Not vul'}</p>
        </div>
        <button onClick={onClose} style={{ width:'100%', marginTop:12, padding:'10px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(245,240,232,0.7)', cursor:'pointer', fontSize:'0.85rem' }}>Close</button>
      </div>
    </div>
  )
}

// ─── Main Bridge component ────────────────────────────────────────
export default function Bridge() {
  usePageMeta('/game/bridge')
  const { profile } = useAuth()
  const isMobile = useIsMobile()
  const [screen, setScreen] = useState('menu')
  const [gameMode, setGameMode] = useState('rubber')
  const [difficulty, setDifficulty] = useState('medium')
  const [game, setGame] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [botThinking, setBotThinking] = useState(null)
  const [lastTrick, setLastTrick] = useState(null)
  const [showLastTrick, setShowLastTrick] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const botTimer = useRef(null)
  const lastTrickTimer = useRef(null)
  const isPlusUser = profile?.plan==='plus'||profile?.plan==='club'

  useEffect(() => {
    if (!game || game.phase !== 'complete' || !game.scoring || resultSaved) return
    const isDeclarer = game.contract?.declarer === 'S'
    const isNS = game.contract?.declarer === 'N' || game.contract?.declarer === 'S'
    const playerWon = isDeclarer ? game.scoring.made : !game.scoring.made
    let ratingChange = 0
    if (isDeclarer) {
      if (game.scoring.made) {
        const level = game.contract.level
        const overtricks = game.tricks[isNS?'NS':'EW'] - game.contract.tricksNeeded
        ratingChange = 20 + (level * 5) + (overtricks * 3)
        if (level === 6) ratingChange += 50
        if (level === 7) ratingChange += 100
        if (game.vulnerability?.[isNS?'NS':'EW']) ratingChange = Math.round(ratingChange * 1.3)
      } else {
        const undertricks = game.contract.tricksNeeded - game.tricks[isNS?'NS':'EW']
        ratingChange = -(10 + undertricks * 8)
      }
    } else {
      ratingChange = !game.scoring.made ? 15 : -5
    }
    saveGameResult('bridge', playerWon, game.scoring.declarerScore || game.scoring.defenderScore || 0, ratingChange, {
      contract: `${game.contract.level}${game.contract.denomination}`,
      declarer: game.contract.declarer,
      made: game.scoring.made,
      mode: game.mode,
    })
    setResultSaved(true)
  }, [game, resultSaved])

  function getPlayerLastBid(pos, auction) {
    const bids = auction.filter(b=>b.position===pos)
    return bids.length ? bids[bids.length-1] : null
  }

  function processBid(ng, bid) {
    ng.auction.push({...bid, position:ng.currentBidder})
    if (isAuctionOver(ng.auction)) {
      const contract = getContract(ng.auction)
      if (!contract) { ng.phase = 'redeal'; return }
      ng.contract = contract
      ng.dummy = PARTNERS[contract.declarer]
      ng.phase = 'playing'
      const pos = ['S','W','N','E']
      ng.currentLeader = pos[(pos.indexOf(contract.declarer)+1)%4]
      ng.dummyRevealed = false
    } else {
      const pos = ['S','W','N','E']
      ng.currentBidder = pos[(pos.indexOf(ng.currentBidder)+1)%4]
    }
  }

  function processPlay(ng, player, card) {
    ng.hands[player] = ng.hands[player].filter(c=>c.id!==card.id)
    ng.currentTrick.push({position:player, card})
    if (!ng.dummyRevealed) ng.dummyRevealed = true
    if (ng.currentTrick.length===4) {
      const winner = getTrickWinner(ng.currentTrick, ng.contract.denomination==='NT'?null:ng.contract.denomination)
      const side = (winner.position==='N'||winner.position==='S')?'NS':'EW'
      ng.tricks[side]++
      ng.trickHistory.push({trick:[...ng.currentTrick], winner:winner.position})
      setLastTrick({trick:[...ng.currentTrick], winner:winner.position})
      setShowLastTrick(true)
      clearTimeout(lastTrickTimer.current)
      lastTrickTimer.current = setTimeout(()=>setShowLastTrick(false), 2500)
      ng.currentTrick = []
      ng.currentLeader = winner.position
      if (ng.tricks.NS+ng.tricks.EW===13) {
        const declSide = (ng.contract.declarer==='N'||ng.contract.declarer==='S')?'NS':'EW'
        ng.scoring = ng.mode==='imps'
          ? calculateIMPScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
          : ng.mode==='rubber'
          ? calculateRubberScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
          : calculateDuplicateScore(ng.contract, ng.tricks[declSide], ng.vulnerability)
        ng.phase = 'complete'
      }
    } else {
      ng.currentLeader = NEXT_PLAYER[player]
    }
  }

  const doBotAction = useCallback((g) => {
    if (!g||g.phase==='complete') return
    let actingPos = null
    if (g.phase==='bidding'&&g.currentBidder!=='S') actingPos = g.currentBidder
    else if (g.phase==='playing') {
      const l = g.currentLeader
      if (l!=='S'&&l!==g.dummy) actingPos = l
      else if (l===g.dummy&&g.contract?.declarer!=='S') actingPos = l
    }
    if (!actingPos) return
    setBotThinking(actingPos)
    clearTimeout(botTimer.current)
    const delay = (difficulty==='easy'?2800:difficulty==='medium'?2000:1200)+Math.random()*800
    botTimer.current = setTimeout(()=>{
      setBotThinking(null)
      setGame(prev=>{
        if (!prev) return prev
        const ng = JSON.parse(JSON.stringify(prev))
        if (ng.phase==='bidding') {
          processBid(ng, getBotBid(ng.hands[ng.currentBidder], ng.auction, ng.currentBidder, ng.vulnerability, ng.difficulty))
        } else if (ng.phase==='playing') {
          const card = getBotCardPlay(ng.hands[ng.currentLeader], ng.currentTrick, ng.contract?.denomination==='NT'?null:ng.contract?.denomination, ng.contract, ng.currentLeader, ng.trickHistory, ng.difficulty)
          processPlay(ng, ng.currentLeader, card)
        }
        return ng
      })
    }, delay)
  }, [difficulty])

  useEffect(()=>{
    if (!game) return
    if (game.phase==='redeal') {
      setGame(createBridgeGame(game.mode,'S',game.difficulty,game.botNames))
      return
    }
    if (game.phase==='complete') return
    const isBotBid = game.phase==='bidding'&&game.currentBidder!=='S'
    const isBotPlay = game.phase==='playing'&&((game.currentLeader!=='S'&&game.currentLeader!==game.dummy)||(game.currentLeader===game.dummy&&game.contract?.declarer!=='S'))
    if (isBotBid||isBotPlay) doBotAction(game)
    return ()=>{ clearTimeout(botTimer.current); setBotThinking(null) }
  }, [game, doBotAction])

  function startGame() {
    const newGame = createBridgeGame(gameMode,'S',difficulty,{N:'North',E:'East',W:'West'})
    newGame.initialHCP = {
      NS: countHCP(newGame.hands['N']) + countHCP(newGame.hands['S']),
      EW: countHCP(newGame.hands['E']) + countHCP(newGame.hands['W']),
    }
    setGame(newGame)
    setScreen('game'); setSelectedCard(null); setBotThinking(null)
    setLastTrick(null); setShowLastTrick(false); setResultSaved(false)
  }
  function handleBid(lv,dn) {
    if (!game||game.phase!=='bidding'||game.currentBidder!=='S') return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processBid(ng,{level:lv,denomination:dn,type:'bid'});return ng})
  }
  function handlePass() {
    if (!game||game.phase!=='bidding'||game.currentBidder!=='S') return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processBid(ng,{type:'pass',level:0,denomination:'PASS'});return ng})
  }
  function handleDouble() {
    if (!game||game.phase!=='bidding'||game.currentBidder!=='S') return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processBid(ng,{type:'double',level:0,denomination:'DBL'});return ng})
  }
  function handleCardClick(card, fromDummy) {
    if (!game||game.phase!=='playing') return
    const isDummyPlay = fromDummy&&game.contract?.declarer==='S'&&game.currentLeader===game.dummy
    if (!isDummyPlay&&game.currentLeader!=='S') return
    const player = isDummyPlay?game.dummy:'S'
    const hand = game.hands[player]
    const trump = game.contract?.denomination==='NT'?null:game.contract?.denomination
    const legal = getLegalCards(hand, game.currentTrick, trump)
    if (!legal.some(c=>c.id===card.id)) return
    clearTimeout(botTimer.current); setBotThinking(null)
    setGame(prev=>{const ng=JSON.parse(JSON.stringify(prev));processPlay(ng,player,card);return ng})
    setSelectedCard(null)
  }

  function handleSouthCardClick(card) {
    if (!game||game.phase!=='playing'||game.currentLeader!=='S') return
    const hand = game.hands['S']
    const trump = game.contract?.denomination==='NT'?null:game.contract?.denomination
    const legal = getLegalCards(hand, game.currentTrick, trump)
    if (!legal.some(c=>c.id===card.id)) return
    if (selectedCard?.id===card.id) {
      handleCardClick(card, false)
    } else {
      setSelectedCard(card)
    }
  }

  // ── Menu ──────────────────────────────────────────────────────────
  if (screen==='menu') return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem' }}>
      <div style={{ maxWidth:500, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
          <div style={{ fontSize:'2.5rem' }}>♠</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'var(--cream)', margin:'0.4rem 0' }}>Bridge</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>The ultimate card game. Play against bots or real opponents.</p>
        </div>
        <div style={{ marginBottom:'1.25rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Game Type</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'rubber',name:'Rubber Bridge',desc:'Classic casual play'},{id:'duplicate',name:'Duplicate Bridge',desc:'Competitive scoring'},{id:'imps',name:'Teams / IMPs',desc:'Professional scoring'}].map(m=>(
              <div key={m.id} onClick={()=>setGameMode(m.id)} style={{ background:gameMode===m.id?'rgba(201,168,76,0.15)':'var(--felt-light)', border:`2px solid ${gameMode===m.id?'var(--gold)':'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:3 }}>{m.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Bot Difficulty</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            {[{id:'easy',name:'Easy',desc:'~4s thinking'},{id:'medium',name:'Medium',desc:'~3s thinking'},{id:'hard',name:'Hard',desc:'~2s thinking',plus:true}].map(d=>(
              <div key={d.id} onClick={()=>(!d.plus||isPlusUser)&&setDifficulty(d.id)} style={{ background:difficulty===d.id?'rgba(201,168,76,0.15)':'var(--felt-light)', border:`2px solid ${difficulty===d.id?'var(--gold)':'var(--border)'}`, borderRadius:10, padding:'0.9rem', cursor:(!d.plus||isPlusUser)?'pointer':'not-allowed', textAlign:'center', opacity:d.plus&&!isPlusUser?0.6:1, position:'relative' }}>
                {d.plus&&!isPlusUser&&<div style={{ position:'absolute', top:-8, right:-8, background:'var(--gold)', color:'var(--felt-dark)', fontSize:'0.58rem', fontWeight:700, padding:'2px 6px', borderRadius:10 }}>PLUS</div>}
                <div style={{ fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{d.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{d.desc}</div>
              </div>
            ))}
          </div>
          {!isPlusUser&&<p style={{ fontSize:'0.72rem', color:'var(--gold)', marginTop:'0.4rem', textAlign:'center' }}><Link to="/upgrade" style={{ color:'var(--gold)' }}>Upgrade to Plus</Link> to unlock Hard</p>}
        </div>
        <button className="btn-gold" onClick={startGame} style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'0.85rem' }}>♠ Deal Cards</button>
        <Link to="/lobby" style={{ display:'block', textAlign:'center', marginTop:'0.9rem', color:'var(--text-muted)', fontSize:'0.85rem' }}>← Back to Lobby</Link>
      </div>
    </div>
  )

  if (!game) return null

  const myHand = game.hands['S'] || []
  const trump = game.contract?.denomination === 'NT' ? null : game.contract?.denomination
  const isMyBidTurn = game.phase==='bidding' && game.currentBidder==='S'
  const isMyPlayTurn = game.phase==='playing' && game.currentLeader==='S'
  const isDeclarer = game.contract?.declarer==='S'
  const isDummyTurn = game.phase==='playing' && game.currentLeader===game.dummy && isDeclarer
  const legalCards = isMyPlayTurn ? getLegalCards(myHand, game.currentTrick, trump) : null
  const isMyTurn = isMyBidTurn || isMyPlayTurn || isDummyTurn
  const lastRealBid = game.auction ? [...game.auction].reverse().find(b=>b.type==='bid') : null
  const canDouble = isMyBidTurn && lastRealBid && (lastRealBid.position==='W'||lastRealBid.position==='E')
  const botName = p => p==='N'?'North':p==='E'?'East':p==='W'?'West':'South'

  const dummyPos = game.dummy
  const dummyHand = dummyPos ? game.hands[dummyPos] : null
  const showDummy = game.dummyRevealed && dummyHand

  const isNorthDummy = dummyPos==='N' && showDummy
  const isWestDummy  = dummyPos==='W' && showDummy
  const isEastDummy  = dummyPos==='E' && showDummy

  function playerLabel(pos) {
    const isDummy = dummyPos===pos && showDummy
    const isDecl = game.contract?.declarer===pos
    const name = pos==='S' ? 'South' : botName(pos)
    return `${name}${isDummy?' ★ Dummy':isDecl?' ★ Decl':''}`
  }

  function labelColor(pos) {
    if (dummyPos===pos && showDummy) return 'var(--gold)'
    if (game.contract?.declarer===pos) return 'var(--gold)'
    if (pos==='S' && isMyTurn) return '#5DCAA5'
    return 'rgba(245,240,232,0.55)'
  }

  // ── Mobile card sizes ──────────────────────────────────────────
  const mCardW = isMobile ? 52 : 72
  const mCardH = isMobile ? 73 : 101
  const mOverlap = isMobile ? 16 : 24
  const mSideCardW = isMobile ? 40 : 60
  const mSideCardH = isMobile ? 56 : 84
  const mSideOverlap = isMobile ? 11 : 15
  const mSouthCardW = isMobile ? 56 : 88
  const mSouthCardH = isMobile ? 78 : 123
  const mSouthOverlap = isMobile ? 18 : 26
  const mTrickW = isMobile ? 160 : 240
  const mTrickH = isMobile ? 140 : 200
  const mTrickCardW = isMobile ? 50 : 76
  const mTrickCardH = isMobile ? 70 : 106

  return (
    <div style={{ paddingTop:56, height:'100vh', display:'flex', flexDirection:'column', background:'#0d1f14', overflow:'hidden' }}>

      {/* ── Mobile info panel (bottom sheet) ── */}
      {isMobile && (
        <MobileSidePanel
          game={game}
          myHand={myHand}
          showPanel={showSidePanel}
          onClose={()=>setShowSidePanel(false)}
        />
      )}

      {/* ── Result overlay ── */}
      {game.phase==='complete' && game.scoring && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'#1a3d28', border:'2px solid var(--gold)', borderRadius:18, padding: isMobile ? '1.5rem 1.25rem' : '2rem', textAlign:'center', maxWidth:400, width:'100%' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{game.scoring.made?'🎉':'😔'}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? '1.4rem' : '1.8rem', color:'var(--gold)', marginBottom:'0.4rem' }}>{game.scoring.made?'Contract Made!':'Contract Defeated!'}</h2>
            <p style={{ color:'var(--cream)', marginBottom:'0.2rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>{game.contract.level}{DENOM_SYMBOLS[game.contract.denomination]} by {game.contract.declarer==='S'?'South':botName(game.contract.declarer)}</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'0.2rem' }}>NS: {game.tricks.NS} tricks · EW: {game.tricks.EW} tricks</p>
            <p style={{ color:'rgba(245,240,232,0.4)', fontSize:'0.78rem', marginBottom:'0.5rem' }}>
              NS: {game.initialHCP?.NS ?? '?'} HCP &nbsp;·&nbsp; EW: {game.initialHCP?.EW ?? '?'} HCP
            </p>
            <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--gold)', margin:'0.75rem 0' }}>
              {(() => {
                if (game.mode === 'imps') {
                  const nsIMPs = game.scoring.imps ?? 0
                  if (nsIMPs > 0) return `NS +${nsIMPs} IMPs`
                  if (nsIMPs < 0) return `EW +${Math.abs(nsIMPs)} IMPs`
                  return '0 IMPs'
                }
                const declSide = (game.contract.declarer==='N'||game.contract.declarer==='S') ? 'NS' : 'EW'
                const defSide = declSide === 'NS' ? 'EW' : 'NS'
                return game.scoring.made
                  ? `${declSide} +${game.scoring.declarerScore}`
                  : `${defSide} +${game.scoring.defenderScore}`
              })()}
              {game.mode === 'imps' ? '' : ' pts'}
            </div>
            {game.mode === 'imps' && game.scoring && (
              <p style={{ fontSize:'0.72rem', color:'rgba(245,240,232,0.4)', marginBottom:'0.5rem' }}>
                Raw score: {game.scoring.rawScore > 0 ? '+' : ''}{game.scoring.rawScore} pts
              </p>
            )}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button className="btn-gold" onClick={startGame}>Next Hand</button>
              <button className="btn-outline" onClick={()=>setScreen('menu')}>Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Last trick overlay ── */}
      {showLastTrick && lastTrick && (
        <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:150, background:'rgba(0,0,0,0.93)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:16, padding: isMobile ? '14px 16px' : '20px 28px', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.6)', maxWidth: isMobile ? '95vw' : 'none' }}>
          <p style={{ fontSize:'0.82rem', color:'var(--gold)', fontWeight:700, marginBottom:10 }}>
            {lastTrick.winner==='S'?'South won':botName(lastTrick.winner)+' won'} the trick 👑
          </p>
          <div style={{ display:'flex', gap: isMobile ? 6 : 10, justifyContent:'center', alignItems:'flex-end' }}>
            {lastTrick.trick.map((t,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.6rem', color:t.position===lastTrick.winner?'var(--gold)':'rgba(245,240,232,0.4)', marginBottom:3, fontWeight:t.position===lastTrick.winner?700:400 }}>
                  {t.position==='S'?'S':t.position}{t.position===lastTrick.winner?' 👑':''}
                </div>
                <BCard card={t.card} w={isMobile ? 52 : 72} h={isMobile ? 73 : 100} />
              </div>
            ))}
          </div>
          <p style={{ fontSize:'0.65rem', color:'rgba(245,240,232,0.2)', marginTop:8 }}>Next trick starting...</p>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 0.75rem', height:44, background:'rgba(0,0,0,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', flexShrink:0, gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '0.4rem' : '0.75rem', minWidth:0, flex:1 }}>
          <button onClick={()=>setScreen('menu')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem', flexShrink:0 }}>← Menu</button>
          <span style={{ fontFamily:"'Playfair Display',serif", color:'var(--gold)', fontWeight:700, flexShrink:0 }}>♠</span>
          {game.contract && (
            <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.08)', color:'var(--cream)', padding:'2px 8px', borderRadius:20, flexShrink:0 }}>
              <span style={{ color:'white' }}>{game.contract.level}</span>
              <span style={{ color:suitColor(game.contract.denomination) }}>{DENOM_SYMBOLS[game.contract.denomination]}</span>
              {!isMobile && <span style={{ color:'var(--text-muted)' }}> · {game.contract.declarer==='S'?'South':botName(game.contract.declarer)} declares</span>}
            </span>
          )}
        </div>
        {/* Turn indicator */}
        <div style={{ fontSize:'0.75rem', fontWeight:600, flexShrink:0 }}>
          {isMyTurn
            ? <span style={{ color:'#5DCAA5' }}>🟢 {isDummyTurn?'Dummy':'Your turn'}</span>
            : botThinking
            ? <span style={{ color:'var(--gold)' }}>{isMobile ? '...' : botName(botThinking)+' '}<ThinkingDots/></span>
            : <span style={{ color:'var(--text-muted)' }}>Wait...</span>}
        </div>
        <div style={{ display:'flex', gap: isMobile ? '0.6rem' : '1rem', fontSize:'0.78rem', fontWeight:600, flexShrink:0, alignItems:'center' }}>
          <span style={{ color:'#5DCAA5' }}>NS:{game.tricks.NS}</span>
          <span style={{ color:'#c0392b' }}>EW:{game.tricks.EW}</span>
          {isMobile && (
            <button onClick={()=>setShowSidePanel(true)} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(245,240,232,0.7)', borderRadius:6, padding:'4px 8px', fontSize:'0.7rem', cursor:'pointer' }}>Info</button>
          )}
          {!isMobile && game.contract && <span style={{ color:'rgba(245,240,232,0.4)' }}>Need {game.contract.tricksNeeded}</span>}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* NORTH */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding: isMobile ? '4px 6px 2px' : '8px 12px 4px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.72rem', fontWeight:600, color:labelColor('N') }}>{playerLabel('N')}</span>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('N',game.auction)} thinking={botThinking==='N'} />}
            </div>
            {isNorthDummy
              ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='N'} horizontal isMobile={isMobile} />
              : <FannedHand cards={game.hands['N']||[]} faceDown cardW={mCardW} cardH={mCardH} overlap={mOverlap} />
            }
          </div>

          {/* MIDDLE ROW */}
          <div style={{ flex:1, display:'flex', alignItems:'stretch', overflow:'hidden', minHeight:0, padding: isMobile ? '0 4px' : '0 8px', gap: isMobile ? 4 : 8 }}>

            {/* WEST */}
            <div style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', gap: isMobile ? 4 : 8, flexShrink:0 }}>
              <span style={{ fontSize:'0.6rem', fontWeight:700, color:labelColor('W'), writingMode:'vertical-rl', transform:'rotate(180deg)' }}>{isMobile ? 'W' : playerLabel('W')}</span>
              {isWestDummy
                ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='W'} horizontal={false} />
                : <FannedHand cards={game.hands['W']||[]} faceDown vertical cardW={mSideCardW} cardH={mSideCardH} overlap={mSideOverlap} />
              }
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('W',game.auction)} thinking={botThinking==='W'} />}
            </div>

            {/* CENTER */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: isMobile ? 4 : 8, minWidth:0, overflow:'hidden' }}>

              {/* Bidding */}
              {game.phase==='bidding' && (
                isMyBidTurn
                  ? <BidPanel auction={game.auction} onBid={handleBid} onPass={handlePass} onDouble={handleDouble} canDouble={canDouble} isMobile={isMobile} />
                  : <div style={{ textAlign:'center', padding: isMobile ? '10px 12px' : '16px 24px', background:'rgba(0,0,0,0.45)', borderRadius:12, border:'1px solid rgba(201,168,76,0.1)' }}>
                      <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:6 }}>Waiting for {botName(game.currentBidder)}...</p>
                      {botThinking && <ThinkingDots/>}
                    </div>
              )}

              {/* Trick area */}
              {game.phase==='playing' && (
                <div style={{ position:'relative', width:mTrickW, height:mTrickH, flexShrink:0 }}>
                  {['N','S','E','W'].map(p => {
                    const play = game.currentTrick.find(t=>t.position===p)
                    const offsets = {
                      N:{top:0,left:'50%',transform:'translateX(-50%)'},
                      S:{bottom:0,left:'50%',transform:'translateX(-50%)'},
                      E:{right:0,top:'50%',transform:'translateY(-50%)'},
                      W:{left:0,top:'50%',transform:'translateY(-50%)'}
                    }
                    return (
                      <div key={p} style={{ position:'absolute', ...offsets[p] }}>
                        {play
                          ? <div style={{ textAlign:'center' }}>
                              <BCard card={play.card} w={mTrickCardW} h={mTrickCardH} />
                              <div style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.45)', marginTop:2 }}>{p==='S'?'S':p}</div>
                            </div>
                          : <div style={{ width:mTrickCardW, height:mTrickCardH, borderRadius:8, border:'2px dashed rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:'0.58rem', color:'rgba(245,240,232,0.15)' }}>{p}</span>
                            </div>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {game.phase==='playing' && isDeclarer && !isMobile && (
                <p style={{ fontSize:'0.65rem', color:'rgba(201,168,76,0.6)', textAlign:'center' }}>★ Tap dummy or your hand to play</p>
              )}
            </div>

            {/* EAST */}
            <div style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'center', gap: isMobile ? 4 : 8, flexShrink:0 }}>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('E',game.auction)} thinking={botThinking==='E'} />}
              {isEastDummy
                ? <DummyHand hand={dummyHand} currentTrick={game.currentTrick} contract={game.contract} onPlay={c=>handleCardClick(c,true)} canPlay={isDummyTurn && game.currentLeader==='E'} horizontal={false} />
                : <FannedHand cards={game.hands['E']||[]} faceDown vertical cardW={mSideCardW} cardH={mSideCardH} overlap={mSideOverlap} />
              }
              <span style={{ fontSize:'0.6rem', fontWeight:700, color:labelColor('E'), writingMode:'vertical-rl' }}>{isMobile ? 'E' : playerLabel('E')}</span>
            </div>
          </div>

          {/* SOUTH — your hand */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap: isMobile ? 4 : 6, padding: isMobile ? '2px 6px 6px' : '4px 12px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.72rem', fontWeight:600, color:labelColor('S') }}>
                {playerLabel('S')} · {countHCP(myHand)} HCP{isMyPlayTurn ? ' · Your turn' : ''}
              </span>
              {game.phase==='bidding' && <BidBubble bid={getPlayerLastBid('S',game.auction)} />}
            </div>
            {/* South hand — sorted by suit */}
            <div style={{ display:'flex', gap: isMobile ? 6 : 12, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-end', maxWidth:'100%', overflow:'hidden' }}>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                const col = SUIT_COLORS[suit]==='#1a1a2e' ? 'rgba(255,255,255,0.6)' : SUIT_COLORS[suit]
                return (
                  <div key={suit} style={{ display:'flex', alignItems:'center', gap: isMobile ? 2 : 4 }}>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.4rem', color:col, fontWeight:700, flexShrink:0 }}>{SUIT_SYMBOLS[suit]}</span>
                    <FannedHand
                      cards={cards}
                      legalCards={legalCards}
                      selectedCard={selectedCard}
                      onCardClick={handleSouthCardClick}
                      cardW={mSouthCardW} cardH={mSouthCardH} overlap={mSouthOverlap}
                    />
                  </div>
                )
              })}
            </div>
            {game.dummy==='S' && game.dummyRevealed && (
              <p style={{ fontSize:'0.7rem', color:'rgba(201,168,76,0.5)', fontStyle:'italic' }}>
                {botName(game.contract?.declarer)} is playing South's hand as dummy
              </p>
            )}
            {isMyPlayTurn && <p style={{ fontSize:'0.6rem', color:'rgba(245,240,232,0.2)' }}>Tap to select · Tap again to play</p>}
          </div>
        </div>

        {/* RIGHT PANEL — desktop only */}
        {!isMobile && (
          <div style={{ width:172, background:'rgba(0,0,0,0.4)', borderLeft:'1px solid rgba(201,168,76,0.1)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflowY:'auto' }}>
            <div>
              <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Bidding History</p>
              <AuctionHistory auction={game.auction} dealer={game.dealer} />
            </div>
            {game.contract && (
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'8px 10px' }}>
                <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Contract</p>
                <p style={{ fontSize:'1rem', fontWeight:700, marginBottom:4 }}>
                  <span style={{ color:'white' }}>{game.contract.level}</span>
                  <span style={{ color: game.contract.denomination==='H'||game.contract.denomination==='D'?'#e74c3c':game.contract.denomination==='NT'?'#7eb5f5':'#ffffff' }}>{DENOM_SYMBOLS[game.contract.denomination]}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginLeft:4 }}>by {game.contract.declarer==='S'?'South':game.contract.declarer==='N'?'North':game.contract.declarer==='E'?'East':'West'}</span>
                </p>
                {game.phase==='playing' && <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:'0.72rem', color:'#5DCAA5' }}>NS won</span>
                    <span style={{ fontSize:'0.82rem', color:'#5DCAA5', fontWeight:700 }}>{game.tricks.NS}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:'0.72rem', color:'#c0392b' }}>EW won</span>
                    <span style={{ fontSize:'0.82rem', color:'#c0392b', fontWeight:700 }}>{game.tricks.EW}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:4 }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Need</span>
                    <span style={{ fontSize:'0.82rem', color:'var(--gold)', fontWeight:700 }}>{game.contract.tricksNeeded - game.tricks[(game.contract.declarer==='N'||game.contract.declarer==='S')?'NS':'EW']} more</span>
                  </div>
                </>}
              </div>
            )}
            <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'8px 10px' }}>
              <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Your Hand · {countHCP(myHand)} HCP</p>
              {['S','H','D','C'].map(suit => {
                const cards = myHand.filter(c=>c.suit===suit).sort((a,b)=>VALUE_RANK[b.value]-VALUE_RANK[a.value])
                if (!cards.length) return null
                const col = SUIT_COLORS[suit]==='#1a1a2e' ? 'rgba(255,255,255,0.85)' : SUIT_COLORS[suit]
                return <p key={suit} style={{ fontSize:'0.82rem', color:col, marginBottom:3 }}>{SUIT_SYMBOLS[suit]} {cards.map(c=>c.value).join(' ')}</p>
              })}
            </div>
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
              <p style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, fontWeight:700 }}>Vulnerability</p>
              <p style={{ fontSize:'0.8rem', color:game.vulnerability?.NS?'#c0392b':'#5DCAA5', marginBottom:3 }}>NS: {game.vulnerability?.NS?'Vul':'Not vul'}</p>
              <p style={{ fontSize:'0.8rem', color:game.vulnerability?.EW?'#c0392b':'#5DCAA5' }}>EW: {game.vulnerability?.EW?'Vul':'Not vul'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
