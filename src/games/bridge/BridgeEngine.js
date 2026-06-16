// ─── Bridge Game Engine v4.0 — Improved Card Play ────────────────

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

function countSolidWinners(cards, suit, played) {
  const sorted = [...cards].filter(c => c.suit === suit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  const playedRanks = played.filter(c => c.suit === suit).map(c => VALUE_RANK[c.value])
  let winners = 0
  for (const card of sorted) {
    const rank = VALUE_RANK[card.value]
    let higherOut = 0
    for (let r = rank + 1; r <= 14; r++) {
      if (!playedRanks.includes(r) && !sorted.some(c => VALUE_RANK[c.value] === r)) higherOut++
    }
    if (higherOut === 0) winners++
    else break // once we hit a non-winner, stop
  }
  return winners
}

// Count how many trumps opponents likely have remaining
function countOutstandingTrumps(trumpSuit, hand, trickHistory) {
  if (!trumpSuit) return 0
  const played = trickHistory.flatMap(t => t.trick.map(p => p.card))
  const playedTrumps = played.filter(c => c.suit === trumpSuit).length
  const myTrumps = hand.filter(c => c.suit === trumpSuit).length
  return 13 - playedTrumps - myTrumps // rough estimate of opponents' trumps
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

// ─── BIDDING ENGINE (unchanged) ───────────────────────────────────
export function getBotBid(hand, auction, position, vulnerability, difficulty = 'hard') {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const tp = totalPoints(hand)
  const partnerPos = PARTNERS[position]
  const lastRealBid = getLastRealBid(auction)
  const vul = vulnerability?.[(position==='N'||position==='S')?'NS':'EW'] || false
  const myBids = auction.filter(b => b.position === position && b.type === 'bid')
  const partnerBids = auction.filter(b => b.position === partnerPos && b.type === 'bid')
  const oppBids = auction.filter(b => b.position !== position && b.position !== partnerPos && b.type === 'bid')
  const partnerLastBid = partnerBids.length ? partnerBids[partnerBids.length - 1] : null

  if (difficulty === 'easy' && Math.random() < 0.15) return pass()

  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length === 0)
    return getOpeningBid(hand, hcp, dist, tp, auction, vul)
  if (myBids.length === 0 && partnerBids.length === 0 && oppBids.length >= 1)
    return getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction, vul, position)
  if (myBids.length === 0 && partnerBids.length >= 1)
    return getResponse(hand, hcp, dist, tp, partnerLastBid, lastRealBid, oppBids, auction, position, vul)
  if (myBids.length === 1 && partnerBids.length >= 1)
    return getOpenerRebid(hand, hcp, dist, tp, myBids[0], partnerLastBid, lastRealBid, auction, vul)
  if (myBids.length === 1 && partnerBids.length >= 2)
    return getResponderRebid(hand, hcp, dist, tp, myBids[0], partnerBids, lastRealBid, auction, vul)
  if (myBids.length >= 2 || partnerBids.length >= 3)
    return getLaterBid(hand, hcp, dist, tp, myBids, partnerBids, lastRealBid, auction, vul)

  if (lastRealBid?.level === 4 && lastRealBid?.denomination === 'NT' && lastRealBid?.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:5, denomination:'C' },{ level:5, denomination:'D' },{ level:5, denomination:'H' },{ level:5, denomination:'S' }]
    return { ...r[Math.min(aces, 3)], type: 'bid' }
  }
  if (lastRealBid?.level === 4 && lastRealBid?.denomination === 'C' && lastRealBid?.position === partnerPos) {
    const aces = countAces(hand)
    const r = [{ level:4, denomination:'D' },{ level:4, denomination:'H' },{ level:4, denomination:'S' },{ level:4, denomination:'NT' }]
    return { ...r[Math.min(aces, 3)], type: 'bid' }
  }
  if (oppBids.length === 1 && myBids.length === 0 && partnerBids.length === 0 && hcp >= 11) {
    const oppSuit = oppBids[0].denomination
    if (oppSuit !== 'NT' && oppBids[0].level === 1) {
      const unbid = SUITS.filter(s => s !== oppSuit)
      const hasSupport = unbid.every(s => dist[s] >= 3)
      if ((hasSupport && hcp >= 11) || hcp >= 17) return dbl()
    }
  }
  if (lastRealBid?.position !== partnerPos && lastRealBid?.type === 'bid' && hcp >= 15 && myBids.length === 0)
    return dbl()
  return pass()
}

