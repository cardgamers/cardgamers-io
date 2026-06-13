import React, { useState, useEffect, useCallback } from 'react';
import { createDeck, shuffle, dealHands, sortHand, botBid, botPlay, getValidCards, trickWinner, calcTeamScore } from './spadesEngine';

const PLAYER_NAMES = ['You', 'West (Bot)', 'Partner (Bot)', 'East (Bot)'];
const TEAM_NAMES = ['Your team', 'Bots'];

function CardEl({ card, onClick, valid, selected }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const s = {
    card: {
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '52px', height: '78px', borderRadius: '8px', border: selected ? '2px solid #f0c040' : '1px solid rgba(255,255,255,0.2)',
      background: valid ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
      color: isRed ? '#c0392b' : '#1a1a1a', cursor: valid ? 'pointer' : 'default',
      fontSize: '1.1rem', fontWeight: 700, transform: selected ? 'translateY(-8px)' : 'none',
      transition: 'transform 0.15s', userSelect: 'none', margin: '0 3px',
    },
    rank: { fontSize: '1rem', lineHeight: 1 },
    suit: { fontSize: '1.1rem', lineHeight: 1 },
  };
  return (
    <div style={s.card} onClick={valid ? onClick : undefined}>
      <span style={s.rank}>{card.rank}</span>
      <span style={s.suit}>{card.suit}</span>
    </div>
  );
}

