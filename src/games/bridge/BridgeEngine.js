// ─── Bridge Game Engine v2.2 — Smart Bot + Correct Declarer ──────

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

function hasStopper(hand, suit) {
  const sc = hand.filter(c => c.suit === suit)
  if (sc.some(c => c.value === 'A')) return true
  if (sc.some(c => c.value === 'K') && sc.length >= 2) return true
  if (sc.some(c => c.value === 'Q') && sc.length >= 3) return true
  if (sc.some(c => c.value === 'J') && sc.length >= 4) return true
  return false
}

function countAces(hand) { return hand.filter(c => c.value === 'A').length }

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

function hasHeadOfSequence(hand, suit) {
  const cards = hand.filter(c => c.suit === suit)
  return cards.some(c => VALUE_RANK[c.value] >= 10)
}

function countSuitWinners(cards, suit, playedCards) {
  const remaining = cards.filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  const alreadyPlayed = playedCards.filter(c => c.suit === suit).map(c => VALUE_RANK[c.value])
  let winners = 0
  for (const card of remaining) {
    let higherOut = 0
    for (let r = VALUE_RANK[card.value] + 1; r <= 14; r++) {
      if (!alreadyPlayed.includes(r) && !remaining.some(c => VALUE_RANK[c.value] === r)) higherOut++
    }
    if (higherOut === 0) winners++
  }
  return winners
}

// ─── Core bid validity ────────────────────────────────────────────
function isBidHigherThan(bid, lastBid) {
  if (!lastBid) return true
  if (bid.type === 'pass') return true
  if (bid.type === 'double' || bid.type === 'redouble') return true
  const denomOrder = ['C','D','H','S','NT']
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) {
    return denomOrder.indexOf(bid.denomination) > denomOrder.indexOf(lastBid.denomination)
  }
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

