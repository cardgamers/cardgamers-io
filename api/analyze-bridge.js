// api/analyze-bridge.js — Claude-powered Bridge session analysis
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { session, gameMode } = req.body
  if (!session || !session.hands || session.hands.length === 0) {
    return res.status(400).json({ error: 'No session data provided' })
  }

  // Build a readable game log from session data
  function formatHand(h, idx) {
    if (h.passed) return `Hand ${idx + 1}: Passed out — no contract bid.`

    const vulStr = h.vulnerability?.NS && h.vulnerability?.EW ? 'Both vulnerable'
      : h.vulnerability?.NS ? 'NS vulnerable'
      : h.vulnerability?.EW ? 'EW vulnerable'
      : 'Neither side vulnerable'

    // Format the four hands
    const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' }
    const RANK_ORDER = ['A','K','Q','J','10','9','8','7','6','5','4','3','2']

    function formatSingleHand(cards, pos) {
      if (!cards || !cards.length) return `${pos}: (empty)`
      const bySuit = {}
      for (const c of cards) {
        if (!bySuit[c.suit]) bySuit[c.suit] = []
        bySuit[c.suit].push(c.value || c.rank)
      }
      const suitStr = ['S','H','D','C'].map(s => {
        const ranks = (bySuit[s] || []).sort((a,b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b))
        return `${SUIT_SYMBOLS[s]}${ranks.join('')}`
      }).join(' ')
      return `${pos}: ${suitStr}`
    }

    let dealStr = ''
    if (h.initialHands) {
      dealStr = '\nDeal:\n' +
        `  ${formatSingleHand(h.initialHands['N'], 'North')}\n` +
        `  ${formatSingleHand(h.initialHands['S'], 'South (You)')}\n` +
        `  ${formatSingleHand(h.initialHands['E'], 'East')}\n` +
        `  ${formatSingleHand(h.initialHands['W'], 'West')}`
    }

    // Format auction
    let auctionStr = ''
    if (h.auction && h.auction.length > 0) {
      const DENOM = { C:'♣', D:'♦', H:'♥', S:'♠', NT:'NT', PASS:'Pass', DBL:'Dbl' }
      const bids = h.auction.map(b => {
        const pos = b.position
        if (b.type === 'pass') return `${pos}:Pass`
        if (b.type === 'double') return `${pos}:Dbl`
        return `${pos}:${b.level}${DENOM[b.denomination] || b.denomination}`
      }).join(' ')
      auctionStr = `\nAuction: ${bids}`
    }

    const result = h.made
      ? `Made ${h.tricksMade} tricks (needed ${h.tricksNeeded})`
      : `Down ${h.undertricks} (needed ${h.tricksNeeded}, took ${h.tricksMade})`

    const score = h.nsRaw > 0 ? `NS +${h.nsRaw}` : h.nsRaw < 0 ? `EW +${Math.abs(h.nsRaw)}` : 'Tie'
    const impStr = h.imps !== 0 ? ` (${h.imps > 0 ? '+' : ''}${h.imps} IMPs)` : ''

    return `Hand ${idx + 1} [${vulStr}]:${dealStr}${auctionStr}\nContract: ${h.contract} by ${h.declarer}\nResult: ${result}\nScore: ${score}${impStr}`
  }

  const gameLog = session.hands.map((h, i) => formatHand(h, i)).join('\n\n')
  const totalNS = session.totals?.NS || 0
  const totalEW = session.totals?.EW || 0
  const nsIMPs = session.totals?.nsIMPs || 0
  const winner = totalNS > totalEW ? 'NS' : totalEW > totalNS ? 'EW' : 'Tie'

  const prompt = `You are an expert Bridge coach analyzing a player's 4-hand session. The player is South (You). 

Scoring mode: ${gameMode || 'rubber'}
Session result: NS ${totalNS} pts, EW ${totalEW} pts${nsIMPs !== 0 ? `, NS ${nsIMPs > 0 ? '+' : ''}${nsIMPs} IMPs` : ''}. ${winner} wins.

${gameLog}

Provide a personalized coaching review of 150-200 words. Be specific to the actual hands — mention specific cards, bids, and decisions where relevant. Cover:
1. One key bidding observation (good or bad decision)
2. One card play or defense observation  
3. One concrete tip for improvement

Write in second person ("You..."). Be encouraging but honest. Focus on the most impactful moments.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Claude API error:', err)
      return res.status(500).json({ error: 'Analysis failed' })
    }

    const data = await response.json()
    const analysis = data.content?.[0]?.text || 'Unable to generate analysis.'
    return res.status(200).json({ analysis })

  } catch (e) {
    console.error('Analyze bridge error:', e)
    return res.status(500).json({ error: e.message })
  }
}
