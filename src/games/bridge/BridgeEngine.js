// ─── Bridge Game Engine ───────────────────────────────────────────
// Improved bot with proper Standard American bidding and card play

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

// ─── Deck ────────────────────────────────────────────────────────
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

// Distribution points for suit contracts
function distributionPoints(hand) {
  const dist = getDistribution(hand)
  let pts = 0
  for (const suit of SUITS) {
    if (dist[suit] === 0) pts += 3  // void
    else if (dist[suit] === 1) pts += 2  // singleton
    else if (dist[suit] === 2) pts += 1  // doubleton
  }
  return pts
}

function totalPoints(hand) {
  return countHCP(hand) + distributionPoints(hand)
}

export function isBalanced(hand) {
  const dist = getDistribution(hand)
  const lengths = Object.values(dist).sort((a,b) => b-a)
  return lengths[0] <= 5 && lengths[3] >= 2
}

function longestSuit(hand) {
  const dist = getDistribution(hand)
  return SUITS.reduce((best, suit) => dist[suit] > dist[best] ? suit : best, 'C')
}

function longestMajor(hand) {
  const dist = getDistribution(hand)
  if (dist['S'] >= dist['H']) return dist['S'] >= 4 ? 'S' : null
  return dist['H'] >= 4 ? 'H' : null
}

function hasStopper(hand, suit) {
  const suitCards = hand.filter(c => c.suit === suit)
  if (suitCards.some(c => c.value === 'A')) return true
  if (suitCards.some(c => c.value === 'K') && suitCards.length >= 2) return true
  if (suitCards.some(c => c.value === 'Q') && suitCards.length >= 3) return true
  return false
}

function countAces(hand) {
  return hand.filter(c => c.value === 'A').length
}

function countKings(hand) {
  return hand.filter(c => c.value === 'K').length
}

// ─── Improved Standard American Bidding Engine ────────────────────
export function getBotBid(hand, auction, position, vulnerability, difficulty = 'medium') {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const tp = totalPoints(hand)
  const partnerPos = PARTNERS[position]

  // Get bids by each player
  const myBids = auction.filter(b => b.position === position && b.type !== 'pass')
  const partnerBids = auction.filter(b => b.position === partnerPos && b.type !== 'pass')
  const oppBids = auction.filter(b => b.position !== position && b.position !== partnerPos && b.type !== 'pass')
  const lastCall = auction.length ? auction[auction.length - 1] : null
  const lastRealBid = getLastRealBid(auction)

  // Easy difficulty — make more mistakes
  if (difficulty === 'easy' && Math.random() < 0.3) {
    return randomValidBid(auction) || { level:0, denomination:'PASS', type:'pass' }
  }

  // ── Opening bid (first bid in auction) ──
  if (myBids.length === 0 && partnerBids.length === 0) {
    return getOpeningBid(hand, hcp, dist, tp, auction)
  }

  // ── Response to partner's opening ──
  if (myBids.length === 0 && partnerBids.length === 1) {
    return getResponse(hand, hcp, dist, tp, partnerBids[0], lastRealBid, oppBids, auction)
  }

  // ── Opener's rebid ──
  if (myBids.length === 1 && partnerBids.length === 1) {
    return getOpenerRebid(hand, hcp, dist, tp, myBids[0], partnerBids[0], lastRealBid, auction)
  }

  // ── Blackwood response ──
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'NT' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const responses = [{ level:5, denomination:'C' }, { level:5, denomination:'D' }, { level:5, denomination:'H' }, { level:5, denomination:'S' }]
    return { ...responses[aces], type:'bid' }
  }

  // ── Gerber response (4C over NT) ──
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'C' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const responses = [{ level:4, denomination:'D' }, { level:4, denomination:'H' }, { level:4, denomination:'S' }, { level:4, denomination:'NT' }]
    return { ...responses[aces], type:'bid' }
  }

  // ── Double (takeout) ──
  if (oppBids.length === 1 && myBids.length === 0 && partnerBids.length === 0 && hcp >= 12) {
    const oppSuit = oppBids[0].denomination
    if (oppBids[0].level === 1 && oppSuit !== 'NT') {
      // Takeout double — have support for other suits
      const unbidSuits = SUITS.filter(s => s !== oppSuit)
      const hasSupport = unbidSuits.every(s => dist[s] >= 3)
      if (hasSupport || hcp >= 17) {
        return { level:0, denomination:'DBL', type:'double' }
      }
    }
  }

  return { level:0, denomination:'PASS', type:'pass' }
}