// ─── Standard American Bidding ────────────────────────────────────
export function getBotBid(hand, auction, position, vulnerability, difficulty = 'hard') {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const tp = totalPoints(hand)
  const partnerPos = PARTNERS[position]
  const lastRealBid = getLastRealBid(auction)

  const myBids = auction.filter(b => b.position === position && b.type === 'bid')
  const partnerBids = auction.filter(b => b.position === partnerPos && b.type === 'bid')
  const oppBids = auction.filter(b => b.position !== position && b.position !== partnerPos && b.type === 'bid')
  const partnerLastBid = partnerBids.length ? partnerBids[partnerBids.length - 1] : null

  if (difficulty === 'easy' && Math.random() < 0.2) {
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length === 0) {
    return getOpeningBid(hand, hcp, dist, tp, auction)
  }

  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length >= 1) {
    const result = getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction)
    if (result) return result
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (myBids.length === 0 && partnerBids.length >= 1) {
    return getResponse(hand, hcp, dist, tp, partnerLastBid, lastRealBid, oppBids, auction)
  }

  if (myBids.length === 1 && partnerBids.length >= 1) {
    return getOpenerRebid(hand, hcp, dist, tp, myBids[0], partnerLastBid, lastRealBid, auction)
  }

  if (myBids.length === 1 && partnerBids.length >= 2) {
    return getResponderRebid(hand, hcp, dist, tp, myBids[0], partnerBids, lastRealBid, auction)
  }

  // Blackwood 4NT response
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'NT' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const responses = [
      { level:5, denomination:'C' },
      { level:5, denomination:'D' },
      { level:5, denomination:'H' },
      { level:5, denomination:'S' }
    ]
    return { ...responses[aces], type: 'bid' }
  }

  // Gerber 4C response
  if (lastRealBid && lastRealBid.level === 4 && lastRealBid.denomination === 'C' && lastRealBid.position === partnerPos) {
    const aces = countAces(hand)
    const responses = [
      { level:4, denomination:'D' },
      { level:4, denomination:'H' },
      { level:4, denomination:'S' },
      { level:4, denomination:'NT' }
    ]
    return { ...responses[aces], type: 'bid' }
  }

  // Takeout double
  if (oppBids.length === 1 && myBids.length === 0 && partnerBids.length === 0 && hcp >= 12) {
    const oppSuit = oppBids[0].denomination
    if (oppSuit !== 'NT') {
      const unbid = SUITS.filter(s => s !== oppSuit)
      const hasSupport = unbid.every(s => dist[s] >= 3)
      if (hasSupport || hcp >= 17) {
        return { level: 0, denomination: 'DBL', type: 'double' }
      }
    }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOpeningBid(hand, hcp, dist, tp, auction) {
  if (hcp < 10) return { level: 0, denomination: 'PASS', type: 'pass' }

  if (hcp >= 5 && hcp <= 10) {
    for (const suit of ['S','H']) {
      if (dist[suit] >= 6 && hasHeadOfSequence(hand, suit)) {
        return makeBid(2, suit, auction)
      }
    }
    for (const suit of SUITS) {
      if (dist[suit] >= 7) return makeBid(3, suit, auction)
    }
  }

  if (hcp < 12) return { level: 0, denomination: 'PASS', type: 'pass' }

  if (hcp >= 22 || (hcp >= 19 && quickTricks(hand) >= 4)) {
    return makeBid(2, 'C', auction)
  }

  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) {
    return makeBid(2, 'NT', auction)
  }

  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) {
    return makeBid(1, 'NT', auction)
  }

  if (dist['S'] >= 5 && dist['S'] >= dist['H']) return makeBid(1, 'S', auction)
  if (dist['H'] >= 5) return makeBid(1, 'H', auction)

  if (hcp >= 12 && hcp <= 21) {
    if (dist['S'] >= 4 && dist['S'] > dist['H']) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)
    if (dist['D'] >= dist['C']) return makeBid(1, 'D', auction)
    return makeBid(1, 'C', auction)
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction) {
  if (hcp < 8) return null

  if (lastRealBid && lastRealBid.level === 1 && hcp >= 15 && hcp <= 18 && isBalanced(hand)) {
    const oppSuit = lastRealBid.denomination
    if (hasStopper(hand, oppSuit)) {
      const bid = makeBid(1, 'NT', auction)
      if (bid.type === 'bid') return bid
    }
  }

  for (const suit of ['S','H','D','C']) {
    if (dist[suit] >= 5 && hcp >= 8) {
      const bid1 = makeBid(1, suit, auction)
      if (bid1.type === 'bid') return bid1
      if (hcp >= 11) {
        const bid2 = makeBid(2, suit, auction)
        if (bid2.type === 'bid') return bid2
      }
    }
  }

  return null
}

