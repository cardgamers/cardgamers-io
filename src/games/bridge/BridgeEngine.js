// ─── Bridge Game Engine v3.0 — Competitive Bot ───────────────────

export const SUITS = ['C', 'D', 'H', 'S']
export const SUIT_SYMBOLS = { C: '♣', D: '♦', H: '♥', S: '♠' }
export const SUIT_NAMES = { C: 'Clubs', D: 'Diamonds', H: 'Hearts', S: 'Spades' }
export const SUIT_COLORS = { C: '#1a1a2e', D: '#c0392b', H: '#c0392b', S: '#1a1a2e' }
export const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
export const VALUE_RANK = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 }
export const DENOMINATIONS = ['C','D','H','S','NT']
export const DENOM_SYMBOLS = { C:'♣', D:'♦', H:'♥', S:'♠', NT:'NT' }
export const DENOM_COLORS = { C:'#1a1a2e', D:'#c0392b', H:'#c0392b', S:'#1a1a2e', NT:'#2563a8' }
export const POSITIONS = ['S','W','N','E']
export const PARTNERS = { S:'N', N:'S', E:'W', W:'E' }
export const NEXT_PLAYER = { S:'W', W:'N', N:'E', E:'S' }
const DENOM_ORDER = ['C','D','H','S','NT']

// ─── Deck ─────────────────────────────────────────────────────────
export function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ suit, value, id: `${value}${suit}` })
  return deck
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealHands() {
  const deck = shuffle(createDeck())
  return {
    S: deck.slice(0, 13).sort(sortCards),
    W: deck.slice(13, 26).sort(sortCards),
    N: deck.slice(26, 39).sort(sortCards),
    E: deck.slice(39, 52).sort(sortCards),
  }
}

export function sortCards(a, b) {
  const suitOrder = { S: 3, H: 2, D: 1, C: 0 }
  if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[b.suit] - suitOrder[a.suit]
  return VALUE_RANK[b.value] - VALUE_RANK[a.value]
}

// ─── Hand evaluation ──────────────────────────────────────────────
export function countHCP(hand) {
  let hcp = 0
  for (const card of hand) {
    if (card.value === 'A') hcp += 4
    else if (card.value === 'K') hcp += 3
    else if (card.value === 'Q') hcp += 2
    else if (card.value === 'J') hcp += 1
  }
  return hcp
}

export function countSuitLength(hand, suit) {
  return hand.filter(c => c.suit === suit).length
}

export function getDistribution(hand) {
  const dist = {}
  for (const suit of SUITS) dist[suit] = countSuitLength(hand, suit)
  return dist
}

function distributionPoints(hand) {
  const dist = getDistribution(hand)
  let pts = 0
  for (const suit of SUITS) {
    if (dist[suit] === 0) pts += 3
    else if (dist[suit] === 1) pts += 2
    else if (dist[suit] === 2) pts += 1
  }
  return pts
}

function totalPoints(hand) { return countHCP(hand) + distributionPoints(hand) }

export function isBalanced(hand) {
  const dist = getDistribution(hand)
  const lengths = Object.values(dist).sort((a, b) => b - a)
  // 4-3-3-3, 4-4-3-2, 5-3-3-2
  if (lengths[3] < 2) return false
  if (lengths[0] > 5) return false
  return true
}

function hasStopper(hand, suit) {
  const sc = hand.filter(c => c.suit === suit)
  if (sc.some(c => c.value === 'A')) return true
  if (sc.some(c => c.value === 'K') && sc.length >= 2) return true
  if (sc.some(c => c.value === 'Q') && sc.length >= 3) return true
  if (sc.some(c => c.value === 'J') && sc.length >= 4) return true
  return false
}

function countAces(hand) { return hand.filter(c => c.value === 'A').length }
function countKings(hand) { return hand.filter(c => c.value === 'K').length }

function quickTricks(hand) {
  let qt = 0
  for (const suit of SUITS) {
    const sc = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    if (!sc.length) continue
    if (sc[0].value === 'A') {
      qt += 1
      if (sc.length >= 2 && sc[1].value === 'K') qt += 1
      else if (sc.length >= 2 && sc[1].value === 'Q') qt += 0.5
    } else if (sc[0].value === 'K') {
      qt += sc.length >= 2 ? 1 : 0.5
    } else if (sc[0].value === 'Q' && sc.length >= 2) {
      qt += 0.5
    }
  }
  return qt
}

function hasHeadOfSequence(hand, suit) {
  const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (cards.length < 2) return false
  return VALUE_RANK[cards[0].value] - VALUE_RANK[cards[1].value] === 1 && VALUE_RANK[cards[0].value] >= 10
}

// Count how many cards in a suit are winners
function countSolidWinners(hand, suit, played) {
  const cards = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  const playedRanks = played.filter(c => c.suit === suit).map(c => VALUE_RANK[c.value])
  let winners = 0
  let expected = 14
  for (const card of cards) {
    const rank = VALUE_RANK[card.value]
    // Count how many higher cards are still out
    let higherOut = 0
    for (let r = rank + 1; r <= 14; r++) {
      if (!playedRanks.includes(r) && !cards.some(c => VALUE_RANK[c.value] === r)) higherOut++
    }
    if (higherOut === 0) winners++
  }
  return winners
}

