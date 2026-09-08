import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LearnBridgeStayman() {
  usePageMeta('/learn/bridge/stayman')
  return (
    <div style={{ paddingTop:64, minHeight:'100vh', background:'var(--felt-dark)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem', fontWeight:600 }}>♠ Bridge Conventions</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--cream)', marginBottom:'0.6rem' }}>The Stayman Convention — How and When to Use It</h1>
          <p style={{ color:'rgba(245,240,232,0.6)', fontSize:'0.95rem', lineHeight:1.7, maxWidth:580, marginBottom:'1.25rem' }}>Stayman is one of the most essential conventions in Standard American Bridge. When partner opens 1NT, you bid 2♣ as an artificial ask — not clubs, but a question: 'Do you have a 4-card major?' Played correctly, Stayman helps you find 4-4 major suit fits that often play better than 3NT.</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link to="/game/bridge" className="btn-gold" style={{ fontSize:'0.88rem', padding:'0.55rem 1.25rem' }}>♠ Play Bridge Free →</Link>
            <Link to="/learn/bridge/scoring" style={{ fontSize:'0.88rem', padding:'0.55rem 1.25rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'rgba(245,240,232,0.7)', textDecoration:'none' }}>Bridge Scoring Guide →</Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:800, margin:'2rem auto', padding:'0 1.5rem 4rem' }}>

      {/* Section 1 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>1</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>When to Use Stayman</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Use Stayman when you have 8+ HCP and at least one 4-card major (Hearts or Spades). You need enough points to invite or force to game, and you need a major to look for. Without a 4-card major, there is no point in asking — just bid 3NT with game values.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Don't use Stayman with a 4-3-3-3 hand. You're better off in 3NT than a 4-3 major fit.</p>
          </div>
        </div>
      </div>
      {/* Section 2 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>2</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>The Responses to 2♣ Stayman</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>After you bid 2♣, opener must respond: 2♦ shows no 4-card major. 2♥ shows exactly 4 Hearts (may also have 4 Spades). 2♠ shows 4 Spades but denies 4 Hearts. These responses are forcing — you cannot pass.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>If opener bids 2♥ and you have 4 Spades not Hearts, bid 2♠ next to look for your fit.</p>
          </div>
        </div>
      </div>
      {/* Section 3 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>3</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>What to Do After the Response</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>If opener shows your major: with 8-9 HCP raise to 3 of the major (invitational). With 10+ HCP jump to 4 of the major (game). If opener bids 2♦ (no major): with 8-9 bid 2NT (invitational). With 10+ bid 3NT (game). If opener bids the wrong major: bid 2NT or 3NT as appropriate — you've confirmed no fit.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>After Stayman finds a fit, you can also cue-bid or use 4NT Blackwood to explore slam.</p>
          </div>
        </div>
      </div>
      {/* Section 4 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>4</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Garbage Stayman — The Exception</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>With a very weak hand (0-7 HCP) and 4-4-4-1 or 5-4-1-3 shape, you can bid 2♣ with no intention of playing 2NT. Whatever opener bids — 2♦, 2♥, or 2♠ — you pass. This is called Garbage Stayman and keeps you out of a doomed 1NT. The singleton makes 1NT dangerous; any 2-level suit contract is safer.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Garbage Stayman only works if you can pass ANY response from opener. Don't use it if you can't pass 2♦.</p>
          </div>
        </div>
      </div>
        {/* CTA */}
        <div style={{ marginTop:'2.5rem', paddingTop:'2rem', borderTop:'1px solid rgba(201,168,76,0.1)', textAlign:'center' }}>
          <p style={{ fontSize:'0.9rem', color:'rgba(245,240,232,0.6)', marginBottom:'1rem' }}>Practice what you've learned against smart bots — free, no sign-up needed.</p>
          <Link to="/game/bridge" className="btn-gold" style={{ fontSize:'0.95rem', padding:'0.7rem 2rem', display:'inline-flex' }}>♠ Play Bridge Now →</Link>
        </div>

        {/* Related links */}
        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>More Bridge guides</p>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <Link to="/learn/bridge-intro" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, color:'var(--gold)', textDecoration:'none' }}>Beginner's Guide</Link>
            <Link to="/learn/bridge/scoring" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Scoring Systems</Link>
            <Link to="/learn/bridge/stayman" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Stayman Convention</Link>
            <Link to="/learn/bridge/blackwood" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Blackwood Convention</Link>
            <Link to="/learn/bridge/vulnerable" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Vulnerability Guide</Link>
            <Link to="/learn/bridge/opening-leads" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Opening Leads</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