function getOpeningBid(hand, hcp, dist, tp, auction) {
  // Pass below 12 HCP (with some flexibility for shape)
  if (hcp < 10) return { level:0, denomination:'PASS', type:'pass' }

  // Preemptive bids with weak hands and long suits
  if (hcp >= 6 && hcp <= 10) {
    // Weak two in major
    for (const suit of ['H','S']) {
      if (dist[suit] >= 6 && hasHeadOfSequence(hand, suit)) {
        return { level:2, denomination:suit, type:'bid' }
      }
    }
    // Weak 3-level preempt
    for (const suit of SUITS) {
      if (dist[suit] >= 7) {
        return { level:3, denomination:suit, type:'bid' }
      }
    }
  }

  if (hcp < 12) return { level:0, denomination:'PASS', type:'pass' }

  // Strong 2C (22+ or 9+ tricks)
  if (hcp >= 22) {
    return { level:2, denomination:'C', type:'bid' }
  }

  // 2NT: 20-21 balanced
  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) {
    return { level:2, denomination:'NT', type:'bid' }
  }

  // 1NT: 15-17 balanced
  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) {
    return { level:1, denomination:'NT', type:'bid' }
  }

  // One of a major — 5+ cards
  if (dist['S'] >= 5 && dist['S'] >= dist['H']) {
    return { level:1, denomination:'S', type:'bid' }
  }
  if (dist['H'] >= 5) {
    return { level:1, denomination:'H', type:'bid' }
  }

  // One of a minor — 12-21
  if (hcp >= 12 && hcp <= 21) {
    // Open longer minor, prefer diamonds
    if (dist['D'] >= dist['C'] || (dist['D'] === 3 && dist['C'] === 3)) {
      if (dist['D'] >= 3) return { level:1, denomination:'D', type:'bid' }
    }
    if (dist['C'] >= 3) return { level:1, denomination:'C', type:'bid' }
    return { level:1, denomination:'D', type:'bid' }
  }

  return { level:0, denomination:'PASS', type:'pass' }
}

function hasHeadOfSequence(hand, suit) {
  const cards = hand.filter(c => c.suit === suit)
  const ranks = cards.map(c => VALUE_RANK[c.value]).sort((a,b) => b-a)
  if (ranks[0] >= 10) return true // Has honour
  return false
}

