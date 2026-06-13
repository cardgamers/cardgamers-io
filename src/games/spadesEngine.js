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

export function botPlay(hand, trick, spadesBroken) {
  const valid = getValidCards(hand, trick, spadesBroken);
  if (trick.length === 0) {
    const nonSpades = valid.filter(c => c.suit !== '♠');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    return pool.reduce((a, b) => a.value < b.value ? a : b);
  }
  const ledSuit = trick[0].card.suit;
  const following = valid.filter(c => c.suit === ledSuit);
  const spades = valid.filter(c => c.suit === '♠');
  const currentWinner = trickWinner(trick);
  const partnerWinning = currentWinner % 2 === 1;
  if (partnerWinning) {
    return valid.reduce((a, b) => a.value < b.value ? a : b);
  }
  if (following.length > 0) {
    const winning = following.filter(c => c.value > trick.reduce((m, t) =>
      t.card.suit === ledSuit ? Math.max(m, t.card.value) : m, -1));
    if (winning.length > 0) return winning.reduce((a, b) => a.value < b.value ? a : b);
    return following.reduce((a, b) => a.value < b.value ? a : b);
  }
  if (spades.length > 0) return spades.reduce((a, b) => a.value < b.value ? a : b);
  return valid.reduce((a, b) => a.value < b.value ? a : b);
}