function getOpeningBid(hand, hcp, dist, tp, auction, vul) {
  if (hcp < 10) return pass()
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
  if (hcp >= 22 || (hcp >= 17 && quickTricks(hand) >= 5)) return makeBid(2, 'C', auction)
  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) return makeBid(2, 'NT', auction)
  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) return makeBid(1, 'NT', auction)
  if (dist['S'] >= 5 && dist['S'] >= dist['H']) return makeBid(1, 'S', auction)
  if (dist['H'] >= 5) return makeBid(1, 'H', auction)
  if (hcp >= 12) {
    if (dist['S'] >= 4 && dist['S'] >= dist['H']) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)
    if (dist['D'] > dist['C']) return makeBid(1, 'D', auction)
    if (dist['C'] > dist['D']) return makeBid(1, 'C', auction)
    return makeBid(1, 'D', auction)
  }
  return pass()
}

function getOvercall(hand, hcp, dist, tp, oppBids, lastRealBid, auction, vul, position) {
  if (hcp < 8) return pass()
  const oppLevel = lastRealBid?.level || 1
  const oppSuit = lastRealBid?.denomination
  if (oppLevel === 1 && hcp >= 15 && hcp <= 18 && isBalanced(hand) && hasStopper(hand, oppSuit)) {
    const b = makeBid(1, 'NT', auction)
    if (b.type === 'bid') return b
  }
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
  if (op.level === 1 && op.denomination === 'NT') {
    if (hcp <= 7) {
      if (dist['H'] >= 5) return makeBid(2, 'D', auction)
      if (dist['S'] >= 5) return makeBid(2, 'H', auction)
      if (dist['C'] >= 6) return makeBid(3, 'C', auction)
      if (dist['D'] >= 6) return makeBid(3, 'D', auction)
      return pass()
    }
    if (hcp >= 8 && hcp <= 9) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction)
      return makeBid(2, 'NT', auction)
    }
    if (hcp >= 10 && hcp <= 14) {
      if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(2, 'C', auction)
      return makeBid(3, 'NT', auction)
    }
    if (hcp >= 15 && hcp <= 16) return makeBid(4, 'NT', auction)
    if (hcp >= 17) return makeBid(6, 'NT', auction)
  }
  if (op.level === 2 && op.denomination === 'NT') {
    if (hcp <= 3) return pass()
    if (dist['S'] >= 5) return makeBid(3, 'H', auction)
    if (dist['H'] >= 5) return makeBid(3, 'D', auction)
    if (dist['H'] >= 4 || dist['S'] >= 4) return makeBid(3, 'C', auction)
    if (hcp >= 4 && hcp <= 6) return makeBid(3, 'NT', auction)
    if (hcp >= 7 && hcp <= 8) return makeBid(4, 'NT', auction)
    if (hcp >= 9) return makeBid(6, 'NT', auction)
  }
  if (op.level === 2 && op.denomination === 'C') {
    if (hcp >= 8 || quickTricks(hand) >= 1.5) {
      if (dist['S'] >= 5) return makeBid(2, 'S', auction)
      if (dist['H'] >= 5) return makeBid(2, 'H', auction)
      if (dist['D'] >= 5) return makeBid(3, 'D', auction)
      return makeBid(2, 'NT', auction)
    }
    return makeBid(2, 'D', auction)
  }
  if (op.level === 2 && (op.denomination === 'H' || op.denomination === 'S')) {
    const suit = op.denomination
    if (hcp >= 16 && dist[suit] >= 2) return makeBid(4, suit, auction)
    if (hcp >= 14 && dist[suit] >= 2) return makeBid(3, suit, auction)
    if (hcp >= 16) return makeBid(2, 'NT', auction)
    return pass()
  }
  if (op.level === 1 && (op.denomination === 'H' || op.denomination === 'S')) {
    const suit = op.denomination
    if (hcp < 6) return pass()
    if (dist[suit] >= 3) {
      if (tp >= 6 && tp <= 9) return makeBid(2, suit, auction)
      if (tp >= 10 && tp <= 12) return makeBid(3, suit, auction)
      if (tp >= 13 && tp <= 15) {
        if (hcp >= 13) return makeBid(4, 'NT', auction)
        return makeBid(4, suit, auction)
      }
      if (tp >= 16) return makeBid(4, 'NT', auction)
    }
    if (suit === 'H' && dist['S'] >= 4 && hcp >= 6) return makeBid(1, 'S', auction)
    if (hcp >= 13) {
      for (const s of ['D','C']) {
        if (dist[s] >= 4) return makeBid(2, s, auction)
      }
      return makeBid(2, 'NT', auction)
    }
    if (hcp >= 6 && hcp <= 12) return makeBid(1, 'NT', auction)
  }
  if (op.level === 1 && (op.denomination === 'C' || op.denomination === 'D')) {
    if (hcp < 6) return pass()
    if (dist['H'] >= 4 && dist['S'] >= 4) return makeBid(1, 'H', auction)
    if (dist['S'] >= 4) return makeBid(1, 'S', auction)
    if (dist['H'] >= 4) return makeBid(1, 'H', auction)
    if (op.denomination === 'C' && dist['D'] >= 4) return makeBid(1, 'D', auction)
    if (hcp >= 6 && hcp <= 9) return makeBid(1, 'NT', auction)
    if (hcp >= 10 && hcp <= 12) return makeBid(2, 'NT', auction)
    if (hcp >= 13 && hcp <= 15) return makeBid(3, 'NT', auction)
    if (hcp >= 16) return makeBid(4, 'NT', auction)
  }
  return pass()
}