export default function Spades() {
  const [hands, setHands] = useState(null);
  const [bids, setBids] = useState([null, null, null, null]);
  const [bidInput, setBidInput] = useState(1);
  const [nilBids, setNilBids] = useState([false, false, false, false]);
  const [trick, setTrick] = useState([]);
  const [trickNo, setTrickNo] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [tricksWon, setTricksWon] = useState([0, 0, 0, 0]);
  const [scores, setScores] = useState([0, 0]);
  const [phase, setPhase] = useState('deal');
  const [lastTrick, setLastTrick] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState(null);

  const startGame = useCallback(() => {
    const deck = shuffle(createDeck());
    const dealt = dealHands(deck);
    setHands(dealt.map(h => sortHand(h)));
    setBids([null, null, null, null]);
    setNilBids([false, false, false, false]);
    setTrick([]);
    setTrickNo(0);
    setCurrentPlayer(0);
    setSpadesBroken(false);
    setTricksWon([0, 0, 0, 0]);
    setLastTrick(null);
    setGameOver(false);
    setSelected(null);
    setPhase('bidding');
  }, []);

  useEffect(() => { startGame(); }, [startGame]);

  useEffect(() => {
    if (phase !== 'bidding') return;
    if (bids[currentPlayer] !== null) return;
    if (currentPlayer === 0) return;
    const timer = setTimeout(() => {
      const bid = botBid(hands[currentPlayer]);
      const newBids = [...bids];
      newBids[currentPlayer] = bid;
      setBids(newBids);
      const next = currentPlayer + 1;
      if (next < 4) setCurrentPlayer(next);
      else { setCurrentPlayer(0); setPhase('playing'); }
    }, 600);
    return () => clearTimeout(timer);
  }, [phase, currentPlayer, bids, hands]);

  const submitBid = () => {
    const newBids = [...bids];
    newBids[0] = bidInput;
    setBids(newBids);
    setCurrentPlayer(1);
  };

  const playCard = useCallback((cardIdx) => {
    if (currentPlayer !== 0 || phase !== 'playing') return;
    const hand = hands[0];
    const card = hand[cardIdx];
    const valid = getValidCards(hand, trick, spadesBroken);
    if (!valid.find(c => c === card)) return;
    const newHands = hands.map(h => [...h]);
    newHands[0] = hand.filter((_, i) => i !== cardIdx);
    const newTrick = [...trick, { player: 0, card }];
    const newSpadesBroken = spadesBroken || card.suit === '♠';
    setHands(newHands);
    setTrick(newTrick);
    setSpadesBroken(newSpadesBroken);
    setSelected(null);
    if (newTrick.length === 4) {
      resolveTrick(newTrick, newHands, newSpadesBroken);
    } else {
      setCurrentPlayer(1);
    }
  }, [currentPlayer, phase, hands, trick, spadesBroken]);

  const resolveTrick = useCallback((completedTrick, currentHands, currentSpadesBroken) => {
    const winner = trickWinner(completedTrick);
    const newTricksWon = [...tricksWon];
    newTricksWon[winner] += 1;
    setTricksWon(newTricksWon);
    setLastTrick(completedTrick);
    const newTrickNo = trickNo + 1;
    setTrickNo(newTrickNo);
    setTimeout(() => {
      setTrick([]);
      if (newTrickNo === 13) {
        const t0 = calcTeamScore([bids[0], bids[2]], [newTricksWon[0], newTricksWon[2]]);
        const t1 = calcTeamScore([bids[1], bids[3]], [newTricksWon[1], newTricksWon[3]]);
        const newScores = [scores[0] + t0, scores[1] + t1];
        setScores(newScores);
        if (newScores[0] >= 500 || newScores[1] >= 500) setGameOver(true);
        else startGame();
      } else {
        setCurrentPlayer(winner);
      }
    }, 1200);
  }, [tricksWon, trickNo, bids, scores, startGame]);

  useEffect(() => {
    if (phase !== 'playing' || currentPlayer === 0) return;
    if (trick.length === 4) return;
    const timer = setTimeout(() => {
      const hand = hands[currentPlayer];
      const card = botPlay(hand, trick, spadesBroken);
      const newHands = hands.map(h => [...h]);
      newHands[currentPlayer] = hand.filter(c => c !== card);
      const newTrick = [...trick, { player: currentPlayer, card }];
      const newSpadesBroken = spadesBroken || card.suit === '♠';
      setHands(newHands);
      setTrick(newTrick);
      setSpadesBroken(newSpadesBroken);
      if (newTrick.length === 4) {
        resolveTrick(newTrick, newHands, newSpadesBroken);
      } else {
        setCurrentPlayer(currentPlayer + 1);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [phase, currentPlayer, hands, trick, spadesBroken, resolveTrick]);

  const s = {
    page: { minHeight: '100vh', background: 'var(--felt-dark)', color: 'var(--cream)', padding: '5rem 1rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '1rem' },
    table: { width: '100%', maxWidth: '700px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' },
    scores: { display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.2rem' },
    scoreBox: { textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem 1.5rem' },
    scoreNum: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' },
    scoreLbl: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' },
    trickArea: { minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '1rem 0', flexWrap: 'wrap' },
    hand: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', marginTop: '1rem' },
    bidBox: { textAlign: 'center', padding: '1rem' },
    bidTitle: { fontSize: '1rem', color: 'rgba(245,240,232,0.7)', marginBottom: '1rem' },
    bidRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
    bidBtn: { padding: '0.6rem 1.6rem', background: 'var(--gold)', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
    select: { padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', color: 'var(--cream)', border: '1px solid rgba(245,240,232,0.2)' },
    info: { fontSize: '0.85rem', color: 'rgba(245,240,232,0.45)', textAlign: 'center', marginTop: '0.5rem' },
    gameOver: { textAlign: 'center', padding: '2rem' },
    btn: { marginTop: '1rem', padding: '0.7rem 2rem', background: 'var(--gold)', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
    playerLabel: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', textAlign: 'center', marginBottom: '4px' },
    trickCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  };

  if (!hands) return <div style={s.page}><p>Dealing...</p></div>;

  if (gameOver) return (
    <div style={s.page}>
      <h1 style={s.title}>Game over</h1>
      <div style={s.gameOver}>
        <p style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>
          {scores[0] > scores[1] ? '🏆 Your team wins!' : '💀 Bots win this one!'}
        </p>
        <p style={s.info}>Your team: {scores[0]} — Bots: {scores[1]}</p>
        <button style={s.btn} onClick={startGame}>Play again</button>
      </div>
    </div>
  );

  const validCards = phase === 'playing' && currentPlayer === 0
    ? getValidCards(hands[0], trick, spadesBroken)
    : [];

  return (
    <div style={s.page}>
      <h1 style={s.title}>♠ Spades</h1>
      <div style={s.scores}>
        {TEAM_NAMES.map((name, i) => (
          <div key={name} style={s.scoreBox}>
            <div style={s.scoreNum}>{scores[i]}</div>
            <div style={s.scoreLbl}>{name}</div>
          </div>
        ))}
      </div>

      <div style={s.table}>
        {phase === 'bidding' && (
          <div style={s.bidBox}>
            <p style={s.bidTitle}>
              {currentPlayer === 0 ? 'Your bid — how many tricks will you win?' : `${PLAYER_NAMES[currentPlayer]} is bidding...`}
            </p>
            {currentPlayer === 0 && (
              <div style={s.bidRow}>
                <select style={s.select} value={bidInput} onChange={e => setBidInput(Number(e.target.value))}>
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => (
                    <option key={n} value={n}>{n === 0 ? 'Nil (0)' : n}</option>
                  ))}
                </select>
                <button style={s.bidBtn} onClick={submitBid}>Confirm bid</button>
              </div>
            )}
            <p style={s.info}>
              {bids.map((b, i) => b !== null ? `${PLAYER_NAMES[i]}: ${b}` : null).filter(Boolean).join(' · ')}
            </p>
          </div>
        )}

        {phase === 'playing' && (
          <>
            <p style={s.info}>
              Trick {trickNo + 1} of 13 &nbsp;·&nbsp;
              {bids.map((b, i) => `${PLAYER_NAMES[i]}: bid ${b}, won ${tricksWon[i]}`).join(' · ')}
            </p>
            <div style={s.trickArea}>
              {trick.map((t, i) => (
                <div key={i} style={s.trickCard}>
                  <div style={s.playerLabel}>{PLAYER_NAMES[t.player]}</div>
                  <CardEl card={t.card} valid={false} />
                </div>
              ))}
              {trick.length === 0 && lastTrick && (
                <p style={s.info}>
                  {PLAYER_NAMES[trickWinner(lastTrick)]} won the last trick
                </p>
              )}
            </div>
            {currentPlayer === 0 && trick.length < 4 && (
              <p style={{ ...s.info, color: 'var(--gold)' }}>Your turn — tap a card to play</p>
            )}
            {currentPlayer !== 0 && (
              <p style={s.info}>{PLAYER_NAMES[currentPlayer]} is thinking...</p>
            )}
          </>
        )}
      </div>

      <div style={s.hand}>
        {hands[0].map((card, i) => {
          const isValid = validCards.includes(card);
          return (
            <CardEl
              key={i}
              card={card}
              valid={isValid}
              selected={selected === i}
              onClick={() => {
                if (selected === i) { playCard(i); setSelected(null); }
                else setSelected(i);
              }}
            />
          );
        })}
      </div>
      <p style={s.info}>Tap once to select, tap again to play</p>
    </div>
  );
}