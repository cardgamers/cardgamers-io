import React, { useState } from 'react';

export default function Tournaments() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('https://formspree.io/f/xwpkqvjb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'tournament-waitlist' }),
    }).then(() => setDone(true));
  };

  const s = {
    page:  { minHeight: '100vh', background: 'var(--felt-dark)', color: 'var(--cream)', padding: '6rem 1.5rem 4rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
    inner: { width: '100%', maxWidth: '560px', textAlign: 'center' },
    emoji: { fontSize: '3.5rem', marginBottom: '1.5rem' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.75rem' },
    sub:   { color: 'rgba(245,240,232,0.5)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' },
    row:   { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' },
    input: { flex: 1, minWidth: '200px', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.15)', borderRadius: '8px', color: 'var(--cream)', fontSize: '0.95rem' },
    btn:   { padding: '0.75rem 1.8rem', background: 'var(--gold)', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' },
    done:  { color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', marginTop: '1rem' },
    features: { display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', margin: '2.5rem 0', },
    feat: { fontSize: '0.85rem', color: 'rgba(245,240,232,0.45)' },
    featNum: { fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--gold)', display: 'block', marginBottom: '0.25rem' },
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.emoji}>🏆</div>
        <h1 style={s.title}>Tournaments coming soon</h1>
        <p style={s.sub}>
          We're building a full tournament system — scheduled events, prize pools,
          live brackets and leaderboards. Bridge, Rummy and Teen Patti tournaments first.
        </p>
        <div style={s.features}>
          <div style={s.feat}><span style={s.featNum}>🂡</span>Bridge events</div>
          <div style={s.feat}><span style={s.featNum}>🃏</span>Rummy leagues</div>
          <div style={s.feat}><span style={s.featNum}>🎴</span>Teen Patti cups</div>
        </div>
        {done ? (
          <p style={s.done}>✅ You're on the list! We'll email you when tournaments go live.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={s.row}>
              <input style={s.input} type="email" required placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} />
              <button style={s.btn} type="submit">Notify me</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}