function getOpenerRebid(hand, hcp, dist, tp, myOpening, partnerResponse, lastRealBid, auction, vul) {
  if (!partnerResponse) return pass()
  const openSuit = myOpening.denomination
  const respSuit = partnerResponse.denomination
  const respLevel = partnerResponse.level
  if (respSuit === openSuit && (openSuit === 'H' || openSuit === 'S')) {
    if (respLevel === 2) {
      if (tp >= 20) return makeBid(4, 'NT', auction)
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
  if (openSuit === 'NT') {
    if (respSuit === 'C' && respLevel === 2) {
      if (dist['S'] >= 4 && dist['S'] >= dist['H']) return makeBid(2, 'S', auction)
      if (dist['H'] >= 4) return makeBid(2, 'H', auction)
      return makeBid(2, 'D', auction)
    }
    if (respSuit === 'D' && respLevel === 2) return makeBid(2, 'H', auction)
    if (respSuit === 'H' && respLevel === 2) return makeBid(2, 'S', auction)
    if (respSuit === 'NT' && respLevel === 2) {
      if (hcp >= 17) return makeBid(3, 'NT', auction)
      return pass()
    }
    if (respSuit === 'NT' && respLevel === 4) return pass()
    return pass()
  }
  if (respSuit === 'NT' && respLevel === 1) {
    if (hcp >= 19) return makeBid(3, 'NT', auction)
    if (hcp >= 18) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
    for (const suit of ['S','H','D','C']) {
      if (suit !== openSuit && dist[suit] >= 4 && hcp >= 17) {
        const b = makeBid(2, suit, auction)
        if (b.type === 'bid') return b
      }
    }
    if (dist[openSuit] >= 5) return makeBid(2, openSuit, auction)
    return pass()
  }
  if (respSuit === 'NT' && respLevel === 2) {
    if (hcp >= 15) return makeBid(3, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    return pass()
  }
  if (respSuit === 'NT' && respLevel === 3) {
    if (hcp >= 18 && countAces(hand) >= 2) return makeBid(4, 'NT', auction)
    if (hcp >= 17) {
      const gameLevel = (openSuit === 'H' || openSuit === 'S') ? 4 : 5
      return makeBid(gameLevel, openSuit, auction)
    }
    return pass()
  }
  if (respLevel === 2 && respSuit !== openSuit && respSuit !== 'NT') {
    if (dist[respSuit] >= 4) return makeBid(3, respSuit, auction)
    if (dist[openSuit] >= 6) return makeBid(3, openSuit, auction)
    if (SUITS.every(s => hasStopper(hand, s))) return makeBid(3, 'NT', auction)
    return makeBid(2, 'NT', auction)
  }
  if (respLevel === 1 && respSuit !== 'NT') {
    if (dist[respSuit] >= 4 && tp >= 16) return makeBid(3, respSuit, auction)
    if (dist[respSuit] >= 4 && tp >= 13) return makeBid(2, respSuit, auction)
    if (hcp >= 18) return makeBid(2, 'NT', auction)
    if (dist[openSuit] >= 6) return makeBid(2, openSuit, auction)
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
  if (prSuit !== 'NT' && prSuit !== 'PASS') {
    if (dist[prSuit] >= 3) {
      const gameLevel = (prSuit === 'H' || prSuit === 'S') ? 4 : 5
      if (hcp >= 12) return makeBid(gameLevel, prSuit, auction)
      if (hcp >= 10) return makeBid(prLevel + 1, prSuit, auction)
    }
    const allStop = SUITS.every(s => hasStopper(hand, s))
    if (allStop && hcp >= 11) return makeBid(3, 'NT', auction)
    if (hcp >= 10) return makeBid(prLevel + 1, prSuit, auction)
    return pass()
  }
  if (prSuit === 'NT') {
    if (prLevel === 1 && hcp >= 11) return makeBid(3, 'NT', auction)
    if (prLevel === 2 && hcp >= 8) return makeBid(3, 'NT', auction)
    return pass()
  }
  return pass()
}

function getLaterBid(hand, hcp, dist, tp, myBids, partnerBids, lastRealBid, auction, vul) {
  const partnerLastBid = partnerBids[partnerBids.length - 1]
  if (!partnerLastBid) return pass()
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

// ─── CARD PLAY ENGINE v4 — Fixed ─────────────────────────────────
export function getLegalCards(hand, trick, trumpSuit) {
  if (trick.length === 0) return hand
  const ledSuit = trick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)
  return suitCards.length > 0 ? suitCards : hand
}

export function getBotCardPlay(hand, trick, trumpSuit, contract, position, trickHistory, difficulty = 'hard') {
  const legal = getLegalCards(hand, trick, trumpSuit)
  if (legal.length === 1) return legal[0]

  if (difficulty === 'easy' && Math.random() < 0.18)
    return legal[Math.floor(Math.random() * legal.length)]

  const isDefender = position === 'E' || position === 'W'
  const partnerPos = PARTNERS[position]
  const played = trickHistory.flatMap(t => t.trick.map(p => p.card))
  const tricksLeft = 13 - trickHistory.length
  const declarerSide = (contract?.declarer === 'N' || contract?.declarer === 'S') ? ['N','S'] : ['E','W']
  const iAmDeclarer = declarerSide.includes(position) && contract?.declarer === position

  if (trick.length === 0)
    return getOpeningLead(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, played, partnerPos, tricksLeft, iAmDeclarer)
  return getFollowPlay(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, played, tricksLeft, contract, iAmDeclarer)
}

// ─── OPENING LEADS ────────────────────────────────────────────────
function getOpeningLead(hand, legal, trumpSuit, contract, position, isDefender, trickHistory, played, partnerPos, tricksLeft, iAmDeclarer) {
  if (!isDefender) return getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft)
  return getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft)
}

// ─── DECLARER LEAD — FIX: draw trumps first properly ─────────────
function getDeclarerLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft) {
  const isTrump = trumpSuit && trumpSuit !== 'NT'

  if (isTrump) {
    const myTrumps = hand.filter(c => c.suit === trumpSuit)
    const outstandingTrumps = countOutstandingTrumps(trumpSuit, hand, trickHistory)

    // FIX: Draw trumps when opponents still have them AND we have enough entries
    // Draw with LOWEST trump first to preserve honours
    if (outstandingTrumps >= 2 && myTrumps.length >= 2 && tricksLeft > 4) {
      // Lead lowest trump to draw opponents' trumps
      const legalTrumps = legal.filter(c => c.suit === trumpSuit)
      if (legalTrumps.length > 0) {
        return legalTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    }

    // Establish long side suit
    const bestSuit = getBestEstablishSuit(hand, legal, trumpSuit, played)
    if (bestSuit) {
      const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
      return sc[0]
    }

    // Top of sequence in side suit
    const seq = findTopSequence(legal.filter(c => c.suit !== trumpSuit))
    if (seq) return seq

    // Lead low from longest side suit
    const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
    if (nonTrumps.length > 0) {
      const byLength = SUITS.filter(s => s !== trumpSuit)
        .map(s => ({ suit: s, cards: hand.filter(c => c.suit === s) }))
        .sort((a,b) => b.cards.length - a.cards.length)
      for (const { suit } of byLength) {
        const lc = legal.filter(c => c.suit === suit)
        if (lc.length > 0) return lc.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
      }
    }
  }

  // NT — run longest/strongest suit
  const bestSuit = getBestEstablishSuit(hand, legal, null, played)
  if (bestSuit) return legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
  const seq = findTopSequence(legal)
  if (seq) return seq
  return legal.sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])[0]
}