function getResponse(hand, hcp, dist, tp, partnerOpening, lastBid, oppBids, auction) {
  const opening = partnerOpening
  if (!opening) return { level:0, denomination:'PASS', type:'pass' }

  // Response to 1NT (15-17)
  if (opening.level === 1 && opening.denomination === 'NT') {
    if (hcp <= 7) {
      // Weak — sign off or transfer
      if (dist['H'] >= 5) return { level:2, denomination:'D', type:'bid' } // Transfer to H
      if (dist['S'] >= 5) return { level:2, denomination:'H', type:'bid' } // Transfer to S
      if (dist['C'] >= 6 || dist['D'] >= 6) {
        const minor = dist['C'] >= dist['D'] ? 'C' : 'D'
        return { level:3, denomination:minor, type:'bid' }
      }
      return { level:0, denomination:'PASS', type:'pass' }
    }
    if (hcp >= 8 && hcp <= 9) {
      // Stayman with major
      if (dist['H'] >= 4 || dist['S'] >= 4) return { level:2, denomination:'C', type:'bid' } // Stayman
      return { level:2, denomination:'NT', type:'bid' } // Invitational
    }
    if (hcp >= 10) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return { level:2, denomination:'C', type:'bid' } // Stayman
      if (hcp >= 15) return { level:6, denomination:'NT', type:'bid' } // Small slam
      return { level:3, denomination:'NT', type:'bid' }
    }
  }

  // Response to 2NT (20-21)
  if (opening.level === 2 && opening.denomination === 'NT') {
    if (hcp >= 3 && (dist['H'] >= 5 || dist['S'] >= 5)) {
      const suit = dist['S'] >= dist['H'] ? 'S' : 'H'
      return { level:3, denomination:suit, type:'bid' }
    }
    if (hcp <= 3) return { level:0, denomination:'PASS', type:'pass' }
    if (hcp >= 4 && hcp <= 7) return { level:3, denomination:'NT', type:'bid' }
    if (hcp >= 8) return { level:6, denomination:'NT', type:'bid' }
    return { level:3, denomination:'NT', type:'bid' }
  }

  // Response to 1 of a major
  if (opening.level === 1 && (opening.denomination === 'H' || opening.denomination === 'S')) {
    const suit = opening.denomination
    if (hcp < 6) return { level:0, denomination:'PASS', type:'pass' }

    // Support partner's major
    if (dist[suit] >= 3) {
      if (tp >= 6 && tp <= 9) return { level:2, denomination:suit, type:'bid' }  // Simple raise
      if (tp >= 10 && tp <= 12) return { level:3, denomination:suit, type:'bid' } // Limit raise
      if (tp >= 13) return { level:4, denomination:suit, type:'bid' } // Game raise
    }

    // New suit at 1 level
    if (suit === 'H' && dist['S'] >= 4 && hcp >= 6) {
      return { level:1, denomination:'S', type:'bid' }
    }

    // 1NT (semi-forcing)
    if (hcp >= 6 && hcp <= 12) return { level:1, denomination:'NT', type:'bid' }

    // 2NT or 3NT
    if (hcp >= 13 && isBalanced(hand)) return { level:3, denomination:'NT', type:'bid' }
  }

  // Response to 1 of a minor
  if (opening.level === 1 && (opening.denomination === 'C' || opening.denomination === 'D')) {
    if (hcp < 6) return { level:0, denomination:'PASS', type:'pass' }

    // Show major first
    if (dist['S'] >= 4 && hcp >= 6) return { level:1, denomination:'S', type:'bid' }
    if (dist['H'] >= 4 && hcp >= 6) return { level:1, denomination:'H', type:'bid' }

    // NT responses
    if (hcp >= 6 && hcp <= 9) return { level:1, denomination:'NT', type:'bid' }
    if (hcp >= 10 && hcp <= 12) return { level:2, denomination:'NT', type:'bid' }
    if (hcp >= 13) return { level:3, denomination:'NT', type:'bid' }
  }

  // Response to weak 2
  if (opening.level === 2 && (opening.denomination === 'H' || opening.denomination === 'S')) {
    const suit = opening.denomination
    if (hcp >= 16 && dist[suit] >= 2) return { level:4, denomination:suit, type:'bid' }
    if (hcp >= 14) return { level:2, denomination:'NT', type:'bid' } // Feature ask
    if (hcp >= 10 && dist[suit] >= 3) return { level:3, denomination:suit, type:'bid' }
    return { level:0, denomination:'PASS', type:'pass' }
  }

  return { level:0, denomination:'PASS', type:'pass' }
}

