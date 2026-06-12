// ─── Bridge Game Engine ───────────────────────────────────────────
// Handles all game logic: dealing, bidding, card play, scoring

export const SUITS = ['C', 'D', 'H', 'S'] // Clubs, Diamonds, Hearts, Spades
export const SUIT_SYMBOLS = { C: '♣', D: '♦', H: '♥', S: '♠' }
export const SUIT_NAMES = { C: 'Clubs', D: 'Diamonds', H: 'Hearts', S: 'Spades' }
export const SUIT_COLORS = { C: '#1a1a2e', D: '#c0392b', H: '#c0392b', S: '#1a1a2e' }
export const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
export const VALUE_RANK = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 }
export const DENOMINATIONS = ['C','D','H','S','NT'] // NT = No Trump
export const DENOM_SYMBOLS = { C:'♣', D:'♦', H:'♥', S:'♠', NT:'NT' }
export const DENOM_COLORS = { C:'#1a1a2e', D:'#c0392b', H:'#c0392b', S:'#1a1a2e', NT:'#1a3a6a' }
export const POSITIONS = ['S','W','N','E'] // South, West, North, East
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

export function isBalanced(hand) {
  const dist = getDistribution(hand)
  const lengths = Object.values(dist).sort((a,b) => b-a)
  // Balanced: 4-3-3-3, 4-4-3-2, 5-3-3-2
  return lengths[0] <= 5 && lengths[3] >= 2
}