// ─── DEFENDER LEAD ────────────────────────────────────────────────
function getDefenderLead(hand, legal, trumpSuit, contract, trickHistory, played, tricksLeft) {
  const isTrump = trumpSuit && trumpSuit !== 'NT'
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)

  // Against NT — 4th best of longest/strongest suit
  if (!isTrump) {
    const bestSuit = getBestLeadSuit(hand, legal, null, played)
    const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    // Top of sequence (AKQ, KQJ, QJ10 etc)
    const seq = findTopSequence(sc)
    if (seq) return seq
    // 4th best
    if (sc.length >= 4) return sc[3]
    // MUD from 3 small
    if (sc.length === 3 && VALUE_RANK[sc[0].value] <= 9) return sc[1]
    // Top of doubleton
    if (sc.length === 2) return sc[0]
    return sc[sc.length - 1]
  }

  // Against suit contract
  // Lead singleton (hoping for ruff)
  for (const suit of SUITS) {
    if (suit === trumpSuit) continue
    const sc = hand.filter(c => c.suit === suit)
    if (sc.length === 1 && legal.some(c => c.suit === suit)) return sc[0]
  }

  // Top of sequence in side suit
  const seq = findTopSequence(nonTrumps.length ? nonTrumps : legal)
  if (seq) return seq

  // 4th best of best suit
  const bestSuit = getBestLeadSuit(hand, legal, trumpSuit, played)
  const sc = legal.filter(c => c.suit === bestSuit).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
  if (sc.length >= 4) return sc[3]
  if (sc.length === 2) return sc[0] // top of doubleton
  return sc[sc.length - 1] || legal[0]
}