function getOpenerRebid(hand, hcp, dist, tp, myOpening, partnerResponse, lastBid, auction) {
  if (!partnerResponse) return { level:0, denomination:'PASS', type:'pass' }

  const openSuit = myOpening.denomination
  const respSuit = partnerResponse.denomination
  const respLevel = partnerResponse.level

  // Partner raised our major
  if (respSuit === openSuit && (openSuit === 'H' || openSuit === 'S')) {
    if (respLevel === 2) {
      // Simple raise — invite or pass
      if (hcp >= 17) return { level:4, denomination:openSuit, type:'bid' } // Game
      if (hcp >= 15) return { level:3, denomination:openSuit, type:'bid' } // Invite
      return { level:0, denomination:'PASS', type:'pass' }
    }
    if (respLevel === 3) {
      if (hcp >= 14) return { level:4, denomination:openSuit, type:'bid' }
      return { level:0, denomination:'PASS', type:'pass' }
    }
  }

  // Partner bid 1NT
  if (respSuit === 'NT' && respLevel === 1) {
    if (hcp >= 19) return { level:3, denomination:'NT', type:'bid' }
    if (hcp >= 17) return { level:2, denomination:'NT', type:'bid' }
    // Rebid suit if 6+
    if (dist[openSuit] >= 6) return { level:2, denomination:openSuit, type:'bid' }
    // Show second suit
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4) {
        const bid = { level:2, denomination:suit, type:'bid' }
        if (isValidBidLevel(bid, lastBid)) return bid
      }
    }
    return { level:0, denomination:'PASS', type:'pass' }
  }

  // Partner bid 2NT (10-12 invite)
  if (respSuit === 'NT' && respLevel === 2) {
    if (hcp >= 14) return { level:3, denomination:'NT', type:'bid' }
    return { level:0, denomination:'PASS', type:'pass' }
  }

  // Partner bid 3NT
  if (respSuit === 'NT' && respLevel === 3) {
    // Check for slam
    if (hcp >= 17 && countAces(hand) >= 2) {
      return { level:4, denomination:'NT', type:'bid' } // Blackwood
    }
    return { level:0, denomination:'PASS', type:'pass' }
  }

  // Opened 1NT — partner transferred
  if (openSuit === 'NT') {
    if (respSuit === 'D') {
      // Transfer to H
      if (isValidBidLevel({ level:2, denomination:'H' }, lastBid)) {
        return { level:2, denomination:'H', type:'bid' }
      }
    }
    if (respSuit === 'H') {
      // Transfer to S
      if (isValidBidLevel({ level:2, denomination:'S' }, lastBid)) {
        return { level:2, denomination:'S', type:'bid' }
      }
    }
    if (respSuit === 'C' && respLevel === 2) {
      // Stayman — show 4-card major
      if (dist['S'] >= 4) return { level:2, denomination:'S', type:'bid' }
      if (dist['H'] >= 4) return { level:2, denomination:'H', type:'bid' }
      return { level:2, denomination:'D', type:'bid' } // No major
    }
    return { level:0, denomination:'PASS', type:'pass' }
  }

  return { level:0, denomination:'PASS', type:'pass' }
}

function isValidBidLevel(bid, lastBid) {
  if (!lastBid) return true
  const denomOrder = ['C','D','H','S','NT']
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) return denomOrder.indexOf(bid.denomination) > denomOrder.indexOf(lastBid.denomination)
  return false
}

function randomValidBid(auction) {
  const last = getLastRealBid(auction)
  const denomOrder = ['C','D','H','S','NT']
  for (let lv = 1; lv <= 7; lv++) {
    for (const dn of denomOrder) {
      if (!last || lv > last.level || (lv === last.level && denomOrder.indexOf(dn) > denomOrder.indexOf(last.denomination))) {
        if (Math.random() < 0.15) return { level:lv, denomination:dn, type:'bid' }
      }
    }
  }
  return null
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

// ─── Improved Card Play ───────────────────────────────────────────
export function getLegalCards(hand, trick, trumpSuit) {
  if (trick.length === 0) return hand
  const ledSuit = trick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)
  if (suitCards.length > 0) return suitCards
  return hand
}

