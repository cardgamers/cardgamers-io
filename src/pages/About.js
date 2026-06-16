import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta'

export default function About() {
  usePageMeta('/about')

  const s = {
    page: { minHeight: '100vh', background: 'var(--felt-dark)', color: 'var(--cream)', padding: '6rem 1.5rem 4rem', display: 'flex', justifyContent: 'center' },
    inner: { width: '100%', maxWidth: '640px' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '1.5rem' },
    body: { fontSize: '1.05rem', lineHeight: '1.8', color: 'rgba(245,240,232,0.75)' },
    divider: { border: 'none', borderTop: '1px solid rgba(245,240,232,0.08)', margin: '2.5rem 0' },
    stat: { display: 'flex', gap: '3rem', flexWrap: 'wrap', marginTop: '2rem' },
    statBox: { textAlign: 'center' },
    statNum: { fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)', display: 'block' },
    statLbl: { fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)', marginTop: '0.25rem', display: 'block' },
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>About CardGamers.io</h1>
        <p style={s.body}>
          CardGamers.io is a free, browser-based card game platform built for players who love classic games.
          No download, no install — just open your browser and play Bridge, Rummy, Spades or Solitaire
          against real opponents or smart bots from anywhere in the world. We built this because great card
          games deserve a great home online: fast, clean, and available in multiple languages so every
          player feels at home.
        </p>
        <hr style={s.divider} />
        <div style={s.stat}>
          <div style={s.statBox}>
            <span style={s.statNum}>4</span>
            <span style={s.statLbl}>Games</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>5</span>
            <span style={s.statLbl}>Languages</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>Free</span>
            <span style={s.statLbl}>To play</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>0</span>
            <span style={s.statLbl}>Downloads needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
