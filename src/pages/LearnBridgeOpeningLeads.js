import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LearnBridgeOpeningLeads() {
  usePageMeta('/learn/bridge/opening-leads')
  return (
    <div style={{ paddingTop:64, minHeight:'100vh', background:'var(--felt-dark)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem', fontWeight:600 }}>♠ Bridge Defense</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--cream)', marginBottom:'0.6rem' }}>Bridge Opening Leads — Which Card to Lead and Why</h1>
          <p style={{ color:'rgba(245,240,232,0.6)', fontSize:'0.95rem', lineHeight:1.7, maxWidth:580, marginBottom:'1.25rem' }}>The opening lead is the most critical card a defender plays. It sets the tone for the entire defense and can win or lose the contract before declarer plays a single card. Standard American has clear guidelines for which card to lead in different situations — against No Trump contracts and against suit contracts.</p>
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
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Against No Trump Contracts</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>The standard lead against NT is the 4th-best card of your longest suit. From K-J-8-6-3, lead the 6 (4th best). This signals the length of your suit to partner using the Rule of 11: subtract the card led from 11 to know how many higher cards are held by the other three players combined. Top of a solid sequence (KQJ, QJ10) is always preferred over 4th best when you have one.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Rule of 11: subtract the card led from 11. The result tells partner how many cards higher than yours are in the other three hands.</p>
          </div>
        </div>
      </div>
      {/* Section 2 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>2</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Against Suit Contracts</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Against suit contracts, top of a sequence is usually best (KQJ, QJ10, J109). From partner's bid suit, lead the highest card. From a doubleton (two cards), lead the top then low — this shows your partner exactly two cards. Avoid leading away from unsupported aces (A-x-x) in a side suit — declarer may have the King and you'll give away a trick.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Never lead away from an ace in a suit contract unless you have the King too (AK is a perfect lead — cash the Ace first).</p>
          </div>
        </div>
      </div>
      {/* Section 3 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>3</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Standard Honour Leads</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Top of a sequence shows the card led and the one below it. Ace shows AK or requests partner to play their highest (suit contracts). King shows KQ or AK. Queen shows QJ or KQ against NT. Jack shows J10 or denies a higher honour. Ten shows 109 or an interior sequence (KJ10, AJ10). Nine shows 98 or an interior sequence. When you lead an honour, partner knows you have the card below it.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Leading the King against a suit contract asks partner to play their highest card — useful for unblocking or getting a ruff.</p>
          </div>
        </div>
      </div>
      {/* Section 4 */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>4</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>When to Lead a Short Suit</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>A singleton lead is often powerful in a suit contract — if you can get in later and partner leads your suit back, you ruff a winner. Lead a singleton when: you have a certain entry (an ace), you have trump control to ruff, and the singleton is not a suit declarer bid. Avoid singleton leads when you have a strong trump holding — you'd rather sit back and score your trumps naturally.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Don't lead a singleton in declarer's side suit — you're just setting up their long suit for discards.</p>
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