// Estimate total tricks in a suit (winners + establishable)
function suitTrickEstimate(hand, suit, played) {
  const cards = hand.filter(c => c.suit === suit)
  const solid = countSolidWinners(hand, suit, played)
  // Additional potential tricks through length/establishment
  const extra = Math.max(0, cards.length - 4)
  return solid + extra * 0.5
}

// ─── Bid validity helpers ─────────────────────────────────────────
function isBidHigherThan(bid, lastBid) {
  if (!lastBid || !lastBid.level) return true
  if (bid.type === 'pass' || bid.type === 'double' || bid.type === 'redouble') return true
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) return DENOM_ORDER.indexOf(bid.denomination) > DENOM_ORDER.indexOf(lastBid.denomination)
  return false
}

function getLastRealBid(auction) {
  for (let i = auction.length - 1; i >= 0; i--) {
    if (auction[i].type === 'bid') return auction[i]
  }
  return null
}

function makeBid(level, denomination, auction) {
  const lastBid = getLastRealBid(auction)
  const bid = { level, denomination, type: 'bid' }
  if (isBidHigherThan(bid, lastBid)) return bid
  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function pass() { return { level: 0, denomination: 'PASS', type: 'pass' } }
function dbl() { return { level: 0, denomination: 'DBL', type: 'double' } }

// ─── COMPETITIVE BIDDING ENGINE ───────────────────────────────────
export function getBotBid(hand, auction, position, vulnerability, difficulty = 'hard') {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const tp = totalPoints(hand)
  const partnerPos = PARTNERS[position]
  const lastRealBid = getLastRealBid(auction)
  const vul = vulnerability?.[(position==='N'||position==='S')?'NS':'EW'] || false

  const myBids    = auction.filter(b => b.position === position && b.type === 'bid')
  const partnerBids = auction.filter(b => b.position === partnerPos && b.type === 'bid')
  const oppBids   = auction.filter(b => b.position !== position && b.position !== partnerPos && b.type === 'bid')
  const partnerLastBid = partnerBids.length ? partnerBids[partnerBids.length - 1] : null
  const allPassed = auction.length > 0 && auction.every(b => b.type === 'pass')

  if (difficulty === 'easy' && Math.random() < 0.15) return pass()

  // ── Opening bid ──
  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length === 0) {
    return getOpeningBid(hand, hcp, dist, tp, auction, vul)
  }

  // ── Overcall ──
  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length >= 1) {
    return getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction, vul, position)
  }

  // ── Response to partner ──
  if (myBids.length === 0 && partnerBids.length >= 1) {
    return getResponse(hand, hcp, dist, tp, partnerLastBid, lastRealBid, oppBids, auction, position, vul)
  }

  // ── Opener rebid ──
  if (myBids.length === 1 && partnerBids.length >= 1) {
    return getOpenerRebid(hand, hcp, dist, tp, myBids[0], partnerLastBid, lastRealBid, auction, vul)
  }

  // ── Responder rebid ──
  if (myBids.length === 1 && partnerBids.length >= 2) {
    return getResponderRebid(hand, hcp, dist, tp, myBids[0], partnerBids, lastRealBid, auction, vul)
  }

  // ── Later bids ──
  if (myBids.length >= 2 || partnerBids.length >= 3) {
    return getLaterBid(hand, hcp, dist, tp, myBids, partnerBids, lastRealBid, auction, vul)
  }

  // ── Blackwood 4NT response ──
  if (lastRealBid?.level === 4 && lastRealBid?.denomination === 'NT' && lastRealBid?.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:5, denomination:'C' },{ level:5, denomination:'D' },{ level:5, denomination:'H' },{ level:5, denomination:'S' }]
    return { ...r[Math.min(aces, 3)], type: 'bid' }
  }

  // ── Gerber 4C response ──
  if (lastRealBid?.level === 4 && lastRealBid?.denomination === 'C' && lastRealBid?.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:4, denomination:'D' },{ level:4, denomination:'H' },{ level:4, denomination:'S' },{ level:4, denomination:'NT' }]
    return { ...r[Math.min(aces, 3)], type: 'bid' }
  }

  // ── Takeout double ──
  if (oppBids.length === 1 && myBids.length === 0 && partnerBids.length === 0 && hcp >= 11) {
    const oppSuit = oppBids[0].denomination
    if (oppSuit !== 'NT' && oppBids[0].level === 1) {
      const unbid = SUITS.filter(s => s !== oppSuit)
      const hasSupport = unbid.every(s => dist[s] >= 3)
      if ((hasSupport && hcp >= 11) || hcp >= 17) return dbl()
    }
  }

  // ── Competitive double (penalty/negative) ──
  if (lastRealBid?.position !== partnerPos && lastRealBid?.type === 'bid' && hcp >= 13 && myBids.length === 0) {
    const b = makeBid(lastRealBid.level, lastRealBid.denomination, auction)
    if (b.type === 'bid') {} // can't bid it
    if (hcp >= 15) return dbl()
  }

  return pass()
}