export function getBotCardPlay(hand, trick, trumpSuit, contract, position, trickHistory, difficulty = 'medium') {
  const legal = getLegalCards(hand, trick, trumpSuit)
  if (legal.length === 1) return legal[0]

  // Easy — occasional random card
  if (difficulty === 'easy' && Math.random() < 0.25) {
    return legal[Math.floor(Math.random() * legal.length)]
  }

  const isDefender = (position === 'E' || position === 'W')
  const partnerPos = PARTNERS[position]
  const playedCards = trickHistory.flatMap(t => t.trick.map(p => p.card))

  if (trick.length === 0) {
    // Leading
    return getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos)
  }

  // Following to a trick
  return getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards)
}

function getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos) {

  if (!isDefender) {
    // Declarer lead — draw trumps, establish long suits
    if (trumpSuit && trumpSuit !== 'NT') {
      const trumps = legal.filter(c => c.suit === trumpSuit)
      if (trumps.length > 0) return trumps[0] // Lead top trump to draw
    }

    // Lead top of a strong sequence
    const sequenceLead = findTopOfSequence(legal)
    if (sequenceLead && VALUE_RANK[sequenceLead.value] >= 10) return sequenceLead

    // Lead highest card
    return legal.reduce((hi, c) => VALUE_RANK[c.value] > VALUE_RANK[hi.value] ? c : hi)
  }

  // Defender lead
  // Lead partner's bid suit if known
  // Lead top of sequence in unbid suit
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)

  // Standard leads: top of honour sequence
  const sequenceLead = findTopOfSequence(nonTrumps.length ? nonTrumps : legal)
  if (sequenceLead) return sequenceLead

  // Fourth best of longest suit
  const bestSuit = findBestLeadSuit(hand, legal, trumpSuit, playedCards)
  const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (suitCards.length >= 4) return suitCards[3] // 4th best
  if (suitCards.length > 0) return suitCards[suitCards.length-1] // lowest

  return legal[legal.length - 1]
}

function findTopOfSequence(cards) {
  // Group by suit
  const bySuit = {}
  for (const c of cards) {
    if (!bySuit[c.suit]) bySuit[c.suit] = []
    bySuit[c.suit].push(c)
  }

  for (const suit of Object.keys(bySuit)) {
    const sorted = bySuit[suit].sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    // Check for sequence (consecutive values)
    let seqLen = 1
    for (let i = 1; i < sorted.length; i++) {
      if (VALUE_RANK[sorted[i-1].value] - VALUE_RANK[sorted[i].value] === 1) seqLen++
      else break
    }
    if (seqLen >= 2 && VALUE_RANK[sorted[0].value] >= 10) {
      return sorted[0] // Top of sequence
    }
  }
  return null
}

function findBestLeadSuit(hand, legal, trumpSuit, playedCards) {
  const suits = [...new Set(legal.map(c => c.suit))].filter(s => s !== trumpSuit)
  if (!suits.length) return legal[0].suit

  // Prefer suit with most cards and honours
  let bestSuit = suits[0]
  let bestScore = -1

  for (const suit of suits) {
    const suitCards = hand.filter(c => c.suit === suit)
    const honours = suitCards.filter(c => VALUE_RANK[c.value] >= 10).length
    const score = suitCards.length * 2 + honours
    if (score > bestScore) { bestScore = score; bestSuit = suit }
  }
  return bestSuit
}

function getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards) {
  const ledSuit = trick[0].card.suit
  const currentWinner = getCurrentWinner(trick, trumpSuit)
  const partnerWinning = currentWinner && currentWinner.position === partnerPos
  const trickWinnable = canWinTrick(legal, trick, trumpSuit)

  // Following suit
  const followCards = legal.filter(c => c.suit === ledSuit)
  if (followCards.length > 0) {
    if (partnerWinning) {
      // Partner is winning — play lowest (signal)
      return followCards.reduce((lo, c) => VALUE_RANK[c.value] < VALUE_RANK[lo.value] ? c : lo)
    }
    if (trickWinnable.length > 0) {
      // Third hand high — play lowest winning card
      return trickWinnable.reduce((lo, c) => VALUE_RANK[c.value] < VALUE_RANK[lo.value] ? c : lo)
    }
    // Can't win — signal with high-low (even number encourages)
    return followCards.reduce((lo, c) => VALUE_RANK[c.value] < VALUE_RANK[lo.value] ? c : lo)
  }

  // Void in led suit — can trump or discard
  const trumpCards = legal.filter(c => c.suit === trumpSuit)

  if (partnerWinning) {
    // Partner winning — discard low from worthless suit
    return findDiscard(legal, trumpSuit, trickHistory)
  }

  if (trumpCards.length > 0 && trumpSuit) {
    // Trump — but only if useful
    const winningTrumps = trumpCards.filter(c => canBeatCurrentWinner(c, currentWinner, trumpSuit))
    if (winningTrumps.length > 0) {
      // Play lowest winning trump
      return winningTrumps.reduce((lo, c) => VALUE_RANK[c.value] < VALUE_RANK[lo.value] ? c : lo)
    }
  }

  // Discard
  return findDiscard(legal, trumpSuit, trickHistory)
}

function findDiscard(legal, trumpSuit, trickHistory) {
  // Discard from shortest, weakest non-trump suit
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
  if (nonTrumps.length === 0) return legal[legal.length-1]

  // Find most worthless card
  return nonTrumps.reduce((worst, c) => {
    const wScore = VALUE_RANK[c.value]
    const bestScore = VALUE_RANK[worst.value]
    return wScore < bestScore ? c : worst
  })
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
  if (!contract) return { declarerScore:0, defenderScore:0, made:false }
  const { level, denomination, doubled, redoubled, declarer } = contract
  const tricksNeeded = level + 6
  const overtricks = tricksMade - tricksNeeded
  const undertricks = tricksNeeded - tricksMade
  const vul = vulnerability[(declarer==='N'||declarer==='S')?'NS':'EW']

  if (tricksMade < tricksNeeded) {
    let penalty = 0
    if (!doubled && !redoubled) penalty = undertricks * (vul ? 100 : 50)
    else if (doubled) penalty = vul ? (undertricks===1?200:200+(undertricks-1)*300) : (undertricks===1?100:undertricks===2?300:300+(undertricks-2)*300)
    else penalty = vul ? (undertricks===1?400:400+(undertricks-1)*600) : (undertricks===1?200:undertricks===2?600:600+(undertricks-2)*600)
    return { declarerScore:0, defenderScore:penalty, made:false }
  }

  let trickScore = 0
  const multiplier = redoubled ? 4 : doubled ? 2 : 1
  if (denomination==='NT') trickScore = (40+(level-1)*30) * multiplier
  else if (denomination==='S'||denomination==='H') trickScore = level*30*multiplier
  else trickScore = level*20*multiplier

  let bonus = 0
  const isGame = trickScore >= 100
  if (isGame) bonus += vul ? 500 : 300
  else bonus += 50
  if (level===6) bonus += vul ? 750 : 500
  if (level===7) bonus += vul ? 1500 : 1000
  if (doubled) bonus += 50
  if (redoubled) bonus += 100

  let overtrickScore = 0
  if (overtricks > 0) {
    if (!doubled && !redoubled) overtrickScore = overtricks * (denomination==='NT'||denomination==='S'||denomination==='H' ? 30 : 20)
    else if (doubled) overtrickScore = overtricks * (vul ? 200 : 100)
    else overtrickScore = overtricks * (vul ? 400 : 200)
  }

  return { declarerScore:trickScore+bonus+overtrickScore, defenderScore:0, made:true, trickScore, bonus, overtrickScore, isGame }
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
    botNames: botNames || { N:'Alex', E:'Sam', W:'Jordan' },
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
