// ─── Bridge Game Engine v2 — Smart Bot ───────────────────────────

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

function totalPoints(hand) {
  return countHCP(hand) + distributionPoints(hand)
}

export function isBalanced(hand) {
  const dist = getDistribution(hand)
  const lengths = Object.values(dist).sort((a, b) => b - a)
  return lengths[0] <= 5 && lengths[3] >= 2
}

function longestSuit(hand) {
  const dist = getDistribution(hand)
  return SUITS.reduce((best, suit) => dist[suit] > dist[best] ? suit : best, 'C')
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
    } else if (sc[0].value === 'K') {
      qt += sc.length >= 2 ? 1 : 0.5
    } else if (sc[0].value === 'Q' && sc.length >= 2) {
      qt += 0.5
    }
  }
  return qt
}

function suitQuality(hand, suit) {
  // Returns quality score for a suit — used for choosing what to bid/lead
  const sc = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  let score = sc.length * 10
  for (const c of sc) score += Math.max(0, VALUE_RANK[c.value] - 9)
  return score
}

function hasHeadOfSequence(hand, suit) {
  const cards = hand.filter(c => c.suit === suit)
  return cards.some(c => VALUE_RANK[c.value] >= 10)
}

// ─── Count winners in a suit ──────────────────────────────────────
function countSuitWinners(hand, suit, playedCards) {
  const remaining = hand.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  const alreadyPlayed = playedCards.filter(c => c.suit === suit).map(c => VALUE_RANK[c.value])
  let winners = 0
  let rank = 14 // Ace
  for (const card of remaining) {
    // Count how many cards above this card are still out
    let higherOut = 0
    for (let r = VALUE_RANK[card.value] + 1; r <= 14; r++) {
      if (!alreadyPlayed.includes(r) && !remaining.some(c => VALUE_RANK[c.value] === r)) higherOut++
    }
    if (higherOut === 0) winners++
  }
  return winners
}