function getOpeningBid(hand, hcp, dist, tp, auction, vul) {
  if (hcp < 10) return pass()

  // Preemptive — 6-10 HCP
  if (hcp >= 5 && hcp <= 10) {
    for (const suit of ['S','H']) {
      if (dist[suit] >= 6 && hasHeadOfSequence(hand, suit)) return makeBid(2, suit, auction)
    }
    for (const suit of ['S','H','D','C']) {
      if (dist[suit] >= 7) return makeBid(3, suit, auction)
      if (dist[suit] >= 8) return makeBid(4, suit, auction)
    }
  }

  if (hcp < 12) return pass()

  // Strong 2C (22+ or 8.5+ quick tricks)
  if (hcp >= 22 || (hcp >= 17 && quickTricks(hand) >= 5)) return makeBid(2, 'C', auction)

  // 2NT: 20-21 balanced
  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) return makeBid(2, 'NT', auction)

  // 1NT: 15-17 balanced
  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) return makeBid(1, 'NT', auction)

  // Strong NT: 18-19 balanced — open 1 of suit, rebid NT
  // 5-card majors
  if (dist['S'] >= 5 && dist['S'] >= dist['H']) return makeBid(1, 'S', auction)
  if (dist['H'] >= 5) return makeBid(1, 'H', auction)

  // 4-card majors (higher ranking first when equal)
  if (hcp >= 12) {
    if (dist['S'] >= 4 && dist['S'] >= dist['H']) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)
    // Longer minor
    if (dist['D'] > dist['C']) return makeBid(1, 'D', auction)
    if (dist['C'] > dist['D']) return makeBid(1, 'C', auction)
    // Equal minors — open 1D with 3-3
    return makeBid(1, 'D', auction)
  }

  return pass()
}

function getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction, vul, position) {
  if (hcp < 8) return pass()
  const oppLevel = lastRealBid?.level || 1
  const oppSuit = lastRealBid?.denomination

  // 1NT overcall: 15-18 balanced with stopper
  if (oppLevel === 1 && hcp >= 15 && hcp <= 18 && isBalanced(hand) && hasStopper(hand, oppSuit)) {
    const b = makeBid(1, 'NT', auction)
    if (b.type === 'bid') return b
  }

  // Simple overcall — 5+ card suit, 8-17 HCP
  for (const suit of ['S','H','D','C']) {
    if (suit === oppSuit) continue
    if (dist[suit] >= 5 && hcp >= 8) {
      const b1 = makeBid(oppLevel, suit, auction)
      if (b1.type === 'bid') return b1
      if (hcp >= 10) {
        const b2 = makeBid(oppLevel + 1, suit, auction)
        if (b2.type === 'bid') return b2
      }
    }
  }

  // Takeout double
  if (oppLevel <= 2 && hcp >= 12) {
    const unbid = SUITS.filter(s => s !== oppSuit)
    const hasSupport = unbid.every(s => dist[s] >= 3)
    if (hasSupport || hcp >= 17) return dbl()
  }

  return pass()
}

