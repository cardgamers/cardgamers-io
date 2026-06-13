import React from 'react';
import { Link } from 'react-router-dom';

const games = [
  { name: 'Spades', desc: 'Bid, bluff and take tricks. Play solo against bots or with a partner.', path: '/game/spades', emoji: '♠️' },
  { name: 'Solitaire',   desc: 'Classic single-player card game. Simple, relaxing, endlessly replayable.', path: '/game/solitaire',   emoji: '🂡' },
  { name: 'Rummy',       desc: 'Form sets and sequences. Play live against real opponents.',                path: '/game/rummy',       emoji: '🃏' },
  { name: 'Bridge',      desc: 'Rubber & Duplicate formats. Bot opponents available anytime.',             path: '/game/bridge',      emoji: '♠️' },
  { name: 'Teen Patti',  desc: 'Three variants — Classic, AK47, and Muflis. India\'s favourite card game.',path: '/game/teen-patti',  emoji: '🎴' },
];

export default function Games() {
  const s = {
    page:  { minHeight: '100vh', background: 'var(--felt-dark)', color: 'var(--cream)', padding: '6rem 1.5rem 4rem', display: 'flex', justifyContent: 'center' },
    inner: { width: '100%', maxWidth: '680px' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.5rem' },
    sub:   { color: 'rgba(245,240,232,0.5)', fontSize: '0.95rem', marginBottom: '2.5rem' },
    grid:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
    card:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,240,232,0.1)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
    left:  { display: 'flex', alignItems: 'center', gap: '1.2rem' },
    emoji: { fontSize: '2.2rem', lineHeight: 1 },
    name:  { fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '0.3rem' },
    desc:  { fontSize: '0.85rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.5 },
    btn:   { padding: '0.6rem 1.4rem', background: 'var(--gold)', color: '#1a1a1a', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' },
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>Our games</h1>
        <p style={s.sub}>All free to play. No download needed. Works on any device.</p>
        <div style={s.grid}>
          {games.map(g => (
            <div key={g.name} style={s.card}>
              <div style={s.left}>
                <span style={s.emoji}>{g.emoji}</span>
                <div>
                  <div style={s.name}>{g.name}</div>
                  <div style={s.desc}>{g.desc}</div>
                </div>
              </div>
              <Link to={g.path} style={s.btn}>Play</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}