// ─── Standard American Bidding Engine ────────────────────────────
export function getBotBid(hand, auction, position, vulnerability) {
  const hcp = countHCP(hand)
  const dist = getDistribution(hand)
  const myBids = auction.filter(b => b.position === position)
  const partnerPos = PARTNERS[position]
  const partnerBids = auction.filter(b => b.position === partnerPos)
  const lastBid = getLastRealBid(auction)
  const passCount = getConsecutivePasses(auction)

  // Opening bid
  if (myBids.length === 0 && !hasOpening(auction, position)) {
    return getOpeningBid(hand, hcp, dist)
  }

  // Response to partner's opening
  if (myBids.length === 0 && partnerBids.length > 0) {
    return getResponseBid(hand, hcp, dist, partnerBids[0], lastBid)
  }

  // Rebid
  if (myBids.length === 1) {
    return getRebid(hand, hcp, dist, myBids[0], partnerBids, lastBid)
  }

  // Default pass
  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getOpeningBid(hand, hcp, dist) {
  if (hcp < 12) return { level: 0, denomination: 'PASS', type: 'pass' }

  // 1NT: 15-17 HCP, balanced
  if (hcp >= 15 && hcp <= 17 && isBalanced(hand)) {
    return { level: 1, denomination: 'NT', type: 'bid' }
  }

  // 2NT: 20-21 HCP, balanced
  if (hcp >= 20 && hcp <= 21 && isBalanced(hand)) {
    return { level: 2, denomination: 'NT', type: 'bid' }
  }

  // 2C: Strong 22+ HCP
  if (hcp >= 22) {
    return { level: 2, denomination: 'C', type: 'bid' }
  }

  // Weak two bids: 6-10 HCP, 6-card suit
  if (hcp >= 6 && hcp <= 10) {
    for (const suit of ['H', 'S', 'D']) {
      if (dist[suit] >= 6) return { level: 2, denomination: suit, type: 'bid' }
    }
  }

  // One of a suit: 12-21 HCP
  // Prefer major suits
  if (dist['S'] >= 5) return { level: 1, denomination: 'S', type: 'bid' }
  if (dist['H'] >= 5) return { level: 1, denomination: 'H', type: 'bid' }
  if (dist['D'] >= 4) return { level: 1, denomination: 'D', type: 'bid' }
  return { level: 1, denomination: 'C', type: 'bid' }
}

function getResponseBid(hand, hcp, dist, partnerOpeningBid, lastBid) {
  if (!partnerOpeningBid) return { level: 0, denomination: 'PASS', type: 'pass' }

  const opening = partnerOpeningBid

  // Response to 1NT (15-17)
  if (opening.level === 1 && opening.denomination === 'NT') {
    if (hcp <= 7) {
      // Stayman or transfer or pass
      if (dist['H'] >= 5) return { level: 2, denomination: 'D', type: 'bid' } // Transfer to hearts
      if (dist['S'] >= 5) return { level: 2, denomination: 'H', type: 'bid' } // Transfer to spades
      return { level: 0, denomination: 'PASS', type: 'pass' }
    }
    if (hcp >= 8 && hcp <= 9) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 10) return { level: 3, denomination: 'NT', type: 'bid' }
  }

  // Response to 1 of a major
  if (opening.level === 1 && (opening.denomination === 'H' || opening.denomination === 'S')) {
    const suit = opening.denomination
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }
    if (dist[suit] >= 3 && hcp >= 6 && hcp <= 9) return { level: 2, denomination: suit, type: 'bid' }
    if (dist[suit] >= 3 && hcp >= 10 && hcp <= 12) return { level: 3, denomination: suit, type: 'bid' }
    if (dist[suit] >= 3 && hcp >= 13) return { level: 4, denomination: suit, type: 'bid' }
    if (hcp >= 6) return { level: 1, denomination: 'NT', type: 'bid' }
  }

  // Response to 1 of a minor
  if (opening.level === 1 && (opening.denomination === 'C' || opening.denomination === 'D')) {
    if (hcp < 6) return { level: 0, denomination: 'PASS', type: 'pass' }
    if (dist['H'] >= 4) return { level: 1, denomination: 'H', type: 'bid' }
    if (dist['S'] >= 4) return { level: 1, denomination: 'S', type: 'bid' }
    if (hcp >= 6 && hcp <= 9) return { level: 1, denomination: 'NT', type: 'bid' }
    if (hcp >= 10 && hcp <= 12) return { level: 2, denomination: 'NT', type: 'bid' }
    if (hcp >= 13) return { level: 3, denomination: 'NT', type: 'bid' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function getRebid(hand, hcp, dist, myOpening, partnerBids, lastBid) {
  // Simple rebid logic
  if (!partnerBids.length) return { level: 0, denomination: 'PASS', type: 'pass' }

  const partnerBid = partnerBids[0]
  if (!partnerBid || partnerBid.type === 'pass') return { level: 0, denomination: 'PASS', type: 'pass' }

  // If partner raised our suit
  if (partnerBid.denomination === myOpening.denomination) {
    if (hcp >= 19) return { level: 4, denomination: myOpening.denomination, type: 'bid' }
    if (hcp >= 16) return { level: 3, denomination: myOpening.denomination, type: 'bid' }
  }

  return { level: 0, denomination: 'PASS', type: 'pass' }
}

function hasOpening(auction, position) {
  return auction.some(b => b.position === position && b.type === 'bid')
}

function getLastRealBid(auction) {
  for (let i = auction.length - 1; i >= 0; i--) {
    if (auction[i].type === 'bid') return auction[i]
  }
  return null
}

function getConsecutivePasses(auction) {
  let count = 0
  for (let i = auction.length - 1; i >= 0; i--) {
    if (auction[i].type === 'pass') count++
    else break
  }
  return count
}

// ─── Bidding validation ───────────────────────────────────────────
export function isValidBid(bid, auction) {
  if (bid.type === 'pass') return true
  if (bid.type === 'double') {
    const last = getLastRealBid(auction)
    return last && last.type === 'bid'
  }
  if (bid.type === 'redouble') {
    const last = getLastRealBid(auction)
    return last && last.type === 'double'
  }

  const lastBid = getLastRealBid(auction)
  if (!lastBid) return true

  const denomOrder = ['C','D','H','S','NT']
  if (bid.level > lastBid.level) return true
  if (bid.level === lastBid.level) {
    return denomOrder.indexOf(bid.denomination) > denomOrder.indexOf(lastBid.denomination)
  }
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

  const declarer = lastBid.position
  const doubled = auction.some(b => b.type === 'double') && !auction.some(b => b.type === 'redouble' && auction.indexOf(b) > auction.findLastIndex(a => a.type === 'double'))
  const redoubled = auction.some(b => b.type === 'redouble')

  return {
    level: lastBid.level,
    denomination: lastBid.denomination,
    declarer,
    doubled,
    redoubled,
    tricksNeeded: lastBid.level + 6,
  }
}

// ─── Card play logic ──────────────────────────────────────────────
export function getLegalCards(hand, trick, trumpSuit) {
  if (trick.length === 0) return hand // Can lead anything

  const ledSuit = trick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)

  if (suitCards.length > 0) return suitCards // Must follow suit
  return hand // Can play anything if void
}

export function getBotCardPlay(hand, trick, trumpSuit, contract, position, trickHistory) {
  const legal = getLegalCards(hand, trick, trumpSuit)
  if (legal.length === 1) return legal[0]

  const isDefender = position === 'E' || position === 'W'

  if (trick.length === 0) {
    // Leading
    if (isDefender) return getBotDefenderLead(legal, trumpSuit, trickHistory)
    return getBotDeclarerLead(legal, trumpSuit, contract)
  }

  // Following
  const ledSuit = trick[0].card.suit
  const winningCard = getCurrentWinner(trick, trumpSuit)
  const partnerWinning = winningCard && PARTNERS[position] === winningCard.position

  if (partnerWinning) {
    // Partner is winning — play low
    return legal.reduce((low, c) => VALUE_RANK[c.value] < VALUE_RANK[low.value] ? c : low)
  }

  // Try to win the trick
  const canWin = legal.filter(c => canBeatTrick(c, trick, trumpSuit))
  if (canWin.length > 0) {
    // Win cheaply
    return canWin.reduce((cheap, c) => VALUE_RANK[c.value] < VALUE_RANK[cheap.value] ? c : cheap)
  }

  // Can't win — play low
  return legal.reduce((low, c) => VALUE_RANK[c.value] < VALUE_RANK[low.value] ? c : low)
}

function getBotDefenderLead(hand, trumpSuit, trickHistory) {
  // Lead top of sequence, or 4th best of longest suit
  const nonTrump = hand.filter(c => c.suit !== trumpSuit)
  if (nonTrump.length > 0) {
    // Find longest suit
    const suits = {}
    for (const c of nonTrump) suits[c.suit] = (suits[c.suit] || 0) + 1
    const longest = Object.entries(suits).sort((a,b) => b[1]-a[1])[0][0]
    const suitCards = nonTrump.filter(c => c.suit === longest).sort((a,b) => VALUE_RANK[b.value]-VALUE_RANK[a.value])
    // 4th best lead (or lowest if < 4 cards)
    return suitCards[Math.min(3, suitCards.length-1)]
  }
  return hand[hand.length - 1]
}

function getBotDeclarerLead(hand, trumpSuit, contract) {
  // Lead towards high cards, draw trumps if trump contract
  if (trumpSuit && trumpSuit !== 'NT') {
    const trumps = hand.filter(c => c.suit === trumpSuit)
    if (trumps.length > 0) return trumps[0] // Lead high trump to draw
  }
  // Lead highest card
  return hand.reduce((high, c) => VALUE_RANK[c.value] > VALUE_RANK[high.value] ? c : high)
}

function getCurrentWinner(trick, trumpSuit) {
  if (trick.length === 0) return null
  let winner = trick[0]
  const ledSuit = trick[0].card.suit

  for (const play of trick) {
    if (play.card.suit === trumpSuit && winner.card.suit !== trumpSuit) {
      winner = play
    } else if (play.card.suit === winner.card.suit && VALUE_RANK[play.card.value] > VALUE_RANK[winner.card.value]) {
      winner = play
    }
  }
  return winner
}

function canBeatTrick(card, trick, trumpSuit) {
  const winner = getCurrentWinner(trick, trumpSuit)
  if (!winner) return true
  if (card.suit === trumpSuit && winner.card.suit !== trumpSuit) return true
  if (card.suit === winner.card.suit && VALUE_RANK[card.value] > VALUE_RANK[winner.card.value]) return true
  return false
}

export function getTrickWinner(trick, trumpSuit) {
  return getCurrentWinner(trick, trumpSuit)
}

// ─── Scoring ──────────────────────────────────────────────────────
export function calculateRubberScore(contract, tricksMade, vulnerability) {
  if (!contract) return { declarerScore: 0, defenderScore: 0 }

  const { level, denomination, doubled, redoubled, declarer } = contract
  const tricksNeeded = level + 6
  const overtricks = tricksMade - tricksNeeded
  const undertricks = tricksNeeded - tricksMade
  const vul = vulnerability[declarer === 'N' || declarer === 'S' ? 'NS' : 'EW']

  if (tricksMade < tricksNeeded) {
    // Defenders score for undertricks
    let penalty = 0
    if (!doubled && !redoubled) {
      penalty = undertricks * (vul ? 100 : 50)
    } else if (doubled) {
      penalty = vul
        ? undertricks === 1 ? 200 : 200 + (undertricks-1) * 300
        : undertricks === 1 ? 100 : undertricks === 2 ? 300 : 300 + (undertricks-2) * 300
    } else if (redoubled) {
      penalty = vul
        ? undertricks === 1 ? 400 : 400 + (undertricks-1) * 600
        : undertricks === 1 ? 200 : undertricks === 2 ? 600 : 600 + (undertricks-2) * 600
    }
    return { declarerScore: 0, defenderScore: penalty, made: false }
  }

  // Contract made — calculate trick score
  let trickScore = 0
  const multiplier = redoubled ? 4 : doubled ? 2 : 1

  if (denomination === 'NT') {
    trickScore = (40 + (level - 1) * 30) * multiplier
  } else if (denomination === 'S' || denomination === 'H') {
    trickScore = level * 30 * multiplier
  } else {
    trickScore = level * 20 * multiplier
  }

  // Game/part score bonus
  let bonus = 0
  const isGame = trickScore >= 100
  if (isGame) {
    bonus += vul ? 500 : 300
  } else {
    bonus += 50 // Part score bonus
  }

  // Slam bonuses
  if (level === 6) bonus += vul ? 750 : 500 // Small slam
  if (level === 7) bonus += vul ? 1500 : 1000 // Grand slam

  // Double/redouble bonus
  if (doubled) bonus += 50
  if (redoubled) bonus += 100

  // Overtrick score
  let overtrickScore = 0
  if (overtricks > 0) {
    if (!doubled && !redoubled) {
      overtrickScore = overtricks * (denomination === 'NT' || denomination === 'S' || denomination === 'H' ? 30 : 20)
    } else if (doubled) {
      overtrickScore = overtricks * (vul ? 200 : 100)
    } else {
      overtrickScore = overtricks * (vul ? 400 : 200)
    }
  }

  return {
    declarerScore: trickScore + bonus + overtrickScore,
    defenderScore: 0,
    made: true,
    trickScore,
    bonus,
    overtrickScore,
    isGame,
  }
}

export function calculateDuplicateScore(contract, tricksMade, vulnerability) {
  // Duplicate uses same scoring but no rubber bonus
  const result = calculateRubberScore(contract, tricksMade, vulnerability)
  return result
}

// ─── Game state factory ───────────────────────────────────────────
export function createBridgeGame(mode, playerPosition, difficulty, botNames) {
  const hands = dealHands()
  const dealer = POSITIONS[Math.floor(Math.random() * 4)]

  return {
    mode, // 'rubber' or 'duplicate'
    playerPosition, // 'S' (human always South)
    difficulty,
    botNames: botNames || { N: 'Alex', E: 'Sam', W: 'Jordan' },
    hands,
    dealer,
    phase: 'bidding', // bidding | playing | complete
    auction: [],
    currentBidder: dealer,
    contract: null,
    currentTrick: [],
    tricks: { NS: 0, EW: 0 },
    trickHistory: [],
    currentLeader: null,
    score: { NS: 0, EW: 0 },
    rubberScore: { NS: [[], []], EW: [[], []] }, // Two game columns
    gamesWon: { NS: 0, EW: 0 },
    vulnerability: { NS: false, EW: false },
    handNumber: 1,
    dummy: null, // Position of dummy (partner of declarer)
    dummyRevealed: false,
  }
}
