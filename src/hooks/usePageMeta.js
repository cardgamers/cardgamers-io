// src/hooks/usePageMeta.js
// Updates page title + meta description dynamically per route

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
    title: 'Play Bridge Online Free — Rubber & Duplicate Bridge | CardGamers.io',
    description: 'Play Bridge online free against smart bots. Rubber and Duplicate formats, Standard American bidding, dummy hand revealed. No download needed.',
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
    title: 'Play Solitaire Online Free — Klondike Solitaire | CardGamers.io',
    description: 'Play Klondike Solitaire free online. No ads, no download. Track your moves, time and win streak. Hint system included. Works on mobile and desktop.',
  },
  '/learn/bridge': {
    title: 'How to Play Bridge — Complete Beginner\'s Guide | CardGamers.io',
    description: 'Learn Bridge from scratch. 11 chapters covering bidding, card play, scoring, conventions and strategy. The clearest Bridge guide for beginners online.',
  },
  '/how-to-play': {
    title: 'How to Play Card Games — Bridge, Rummy, Spades & Solitaire | CardGamers.io',
    description: 'Step-by-step guides for every card game on CardGamers.io. Learn Bridge, Rummy, Spades and Solitaire rules and strategy from scratch.',
  },
  '/leaderboard': {
    title: 'Leaderboard — Top Card Game Players | CardGamers.io',
    description: 'See the top ranked players on CardGamers.io. Global rankings for Bridge, Rummy, Spades and Solitaire. Updated in real time.',
  },
  '/upgrade': {
    title: 'Upgrade to Plus — Ad-Free Card Games | CardGamers.io',
    description: 'Go ad-free, unlock hard bots, full game history and private club rooms. CardGamers.io Plus from $6/month.',
  },
  '/about': {
    title: 'About CardGamers.io — Free Online Card Games Platform',
    description: 'CardGamers.io is a free browser-based card game platform. Play Bridge, Rummy, Spades and Solitaire from any device. No download, no sign-up needed to try.',
  },
  '/games': {
    title: 'All Card Games — CardGamers.io',
    description: 'Browse all card games on CardGamers.io. Bridge, Rummy, Spades, Solitaire and more. Free to play, no download needed.',
  },
  '/tournaments': {
    title: 'Card Game Tournaments — CardGamers.io',
    description: 'Compete in Bridge, Rummy and Spades tournaments on CardGamers.io. Test your skills against the best players.',
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

    setMeta('meta[name="description"]',         'content', meta.description)
    setMeta('meta[property="og:title"]',         'content', meta.title)
    setMeta('meta[property="og:description"]',   'content', meta.description)
    setMeta('meta[property="og:url"]',           'content', `https://www.cardgamers.io${path}`)
    setMeta('meta[name="twitter:title"]',        'content', meta.title)
    setMeta('meta[name="twitter:description"]',  'content', meta.description)

    return () => { document.title = DEFAULT_META.title }
  }, [path])
}
