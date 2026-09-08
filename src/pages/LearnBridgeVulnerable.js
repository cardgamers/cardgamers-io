import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LearnBridgeVulnerable() {
  usePageMeta('/learn/bridge/vulnerable')
  return (
    <div style={{ paddingTop:64, minHeight:'100vh', background:'var(--felt-dark)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem', fontWeight:600 }}>♠ Bridge Scoring</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--cream)', marginBottom:'0.6rem' }}>Vulnerability in Bridge — What It Means and Why It Matters</h1>
          <p style={{ color:'rgba(245,240,232,0.6)', fontSize:'0.95rem', lineHeight:1.7, maxWidth:580, marginBottom:'1.25rem' }}>Vulnerability is one of the most important concepts in bridge scoring. When your side is vulnerable, the stakes are higher — you earn bigger bonuses for making game and slam contracts, but you also pay heavier penalties when you go down. Understanding vulnerability changes how aggressively you bid and whether you double opponents.</p>
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
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>How Vulnerability Works</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>In rubber bridge, you become vulnerable after winning your first game. In duplicate bridge, vulnerability is pre-assigned to each board in a rotation: Board 1 is neither side vulnerable, Board 2 is North-South vulnerable, Board 3 is East-West vulnerable, Board 4 is both sides vulnerable, and the pattern repeats. On cardgamers.io, the vulnerability rotates across your 4-hand session in the same way.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Always check the vulnerability before bidding. It changes the value of games, slams, and penalty doubles dramatically.</p>
          </div>
        </div>
      </div>
      {/* Section 2 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>2</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>How Vulnerability Affects Game Bonuses</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Making game scores differently depending on vulnerability. Not vulnerable: +300 bonus for game. Vulnerable: +500 bonus for game. This makes vulnerable games worth significantly more — and means missing a vulnerable game costs you more than missing a non-vulnerable game. In IMP scoring, bidding and making a vulnerable game that your opponents missed is worth 10 IMPs.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>A vulnerable game bonus of +500 versus a non-vulnerable +300 is a 200-point swing — enough to change the whole session result.</p>
          </div>
        </div>
      </div>
      {/* Section 3 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>3</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>How Vulnerability Affects Penalties</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Going down costs more when vulnerable. Not vulnerable: 50 points per undertrick (undoubled). Vulnerable: 100 points per undertrick (undoubled). Doubled not vulnerable: 100 for 1st undertrick, 200 each after. Doubled vulnerable: 200 for 1st undertrick, 300 each after. This is why opponents are more willing to double you when vulnerable — the rewards are much larger.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Being doubled and vulnerable going down 3 tricks costs 800 points — nearly as much as a vulnerable game.</p>
          </div>
        </div>
      </div>
      {/* Section 4 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>4</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Vulnerability and Bidding Strategy</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Vulnerability should influence several bidding decisions. Pre-empts: Be more careful with weak 2s and 3-bids when vulnerable — the penalties are severe if doubled. Doubles: Double opponents more freely when they are vulnerable. Sacrifice bids: A sacrifice is only worthwhile if you go down fewer points than the opponents would score for their contract. Slam bidding: Push harder for slam when vulnerable — the extra bonus is worth the risk.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Favourable vulnerability (you not vul, opponents vul) is the best time to pre-empt and take sacrifices.</p>
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
