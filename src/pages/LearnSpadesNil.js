import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LearnSpadesNil() {
  usePageMeta('/learn/spades/nil-bid')
  return (
    <div style={{ paddingTop:64, minHeight:'100vh', background:'var(--felt-dark)' }}>
      <div style={{ background:'linear-gradient(135deg,rgba(15,34,25,0.95),rgba(26,26,46,0.9))', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.5rem', fontWeight:600 }}>♠ Spades Strategy</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--cream)', marginBottom:'0.6rem' }}>How to Bid Nil in Spades</h1>
          <p style={{ color:'rgba(245,240,232,0.6)', fontSize:'0.95rem', lineHeight:1.7, maxWidth:580, marginBottom:'1.25rem' }}>A nil bid is one of the most exciting — and risky — plays in Spades. You're promising to win zero tricks in the hand. If you succeed, your team scores a big bonus. If you fail and take even one trick, you're penalized. Understanding when and how to bid nil is one of the skills that separates good Spades players from great ones.</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link to="/game/spades" className="btn-gold" style={{ fontSize:'0.88rem', padding:'0.55rem 1.25rem' }}>♠ Play Spades Free →</Link>
            <Link to="/learn/spades" style={{ fontSize:'0.88rem', padding:'0.55rem 1.25rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'rgba(245,240,232,0.7)', textDecoration:'none' }}>Spades Rules →</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:800, margin:'2rem auto', padding:'0 1.5rem 4rem' }}>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>1</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>What is a Nil Bid?</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>When you bid nil, you're declaring that you will win zero tricks during the hand. Your partner bids and plays normally — only you must avoid winning any tricks. If you succeed, your team earns a 100-point bonus on top of your partner's bid. If you fail (take even one trick), your team loses 100 points, though your partner's tricks still count toward their bid.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Nil is worth 100 points bonus — roughly equivalent to making a 10-trick bid. It's a huge swing either way.</p>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>2</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>When to Bid Nil</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Bid nil when your hand is weak enough to avoid winning tricks. Good nil hands have: no Aces or Kings in side suits, no high Spades (avoid Ace, King, Queen of Spades), short suits where you can discard on partner's leads, and low cards across all suits. Ideally, your highest card should be a 9 or lower, with nothing in Spades above a 7.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>The 2♠ through 7♠ are relatively safe. The Q♠ is dangerous — opponents will lead Spades to knock it out of you.</p>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>3</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>How to Play a Nil Hand</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Once you've bid nil, your goal is to avoid taking any trick. Key techniques: play your highest cards under the current winner when following suit — this ducks the trick. When void in a suit, discard your highest cards from other suits to get rid of dangerous holdings. If you have the Q♠ or J♠, try to dump them on partner's Spade leads early. Signal to partner which suits are safe to lead through.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Discard high cards aggressively when void in a suit. Every Ace or King you shed is one less threat to your nil.</p>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>4</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>How to Help Partner's Nil</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>When partner bids nil, your job is to protect them. Lead through their dangerous suits early to let them dump high cards. Avoid leading suits where partner might be forced to win. Win tricks yourself whenever possible — take the trick rather than let it fall to partner. Cover partner's high cards by playing higher when you can. A good partner can make an otherwise risky nil succeed.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>If partner bids nil, lead your lowest cards to avoid trapping them. Give them every chance to duck under you.</p>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(26,26,46,0.6)', borderBottom:'1px solid rgba(201,168,76,0.12)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 }}>5</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', color:'var(--cream)', margin:0 }}>Blind Nil — The High Risk Option</h2>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.92rem', color:'rgba(245,240,232,0.75)', lineHeight:1.85, marginBottom:'1rem' }}>Blind nil means bidding nil before looking at your cards. It's worth 200 points if successful, but -200 if you fail. Blind nil is typically only allowed when your team is losing by 100+ points and needs a comeback. After bidding blind nil, you may exchange 2 cards with your partner. Blind nil is extremely risky and should only be attempted in desperate situations.</p>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'0.6rem 1rem', display:'flex', gap:8 }}>
            <span style={{ color:'var(--gold)', flexShrink:0 }}>💡</span>
            <p style={{ fontSize:'0.82rem', color:'var(--gold)', lineHeight:1.6, margin:0 }}>Blind nil is a Hail Mary. Only bid it when you're far behind and need a dramatic swing to have any chance of winning.</p>
          </div>
        </div>
      </div>
        <div style={{ marginTop:'2.5rem', paddingTop:'2rem', borderTop:'1px solid rgba(201,168,76,0.1)', textAlign:'center' }}>
          <p style={{ fontSize:'0.9rem', color:'rgba(245,240,232,0.6)', marginBottom:'1rem' }}>Practice your Spades strategy against smart bots — free, no sign-up needed.</p>
          <Link to="/game/spades" className="btn-gold" style={{ fontSize:'0.95rem', padding:'0.7rem 2rem', display:'inline-flex' }}>♠ Play Spades Now →</Link>
        </div>
        <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>More Spades guides</p>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <Link to="/learn/spades" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, color:'var(--gold)', textDecoration:'none' }}>Spades Rules</Link>
            <Link to="/learn/spades/nil-bid" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>How to Bid Nil</Link>
            <Link to="/learn/spades/strategy" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Strategy Guide</Link>
            <Link to="/learn/spades/scoring" style={{ fontSize:'0.85rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'rgba(245,240,232,0.65)', textDecoration:'none' }}>Scoring Guide</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
