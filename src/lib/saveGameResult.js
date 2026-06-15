import { supabase } from './supabase'

export async function saveGameResult(gameType, playerWon, score = 0, ratingChange = 0, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    // Guests have no Supabase user — skip silently
    if (!user) return

    await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: gameType,
      result: playerWon ? 'win' : 'loss',
      score,
      duration_seconds: metadata.duration_seconds || null,
      moves: metadata.moves || null,
      played_at: new Date().toISOString(),
      metadata: metadata,
    })

    const { data: prof } = await supabase
      .from('profiles')
      .select('games_played, games_won, rating, username, plan')
      .eq('id', user.id)
      .single()

    if (!prof) return

    const newRating = Math.max(100, (prof.rating || 1000) + ratingChange)
    const newPlayed = (prof.games_played || 0) + 1
    const newWon = (prof.games_won || 0) + (playerWon ? 1 : 0)

    await supabase.from('profiles').update({
      games_played: newPlayed,
      games_won: newWon,
      rating: newRating,
    }).eq('id', user.id)

    const { data: lb } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const gameCol = gameType === 'teen_patti' ? 'teen_patti' : gameType
    const playedCol = `${gameCol}_played`
    const wonCol = `${gameCol}_won`

    const lbUpdate = {
      user_id: user.id,
      username: prof.username,
      rating: newRating,
      games_played: newPlayed,
      games_won: newWon,
      win_pct: Math.round(newWon / newPlayed * 100),
      plan: prof.plan,
      updated_at: new Date().toISOString(),
      bridge_played: lb?.bridge_played || 0,
      bridge_won: lb?.bridge_won || 0,
      rummy_played: lb?.rummy_played || 0,
      rummy_won: lb?.rummy_won || 0,
      solitaire_played: lb?.solitaire_played || 0,
      solitaire_won: lb?.solitaire_won || 0,
      teen_patti_played: lb?.teen_patti_played || 0,
      teen_patti_won: lb?.teen_patti_won || 0,
    }

    lbUpdate[playedCol] = (lb?.[playedCol] || 0) + 1
    if (playerWon) lbUpdate[wonCol] = (lb?.[wonCol] || 0) + 1

    await supabase.from('leaderboard').upsert(lbUpdate, { onConflict: 'user_id' })

  } catch (e) {
    console.error('Failed to save game result:', e)
  }
}
