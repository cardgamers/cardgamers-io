import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LearnBridgeBlackwood() {
  usePageMeta('/learn/bridge/blackwood')
  return (
    <div style={{ paddingTop:64, minHeight:'100vh', background:'var(--felt-dark)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem', fontWeight:600 }}>♠ Bridge Conventions</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--cream)', marginBottom:'0.6rem' }}>Blackwood Convention — Asking for Aces</h1>
          <p style={{ color:'rgba(245,240,232,0.6)', fontSize:'0.95rem', lineHeight:1.7, maxWidth:580, marginBottom:'1.25rem' }}>Blackwood is the most widely used slam convention in bridge. When a trump suit is agreed and you want to bid a slam, 4NT asks partner how many aces they hold. The responses tell you whether your combined hands have enough aces to safely bid a small or grand slam.</p>
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
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>The 4NT Ask and Responses</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>After bidding 4NT (Blackwood), partner responds: 5♣ = 0 or 4 aces. 5♦ = 1 ace. 5♥ = 2 aces. 5♠ = 3 aces. If you then bid 5NT, you are asking for kings using the same scale: 6♣ = 0 kings, 6♦ = 1 king, 6♥ = 2 kings, 6♠ = 3 kings, 6NT = 4 kings.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>5♣ shows 0 OR 4 aces. Context usually makes it clear which — if you've shown a strong hand, 4 aces is more likely.</p>
          </div>
        </div>
      </div>
      {/* Section 2 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>2</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>When to Use Blackwood</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Use Blackwood when: you have agreed on a trump suit, you have at least 33 combined HCP for a small slam or 37 for a grand slam, and the only question is whether you're missing two aces. Do NOT use Blackwood when you have a void — the responses become unreliable because a void can compensate for a missing ace but Blackwood can't show this.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Blackwood asks a simple question: how many aces? If the answer won't change your decision, don't ask.</p>
          </div>
        </div>
      </div>
      {/* Section 3 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>3</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>When NOT to Use Blackwood</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Avoid Blackwood with: a void suit (use cue-bidding instead), a hand missing two aces (you already know slam is off), or when 4NT would be a natural bid (after opening 2NT or rebidding NT). If partner might have only 1 ace and the response would put you past the safe level, cue-bid instead.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Never use Blackwood if you can't handle any of the four possible responses.</p>
          </div>
        </div>
      </div>
      {/* Section 4 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>4</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Roman Key Card Blackwood (RKCB)</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Many experienced players use Roman Key Card Blackwood instead of standard Blackwood. RKCB treats the King of trumps as a 5th key card. 5♣ = 0 or 3 key cards. 5♦ = 1 or 4 key cards. 5♥ = 2 or 5 key cards without the trump Queen. 5♠ = 2 or 5 key cards with the trump Queen. RKCB gives more information than standard Blackwood and is standard at most duplicate clubs.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>RKCB 5♣ and 5♦ are ambiguous — partner clarifies with further bids if needed.</p>
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
