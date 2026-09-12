// ─── Gin Rummy Engine ─────────────────────────────────────────────
export const SUITS = ['S', 'H', 'D', 'C']
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const VALUE_RANK = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 10, Q: 10, K: 10 }
export const VALUE_IDX = { A: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, J: 10, Q: 11, K: 12 }

export function createDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ id: `${value}${suit}`, suit, value, rank: VALUE_RANK[value], idx: VALUE_IDX[value] })
  return deck
}

export function shuffle(deck) {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function dealGame() {
  const deck = shuffle(createDeck())
  return {
    playerHand: deck.slice(0, 10),
    botHand: deck.slice(10, 20),
    stock: deck.slice(21),
    discard: [deck[20]],
    phase: 'player-draw', // player-draw | player-discard | bot-turn | showdown | game-over
    turn: 0,
    drawnFrom: null, // 'stock' | 'discard'
    drawn: null, // card just drawn
    message: 'Draw a card to start',
    winner: null,
    playerMelds: [],
    botMelds: [],
    knocker: null,
    scores: { player: 0, bot: 0 },
  }
}

// ─── Meld detection ───────────────────────────────────────────────
export function isValidSet(cards) {
  if (cards.length < 3 || cards.length > 4) return false
  const val = cards[0].value
  return cards.every(c => c.value === val) && new Set(cards.map(c => c.suit)).size === cards.length
}

export function isValidRun(cards) {
  if (cards.length < 3) return false
  const suit = cards[0].suit
  if (!cards.every(c => c.suit === suit)) return false
  const sorted = [...cards].sort((a, b) => a.idx - b.idx)
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i].idx !== sorted[i - 1].idx + 1) return false
  return true
}

export function isValidMeld(cards) {
  return isValidSet(cards) || isValidRun(cards)
}

// Find all possible melds in a hand
export function findMelds(hand) {
  const melds = []

  // Find sets
  const byValue = {}
  for (const c of hand) {
    if (!byValue[c.value]) byValue[c.value] = []
    byValue[c.value].push(c)
  }
  for (const cards of Object.values(byValue)) {
    if (cards.length >= 3) {
      melds.push([...cards.slice(0, 3)])
      if (cards.length === 4) melds.push([...cards])
    }
  }

  // Find runs
  const bySuit = {}
  for (const c of hand) {
    if (!bySuit[c.suit]) bySuit[c.suit] = []
    bySuit[c.suit].push(c)
  }
  for (const cards of Object.values(bySuit)) {
    const sorted = [...cards].sort((a, b) => a.idx - b.idx)
    for (let start = 0; start < sorted.length; start++) {
      for (let end = start + 2; end < sorted.length; end++) {
        const slice = sorted.slice(start, end + 1)
        if (isValidRun(slice)) melds.push(slice)
      }
    }
  }

  return melds
}

// Find the best arrangement of melds to minimize deadwood
export function bestMeldArrangement(hand) {
  const melds = findMelds(hand)

  function tryArrangements(remaining, usedCards, currentMelds) {
    let best = { melds: currentMelds, deadwood: deadwoodValue(remaining) }

    for (const meld of melds) {
      if (meld.some(c => usedCards.has(c.id))) continue
      const newUsed = new Set([...usedCards, ...meld.map(c => c.id)])
      const newRemaining = remaining.filter(c => !newUsed.has(c.id))
      const result = tryArrangements(newRemaining, newUsed, [...currentMelds, meld])
      if (result.deadwood < best.deadwood) best = result
    }

    return best
  }

  return tryArrangements(hand, new Set(), [])
}

export function deadwoodValue(cards) {
  return cards.reduce((sum, c) => sum + c.rank, 0)
}

export function deadwoodCards(hand) {
  const { melds } = bestMeldArrangement(hand)
  const meldCardIds = new Set(melds.flat().map(c => c.id))
  return hand.filter(c => !meldCardIds.has(c.id))
}

// ─── Bot AI ───────────────────────────────────────────────────────
export function botDecideAction(botHand, topDiscard, difficulty = 'medium') {
  // Should bot draw from discard?
  const withDiscard = [...botHand, topDiscard]
  const currentDW = bestMeldArrangement(botHand).deadwood
  const discardDW = bestMeldArrangement(withDiscard).deadwood

  // Draw from discard if it reduces deadwood by at least 2
  const drawFromDiscard = discardDW < currentDW - 1

  return { drawFromDiscard }
}

export function botChooseDiscard(botHand, difficulty = 'medium') {
  const { melds, deadwood } = bestMeldArrangement(botHand)
  const meldCardIds = new Set(melds.flat().map(c => c.id))
  const deadwoodCards = botHand.filter(c => !meldCardIds.has(c.id))

  if (deadwoodCards.length === 0) {
    // All cards in melds — discard lowest meld card
    return botHand.reduce((a, b) => a.rank < b.rank ? a : b)
  }

  // Discard highest deadwood card
  return deadwoodCards.reduce((a, b) => a.rank > b.rank ? a : b)
}

export function botShouldKnock(botHand) {
  const { deadwood } = bestMeldArrangement(botHand)
  return deadwood <= 10
}

export function botShouldGin(botHand) {
  const { deadwood } = bestMeldArrangement(botHand)
  return deadwood === 0
}

// ─── Scoring ──────────────────────────────────────────────────────
export function calcScore(knockerHand, opponentHand, isGin) {
  const knockerDW = bestMeldArrangement(knockerHand).deadwood
  const opponentDW = bestMeldArrangement(opponentHand).deadwood

  if (isGin) {
    return { knockerScore: 25 + opponentDW, opponentScore: 0, result: 'gin' }
  }

  if (opponentDW <= knockerDW) {
    // Undercut
    return { knockerScore: 0, opponentScore: 25 + (knockerDW - opponentDW), result: 'undercut' }
  }

  return { knockerScore: opponentDW - knockerDW, opponentScore: 0, result: 'knock' }
}
