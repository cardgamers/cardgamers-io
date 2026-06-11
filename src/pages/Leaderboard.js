import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leaderboard').select('*').then(({ data }) => {
      setRows(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div className="page-wrap" style={{ padding: '2rem 1.5rem' }}>
        <span className="section-eye">Hall of Fame</span>
        <h1 className="display-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Top players across all games this season</p>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>♠</div>
            <p>No players yet — be the first to play!</p>
          </div>
        ) : (
          <div className="card-surface" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {['Rank', 'Player', 'Rating', 'Games', 'Win %'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: h === 'Rank' || h === 'Player' ? 'left' : 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.username} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', width: 60 }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: 'var(--felt-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                          {row.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{row.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--gold)' }}>{row.rating}</td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>{row.games_played}</td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: 'var(--green-accent)' }}>{row.win_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