// ─── Standard American Bidding ────────────────────────────────────
export function getBotBid(hand, auction, position, vulnerability, difficulty = 'hard') {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const tp = totalPoints(hand)
  const partnerPos = PARTNERS[position]

  const myBids = auction.filter(b => b.position === position && b.type !== 'pass')
  const partnerBids = auction.filter(b => b.position === partnerPos && b.type !== 'pass')
  const oppBids = auction.filter(b => b.position !== position && b.position !== partnerPos)
  const lastCall = auction.length ? auction[auction.length - 1] : null
  const lastRealBid = getLastRealBid(auction)
  const partnerLastBid = partnerBids.length ? partnerBids[partnerBids.length - 1] : null

  if (difficulty === 'easy' && Math.random() < 0.2) {
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // ── Opening bid ──
  if (myBids.length === 0 && partnerBids.length === 0 && !oppBids.some(b => b.type === 'bid')) {
    return getOpeningBid(hand, hcp, dist, tp)
  }

  // ── Overcall after opponent opens ──
  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length >= 1) {
    const result = getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, position, auction)
    if (result) return result
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // ── Response to partner's opening ──
  if (myBids.length === 0 && partnerBids.length >= 1) {
    return getResponse(hand, hcp, dist, tp, partnerLastBid, lastRealBid, oppBids, auction, position)
  }

  // ── Opener's rebid ──
  if (myBids.length === 1 && partnerBids.length >= 1) {
    return getOpenerRebid(hand, hcp, dist, tp, myBids[0], partnerLastBid, lastRealBid, auction)
  }

  // ── Responder's rebid ──
  if (myBids.length === 1 && partnerBids.length >= 2) {
    return getResponderRebid(hand, hcp, dist, tp, myBids[0], partnerBids, lastRealBid, auction)
  }

  // ── Blackwood 4NT response ──
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'NT' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:5, denomination:'C' }, { level:5, denomination:'D' }, { level:5, denomination:'H' }, { level:5, denomination:'S' }]
    return { ...r[aces], type: 'bid' }
  }

  // ── Gerber 4C response ──
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'C' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:4, denomination:'D' }, { level:4, denomination:'H' }, { level:4, denomination:'S' }, { level:4, denomination:'NT' }]
    return { ...r[aces], type: 'bid' }
  }

  // ── Takeout double ──
  if (oppBids.filter(b=>b.type==='bid').length === 1 && myBids.length === 0 && partnerBids.length === 0 && hcp >= 12) {
    const oppSuit = oppBids.find(b=>b.type==='bid').denomination
    if (oppSuit !== 'NT') {
      const unbid = SUITS.filter(s => s !== oppSuit)
      const hasSupport = unbid.every(s => dist[s] >= 3)
      if (hasSupport || hcp >= 17) return { level: 0, denomination: 'DBL', type: 'double' }
    }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOpeningBid(hand, hcp, dist, tp) {
  if (hcp < 10) return { level: 0, denomination: 'PASS', type: 'pass' }

  // Preemptive bids
  if (hcp >= 5 && hcp <= 10) {
    for (const suit of ['S','H']) {
      if (dist[suit] >= 6 && hasHeadOfSequence(hand, suit)) {
        return { level: 2, denomination: suit, type: 'bid' }
      }
    }
    for (const suit of SUITS) {
      if (dist[suit] >= 7) return { level: 3, denomination: suit, type: 'bid' }
    }
  }

  if (hcp < 12) return { level: 0, denomination: 'PASS', type: 'pass' }

  // Strong 2C
  if (hcp >= 22 || (hcp >= 19 && quickTricks(hand) >= 4)) {
    return { level: 2, denomination: 'C', type: 'bid' }
  }

  // 2NT: 20-21 balanced
  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) {
    return { level: 2, denomination: 'NT', type: 'bid' }
  }

  // 1NT: 15-17 balanced
  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) {
    return { level: 1, denomination: 'NT', type: 'bid' }
  }

  // 1 of a major (5+ cards)
  if (dist['S'] >= 5 && dist['S'] >= dist['H']) return { level: 1, denomination: 'S', type: 'bid' }
  if (dist['H'] >= 5) return { level: 1, denomination: 'H', type: 'bid' }

  // 4-card majors (if strong enough)
  if (hcp >= 12 && hcp <= 21) {
    if (dist['S'] >= 4 && dist['S'] > dist['H']) return { level: 1, denomination: 'S', type: 'bid' }
    if (dist['H'] >= 4) return { level: 1, denomination: 'H', type: 'bid' }
    if (dist['D'] >= dist['C']) return { level: 1, denomination: 'D', type: 'bid' }
    return { level: 1, denomination: 'C', type: 'bid' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, position, auction) {
  if (hcp < 8) return null
  const oppLevel = lastRealBid ? lastRealBid.level : 1

  // 1NT overcall: 15-18 balanced with stopper in opp suit
  if (oppLevel === 1 && hcp >= 15 && hcp <= 18 && isBalanced(hand)) {
    const oppSuit = lastRealBid.denomination
    if (hasStopper(hand, oppSuit)) {
      return { level: 1, denomination: 'NT', type: 'bid' }
    }
  }

  // Simple overcall with good suit
  for (const suit of ['S','H','D','C']) {
    if (dist[suit] >= 5 && hcp >= 8) {
      const bid = { level: oppLevel, denomination: suit, type: 'bid' }
      if (isValidBidLevel(bid, lastRealBid)) return bid
      if (isValidBidLevel({ level: oppLevel + 1, denomination: suit, type: 'bid' }, lastRealBid) && hcp >= 11) {
        return { level: oppLevel + 1, denomination: suit, type: 'bid' }
      }
    }
  }

  return null
}

function getResponse(hand, hcp, dist, tp, partnerOpening, lastBid, oppBids, auction, position) {
  if (!partnerOpening) return { level: 0, denomination: 'PASS', type: 'pass' }
  const opening = partnerOpening

  // Response to 1NT (15-17)
  if (opening.level === 1 && opening.denomination === 'NT') {
    if (hcp <= 7) {
      if (dist['H'] >= 5) return { level: 2, denomination: 'D', type: 'bid' } // Jacoby transfer → H
      if (dist['S'] >= 5) return { level: 2, denomination: 'H', type: 'bid' } // Jacoby transfer → S
      if (dist['C'] >= 6) return { level: 3, denomination: 'C', type: 'bid' }
      if (dist['D'] >= 6) return { level: 3, denomination: 'D', type: 'bid' }
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (hcp >= 8 && hcp <= 9) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return { level: 2, denomination: 'C', type: 'bid' } // Stayman
      return { level: 2, denomination: 'NT', type: 'bid' }
    }
    if (hcp >= 10) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return { level: 2, denomination: 'C', type: 'bid' } // Stayman
      if (hcp >= 10 && hcp <= 14) return { level: 3, denomination: 'NT', type: 'bid' }
      if (hcp >= 15) return { level: 4, denomination: 'NT', type: 'bid' } // Blackwood
    }
  }

  // Response to 2NT (20-21)
  if (opening.level === 2 && opening.denomination === 'NT') {
    if (hcp <= 3) return { level: 0, denomination: 'PASS', type: 'pass' }
    if (dist['S'] >= 5) return { level: 3, denomination: 'H', type: 'bid' } // Transfer
    if (dist['H'] >= 5) return { level: 3, denomination: 'D', type: 'bid' } // Transfer
    if (hcp >= 4 && hcp <= 6) return { level: 3, denomination: 'NT', type: 'bid' }
    if (hcp >= 7) return { level: 4, denomination: 'NT', type: 'bid' } // Blackwood
  }

  // Response to 2C (strong)
  if (opening.level === 2 && opening.denomination === 'C') {
    if (hcp >= 8) {
      // Positive response — show suit or NT
      if (dist['S'] >= 5) return { level: 2, denomination: 'S', type: 'bid' }
      if (dist['H'] >= 5) return { level: 2, denomination: 'H', type: 'bid' }
      return { level: 2, denomination: 'NT', type: 'bid' }
    }
    return { level: 2, denomination: 'D', type: 'bid' } // Waiting
  }

  // Response to 1 of a major
  if (opening.level === 1 && (opening.denomination === 'H' || opening.denomination === 'S')) {
    const suit = opening.denomination
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }

    if (dist[suit] >= 3) {
      if (tp >= 6 && tp <= 9) return { level: 2, denomination: suit, type: 'bid' }
      if (tp >= 10 && tp <= 12) return { level: 3, denomination: suit, type: 'bid' }
      if (tp >= 13) {
        if (hcp >= 16) return { level: 4, denomination: 'NT', type: 'bid' } // Blackwood
        return { level: 4, denomination: suit, type: 'bid' }
      }
    }

    // Splinter (singleton in side suit, 4+ card support, game values)
    if (dist[suit] >= 4 && tp >= 13) {
      for (const s of SUITS) {
        if (s !== suit && dist[s] === 1) {
          const splinterLevel = s === 'C' ? 4 : s === 'D' ? 4 : 3
          return { level: splinterLevel, denomination: s, type: 'bid' }
        }
      }
    }

    if (suit === 'H' && dist['S'] >= 4 && hcp >= 6) return { level: 1, denomination: 'S', type: 'bid' }
    if (hcp >= 6 && hcp <= 9) return { level: 1, denomination: 'NT', type: 'bid' }
    if (hcp >= 10 && hcp <= 12 && isBalanced(hand)) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 13 && isBalanced(hand)) return { level: 3, denomination: 'NT', type: 'bid' }
  }

  // Response to 1 of a minor
  if (opening.level === 1 && (opening.denomination === 'C' || opening.denomination === 'D')) {
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }

    if (dist['S'] >= 4 && hcp >= 6) return { level: 1, denomination: 'S', type: 'bid' }
    if (dist['H'] >= 4 && hcp >= 6) return { level: 1, denomination: 'H', type: 'bid' }
    if (dist['D'] >= 4 && opening.denomination === 'C' && hcp >= 6) return { level: 1, denomination: 'D', type: 'bid' }

    if (hcp >= 6 && hcp <= 9) return { level: 1, denomination: 'NT', type: 'bid' }
    if (hcp >= 10 && hcp <= 12) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 13 && hcp <= 15) return { level: 3, denomination: 'NT', type: 'bid' }
    if (hcp >= 16) return { level: 4, denomination: 'NT', type: 'bid' } // Blackwood
  }

  // Response to weak 2
  if (opening.level === 2 && (opening.denomination === 'H' || opening.denomination === 'S')) {
    const suit = opening.denomination
    if (hcp >= 16 && dist[suit] >= 2) return { level: 4, denomination: suit, type: 'bid' }
    if (hcp >= 14) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 10 && dist[suit] >= 3) return { level: 3, denomination: suit, type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOpenerRebid(hand, hcp, dist, tp, myOpening, partnerResponse, lastBid, auction) {
  if (!partnerResponse) return { level: 0, denomination: 'PASS', type: 'pass' }

  const openSuit = myOpening.denomination
  const respSuit = partnerResponse.denomination
  const respLevel = partnerResponse.level

  // Partner raised our major
  if (respSuit === openSuit && (openSuit === 'H' || openSuit === 'S')) {
    if (respLevel === 2) {
      if (hcp >= 19) return { level: 4, denomination: 'NT', type: 'bid' } // Blackwood
      if (hcp >= 17) return { level: 4, denomination: openSuit, type: 'bid' }
      if (hcp >= 15) return { level: 3, denomination: openSuit, type: 'bid' }
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (respLevel === 3) {
      if (hcp >= 17) return { level: 4, denomination: 'NT', type: 'bid' }
      if (hcp >= 14) return { level: 4, denomination: openSuit, type: 'bid' }
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (respLevel === 4) {
      // Game bid — check for slam
      if (hcp >= 19 && countAces(hand) >= 2) return { level: 4, denomination: 'NT', type: 'bid' }
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
  }

  // Partner bid 1NT
  if (respSuit === 'NT' && respLevel === 1) {
    if (hcp >= 20) return { level: 3, denomination: 'NT', type: 'bid' }
    if (hcp >= 18) return { level: 2, denomination: 'NT', type: 'bid' }
    if (dist[openSuit] >= 6) return { level: 2, denomination: openSuit, type: 'bid' }
    // Show second suit
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4) {
        const bid = { level: 2, denomination: suit, type: 'bid' }
        if (isValidBidLevel(bid, lastBid)) return bid
      }
    }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // Partner bid 2NT
  if (respSuit === 'NT' && respLevel === 2) {
    if (hcp >= 15) return { level: 3, denomination: 'NT', type: 'bid' }
    if (dist[openSuit] >= 6) return { level: 3, denomination: openSuit, type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // Partner bid 3NT
  if (respSuit === 'NT' && respLevel === 3) {
    if (hcp >= 19 && countAces(hand) >= 2) return { level: 4, denomination: 'NT', type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // Opened 1NT — handle transfers and Stayman
  if (openSuit === 'NT') {
    if (respSuit === 'D' && respLevel === 2) return { level: 2, denomination: 'H', type: 'bid' } // Complete H transfer
    if (respSuit === 'H' && respLevel === 2) return { level: 2, denomination: 'S', type: 'bid' } // Complete S transfer
    if (respSuit === 'C' && respLevel === 2) {
      if (dist['S'] >= 4) return { level: 2, denomination: 'S', type: 'bid' }
      if (dist['H'] >= 4) return { level: 2, denomination: 'H', type: 'bid' }
      return { level: 2, denomination: 'D', type: 'bid' }
    }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // Partner new suit at 2 level — shows 10+ HCP
  if (respLevel === 2 && respSuit !== openSuit && respSuit !== 'NT') {
    const combinedHCP = hcp + 10
    if (combinedHCP >= 25) {
      const allStoppers = SUITS.every(s => hasStopper(hand, s) || dist[s] === 0)
      if (allStoppers) return { level: 3, denomination: 'NT', type: 'bid' }
    }
    if (dist[respSuit] >= 3) return { level: 3, denomination: respSuit, type: 'bid' }
    if (dist[openSuit] >= 6) return { level: 3, denomination: openSuit, type: 'bid' }
    return { level: 2, denomination: 'NT', type: 'bid' }
  }

  // Partner new suit at 1 level
  if (respLevel === 1 && respSuit !== 'NT') {
    if (dist[respSuit] >= 4) {
      if (tp >= 16) return { level: 3, denomination: respSuit, type: 'bid' }
      if (tp >= 13) return { level: 2, denomination: respSuit, type: 'bid' }
    }
    if (hcp >= 19) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 17) return { level: 2, denomination: 'NT', type: 'bid' }
    if (dist[openSuit] >= 6) return { level: 2, denomination: openSuit, type: 'bid' }
    // Reverse bid — show second suit at 2 level if strong enough
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4 && hcp >= 17) {
        const bid = { level: 2, denomination: suit, type: 'bid' }
        if (isValidBidLevel(bid, lastBid)) return bid
      }
    }
    if (hcp >= 12 && hcp <= 14) return { level: 2, denomination: openSuit, type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getResponderRebid(hand, hcp, dist, tp, myFirstBid, partnerBids, lastBid, auction) {
  const partnerRebid = partnerBids[partnerBids.length - 1]
  if (!partnerRebid) return { level: 0, denomination: 'PASS', type: 'pass' }

  const prSuit = partnerRebid.denomination
  const prLevel = partnerRebid.level

  // Partner rebid their suit
  if (prSuit === partnerBids[0].denomination && prSuit !== 'NT') {
    if (dist[prSuit] >= 3 && hcp >= 10) {
      const gameLevel = (prSuit === 'H' || prSuit === 'S') ? 4 : 5
      if (tp >= 12) return { level: gameLevel, denomination: prSuit, type: 'bid' }
    }
    if (hcp >= 11) return { level: prLevel + 1, denomination: prSuit, type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  // Partner bid NT
  if (prSuit === 'NT') {
    if (prLevel === 1 && hcp >= 11) return { level: 3, denomination: 'NT', type: 'bid' }
    if (prLevel === 2 && hcp >= 8) return { level: 3, denomination: 'NT', type: 'bid' }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function isValidBidLevel(bid, lastBid) {
  if (!lastBid) return true
  const denomOrder = ['C','D','H','S','NT']
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) return denomOrder.indexOf(bid.denomination) > denomOrder.indexOf(lastBid.denomination)
  return false
}

// ─── Bidding validation ───────────────────────────────────────────
export function isValidBid(bid, auction) {
  if (bid.type === 'pass') return true
  if (bid.type === 'double') {
    const last = getLastRealBid(auction)
    return last && last.type === 'bid'
  }
  const lastBid = getLastRealBid(auction)
  if (!lastBid) return true
  const denomOrder = ['C','D','H','S','NT']
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) return denomOrder.indexOf(bid.denomination) > denomOrder.indexOf(lastBid.denomination)
  return false
}

export function isAuctionOver(auction) {
  if (auction.length < 4) return false
  const last3 = auction.slice(-3)
  return last3.every(b => b.type === 'pass')
}

export function getContract(auction) {
  const lastBid = getLastRealBid(auction)
  if (!lastBid) return null
  const doubled = auction.some(b => b.type === 'double')
  const redoubled = auction.some(b => b.type === 'redouble')
  return {
    level: lastBid.level,
    denomination: lastBid.denomination,
    declarer: lastBid.position,
    doubled,
    redoubled,
    tricksNeeded: lastBid.level + 6,
  }
}

function getLastRealBid(auction) {
  for (let i = auction.length - 1; i >= 0; i--) {
    if (auction[i].type === 'bid') return auction[i]
  }
  return null
}

// ─── Smart Card Play Engine ───────────────────────────────────────
export function getLegalCards(hand, trick, trumpSuit) {
  if (trick.length === 0) return hand
  const ledSuit = trick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)
  if (suitCards.length > 0) return suitCards
  return hand
}

export function getBotCardPlay(hand, trick, trumpSuit, contract, position, trickHistory, difficulty = 'hard') {
  const legal = getLegalCards(hand, trick, trumpSuit)
  if (legal.length === 1) return legal[0]

  if (difficulty === 'easy' && Math.random() < 0.2) {
    return legal[Math.floor(Math.random() * legal.length)]
  }

  const isDefender = (position === 'E' || position === 'W')
  const partnerPos = PARTNERS[position]
  const playedCards = trickHistory.flatMap(t => t.trick.map(p => p.card))
  const tricksPlayed = trickHistory.length
  const tricksLeft = 13 - tricksPlayed

  if (trick.length === 0) {
    return getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos, tricksLeft)
  }

  return getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards, tricksLeft, contract)
}

// ─── Opening leads ────────────────────────────────────────────────
function getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos, tricksLeft) {

  if (!isDefender) {
    return getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, playedCards, tricksLeft)
  }

  return getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, playedCards, tricksLeft)
}

function getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, playedCards, tricksLeft) {
  const isTrumpContract = trumpSuit && trumpSuit !== 'NT'

  // Count our sure winners
  const sureWinners = SUITS.reduce((sum, suit) => sum + countSuitWinners(hand, suit, playedCards), 0)
  const tricksNeeded = contract ? contract.tricksNeeded : 7

  if (isTrumpContract) {
    // Draw trumps aggressively when we have more
    const myTrumps = hand.filter(c => c.suit === trumpSuit)
    if (myTrumps.length >= 4) {
      const topTrump = myTrumps.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
      return topTrump
    }

    // Establish long suit
    const bestSuit = findBestEstablishSuit(hand, legal, trumpSuit, playedCards)
    if (bestSuit) {
      const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
      return suitCards[0]
    }

    // Lead top of sequence
    const seq = findTopOfSequence(legal.filter(c => c.suit !== trumpSuit))
    if (seq) return seq

    // Lead highest non-trump
    const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
    if (nonTrumps.length > 0) return nonTrumps.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
  }

  // NT contract — run longest suit
  const bestSuit = findBestEstablishSuit(hand, legal, null, playedCards)
  if (bestSuit) {
    const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    return suitCards[0]
  }

  // Lead top of sequence
  const seq = findTopOfSequence(legal)
  if (seq) return seq

  return legal.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
}

function getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, playedCards, tricksLeft) {
  const isTrumpContract = trumpSuit && trumpSuit !== 'NT'
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)

  // Against NT — lead 4th best of longest strongest suit
  if (!isTrumpContract) {
    const bestSuit = findBestLeadSuit(hand, legal, null, playedCards)
    const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])

    // Top of honour sequence
    const seq = findTopOfSequence(suitCards)
    if (seq) return seq

    // 4th best
    if (suitCards.length >= 4) return suitCards[3]
    // MUD (Middle-Up-Down) from small cards
    if (suitCards.length === 3 && VALUE_RANK[suitCards[0].value] <= 9) return suitCards[1]
    // Lowest from 2
    if (suitCards.length >= 1) return suitCards[suitCards.length - 1]
  }

  // Against suit contract
  // Lead singleton for ruff potential
  for (const suit of SUITS) {
    if (suit !== trumpSuit) {
      const sc = hand.filter(c => c.suit === suit)
      if (sc.length === 1) return sc[0]
    }
  }

  // Top of sequence in non-trump
  const seq = findTopOfSequence(nonTrumps.length ? nonTrumps : legal)
  if (seq) return seq

  // Avoid leading into declarer's likely suits — lead safe low card
  const bestSuit = findBestLeadSuit(hand, legal, trumpSuit, playedCards)
  const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (suitCards.length >= 4) return suitCards[3]
  if (suitCards.length > 0) return suitCards[suitCards.length - 1]

  return legal[legal.length - 1]
}