function getResponse(hand, hcp, dist, tp, partnerOpening, lastRealBid, oppBids, auction, position, vul) {
  if (!partnerOpening) return pass()
  const op = partnerOpening

  // ── Response to 1NT (15-17) ──
  if (op.level === 1 && op.denomination === 'NT') {
    if (hcp <= 7) {
      // Weak — transfer or pass
      if (dist['H'] >= 5) return makeBid(2, 'D', auction) // Jacoby → H
      if (dist['S'] >= 5) return makeBid(2, 'H', auction) // Jacoby → S
      if (dist['C'] >= 6) return makeBid(3, 'C', auction)
      if (dist['D'] >= 6) return makeBid(3, 'D', auction)
      return pass()
    }
    if (hcp >= 8 && hcp <= 9) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction) // Stayman
      return makeBid(2, 'NT', auction) // Invite
    }
    if (hcp >= 10 && hcp <= 14) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction) // Stayman
      return makeBid(3, 'NT', auction)
    }
    if (hcp >= 15 && hcp <= 16) return makeBid(4, 'NT', auction) // Quantitative
    if (hcp >= 17) return makeBid(6, 'NT', auction) // Small slam
  }

  // ── Response to 2NT (20-21) ──
  if (op.level === 2 && op.denomination === 'NT') {
    if (hcp <= 3) return pass()
    if (dist['S'] >= 5) return makeBid(3, 'H', auction) // Transfer
    if (dist['H'] >= 5) return makeBid(3, 'D', auction) // Transfer
    if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(3, 'C', auction) // Puppet Stayman
    if (hcp >= 4 && hcp <= 6) return makeBid(3, 'NT', auction)
    if (hcp >= 7 && hcp <= 8) return makeBid(4, 'NT', auction) // Invite slam
    if (hcp >= 9) return makeBid(6, 'NT', auction)
  }

  // ── Response to 2C (strong) ──
  if (op.level === 2 && op.denomination === 'C') {
    if (hcp >= 8 || quickTricks(hand) >= 1.5) {
      if (dist['S'] >= 5) return makeBid(2, 'S', auction)
      if (dist['H'] >= 5) return makeBid(2, 'H', auction)
      if (dist['D'] >= 5) return makeBid(3, 'D', auction)
      return makeBid(2, 'NT', auction) // Positive balanced
    }
    return makeBid(2, 'D', auction) // Waiting
  }

  // ── Response to weak 2 ──
  if (op.level === 2 && (op.denomination === 'H' || op.denomination === 'S')) {
    const suit = op.denomination
    if (hcp >= 16 && dist[suit] >= 2) return makeBid(4, suit, auction)
    if (hcp >= 14 && dist[suit] >= 2) return makeBid(3, suit, auction)
    if (hcp >= 16) return makeBid(2, 'NT', auction) // Feature ask
    return pass()
  }

  // ── Response to 1 of a major ──
  if (op.level === 1 && (op.denomination === 'H' || op.denomination === 'S')) {
    const suit = op.denomination
    if (hcp < 6) return pass()

    // Support partner's major
    if (dist[suit] >= 3) {
      if (tp >= 6 && tp <= 9) return makeBid(2, suit, auction)
      if (tp >= 10 && tp <= 12) return makeBid(3, suit, auction) // Limit raise
      if (tp >= 13 && tp <= 15) {
        if (hcp >= 13) return makeBid(4, 'NT', auction) // Blackwood
        return makeBid(4, suit, auction)
      }
      if (tp >= 16) return makeBid(4, 'NT', auction) // Blackwood slam try
    }

    // New suit responses
    if (suit === 'H') {
      if (dist['S'] >= 4 && hcp >= 6) return makeBid(1, 'S', auction)
    }
    // 2/1 game force
    if (hcp >= 13) {
      for (const s of ['D','C']) {
        if (dist[s] >= 4) return makeBid(2, s, auction)
      }
      return makeBid(2, 'NT', auction) // 2/1 with balanced
    }
    if (hcp >= 6 && hcp <= 12) return makeBid(1, 'NT', auction)
  }

  // ── Response to 1 of a minor ──
  if (op.level === 1 && (op.denomination === 'C' || op.denomination === 'D')) {
    if (hcp < 6) return pass()

    // Show 4-card majors up the line
    if (dist['H'] >= 4 && dist['S'] >= 4) return makeBid(1, 'H', auction)
    if (dist['S'] >= 4) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)

    // Minor suit response
    if (op.denomination === 'C' && dist['D'] >= 4) return makeBid(1, 'D', auction)

    // NT responses
    if (hcp >= 6 && hcp <= 9) return makeBid(1, 'NT', auction)
    if (hcp >= 10 && hcp <= 12) return makeBid(2, 'NT', auction)
    if (hcp >= 13 && hcp <= 15) return makeBid(3, 'NT', auction)
    if (hcp >= 16) return makeBid(4, 'NT', auction) // Gerber
  }

  return pass()
}

