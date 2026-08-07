// api/keepalive.js — Supabase ping using plain fetch (no package dependencies)
module.exports = async function handler(req, res) {
  const url = process.env.REACT_APP_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'Missing env vars' })
  }

  try {
    // Lightweight REST ping — count profiles table, head=true means no rows returned
    const response = await fetch(`${url}/rest/v1/profiles?select=count`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
        'Range': '0-0',
      },
    })

    if (!response.ok) {
      throw new Error(`Supabase responded with ${response.status}`)
    }

    const now = new Date().toISOString()
    console.log(`[keepalive] ${now} — Supabase ping OK`)
    return res.status(200).json({ ok: true, pinged_at: now })

  } catch (e) {
    console.error('[keepalive] Failed:', e.message)
    return res.status(500).json({ ok: false, error: e.message })
  }
}
