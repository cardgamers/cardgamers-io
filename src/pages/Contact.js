import React, { useState } from 'react';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('https://formspree.io/f/xwpkqvjb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(() => setSent(true));
  };

  const s = {
    page: { minHeight: '100vh', background: 'var(--felt-dark)', color: 'var(--cream)', padding: '6rem 1.5rem 4rem', display: 'flex', justifyContent: 'center' },
    inner: { width: '100%', maxWidth: '560px' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.5rem' },
    sub: { color: 'rgba(245,240,232,0.5)', fontSize: '0.95rem', marginBottom: '2.5rem' },
    label: { display: 'block', fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)', marginBottom: '0.4rem', marginTop: '1.2rem' },
    input: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.15)', borderRadius: '8px', color: 'var(--cream)', fontSize: '0.95rem', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.15)', borderRadius: '8px', color: 'var(--cream)', fontSize: '0.95rem', minHeight: '140px', boxSizing: 'border-box', resize: 'vertical' },
    btn: { marginTop: '1.8rem', padding: '0.8rem 2rem', background: 'var(--gold)', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
    success: { textAlign: 'center', padding: '3rem 0' },
  };

  if (sent) return (
    <div style={s.page}>
      <div style={{ ...s.inner, ...s.success }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
        <h2 style={s.title}>Message sent!</h2>
        <p style={s.sub}>We'll get back to you within 24 hours.</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>Contact us</h1>
        <p style={s.sub}>Questions, feedback, bug reports — we read everything.</p>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Your name</label>
          <input style={s.input} type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <label style={s.label}>Email address</label>
          <input style={s.input} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label style={s.label}>Message</label>
          <textarea style={s.textarea} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
          <button style={s.btn} type="submit">Send message</button>
        </form>
      </div>
    </div>
  );
}