function getOpenerRebid(hand, hcp, dist, tp, myOpening, partnerResponse, lastRealBid, auction, vul) {
  if (!partnerResponse) return pass()
  const openSuit = myOpening.denomination
  const respSuit = partnerResponse.denomination
  const respLevel = partnerResponse.level

  // Partner raised our major
  if (respSuit === openSuit && (openSuit === 'H' || openSuit === 'S')) {
    if (respLevel === 2) {
      if (tp >= 20) return makeBid(4, 'NT', auction) // Blackwood
      if (tp >= 18) return makeBid(4, openSuit, auction)
      if (tp >= 16) return makeBid(3, openSuit, auction)
      return pass()
    }
    if (respLevel === 3) {
      if (hcp >= 18) return makeBid(4, 'NT', auction)
      if (hcp >= 14) return makeBid(4, openSuit, auction)
      return pass()
    }
    if (respLevel === 4) {
      if (hcp >= 20 && countAces(hand) >= 2) return makeBid(4, 'NT', auction)
      return pass()
    }
  }

  // Opened 1NT — handle Stayman and transfers
  if (openSuit === 'NT') {
    if (respSuit === 'C' && respLevel === 2) { // Stayman
      if (dist['S'] >= 4 && dist['S'] >= dist['H']) return makeBid(2, 'S', auction)
      if (dist['H'] >= 4) return makeBid(2, 'H', auction)
      return makeBid(2, 'D', auction) // No 4-card major
    }
    if (respSuit === 'D' && respLevel === 2) return makeBid(2, 'H', auction) // Complete H transfer
    if (respSuit === 'H' && respLevel === 2) return makeBid(2, 'S', auction) // Complete S transfer
    if (respSuit === 'NT' && respLevel === 2) {
      if (hcp >= 17) return makeBid(3, 'NT', auction)
      return pass()
    }
    if (respSuit === 'NT' && respLevel === 4) return pass() // Quantitative — pass with min
    return pass()
  }

  // Partner bid 1NT
  if (respSuit === 'NT' && respLevel === 1) {
    if (hcp >= 19) return makeBid(3, 'NT', auction)
    if (hcp >= 18) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
    // Show second suit (reverse only with 17+)
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4 && hcp >= 17) {
        const b = makeBid(2, suit, auction)
        if (b.type === 'bid') return b
      }
    }
    // Rebid 5-card suit
    if (dist[openSuit] >= 5) return makeBid(2, openSuit, auction)
    return pass()
  }

  // Partner bid 2NT (10-12 invitational)
  if (respSuit === 'NT' && respLevel === 2) {
    if (hcp >= 15) return makeBid(3, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    return pass()
  }

  // Partner bid 3NT
  if (respSuit === 'NT' && respLevel === 3) {
    if (hcp >= 18 && countAces(hand) >= 2) return makeBid(4, 'NT', auction) // Blackwood
    if (hcp >= 17) {
      const gameLevel = (openSuit === 'H' || openSuit === 'S') ? 4 : 5
      return makeBid(gameLevel, openSuit, auction)
    }
    return pass()
  }

  // Partner's new suit at 2 level (game force)
  if (respLevel === 2 && respSuit !== openSuit && respSuit !== 'NT') {
    const combinedMin = hcp + 10
    if (dist[respSuit] >= 4) return makeBid(3, respSuit, auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    if (combinedMin >= 25 && SUITS.every(s => hasStopper(hand, s))) return makeBid(3, 'NT', auction)
    return makeBid(2, 'NT', auction)
  }

  // Partner's new suit at 1 level
  if (respLevel === 1 && respSuit !== 'NT') {
    if (dist[respSuit] >= 4 && tp >= 16) return makeBid(3, respSuit, auction)
    if (dist[respSuit] >= 4 && tp >= 13) return makeBid(2, respSuit, auction)
    if (hcp >= 18) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
    // Reverse
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && suit !== respSuit && dist[suit] >= 4 && hcp >= 17) {
        const b = makeBid(2, suit, auction)
        if (b.type === 'bid') return b
      }
    }
    if (dist[openSuit] >= 5 && hcp >= 12) return makeBid(2, openSuit, auction)
    return pass()
  }

  return pass()
}

function getResponderRebid(hand, hcp, dist, tp, myFirstBid, partnerBids, lastRealBid, auction, vul) {
  const partnerRebid = partnerBids[partnerBids.length - 1]
  if (!partnerRebid) return pass()
  const prSuit = partnerRebid.denomination
  const prLevel = partnerRebid.level

  // Partner showed a suit
  if (prSuit !== 'NT' && prSuit !== 'PASS') {
    if (dist[prSuit] >= 3) {
      const gameLevel = (prSuit === 'H' || prSuit === 'S') ? 4 : 5
      if (hcp >= 12) return makeBid(gameLevel, prSuit, auction)
      if (hcp >= 10) return makeBid(prLevel + 1, prSuit, auction)
    }
    // Try NT
    const allStop = SUITS.every(s => hasStopper(hand, s))
    if (allStop && hcp >= 11) return makeBid(3, 'NT', auction)
    if (hcp >= 10) return makeBid(prLevel + 1, prSuit, auction)
    return pass()
  }

  // Partner bid NT
  if (prSuit === 'NT') {
    if (prLevel === 1 && hcp >= 11) return makeBid(3, 'NT', auction)
    if (prLevel === 2 && hcp >= 8) return makeBid(3, 'NT', auction)
    return pass()
  }

  return pass()
}

function getLaterBid(hand, hcp, dist, tp, myBids, partnerBids, lastRealBid, auction, vul) {
  // Slam tries
  const partnerLastBid = partnerBids[partnerBids.length - 1]
  if (!partnerLastBid) return pass()

  const combinedHCP = hcp + (partnerBids.length * 10) // rough estimate
  if (hcp >= 14 && partnerLastBid.level >= 3) {
    if (lastRealBid?.denomination === 'NT' && lastRealBid?.level === 3) {
      if (hcp >= 16) return makeBid(4, 'NT', auction)
    }
  }

  return pass()
}

// ─── Bidding validation ───────────────────────────────────────────
export function isValidBid(bid, auction) {
  if (bid.type === 'pass') return true
  if (bid.type === 'double') {
    const last = getLastRealBid(auction)
    return last && last.type === 'bid'
  }
  return isBidHigherThan(bid, getLastRealBid(auction))
}

export function isAuctionOver(auction) {
  if (auction.length < 4) return false
  return auction.slice(-3).every(b => b.type === 'pass')
}

