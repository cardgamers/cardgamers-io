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

export function botBid(hand) {
  let bid = 0;
  for (const card of hand) {
    if (card.suit === '♠') {
      if (card.value >= 10) bid += 1;
      else if (card.value >= 7) bid += 0.5;
    } else {
      if (card.value === 12) bid += 1;
      else if (card.value === 11) bid += 0.75;
      else if (card.value === 10) bid += 0.5;
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
export function botPlay(hand, trick, spadesBroken, myPosition) {
  const valid = getValidCards(hand, trick, spadesBroken);

  // Leading the trick
  if (trick.length === 0) {
    const nonSpades = valid.filter(c => c.suit !== '♠');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
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
