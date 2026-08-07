import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.headers['x-vercel-cron'] !== '1' && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    const now = new Date().toISOString()
    console.log(`[keepalive] ${now} — Supabase ping OK, ${count} profiles`)
    return res.status(200).json({ ok: true, pinged_at: now, count })
  } catch (e) {
    console.error('[keepalive] Supabase ping failed:', e.message)
    return res.status(500).json({ ok: false, error: e.message })
  }
}
