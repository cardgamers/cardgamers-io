import { supabase } from './supabase'

/**
 * Save a game result to game_history and update leaderboard + profile
 * @param {string} gameType - 'solitaire' | 'bridge' | 'rummy' | 'teen_patti'
 * @param {boolean} playerWon
 * @param {number} score
 * @param {number} ratingChange
 * @param {object} metadata - optional extra data
 */
export async function saveGameResult(gameType, playerWon, score = 0, ratingChange = 0, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save game history
    await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: gameType,
      result: playerWon ? 'win' : 'loss',
      score,
      rating_change: ratingChange,
      played_at: new Date().toISOString(),
      metadata: JSON.stringify(metadata),
    })

    // Get current profile + leaderboard
    const { data: prof } = await supabase
      .from('profiles')
      .select('games_played, games_won, rating, username, plan')
      .eq('id', user.id)
      .single()

    if (!prof) return

    const newRating = Math.max(100, (prof.rating || 1000) + ratingChange)
    const newPlayed = (prof.games_played || 0) + 1
    const newWon = (prof.games_won || 0) + (playerWon ? 1 : 0)

    // Update profile
    await supabase.from('profiles').update({
      games_played: newPlayed,
      games_won: newWon,
      rating: newRating,
    }).eq('id', user.id)

    // Get current leaderboard row
    const { data: lb } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Build per-game column updates
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
      // Per-game stats
      bridge_played: lb?.bridge_played || 0,
      bridge_won: lb?.bridge_won || 0,
      rummy_played: lb?.rummy_played || 0,
      rummy_won: lb?.rummy_won || 0,
      solitaire_played: lb?.solitaire_played || 0,
      solitaire_won: lb?.solitaire_won || 0,
      teen_patti_played: lb?.teen_patti_played || 0,
      teen_patti_won: lb?.teen_patti_won || 0,
    }

    // Increment the specific game counters
    lbUpdate[playedCol] = (lb?.[playedCol] || 0) + 1
    if (playerWon) lbUpdate[wonCol] = (lb?.[wonCol] || 0) + 1

    await supabase.from('leaderboard').upsert(lbUpdate, { onConflict: 'user_id' })

  } catch (e) {
    console.error('Failed to save game result:', e)
  }
}
