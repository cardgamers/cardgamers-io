import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const BADGES = [
  { id:'first_game', icon:'🃏', name:'First Hand', desc:'Played your first game' },
  { id:'first_win', icon:'🏆', name:'First Win', desc:'Won your first game' },
  { id:'century', icon:'💯', name:'Century Club', desc:'Played 100 games' },
  { id:'streak_7', icon:'🔥', name:'Week Warrior', desc:'7-day play streak' },
  { id:'bridge_novice', icon:'♠', name:'Bridge Novice', desc:'Played 10 Bridge games' },
  { id:'rummy_pro', icon:'♥', name:'Rummy Pro', desc:'Won 20 Rummy games' },
  { id:'plus_member', icon:'⭐', name:'Plus Member', desc:'Subscribed to Plus' },
  { id:'top_10', icon:'👑', name:'Week Champion', desc:'Top 10 on weekly leaderboard' },
]

function StatCard({ label, value, color }) {
  return (
    <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'1rem', textAlign:'center' }}>
      <div style={{ fontSize:'1.8rem', fontWeight:700, color: color||'var(--cream)', marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistory(data || [])
        setLoading(false)
      })
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!profile) return (
    <div style={{ paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--text-muted)' }}>Loading...</p>
    </div>
  )

  const winRate = profile.games_played > 0 ? Math.round((profile.games_won / profile.games_played) * 100) : 0
  const earnedBadges = BADGES.filter(b => {
    if (b.id === 'plus_member') return profile.plan !== 'free'
    if (b.id === 'first_game') return profile.games_played >= 1
    if (b.id === 'first_win') return profile.games_won >= 1
    if (b.id === 'century') return profile.games_played >= 100
    return false
  })

  return (
    <div style={{ paddingTop:80, minHeight:'100vh' }}>
      <div className="page-wrap" style={{ padding:'2rem 1.5rem', maxWidth:700 }}>

        {/* Profile header */}
        <div style={{ background:'var(--felt-light)', border:'1px solid var(--border)', borderRadius:16, padding:'1.75rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'1.25rem' }}>
            {/* Avatar */}
            <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--gold)', color:'var(--felt-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:700, flexShrink:0 }}>
              {profile.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', color:'var(--cream)', margin:0 }}>{profile.username}</h1>
                {profile.plan !== 'free' && (
                  <span style={{ background:'rgba(201,168,76,0.2)', color:'var(--gold)', fontSize:'0.7rem', fontWeight:700, padding:'2px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {profile.plan}
                  </span>
                )}
              </div>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', margin:'0.25rem 0 0' }}>
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })}
              </p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexShrink:0 }}>
              {profile.plan === 'free' && (
                <Link to="/upgrade" className="btn-gold" style={{ padding:'0.45rem 1rem', fontSize:'0.8rem' }}>⭐ Upgrade</Link>
              )}
              <button onClick={handleSignOut} className="btn-outline" style={{ padding:'0.45rem 1rem', fontSize:'0.8rem' }}>Sign Out</button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:'0.75rem' }}>
            <StatCard label="Rating" value={profile.rating || 1000} color="var(--gold)" />
            <StatCard label="Games" value={profile.games_played || 0} />
            <StatCard label="Wins" value={profile.games_won || 0} color="var(--green-accent)" />
            <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? 'var(--green-accent)' : 'var(--text-muted)'} />
          </div>
        </div>

        {/* Badges */}
        <div style={{ background:'var(--felt-light)', border:'1px solid var(--border)', borderRadius:16, padding:'1.5rem', marginBottom:'1.25rem' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'var(--cream)', marginBottom:'1rem' }}>Badges</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'0.75rem' }}>
            {BADGES.map(badge => {
              const earned = earnedBadges.some(b => b.id === badge.id)
              return (
                <div key={badge.id} style={{ background: earned ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.2)', border:`1px solid ${earned ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius:10, padding:'0.85rem', textAlign:'center', opacity: earned ? 1 : 0.4 }}>
                  <div style={{ fontSize:'1.8rem', marginBottom:'0.35rem' }}>{badge.icon}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color: earned ? 'var(--gold)' : 'var(--text-muted)', marginBottom:'0.2rem' }}>{badge.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', lineHeight:1.4 }}>{badge.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent games */}
        <div style={{ background:'var(--felt-light)', border:'1px solid var(--border)', borderRadius:16, padding:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'var(--cream)', margin:0 }}>Recent Games</h2>
            {profile.plan === 'free' && <Link to="/upgrade" style={{ fontSize:'0.75rem', color:'var(--gold)' }}>Upgrade for full history →</Link>}
          </div>

          {loading ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'1rem' }}>Loading...</p>
          ) : history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'1.5rem' }}>
              <p style={{ color:'var(--text-muted)', marginBottom:'1rem' }}>No games played yet</p>
              <Link to="/lobby" className="btn-gold" style={{ display:'inline-flex' }}>Start Playing →</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {history.map(game => (
                <div key={game.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.65rem 0.9rem', background:'rgba(0,0,0,0.2)', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <span style={{ fontSize:'1.1rem' }}>
                      {game.game_type === 'bridge' ? '♠' : game.game_type === 'rummy' ? '♥' : '♣'}
                    </span>
                    <div>
                      <div style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--cream)', textTransform:'capitalize' }}>{game.game_type}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                        {new Date(game.played_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Score: {game.score}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:600, padding:'2px 10px', borderRadius:20,
                      background: game.result === 'win' ? 'rgba(29,158,117,0.2)' : game.result === 'loss' ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.1)',
                      color: game.result === 'win' ? 'var(--green-accent)' : game.result === 'loss' ? '#c0392b' : 'var(--text-muted)'
                    }}>
                      {game.result ? game.result.toUpperCase() : 'PLAYED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