// ─── Following to a trick ─────────────────────────────────────────
function getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards, tricksLeft, contract) {
  const ledSuit = trick[0].card.suit
  const currentWinner = getCurrentWinner(trick, trumpSuit)
  const partnerWinning = currentWinner && currentWinner.position === partnerPos
  const followCards = legal.filter(c => c.suit === ledSuit)
  const trumpCards = legal.filter(c => c.suit === trumpSuit)
  const isLastToPlay = trick.length === 3

  // ── Following suit ──
  if (followCards.length > 0) {
    const winningCards = followCards.filter(c => canBeatCurrentWinner(c, currentWinner, trumpSuit))

    // Second hand low (unless strong sequence)
    if (trick.length === 1 && isDefender) {
      const seq = findTopOfSequence(followCards)
      if (seq && VALUE_RANK[seq.value] >= 12) return seq // Play top of KQ sequence etc
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0] // Low
    }

    // Third hand high
    if (trick.length === 2 && isDefender && !partnerWinning) {
      if (winningCards.length > 0) {
        return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0] // Lowest winner
      }
    }

    // Partner is winning — don't overtake, play low
    if (partnerWinning) {
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Last to play — win cheaply if possible
    if (isLastToPlay && winningCards.length > 0) {
      return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Declarer — always try to win
    if (!isDefender && winningCards.length > 0) {
      return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Can't win — play lowest or signal
    return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
  }

  // ── Void in led suit — trump or discard ──

  // Partner is winning — discard
  if (partnerWinning) {
    return findSmartDiscard(hand, legal, trumpSuit, trickHistory, playedCards)
  }

  // Trump if useful
  if (trumpCards.length > 0 && trumpSuit && trumpSuit !== 'NT') {
    const winningTrumps = trumpCards.filter(c => canBeatCurrentWinner(c, currentWinner, trumpSuit))

    if (!isDefender) {
      // Declarer — trump with lowest winner
      if (winningTrumps.length > 0) {
        return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    } else {
      // Defender — overruff only if worth it
      if (winningTrumps.length > 0 && trick.length === 3) {
        return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
      if (winningTrumps.length > 0 && VALUE_RANK[winningTrumps[0].value] >= 11) {
        return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    }
  }

  // Discard smartly
  return findSmartDiscard(hand, legal, trumpSuit, trickHistory, playedCards)
}

// ─── Smart discard — protect honours, shed losers ─────────────────
function findSmartDiscard(hand, legal, trumpSuit, trickHistory, playedCards) {
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
  if (!nonTrumps.length) return legal.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]

  // Find suit with no more winners to protect
  let worstCard = null
  let worstScore = Infinity

  for (const card of nonTrumps) {
    const suitCards = hand.filter(c => c.suit === card.suit)
    const winners = countSuitWinners(suitCards, card.suit, playedCards)
    const score = winners * 10 + VALUE_RANK[card.value]
    if (score < worstScore) {
      worstScore = score
      worstCard = card
    }
  }

  return worstCard || nonTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
}

// ─── Helpers ──────────────────────────────────────────────────────
function findTopOfSequence(cards) {
  const bySuit = {}
  for (const c of cards) {
    if (!bySuit[c.suit]) bySuit[c.suit] = []
    bySuit[c.suit].push(c)
  }
  for (const suit of Object.keys(bySuit)) {
    const sorted = bySuit[suit].sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    let seqLen = 1
    for (let i = 1; i < sorted.length; i++) {
      if (VALUE_RANK[sorted[i-1].value] - VALUE_RANK[sorted[i].value] === 1) seqLen++
      else break
    }
    if (seqLen >= 2 && VALUE_RANK[sorted[0].value] >= 10) return sorted[0]
  }
  return null
}

function findBestLeadSuit(hand, legal, trumpSuit, playedCards) {
  const suits = [...new Set(legal.map(c => c.suit))].filter(s => s !== trumpSuit)
  if (!suits.length) return legal[0].suit
  let bestSuit = suits[0]
  let bestScore = -1
  for (const suit of suits) {
    const sc = hand.filter(c => c.suit === suit)
    const honours = sc.filter(c => VALUE_RANK[c.value] >= 10).length
    const score = sc.length * 3 + honours * 2
    if (score > bestScore) { bestScore = score; bestSuit = suit }
  }
  return bestSuit
}

function findBestEstablishSuit(hand, legal, trumpSuit, playedCards) {
  const suits = [...new Set(legal.map(c => c.suit))].filter(s => s !== trumpSuit)
  if (!suits.length) return null
  let bestSuit = null
  let bestScore = -1
  for (const suit of suits) {
    const sc = hand.filter(c => c.suit === suit)
    const winners = countSuitWinners(sc, suit, playedCards)
    const score = winners * 5 + sc.length
    if (score > bestScore) { bestScore = score; bestSuit = suit }
  }
  return bestSuit
}

function canWinTrick(cards, trick, trumpSuit) {
  return cards.filter(c => canBeatCurrentWinner(c, getCurrentWinner(trick, trumpSuit), trumpSuit))
}

function canBeatCurrentWinner(card, winner, trumpSuit) {
  if (!winner) return true
  if (card.suit === trumpSuit && winner.card.suit !== trumpSuit) return true
  if (card.suit === winner.card.suit && VALUE_RANK[card.value] > VALUE_RANK[winner.card.value]) return true
  return false
}

function getCurrentWinner(trick, trumpSuit) {
  if (trick.length === 0) return null
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
  return getCurrentWinner(trick, trumpSuit)
}

// ─── Scoring ──────────────────────────────────────────────────────
export function calculateRubberScore(contract, tricksMade, vulnerability) {
  if (!contract) return { declarerScore: 0, defenderScore: 0, made: false }
  const { level, denomination, doubled, redoubled, declarer } = contract
  const tricksNeeded = level + 6
  const overtricks = tricksMade - tricksNeeded
  const undertricks = tricksNeeded - tricksMade
  const vul = vulnerability[(declarer === 'N' || declarer === 'S') ? 'NS' : 'EW']

  if (tricksMade < tricksNeeded) {
    let penalty = 0
    if (!doubled && !redoubled) penalty = undertricks * (vul ? 100 : 50)
    else if (doubled) penalty = vul ? (undertricks===1?200:200+(undertricks-1)*300) : (undertricks===1?100:undertricks===2?300:300+(undertricks-2)*300)
    else penalty = vul ? (undertricks===1?400:400+(undertricks-1)*600) : (undertricks===1?200:undertricks===2?600:600+(undertricks-2)*600)
    return { declarerScore: 0, defenderScore: penalty, made: false }
  }

  let trickScore = 0
  const multiplier = redoubled ? 4 : doubled ? 2 : 1
  if (denomination === 'NT') trickScore = (40 + (level - 1) * 30) * multiplier
  else if (denomination === 'S' || denomination === 'H') trickScore = level * 30 * multiplier
  else trickScore = level * 20 * multiplier

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
    if (!doubled && !redoubled) overtrickScore = overtricks * (denomination === 'NT' || denomination === 'S' || denomination === 'H' ? 30 : 20)
    else if (doubled) overtrickScore = overtricks * (vul ? 200 : 100)
    else overtrickScore = overtricks * (vul ? 400 : 200)
  }

  return { declarerScore: trickScore + bonus + overtrickScore, defenderScore: 0, made: true, trickScore, bonus, overtrickScore, isGame }
}

export function calculateDuplicateScore(contract, tricksMade, vulnerability) {
  return calculateRubberScore(contract, tricksMade, vulnerability)
}

// ─── Game state factory ───────────────────────────────────────────
export function createBridgeGame(mode, playerPosition, difficulty, botNames) {
  const hands = dealHands()
  const dealer = POSITIONS[Math.floor(Math.random() * 4)]
  return {
    mode, playerPosition, difficulty,
    botNames: botNames || { N: 'Alex', E: 'Sam', W: 'Jordan' },
    hands, dealer,
    phase: 'bidding',
    auction: [],
    currentBidder: dealer,
    contract: null,
    currentTrick: [],
    tricks: { NS: 0, EW: 0 },
    trickHistory: [],
    currentLeader: null,
    score: { NS: 0, EW: 0 },
    vulnerability: { NS: false, EW: false },
    handNumber: 1,
    dummy: null,
    dummyRevealed: false,
  }
}