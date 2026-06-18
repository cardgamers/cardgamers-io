import { supabase } from './supabase'

// Fetches how this game compares to all other Solitaire games played on the platform.
// Returns null if the user is a guest (no data saved) or on any query failure —
// callers should treat null as "stats unavailable" and hide the UI gracefully.
export async function getSolitairePercentile(drawMode, time, moves) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null // guests have no history to compare against

    // Pull all completed solitaire games across all players.
    const { data: allGames, error } = await supabase
      .from('game_history')
      .select('result, duration_seconds, moves, metadata')
      .eq('game_type', 'solitaire')
      .not('duration_seconds', 'is', null)
      .not('moves', 'is', null)

    if (error || !allGames || allGames.length < 5) return null // not enough data to be meaningful

    // Filter to same draw mode if metadata has it; fall back to all games if drawMode wasn't tracked historically
    const sameMode = allGames.filter(g => g.metadata?.drawMode === drawMode)
    const pool = sameMode.length >= 5 ? sameMode : allGames

    const totalGames = pool.length
    const wins = pool.filter(g => g.result === 'win').length
    const winRatePct = Math.round((wins / totalGames) * 100)

    // Time percentile — lower time is better, so percentile = % of games SLOWER than you
    const slowerOnTime = pool.filter(g => g.duration_seconds > time).length
    const timePercentile = Math.round((slowerOnTime / totalGames) * 100)

    // Moves percentile — fewer moves is better, so percentile = % of games with MORE moves than you
    const moreMoves = pool.filter(g => g.moves > moves).length
    const movesPercentile = Math.round((moreMoves / totalGames) * 100)

    return {
      totalGames,
      winRatePct,      // overall win rate for this draw mode across the platform
      timePercentile,  // this player's time beats X% of all games
      movesPercentile, // this player's move count beats X% of all games
    }
  } catch (e) {
    console.error('Failed to fetch Solitaire percentile stats:', e)
    return null
  }
}
