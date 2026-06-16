// src/hooks/usePageMeta.js
import { useEffect } from 'react'

const PAGE_META = {
  '/': {
    title: 'CardGamers.io — Play Bridge, Rummy, Spades & Solitaire Online Free',
    description: 'Play Bridge, Rummy, Spades and Solitaire online free. No download needed. Real opponents, smart bots, live leaderboards. The best free card games platform.',
  },
  '/lobby': {
    title: 'Game Lobby — Choose Your Card Game | CardGamers.io',
    description: 'Pick a card game and start playing instantly. Bridge, Rummy, Spades and Solitaire — free to play, no download, no sign-up required.',
  },
  '/game/bridge': {
    title: 'Play Bridge Online Free — Rubber, Duplicate & IMP Scoring | CardGamers.io',
    description: 'Play Bridge online free against smart bots. Rubber, Duplicate and IMP scoring. Standard American bidding, dummy hand revealed. No download needed.',
  },
  '/game/rummy': {
    title: 'Play Rummy Online Free — Multiplayer Gin Rummy | CardGamers.io',
    description: 'Play Gin Rummy online free against real opponents. Form sets and runs, track your rating, climb the leaderboard. No download needed.',
  },
  '/game/spades': {
    title: 'Play Spades Online Free — Classic Trick-Taking Card Game | CardGamers.io',
    description: 'Play Spades online free. Bid your tricks, play your hand, beat the bots. Classic partnership Spades with full scoring. No download needed.',
  },
  '/game/solitaire': {
    title: 'Play Solitaire Online Free — Klondike Draw 1 & Draw 3 | CardGamers.io',
    description: 'Play Klondike Solitaire free online. Choose Draw 1 or Draw 3 mode. No ads, no download. Hint system, undo, win streak tracking. Works on mobile and desktop.',
  },
  '/learn/bridge-intro': {
    title: 'How to Play Bridge — Rules & Guide | CardGamers.io',
    description: 'Learn how to play Bridge card game with our complete beginner\'s guide. Bidding, tricks, scoring explained simply. Then play free online — no sign-up needed.',
  },
  '/learn/bridge': {
    title: 'Bridge Card Game Guide — Bidding, Conventions & Strategy | CardGamers.io',
    description: 'Master Bridge with our 11-chapter guide. Covers Standard American bidding, card play, scoring, Stayman, Blackwood, slams and defence strategy.',
  },
  '/learn/solitaire': {
    title: 'How to Play Solitaire — Rules & Strategy Guide | CardGamers.io',
    description: 'Learn how to play Klondike Solitaire. Setup, moving cards, Foundation rules, Stock pile strategy and winning tips — explained with visual examples.',
  },
  '/learn/rummy': {
    title: 'How to Play Rummy — Rules & Strategy Guide | CardGamers.io',
    description: 'Learn how to play Gin Rummy. Sets, runs, knocking, deadwood scoring and strategy — everything a beginner needs to start winning at Rummy.',
  },
  '/learn/spades': {
    title: 'How to Play Spades — Rules & Strategy Guide | CardGamers.io',
    description: 'Learn how to play Spades. Trump rules, bidding, Nil bids, bags penalty and winning strategy — the complete beginner\'s guide to Spades card game.',
  },
  '/how-to-play': {
    title: 'How to Play Card Games — Bridge, Rummy, Spades & Solitaire | CardGamers.io',
    description: 'Step-by-step guides for Bridge, Rummy, Spades and Solitaire. Learn the rules and strategy for every card game on CardGamers.io — free to play after.',
  },
  '/leaderboard': {
    title: 'Leaderboard — Top Card Game Players | CardGamers.io',
    description: 'See the top ranked players on CardGamers.io. Global rankings for Bridge, Rummy, Spades and Solitaire. Updated in real time.',
  },
  '/upgrade': {
    title: 'Upgrade to Plus — Ad-Free Card Games | CardGamers.io',
    description: 'Go ad-free, unlock hard bots, full game history and private club rooms. CardGamers.io Plus from $6/month. Cancel anytime.',
  },
  '/about': {
    title: 'About CardGamers.io — Free Online Card Games Platform',
    description: 'CardGamers.io is a free browser-based card game platform. Play Bridge, Rummy, Spades and Solitaire from any device. No download, no sign-up needed to try.',
  },
  '/games': {
    title: 'All Card Games — Bridge, Rummy, Spades & Solitaire | CardGamers.io',
    description: 'Browse all card games on CardGamers.io. Bridge, Rummy, Spades and Solitaire — free to play, no download needed.',
  },
  '/tournaments': {
    title: 'Card Game Tournaments — Bridge, Rummy & Spades | CardGamers.io',
    description: 'Compete in Bridge, Rummy and Spades tournaments on CardGamers.io. Join the waitlist for scheduled events, prize pools and live leaderboards.',
  },
  '/contact': {
    title: 'Contact Us — CardGamers.io',
    description: 'Get in touch with the CardGamers.io team. Questions, feedback or bug reports — we read everything.',
  },
  '/privacy': {
    title: 'Privacy Policy — CardGamers.io',
    description: 'CardGamers.io privacy policy. How we collect, use and protect your data.',
  },
  '/terms': {
    title: 'Terms of Service — CardGamers.io',
    description: 'CardGamers.io terms of service. Rules and conditions for using our platform.',
  },
}

const DEFAULT_META = {
  title: 'CardGamers.io — Play Card Games Online Free',
  description: 'Play Bridge, Rummy, Spades and Solitaire online free. No download needed. Smart bots, real opponents, live leaderboards.',
}

export function usePageMeta(path) {
  useEffect(() => {
    const meta = PAGE_META[path] || DEFAULT_META

    document.title = meta.title

    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector)
      if (el) el.setAttribute(attr, value)
    }

    // Standard meta
    setMeta('meta[name="description"]',        'content', meta.description)

    // Open Graph
    setMeta('meta[property="og:title"]',        'content', meta.title)
    setMeta('meta[property="og:description"]',  'content', meta.description)
    setMeta('meta[property="og:url"]',          'content', `https://www.cardgamers.io${path}`)

    // Twitter
    setMeta('meta[name="twitter:title"]',       'content', meta.title)
    setMeta('meta[name="twitter:description"]', 'content', meta.description)

    // Canonical — update or create
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `https://www.cardgamers.io${path}`)

    return () => { document.title = DEFAULT_META.title }
  }, [path])
}
