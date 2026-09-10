export const SUITS = ['♠','♥','♦','♣'];
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, value: RANKS.indexOf(rank) });
  return deck;
}

export function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function dealHands(deck) {
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}

export function sortHand(hand) {
  return [...hand].sort((a, b) => {
    if (a.suit === b.suit) return b.value - a.value;
    const order = ['♠','♥','♦','♣'];
    return order.indexOf(a.suit) - order.indexOf(b.suit);
  });
}

export function botBid(hand, difficulty = 'medium') {
  let bid = 0;
  const spades = hand.filter(c => c.suit === '♠');
  const nonSpades = hand.filter(c => c.suit !== '♠');

  for (const card of hand) {
    if (card.suit === '♠') {
      if (card.value === 12) bid += 1;       // Ace of spades — certain trick
      else if (card.value === 11) bid += 1;  // King — nearly certain
      else if (card.value === 10) bid += 0.85; // Queen
      else if (card.value === 9) bid += 0.6;  // Jack
      else if (card.value >= 7) bid += 0.4;   // 9-10
      else if (card.value >= 5 && spades.length >= 5) bid += 0.3; // long spades
    } else {
      if (card.value === 12) bid += 1;         // Ace — certain
      else if (card.value === 11) bid += 0.85; // King — near certain
      else if (card.value === 10) bid += 0.55; // Queen
      else if (card.value === 9) bid += 0.3;   // Jack with length
    }
  }

  // Hard difficulty: adjust for voids (ruffing potential) and long suits
  if (difficulty === 'hard') {
    const suitCounts = {};
    for (const c of hand) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    for (const [suit, count] of Object.entries(suitCounts)) {
      if (suit !== '♠') {
        if (count === 0) bid += 1.5;  // void — can ruff freely
        else if (count === 1) bid += 0.75; // singleton
        else if (count === 2) bid += 0.3;  // doubleton
        if (count >= 5) bid += 0.5;        // long suit likely establishes
      }
    }
    // Hard bots don't overbid — subtract a little for accuracy
    bid -= 0.3;
  }

  // Easy difficulty: underbid slightly (conservative, less accurate)
  if (difficulty === 'easy') {
    bid -= 0.5;
  }

  // Nil bid logic — bid nil on very weak hands
  if (difficulty !== 'easy') {
    const spades = hand.filter(c => c.suit === '♠')
    const hasHighSpade = spades.some(c => c.value >= 9) // Q or higher
    const hasHighNonSpade = hand.filter(c => c.suit !== '♠').some(c => c.value >= 11) // K or higher
    const roundedBid = Math.round(bid)
    // Bid nil if hand is very weak (expected tricks ≤ 1) and no dangerous high cards
    if (roundedBid <= 1 && !hasHighSpade && !hasHighNonSpade && difficulty === 'hard') {
      return 0 // nil bid
    }
  }

  return Math.max(1, Math.round(bid));
}

export function getValidCards(hand, trick, spadesBroken) {
  if (trick.length === 0) {
    const nonSpades = hand.filter(c => c.suit !== '♠');
    return spadesBroken || nonSpades.length === 0 ? hand : nonSpades;
  }
  const ledSuit = trick[0].card.suit;
  const following = hand.filter(c => c.suit === ledSuit);
  return following.length > 0 ? following : hand;
}

export function trickWinner(trick) {
  const ledSuit = trick[0].card.suit;
  let best = trick[0];
  for (const t of trick) {
    const c = t.card;
    const b = best.card;
    if (c.suit === '♠' && b.suit !== '♠') { best = t; continue; }
    if (c.suit !== '♠' && b.suit === '♠') continue;
    if (c.suit === b.suit && c.value > b.value) best = t;
    else if (c.suit !== ledSuit && b.suit === ledSuit) continue;
    else if (c.suit === ledSuit && b.suit !== ledSuit) best = t;
  }
  return best.player;
}

export function calcTeamScore(bids, tricks) {
  const teamBid = bids[0] + bids[1];
  const teamTricks = tricks[0] + tricks[1];
  if (teamTricks >= teamBid) {
    const bags = teamTricks - teamBid;
    return teamBid * 10 + bags;
  }
  return -(teamBid * 10);
}

// ─── Helper: who is winning the trick right now, and with what card ──
function currentWinnerInfo(trick) {
  if (!trick.length) return null
  const ledSuit = trick[0].card.suit
  let best = trick[0]
  for (const t of trick) {
    const c = t.card, b = best.card
    if (c.suit === '♠' && b.suit !== '♠') { best = t; continue }
    if (c.suit !== '♠' && b.suit === '♠') continue
    if (c.suit === b.suit && c.value > b.value) best = t
  }
  return best
}

// Is `player` on the same team as the player whose turn it currently is?
// Teams: 0&2 (You/Partner), 1&3 (West/East)
function isPartner(playerA, playerB) {
  return (playerA % 2) === (playerB % 2)
}

