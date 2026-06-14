// src/hooks/usePageMeta.js
// Updates page title + meta description dynamically per route
// This helps Google index each game page with the right keywords

import { useEffect } from 'react'

const PAGE_META = {
  '/': {
    title: 'CardGamers.io — Play Bridge, Rummy, Solitaire & Card Games Online Free',
    description: 'Play Bridge, Rummy, Teen Patti, Spades and Solitaire online free. No download needed. Real opponents, bot practice, live tournaments.',
  },
  '/game/solitaire': {
    title: 'Free Solitaire Online — No Download | CardGamers.io',
    description: 'Play Klondike Solitaire free online. No download, no ads. Track your score, moves and time. Hint system included. Works on mobile and desktop.',
  },
  '/game/bridge': {
    title: 'Play Bridge Online Free — Rubber & Duplicate Bridge | CardGamers.io',
    description: 'Play Bridge online free against smart bots. Rubber and Duplicate formats. Standard American bidding. No download needed. Practice anytime.',
  },
  '/game/rummy': {
    title: 'Play Rummy Online Free — Multiplayer Card Game | CardGamers.io',
    description: 'Play Gin Rummy online free against real opponents. Form sets and sequences. No download needed. Works on mobile and desktop.',
  },
  '/game/teen-patti': {
    title: 'Play Teen Patti Online Free — Classic, AK47 & Muflis | CardGamers.io',
    description: 'Play Teen Patti online free. Three variants — Classic, AK47 and Muflis. No download needed. India\'s favourite card game in your browser.',
  },
  '/game/spades': {
    title: 'Play Spades Online Free — Card Game with Bots | CardGamers.io',
    description: 'Play Spades online free against bots. Bid, bluff and take tricks. No download needed. Works on mobile and desktop.',
  },
  '/about': {
    title: 'About CardGamers.io — Free Online Card Games',
    description: 'CardGamers.io is a free browser-based card game platform. Play Bridge, Rummy, Teen Patti, Spades and Solitaire from any device, no download needed.',
  },
  '/games': {
    title: 'All Card Games — CardGamers.io',
    description: 'Browse all card games on CardGamers.io. Bridge, Rummy, Teen Patti, Spades, Solitaire and more. Free to play, no download needed.',
  },
  '/leaderboard': {
    title: 'Leaderboard — CardGamers.io',
    description: 'See the top card game players on CardGamers.io. Rankings for Bridge, Rummy, Teen Patti, Spades and Solitaire.',
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
  description: 'Play Bridge, Rummy, Teen Patti, Spades and Solitaire online free. No download needed.',
}

export function usePageMeta(path) {
  useEffect(() => {
    const meta = PAGE_META[path] || DEFAULT_META

    // Update title
    document.title = meta.title

    // Update description
    let desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', meta.description)

    // Update OG tags
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', meta.title)

    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', meta.description)

    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', `https://www.cardgamers.io${path}`)

    // Update Twitter
    let twTitle = document.querySelector('meta[name="twitter:title"]')
    if (twTitle) twTitle.setAttribute('content', meta.title)

    let twDesc = document.querySelector('meta[name="twitter:description"]')
    if (twDesc) twDesc.setAttribute('content', meta.description)

    // Restore default on unmount
    return () => {
      document.title = DEFAULT_META.title
    }
  }, [path])
}