// ─── FOLLOW TO TRICK — Major fixes here ──────────────────────────
function getFollowPlay(hand, legal, trick, trumpSuit, position, isDefender, partnerPos, trickHistory, played, tricksLeft, contract, iAmDeclarer) {
  const ledSuit = trick[0].card.suit
  const currentWinner = getCurrentTrickWinner(trick, trumpSuit)
  const partnerWinning = currentWinner?.position === partnerPos
  const followCards = legal.filter(c => c.suit === ledSuit)
  const trumpCards = legal.filter(c => c.suit === trumpSuit)
  const isLastToPlay = trick.length === 3
  const tricksMadeByDeclarerSide = trickHistory.filter(t => {
    const declarerSide = (contract?.declarer === 'N' || contract?.declarer === 'S') ? ['N','S'] : ['E','W']
    return declarerSide.includes(t.winner)
  }).length

  // ── FOLLOWING SUIT ──────────────────────────────────────────────
  if (followCards.length > 0) {
    const winFollow = followCards.filter(c => canBeat(c, currentWinner, trumpSuit))

    // SECOND HAND: play low unless we have top of sequence
    if (trick.length === 1) {
      if (isDefender) {
        // Cover an honour with an honour (Jack or higher led)
        const ledCard = trick[0].card
        if (VALUE_RANK[ledCard.value] >= 11) {
          const coverCards = followCards.filter(c => VALUE_RANK[c.value] > VALUE_RANK[ledCard.value])
          if (coverCards.length > 0)
            return coverCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        }
        // Top of solid sequence (KQ, QJ, J10)
        const seq = findTopSequence(followCards)
        if (seq && VALUE_RANK[seq.value] >= 11) return seq
        // Otherwise second hand low
        return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      } else {
        // Declarer second hand: play low to finesse later
        return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    }

    // THIRD HAND: play high (defenders), or cheapest winner (declarer)
    if (trick.length === 2) {
      if (isDefender && !partnerWinning && winFollow.length > 0) {
        // Third hand high — play cheapest winner
        return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
      if (!isDefender && winFollow.length > 0) {
        return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      }
    }

    // FOURTH HAND (last to play): win cheaply if needed
    if (isLastToPlay) {
      if (!partnerWinning && winFollow.length > 0)
        return winFollow.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      if (partnerWinning)
        return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
    }

    // Partner winning — don't overtake, play lowest
    if (partnerWinning)
      return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]

    // Default: play lowest following card
    return followCards.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
  }

  // ── VOID IN LED SUIT ────────────────────────────────────────────

  // FIX: Partner winning — NEVER trump, always discard
  if (partnerWinning) {
    return smartDiscard(hand, legal, trumpSuit, played, trickHistory)
  }

  // Trump if we have them and they're useful
  if (trumpCards.length > 0 && trumpSuit && trumpSuit !== 'NT') {
    const winTrumps = trumpCards.filter(c => canBeat(c, currentWinner, trumpSuit))

    if (winTrumps.length > 0) {
      if (!isDefender) {
        // FIX: Declarer ruffs with LOWEST winning trump (preserve honours)
        return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
      } else {
        // Defender ruffing
        if (isLastToPlay) {
          // Last to play — ruff with lowest winner
          return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        }
        // FIX: Only ruff if we have a meaningful trump (9 or higher to avoid being overruffed)
        // OR if we only have 1-2 trumps (shortness means ruffing is valuable)
        const worthRuffing = winTrumps.filter(c => VALUE_RANK[c.value] >= 9)
        if (worthRuffing.length > 0)
          return worthRuffing.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        if (trumpCards.length <= 2)
          return winTrumps.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
        // Otherwise discard — don't waste low trumps getting overruffed
        return smartDiscard(hand, legal, trumpSuit, played, trickHistory)
      }
    }
  }

  // No winning trump or can't usefully trump — discard
  return smartDiscard(hand, legal, trumpSuit, played, trickHistory)
}

// ─── SMART DISCARD — Improved ─────────────────────────────────────
function smartDiscard(hand, legal, trumpSuit, played, trickHistory) {
  // Never discard a trump if we have non-trumps
  const nonTrumps = legal.filter(c => c.suit !== trumpSuit)
  const candidates = nonTrumps.length > 0 ? nonTrumps : legal

  if (candidates.length === 1) return candidates[0]

  // Score each card: lower = safer to discard
  // Discard from shortest suit with fewest winners
  let worst = null, worstScore = Infinity

  for (const card of candidates) {
    const suitCards = hand.filter(c => c.suit === card.suit)
    const legalSuitCards = candidates.filter(c => c.suit === card.suit)
    const winners = countSolidWinners(suitCards, card.suit, played)

    // Heavily penalise discarding from suits with winners
    // Prefer to discard from suits where we have no winners
    const winnerPenalty = winners > 0 ? winners * 30 : 0
    // Prefer to discard low cards
    const rankScore = VALUE_RANK[card.value]
    // Prefer to discard from short suits (already established or useless)
    const lengthScore = suitCards.length * 2
    // Don't discard from long suits we're establishing
    const establishScore = suitCards.length >= 5 ? 20 : 0

    const score = winnerPenalty + rankScore + lengthScore + establishScore

    if (score < worstScore) { worstScore = score; worst = card }
  }

  return worst || candidates.sort((a,b) => VALUE_RANK[a.value]-VALUE_RANK[b.value])[0]
}

// ─── HELPERS ──────────────────────────────────────────────────────
function findTopSequence(cards) {
  const bySuit = {}
  for (const c of cards) {
    if (!bySuit[c.suit]) bySuit[c.suit] = []
    bySuit[c.suit].push(c)
  }
  let best = null, bestRank = 0
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
    // Prefer long suits with honours
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
    if (play.card.suit === trumpSuit && winner.card.suit !== trumpSuit) winner = play
    else if (play.card.suit === winner.card.suit && VALUE_RANK[play.card.value] > VALUE_RANK[winner.card.value]) winner = play
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

// ─── IMP SCORING ──────────────────────────────────────────────────
const IMP_SCALE = [
  [20, 1], [50, 2], [90, 3], [130, 4], [170, 5],
  [220, 6], [270, 7], [320, 8], [370, 9], [430, 10],
  [500, 11], [600, 12], [750, 13], [900, 14], [1100, 15],
  [1300, 16], [1500, 17], [1750, 18], [2000, 19],
  [2250, 20], [2500, 21], [3000, 22], [3500, 23], [4000, 24]
]

export function pointsToIMPs(diff) {
  const absDiff = Math.abs(diff)
  let imps = 0
  for (const [threshold, imp] of IMP_SCALE) {
    if (absDiff >= threshold) imps = imp
    else break
  }
  return diff >= 0 ? imps : -imps
}

export function calculateIMPScore(contract, tricksMade, vulnerability) {
  if (!contract) return { declarerScore: 0, defenderScore: 0, made: false, imps: 0, rawScore: 0, scoringMode: 'imps' }
  const raw = calculateRubberScore(contract, tricksMade, vulnerability)
  const declSide = (contract.declarer === 'N' || contract.declarer === 'S') ? 'NS' : 'EW'
  const rawNS = declSide === 'NS'
    ? (raw.made ? raw.declarerScore : -raw.defenderScore)
    : (raw.made ? -raw.declarerScore : raw.defenderScore)
  const nsIMPs = pointsToIMPs(rawNS)
  return { ...raw, imps: nsIMPs, rawScore: rawNS, scoringMode: 'imps' }
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