// ─── Improved bot card play ─────────────────────────────────────────
export function botPlay(hand, trick, spadesBroken, myPosition, difficulty = 'medium', playedCards = []) {
  const valid = getValidCards(hand, trick, spadesBroken);

  // Nil protection — if we know our partner bid nil, protect them
  // (partnerNilBid parameter can be passed from game state)
  // This is handled by the caller passing context

  // Leading the trick
  if (trick.length === 0) {
    const nonSpades = valid.filter(c => c.suit !== '♠');
    const pool = nonSpades.length > 0 ? nonSpades : valid;

    if (difficulty === 'hard') {
      // Hard: lead Aces first to cash winners, then establish long suits
      const aces = pool.filter(c => c.value === 12);
      if (aces.length > 0) return aces[0];
      // Lead from longest non-spade suit to establish winners
      const suitGroups = {};
      for (const c of pool) suitGroups[c.suit] = (suitGroups[c.suit] || []).concat(c);
      const longestSuit = Object.values(suitGroups).sort((a,b) => b.length - a.length)[0];
      if (longestSuit && longestSuit.length >= 4) {
        return longestSuit.reduce((a,b) => a.value > b.value ? a : b); // lead high from long suit
      }
    }
    return pool.reduce((a, b) => a.value < b.value ? a : b);
  }

  const ledSuit = trick[0].card.suit;
  const following = valid.filter(c => c.suit === ledSuit);
  const spades = valid.filter(c => c.suit === '♠');
  const winnerInfo = currentWinnerInfo(trick);
  const position = myPosition !== undefined ? myPosition : trick.length; // fallback estimate
  const partnerWinning = winnerInfo && isPartner(winnerInfo.player, position);
  const isLastToPlay = trick.length === 3;

  // ── Following suit (have cards in the led suit) ──
  if (following.length > 0) {
    // Partner is already winning — don't waste a high card, play low
    if (partnerWinning) {
      return following.reduce((a, b) => a.value < b.value ? a : b);
    }
    // Try to win with the cheapest card that beats the current winner
    const highestInSuit = trick.reduce((m, t) =>
      t.card.suit === ledSuit ? Math.max(m, t.card.value) : m, -1);
    const winningCards = following.filter(c => c.value > highestInSuit);
    if (winningCards.length > 0) {
      // Last to play — always take cheapest winner. Otherwise also fine to win cheaply.
      return winningCards.reduce((a, b) => a.value < b.value ? a : b);
    }
    // Can't win — play lowest
    return following.reduce((a, b) => a.value < b.value ? a : b);
  }

  // ── Void in led suit ──

  // FIX: Partner is winning — never trump over partner, just discard
  if (partnerWinning) {
    const nonSpades = valid.filter(c => c.suit !== '♠');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    return pool.reduce((a, b) => a.value < b.value ? a : b);
  }

  // We have spades and the trick isn't already won by partner — consider trumping
  if (spades.length > 0) {
    // Is there already a spade played in this trick? If so, we need to beat it.
    const spadesInTrick = trick.filter(t => t.card.suit === '♠');
    const highestSpadeInTrick = spadesInTrick.length
      ? Math.max(...spadesInTrick.map(t => t.card.value))
      : -1;

    const winningSpades = spades.filter(c => c.value > highestSpadeInTrick);

    if (winningSpades.length === 0) {
      // Our spades can't beat what's already there — don't bother trumping, discard instead
      const nonSpades = valid.filter(c => c.suit !== '♠');
      const pool = nonSpades.length > 0 ? nonSpades : valid;
      return pool.reduce((a, b) => a.value < b.value ? a : b);
    }

    // FIX: If we're last to play, just play the cheapest winning spade — guaranteed win
    if (isLastToPlay) {
      return winningSpades.reduce((a, b) => a.value < b.value ? a : b);
    }

    // FIX: Not last to play — players after us could still overtrump.
    // Only commit a trump if it's a genuinely strong one (J or higher),
    // OR if we have very few spades left (shortness makes ruffing valuable regardless).
    const strongSpades = winningSpades.filter(c => c.value >= 9); // J=9 in 0-indexed RANKS array... let's check
    if (strongSpades.length > 0) {
      return strongSpades.reduce((a, b) => a.value < b.value ? a : b);
    }
    if (spades.length <= 2) {
      return winningSpades.reduce((a, b) => a.value < b.value ? a : b);
    }
    // Otherwise — too risky to commit a mid-value trump that could be overtrumped. Discard instead.
    const nonSpades = valid.filter(c => c.suit !== '♠');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    return pool.reduce((a, b) => a.value < b.value ? a : b);
  }

  // No spades, no following cards — discard lowest
  return valid.reduce((a, b) => a.value < b.value ? a : b);
}
