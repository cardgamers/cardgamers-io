import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const GAMES = [
  { id: 'all', label: 'Overall', icon: '🏆' },
  { id: 'bridge', label: 'Bridge', icon: '♠' },
  { id: 'rummy', label: 'Rummy', icon: '♥' },
  { id: 'solitaire', label: 'Solitaire', icon: '♣' },
]

const PERIODS = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
]

export default function Leaderboard() {
  const [activeGame, setActiveGame] = useState('all')
  const [activePeriod, setActivePeriod] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('leaderboard')
      .select('*')
      .order('rating', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [activeGame, activePeriod])

  const rankColor = i => i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)'
  const rankLabel = i => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`

  return (
    <div style={{ paddingTop:80, minHeight:'100vh' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span className="section-eye">Hall of Fame</span>
          <h1 className="display-title" style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>Leaderboard</h1>
          <p style={{ color:'var(--text-muted)' }}>Top players competing for glory</p>
        </div>

        {/* Game tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => setActiveGame(g.id)} style={{
              padding:'0.5rem 1.25rem', borderRadius:8, fontWeight:600, fontSize:'0.88rem',
              background: activeGame===g.id ? 'var(--gold)' : 'var(--felt-light)',
              border: `2px solid ${activeGame===g.id ? 'var(--gold)' : 'var(--border)'}`,
              color: activeGame===g.id ? 'var(--felt-dark)' : 'var(--cream)',
              cursor:'pointer',
            }}>
              {g.icon} {g.label}
            </button>
          ))}
        </div>

        {/* Period tabs */}
        <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.5rem', justifyContent:'center' }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setActivePeriod(p.id)} style={{
              padding:'0.35rem 1rem', borderRadius:20, fontSize:'0.78rem', fontWeight:500,
              background: activePeriod===p.id ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: `1px solid ${activePeriod===p.id ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
              color: activePeriod===p.id ? 'var(--gold)' : 'var(--text-muted)',
              cursor:'pointer',
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && rows.length >= 3 && (
          <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', alignItems:'flex-end', justifyContent:'center' }}>
            {[rows[1], rows[0], rows[2]].map((row, i) => {
              const actualRank = i === 0 ? 1 : i === 1 ? 0 : 2
              const heights = [140, 170, 120]
              const medals = ['🥈', '🥇', '🥉']
              return (
                <div key={row.username} style={{ textAlign:'center', flex:1, maxWidth:160 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--cream)', marginBottom:6 }}>{row.username}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gold)', marginBottom:6 }}>{row.rating} pts</div>
                  <div style={{ height:heights[i], background: i===1 ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)', border:`1px solid ${i===1?'rgba(201,168,76,0.4)':'var(--border)'}`, borderRadius:'8px 8px 0 0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>
                    {medals[i]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full table */}
        <div className="card-surface" style={{ padding:0, overflow:'hidden' }}>
          {loading ? (
            <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'3rem' }}>Loading rankings...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>
                {GAMES.find(g => g.id === activeGame)?.icon}
              </div>
              <p style={{ color:'var(--text-muted)', marginBottom:'1.25rem' }}>
                No players ranked yet for {GAMES.find(g=>g.id===activeGame)?.label}.
              </p>
              <Link to="/lobby" className="btn-gold" style={{ display:'inline-flex' }}>
                Be the first to play →
              </Link>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(0,0,0,0.2)' }}>
                  {['Rank','Player','Rating','Games','Win %'].map(h => (
                    <th key={h} style={{ padding:'0.85rem 1.25rem', textAlign:h==='Rank'||h==='Player'?'left':'right', fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.username} style={{ borderTop:'1px solid var(--border)', background: i===0?'rgba(201,168,76,0.05)':i===1?'rgba(192,192,192,0.03)':i===2?'rgba(205,127,50,0.03)':'transparent' }}>
                    <td style={{ padding:'0.85rem 1.25rem', width:60 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:700, color:rankColor(i) }}>
                        {rankLabel(i)}
                      </span>
                    </td>
                    <td style={{ padding:'0.85rem 1.25rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
                          {row.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, color:'var(--cream)', fontSize:'0.9rem' }}>{row.username}</div>
                          {row.plan && row.plan !== 'free' && (
                            <div style={{ fontSize:'0.65rem', color:'var(--gold)', fontWeight:600, textTransform:'uppercase' }}>{row.plan}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'0.85rem 1.25rem', textAlign:'right', fontWeight:700, color:'var(--gold)', fontSize:'0.95rem' }}>{row.rating}</td>
                    <td style={{ padding:'0.85rem 1.25rem', textAlign:'right', color:'var(--text-muted)', fontSize:'0.88rem' }}>{row.games_played}</td>
                    <td style={{ padding:'0.85rem 1.25rem', textAlign:'right', color:'var(--green-accent)', fontSize:'0.88rem', fontWeight:600 }}>{row.win_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', marginTop:'2rem' }}>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'0.75rem' }}>Play more games to climb the rankings</p>
          <Link to="/lobby" className="btn-gold" style={{ display:'inline-flex' }}>Play Now →</Link>
        </div>
      </div>
    </div>
  )
}