// ─── CORRECT DECLARER: first on winning side to bid final denom ───
export function getContract(auction) {
  const lastBid = getLastRealBid(auction)
  if (!lastBid) return null

  const doubled = auction.some(b => b.type === 'double')
  const redoubled = auction.some(b => b.type === 'redouble')
  const finalDenom = lastBid.denomination
  const winningSide = (lastBid.position === 'N' || lastBid.position === 'S') ? ['N','S'] : ['E','W']

  let declarer = lastBid.position
  for (const b of auction) {
    if (b.type === 'bid' && b.denomination === finalDenom && winningSide.includes(b.position)) {
      declarer = b.position
      break
    }
  }

  return { level: lastBid.level, denomination: finalDenom, declarer, doubled, redoubled, tricksNeeded: lastBid.level + 6 }
}

// ─── SMART CARD PLAY ENGINE ───────────────────────────────────────
export function getLegalCards(hand, trick, trumpSuit) {
  if (trick.length === 0) return hand
  const ledSuit = trick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)
  return suitCards.length > 0 ? suitCards : hand
}

export function getBotCardPlay(hand, trick, trumpSuit, contract, position, trickHistory, difficulty = 'hard') {
  const legal = getLegalCards(hand, trick, trumpSuit)
  if (legal.length === 1) return legal[0]

  if (difficulty === 'easy' && Math.random() < 0.18) {
    return legal[Math.floor(Math.random() * legal.length)]
  }

  const isDefender = position === 'E' || position === 'W'
  const partnerPos = PARTNERS[position]
  const played = trickHistory.flatMap(t => t.trick.map(p => p.card))
  const tricksLeft = 13 - trickHistory.length
  const declarerSide = (contract?.declarer === 'N' || contract?.declarer === 'S') ? ['N','S'] : ['E','W']
  const iAmDeclarer = declarerSide.includes(position) && contract?.declarer === position

  if (trick.length === 0) {
    return getOpeningLead(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, played, partnerPos, tricksLeft, iAmDeclarer)
  }

  return getFollowPlay(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, played, tricksLeft, contract, iAmDeclarer)
}

// ─── OPENING LEADS ────────────────────────────────────────────────
function getOpeningLead(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, played, partnerPos, tricksLeft, iAmDeclarer) {
  if (!isDefender) {
    return getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft)
  }
  return getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft)
}

function getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft) {
  const isTrump = trumpSuit && trumpSuit !== 'NT'
  const tricksNeeded = contract ? contract.tricksNeeded : 7
  const tricksMade = trickHistory.filter(t => ['N','S'].includes(t.winner) === (['N','S'].includes(contract?.declarer))).length

  if (isTrump) {
    // Draw trumps first if we have more
    const myTrumps = hand.filter(c => c.suit === trumpSuit)
    if (myTrumps.length >= 4 && tricksLeft > 6) {
      return myTrumps.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
    }

    // Establish long suit
    const bestSuit = getBestEstablishSuit(hand, legal, trumpSuit, played)
    if (bestSuit) {
      const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
      return sc[0]
    }

    // Lead towards honours
    const seq = findTopSequence(legal.filter(c => c.suit !== trumpSuit))
    if (seq) return seq

    // Lead low from length
    const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
    if (nonTrumps.length > 0) {
      const byLength = SUITS.filter(s => s !== trumpSuit).map(s => ({ suit: s, cards: hand.filter(c => c.suit === s) })).sort((a,b) => b.cards.length - a.cards.length)
      for (const { suit, cards } of byLength) {
        const lc = legal.filter(c => c.suit === suit)
        if (lc.length > 0) return lc.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
      }
    }
  }

  // NT — run longest/strongest suit
  const bestSuit = getBestEstablishSuit(hand, legal, null, played)
  if (bestSuit) {
    return legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
  }
  const seq = findTopSequence(legal)
  if (seq) return seq
  return legal.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
}

function getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft) {
  const isTrump = trumpSuit && trumpSuit !== 'NT'
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)

  // Against NT — 4th best of longest strongest suit
  if (!isTrump) {
    const bestSuit = getBestLeadSuit(hand, legal, null, played)
    const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    const seq = findTopSequence(sc)
    if (seq) return seq
    if (sc.length >= 4) return sc[3] // 4th best
    if (sc.length === 3 && VALUE_RANK[sc[0].value] <= 9) return sc[1] // MUD
    return sc[sc.length - 1]
  }

  // Against suit contract
  // Lead singleton for ruff
  for (const suit of SUITS) {
    if (suit === trumpSuit) continue
    const sc = hand.filter(c => c.suit === suit)
    if (sc.length === 1 && legal.some(c => c.suit === suit)) return sc[0]
  }

  // Avoid leading trumps unless nothing else good
  // Top of sequence
  const seq = findTopSequence(nonTrumps.length ? nonTrumps : legal)
  if (seq) return seq

  // 4th best of best suit
  const bestSuit = getBestLeadSuit(hand, legal, trumpSuit, played)
  const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (sc.length >= 4) return sc[3]
  return sc[sc.length - 1] || legal[0]
}