function getResponse(hand, hcp, dist, tp, partnerOpening, lastRealBid, oppBids, auction) {
  if (!partnerOpening) return { level: 0, denomination: 'PASS', type: 'pass' }

  if (partnerOpening.level === 1 && partnerOpening.denomination === 'NT') {
    if (hcp <= 7) {
      if (dist['H'] >= 5) return makeBid(2, 'D', auction)
      if (dist['S'] >= 5) return makeBid(2, 'H', auction)
      if (dist['C'] >= 6) return makeBid(3, 'C', auction)
      if (dist['D'] >= 6) return makeBid(3, 'D', auction)
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (hcp >= 8 && hcp <= 9) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction)
      return makeBid(2, 'NT', auction)
    }
    if (hcp >= 10) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction)
      if (hcp >= 15) return makeBid(4, 'NT', auction)
      return makeBid(3, 'NT', auction)
    }
  }

  if (partnerOpening.level === 2 && partnerOpening.denomination === 'NT') {
    if (hcp <= 3) return { level: 0, denomination: 'PASS', type: 'pass' }
    if (dist['S'] >= 5) return makeBid(3, 'H', auction)
    if (dist['H'] >= 5) return makeBid(3, 'D', auction)
    if (hcp >= 7) return makeBid(4, 'NT', auction)
    return makeBid(3, 'NT', auction)
  }

  if (partnerOpening.level === 2 && partnerOpening.denomination === 'C') {
    if (hcp >= 8) {
      if (dist['S'] >= 5) return makeBid(2, 'S', auction)
      if (dist['H'] >= 5) return makeBid(2, 'H', auction)
      return makeBid(2, 'NT', auction)
    }
    return makeBid(2, 'D', auction)
  }

  if (partnerOpening.level === 1 && (partnerOpening.denomination === 'H' || partnerOpening.denomination === 'S')) {
    const suit = partnerOpening.denomination
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }

    if (dist[suit] >= 3) {
      if (tp >= 6 && tp <= 9) return makeBid(2, suit, auction)
      if (tp >= 10 && tp <= 12) return makeBid(3, suit, auction)
      if (tp >= 13) {
        if (hcp >= 16) return makeBid(4, 'NT', auction)
        return makeBid(4, suit, auction)
      }
    }

    if (suit === 'H' && dist['S'] >= 4 && hcp >= 6) return makeBid(1, 'S', auction)
    if (hcp >= 6 && hcp <= 9) return makeBid(1, 'NT', auction)
    if (hcp >= 10 && hcp <= 12 && isBalanced(hand)) return makeBid(2, 'NT', auction)
    if (hcp >= 13 && isBalanced(hand)) return makeBid(3, 'NT', auction)
  }

  if (partnerOpening.level === 1 && (partnerOpening.denomination === 'C' || partnerOpening.denomination === 'D')) {
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }
    if (dist['S'] >= 4) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)
    if (dist['D'] >= 4 && partnerOpening.denomination === 'C') return makeBid(1, 'D', auction)
    if (hcp >= 6 && hcp <= 9) return makeBid(1, 'NT', auction)
    if (hcp >= 10 && hcp <= 12) return makeBid(2, 'NT', auction)
    if (hcp >= 13 && hcp <= 15) return makeBid(3, 'NT', auction)
    if (hcp >= 16) return makeBid(4, 'NT', auction)
  }

  if (partnerOpening.level === 2 && (partnerOpening.denomination === 'H' || partnerOpening.denomination === 'S')) {
    const suit = partnerOpening.denomination
    if (hcp >= 16 && dist[suit] >= 2) return makeBid(4, suit, auction)
    if (hcp >= 14) return makeBid(2, 'NT', auction)
    if (hcp >= 10 && dist[suit] >= 3) return makeBid(3, suit, auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOpenerRebid(hand, hcp, dist, tp, myOpening, partnerResponse, lastRealBid, auction) {
  if (!partnerResponse) return { level: 0, denomination: 'PASS', type: 'pass' }

  const openSuit = myOpening.denomination
  const respSuit = partnerResponse.denomination
  const respLevel = partnerResponse.level

  if (respSuit === openSuit && (openSuit === 'H' || openSuit === 'S')) {
    if (respLevel === 2) {
      if (hcp >= 19) return makeBid(4, 'NT', auction)
      if (hcp >= 17) return makeBid(4, openSuit, auction)
      if (hcp >= 15) return makeBid(3, openSuit, auction)
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (respLevel === 3) {
      if (hcp >= 17) return makeBid(4, 'NT', auction)
      if (hcp >= 14) return makeBid(4, openSuit, auction)
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (respLevel === 4) {
      if (hcp >= 19 && countAces(hand) >= 2) return makeBid(4, 'NT', auction)
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
  }

  if (respSuit === 'NT' && respLevel === 1) {
    if (hcp >= 20) return makeBid(3, 'NT', auction)
    if (hcp >= 18) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4) {
        const bid = makeBid(2, suit, auction)
        if (bid.type === 'bid') return bid
      }
    }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (respSuit === 'NT' && respLevel === 2) {
    if (hcp >= 15) return makeBid(3, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (respSuit === 'NT' && respLevel === 3) {
    if (hcp >= 19 && countAces(hand) >= 2) return makeBid(4, 'NT', auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (openSuit === 'NT') {
    if (respSuit === 'D' && respLevel === 2) return makeBid(2, 'H', auction)
    if (respSuit === 'H' && respLevel === 2) return makeBid(2, 'S', auction)
    if (respSuit === 'C' && respLevel === 2) {
      if (dist['S'] >= 4) return makeBid(2, 'S', auction)
      if (dist['H'] >= 4) return makeBid(2, 'H', auction)
      return makeBid(2, 'D', auction)
    }
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (respLevel === 2 && respSuit !== openSuit && respSuit !== 'NT') {
    if (dist[respSuit] >= 3) return makeBid(3, respSuit, auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    return makeBid(2, 'NT', auction)
  }

  if (respLevel === 1 && respSuit !== 'NT') {
    if (dist[respSuit] >= 4 && tp >= 16) return makeBid(3, respSuit, auction)
    if (dist[respSuit] >= 4 && tp >= 13) return makeBid(2, respSuit, auction)
    if (hcp >= 19) return makeBid(2, 'NT', auction)
    if (hcp >= 17) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4 && hcp >= 17) {
        const bid = makeBid(2, suit, auction)
        if (bid.type === 'bid') return bid
      }
    }
    if (hcp >= 12 && hcp <= 14) return makeBid(2, openSuit, auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getResponderRebid(hand, hcp, dist, tp, myFirstBid, partnerBids, lastRealBid, auction) {
  const partnerRebid = partnerBids[partnerBids.length - 1]
  if (!partnerRebid) return { level: 0, denomination: 'PASS', type: 'pass' }

  const prSuit = partnerRebid.denomination
  const prLevel = partnerRebid.level

  if (prSuit === partnerBids[0].denomination && prSuit !== 'NT') {
    if (dist[prSuit] >= 3 && hcp >= 10) {
      const gameLevel = (prSuit === 'H' || prSuit === 'S') ? 4 : 5
      if (tp >= 12) return makeBid(gameLevel, prSuit, auction)
    }
    if (hcp >= 11) return makeBid(prLevel + 1, prSuit, auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  if (prSuit === 'NT') {
    if (prLevel === 1 && hcp >= 11) return makeBid(3, 'NT', auction)
    if (prLevel === 2 && hcp >= 8) return makeBid(3, 'NT', auction)
    return { level: 0, denomination: 'PASS', type: 'pass' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
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
  const last3 = auction.slice(-3)
  return last3.every(b => b.type === 'pass')
}

// ─── FIXED: Correct declarer determination ────────────────────────
// The declarer is the FIRST player on the winning side
// who bid the denomination of the final contract.
// Example: W bids 2NT, E bids 3NT — W is declarer because W first bid NT
export function getContract(auction) {
  const lastBid = getLastRealBid(auction)
  if (!lastBid) return null

  const doubled = auction.some(b => b.type === 'double')
  const redoubled = auction.some(b => b.type === 'redouble')
  const finalDenom = lastBid.denomination

  // Determine which side won the auction
  const winningSide = (lastBid.position === 'N' || lastBid.position === 'S')
    ? ['N', 'S']
    : ['E', 'W']

  // Find the FIRST bid of the final denomination by the winning side
  let declarer = lastBid.position
  for (const b of auction) {
    if (b.type === 'bid' && b.denomination === finalDenom && winningSide.includes(b.position)) {
      declarer = b.position
      break
    }
  }

  return {
    level: lastBid.level,
    denomination: finalDenom,
    declarer,
    doubled,
    redoubled,
    tricksNeeded: lastBid.level + 6,
  }
}

// ─── Smart Card Play ──────────────────────────────────────────────
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
  const tricksLeft = 13 - trickHistory.length

  if (trick.length === 0) {
    return getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos, tricksLeft)
  }

  return getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards, tricksLeft, contract)
}

function getLeadCard(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, playedCards, partnerPos, tricksLeft) {
  if (!isDefender) {
    return getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, playedCards)
  }
  return getDefenderLead(hand, legal, trumpSuit, trickHistory, playedCards)
}

function getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, playedCards) {
  const isTrumpContract = trumpSuit && trumpSuit !== 'NT'

  if (isTrumpContract) {
    const myTrumps = legal.filter(c => c.suit === trumpSuit)
    if (myTrumps.length >= 3) {
      return myTrumps.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
    }
    const seq = findTopOfSequence(legal.filter(c => c.suit !== trumpSuit))
    if (seq) return seq
    const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
    if (nonTrumps.length > 0) return nonTrumps.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
  }

  const bestSuit = findBestEstablishSuit(hand, legal, null, playedCards)
  if (bestSuit) {
    return legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
  }
  const seq = findTopOfSequence(legal)
  if (seq) return seq
  return legal.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
}

function getDefenderLead(hand, legal, trumpSuit, trickHistory, playedCards) {
  const isTrumpContract = trumpSuit && trumpSuit !== 'NT'
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)

  if (!isTrumpContract) {
    const bestSuit = findBestLeadSuit(hand, legal, null, playedCards)
    const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    const seq = findTopOfSequence(suitCards)
    if (seq) return seq
    if (suitCards.length >= 4) return suitCards[3]
    if (suitCards.length === 3 && VALUE_RANK[suitCards[0].value] <= 9) return suitCards[1]
    if (suitCards.length >= 1) return suitCards[suitCards.length - 1]
  }

  for (const suit of SUITS) {
    if (suit !== trumpSuit) {
      const sc = hand.filter(c => c.suit === suit)
      if (sc.length === 1 && legal.some(c => c.suit === suit)) return sc[0]
    }
  }

  const seq = findTopOfSequence(nonTrumps.length ? nonTrumps : legal)
  if (seq) return seq

  const bestSuit = findBestLeadSuit(hand, legal, trumpSuit, playedCards)
  const suitCards = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (suitCards.length >= 4) return suitCards[3]
  if (suitCards.length > 0) return suitCards[suitCards.length - 1]

  return legal[legal.length - 1]
}

function getFollowCard(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, playedCards, tricksLeft, contract) {
  const currentWinner = getCurrentWinner(trick, trumpSuit)
  const partnerWinning = currentWinner && currentWinner.position === partnerPos
  const followCards = legal.filter(c => c.suit === trick[0].card.suit)
  const trumpCards = legal.filter(c => c.suit === trumpSuit)
  const isLastToPlay = trick.length === 3

  if (followCards.length > 0) {
    const winningCards = followCards.filter(c => canBeatCurrentWinner(c, currentWinner, trumpSuit))

    if (trick.length === 1 && isDefender) {
      const seq = findTopOfSequence(followCards)
      if (seq && VALUE_RANK[seq.value] >= 12) return seq
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    if (trick.length === 2 && isDefender && !partnerWinning && winningCards.length > 0) {
      return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    if (partnerWinning) {
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    if (isLastToPlay && winningCards.length > 0) {
      return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    if (!isDefender && winningCards.length > 0) {
      return winningCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
  }

  if (partnerWinning) {
    return findSmartDiscard(hand, legal, trumpSuit, playedCards)
  }

  if (trumpCards.length > 0 && trumpSuit && trumpSuit !== 'NT') {
    const winningTrumps = trumpCards.filter(c => canBeatCurrentWinner(c, currentWinner, trumpSuit))
    if (winningTrumps.length > 0) {
      if (!isDefender) return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      if (isLastToPlay) return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      if (VALUE_RANK[winningTrumps[0].value] >= 11) return winningTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }
  }

  return findSmartDiscard(hand, legal, trumpSuit, playedCards)
}

function findSmartDiscard(hand, legal, trumpSuit, playedCards) {
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
  if (!nonTrumps.length) return legal.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]

  let worstCard = null
  let worstScore = Infinity
  for (const card of nonTrumps) {
    const suitCards = hand.filter(c => c.suit === card.suit)
    const winners = countSuitWinners(suitCards, card.suit, playedCards)
    const score = winners * 10 + VALUE_RANK[card.value]
    if (score < worstScore) { worstScore = score; worstCard = card }
  }
  return worstCard || nonTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
}

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
    else if (doubled) penalty = vul
      ? (undertricks===1?200:200+(undertricks-1)*300)
      : (undertricks===1?100:undertricks===2?300:300+(undertricks-2)*300)
    else penalty = vul
      ? (undertricks===1?400:400+(undertricks-1)*600)
      : (undertricks===1?200:undertricks===2?600:600+(undertricks-2)*600)
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