// ─── FOLLOWING TO TRICK ───────────────────────────────────────────
function getFollowPlay(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, played, tricksLeft, contract, iAmDeclarer) {
  const ledSuit = trick[0].card.suit
  const currentWinner = getCurrentTrickWinner(trick, trumpSuit)
  const partnerWinning = currentWinner?.position === partnerPos
  const followCards = legal.filter(c => c.suit === ledSuit)
  const trumpCards = legal.filter(c => c.suit === trumpSuit)
  const isLastToPlay = trick.length === 3
  const winCards = legal.filter(c => canBeat(c, currentWinner, trumpSuit))

  // ── Following suit ──
  if (followCards.length > 0) {
    const winFollow = followCards.filter(c => canBeat(c, currentWinner, trumpSuit))

    // Second hand LOW (unless strong sequence)
    if (trick.length === 1 && isDefender) {
      const seq = findTopSequence(followCards)
      if (seq && VALUE_RANK[seq.value] >= 12) return seq // KQ, QJ etc
      // Cover an honour with an honour
      const ledCard = trick[0].card
      if (VALUE_RANK[ledCard.value] >= 11 && followCards.some(c => VALUE_RANK[c.value] > VALUE_RANK[ledCard.value])) {
        return followCards.filter(c => VALUE_RANK[c.value] > VALUE_RANK[ledCard.value])
          .sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Third hand HIGH
    if (trick.length === 2 && isDefender && !partnerWinning && winFollow.length > 0) {
      // Play cheapest winner
      return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Partner winning — play low (don't overtake)
    if (partnerWinning) {
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Last to play — win cheaply
    if (isLastToPlay && winFollow.length > 0) {
      return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Declarer — always try to win with cheapest winner
    if (!isDefender && winFollow.length > 0) {
      return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Finesse position — play 9 or J if appropriate
    if (!isDefender && followCards.length > 0) {
      // Unblock high cards when void in other hand
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
  }

  // ── Void — trump or discard ──

  // Partner winning — discard intelligently
  if (partnerWinning) {
    return smartDiscard(hand, legal, trumpSuit, played, trickHistory)
  }

  // Trump if useful
  if (trumpCards.length > 0 && trumpSuit && trumpSuit !== 'NT') {
    const winTrumps = trumpCards.filter(c => canBeat(c, currentWinner, trumpSuit))

    if (winTrumps.length > 0) {
      if (!isDefender) {
        // Declarer trumps with lowest winner (preserve high trumps)
        return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      } else {
        // Defender overruffs or ruffs with significant trump
        if (isLastToPlay) return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        // Only ruff with a significant trump (J or higher)
        const significantTrumps = winTrumps.filter(c => VALUE_RANK[c.value] >= 11)
        if (significantTrumps.length > 0) return significantTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        // Low ruff — only if short in trumps (can't help to ruff low when declarer overruffs)
        if (trumpCards.length <= 2) return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    }
  }

  // Discard
  return smartDiscard(hand, legal, trumpSuit, played, trickHistory)
}

// ─── SMART DISCARD ────────────────────────────────────────────────
function smartDiscard(hand, legal, trumpSuit, played, trickHistory) {
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
  if (!nonTrumps.length) return legal.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]

  // Discard from shortest suit with fewest winners
  let worst = null
  let worstScore = Infinity

  for (const card of nonTrumps) {
    const suitCards = hand.filter(c => c.suit === card.suit)
    const winners = countSolidWinners(suitCards, card.suit, played)
    // Lower score = safer to discard from
    const score = winners * 20 + suitCards.length * 3 + VALUE_RANK[card.value]
    if (score < worstScore) { worstScore = score; worst = card }
  }

  return worst || nonTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
}

// ─── HELPERS ──────────────────────────────────────────────────────
function findTopSequence(cards) {
  const bySuit = {}
  for (const c of cards) {
    if (!bySuit[c.suit]) bySuit[c.suit] = []
    bySuit[c.suit].push(c)
  }
  let best = null
  let bestRank = 0
  for (const suit of Object.keys(bySuit)) {
    const sorted = bySuit[suit].sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    let seqLen = 1
    for (let i = 1; i < sorted.length; i++) {
      if (VALUE_RANK[sorted[i-1].value] - VALUE_RANK[sorted[i].value] === 1) seqLen++
      else break
    }
    if (seqLen >= 2 && VALUE_RANK[sorted[0].value] >= 10 && VALUE_RANK[sorted[0].value] > bestRank) {
      bestRank = VALUE_RANK[sorted[0].value]
      best = sorted[0]
    }
  }
  return best
}

function getBestLeadSuit(hand, legal, trumpSuit, played) {
  const suits = [...new Set(legal.map(c => c.suit))].filter(s => s !== trumpSuit)
  if (!suits.length) return legal[0].suit
  let best = suits[0], bestScore = -1
  for (const suit of suits) {
    const sc = hand.filter(c => c.suit === suit)
    const honours = sc.filter(c => VALUE_RANK[c.value] >= 10).length
    const winners = countSolidWinners(sc, suit, played)
    const score = sc.length * 3 + honours * 2 + winners * 5
    if (score > bestScore) { bestScore = score; best = suit }
  }
  return best
}

function getBestEstablishSuit(hand, legal, trumpSuit, played) {
  const suits = [...new Set(legal.map(c => c.suit))].filter(s => s !== trumpSuit)
  if (!suits.length) return null
  let best = null, bestScore = -1
  for (const suit of suits) {
    const sc = hand.filter(c => c.suit === suit)
    const winners = countSolidWinners(sc, suit, played)
    const score = winners * 6 + sc.length
    if (score > bestScore) { bestScore = score; best = suit }
  }
  return best
}

function canBeat(card, winner, trumpSuit) {
  if (!winner) return true
  if (card.suit === trumpSuit && winner.card.suit !== trumpSuit) return true
  if (card.suit !== winner.card.suit && card.suit !== trumpSuit) return false
  if (card.suit === winner.card.suit) return VALUE_RANK[card.value] > VALUE_RANK[winner.card.value]
  return false
}

function getCurrentTrickWinner(trick, trumpSuit) {
  if (!trick.length) return null
  let winner = trick[0]
  for (const play of trick) {
    if (play.card.suit === trumpSuit && winner.card.suit !== trumpSuit) {
      winner = play
    } else if (play.card.suit === winner.card.suit && VALUE_RANK[play.card.value] > VALUE_RANK[winner.card.value]) {
      winner = play
    }
  }
  return winner
}

export function getTrickWinner(trick, trumpSuit) {
  return getCurrentTrickWinner(trick, trumpSuit)
}

// ─── SCORING ──────────────────────────────────────────────────────
export function calculateRubberScore(contract, tricksMade, vulnerability) {
  if (!contract) return { declarerScore: 0, defenderScore: 0, made: false }
  const { level, denomination, doubled, redoubled, declarer } = contract
  const tricksNeeded = level + 6
  const undertricks = tricksNeeded - tricksMade
  const overtricks = tricksMade - tricksNeeded
  const vul = vulnerability?.[(declarer==='N'||declarer==='S')?'NS':'EW'] || false

  if (tricksMade < tricksNeeded) {
    let penalty = 0
    if (!doubled && !redoubled) penalty = undertricks * (vul ? 100 : 50)
    else if (doubled) {
      if (vul) penalty = undertricks===1?200:200+(undertricks-1)*300
      else penalty = undertricks===1?100:undertricks===2?300:300+(undertricks-2)*300
    } else {
      if (vul) penalty = undertricks===1?400:400+(undertricks-1)*600
      else penalty = undertricks===1?200:undertricks===2?600:600+(undertricks-2)*600
    }
    return { declarerScore: 0, defenderScore: penalty, made: false }
  }

  const mult = redoubled ? 4 : doubled ? 2 : 1
  let trickScore = 0
  if (denomination === 'NT') trickScore = (40 + (level-1)*30) * mult
  else if (denomination === 'S' || denomination === 'H') trickScore = level * 30 * mult
  else trickScore = level * 20 * mult

  let bonus = 0
  const isGame = trickScore >= 100
  if (isGame) bonus += vul ? 500 : 300
  else bonus += 50
  if (level === 6) bonus += vul ? 750 : 500
  if (level === 7) bonus += vul ? 1500 : 1000
  if (doubled) bonus += 50
  if (redoubled) bonus += 100

  let overtrickScore = 0
  if (overtricks > 0) {
    if (!doubled && !redoubled) overtrickScore = overtricks * (denomination==='NT'||denomination==='S'||denomination==='H' ? 30 : 20)
    else if (doubled) overtrickScore = overtricks * (vul ? 200 : 100)
    else overtrickScore = overtricks * (vul ? 400 : 200)
  }

  return { declarerScore: trickScore+bonus+overtrickScore, defenderScore: 0, made: true, trickScore, bonus, overtrickScore, isGame }
}

export function calculateDuplicateScore(contract, tricksMade, vulnerability) {
  return calculateRubberScore(contract, tricksMade, vulnerability)
}

// ─── GAME STATE FACTORY ───────────────────────────────────────────
export function createBridgeGame(mode, playerPosition, difficulty, botNames) {
  const hands = dealHands()
  const dealer = POSITIONS[Math.floor(Math.random() * 4)]
  return {
    mode, playerPosition, difficulty,
    botNames: botNames || { N:'North', E:'East', W:'West' },
    hands, dealer,
    phase: 'bidding',
    auction: [],
    currentBidder: dealer,
    contract: null,
    currentTrick: [],
    tricks: { NS:0, EW:0 },
    trickHistory: [],
    currentLeader: null,
    score: { NS:0, EW:0 },
    vulnerability: { NS:false, EW:false },
    handNumber: 1,
    dummy: null,
    dummyRevealed: false,
  }
}
