import { useState } from 'react'
import { Link } from 'react-router-dom'

const GAMES = {
  bridge: {
    title: 'How to Play Bridge',
    icon: '♠',
    intro: 'Contract Bridge is widely considered the greatest card game ever invented. It combines skill, strategy, memory, and partnership in a way no other game can match.',
    sections: [
      {
        title: 'The Basics',
        content: 'Bridge is played by 4 players in two partnerships — North/South vs East/West. A standard 52-card deck is used. The goal is to win "tricks" and fulfil a contract you bid for during the auction.'
      },
      {
        title: 'The Deal',
        content: 'Each player receives 13 cards. Cards are ranked A K Q J 10 9 8 7 6 5 4 3 2 (Ace highest). Suits rank Spades > Hearts > Diamonds > Clubs for bidding purposes.'
      },
      {
        title: 'The Auction (Bidding)',
        content: 'Before play begins, players bid to win the contract. A bid states how many tricks above 6 your partnership will win, and in which suit (or No Trump). For example, "2 Hearts" means your side will win at least 8 tricks with Hearts as trumps. Bidding goes clockwise. You can bid higher, double, or pass. Three consecutive passes ends the auction.'
      },
      {
        title: 'Point Count (HCP)',
        content: 'Ace = 4 points, King = 3, Queen = 2, Jack = 1. Count your High Card Points (HCP) to judge your hand strength. 12+ HCP is usually enough to open the bidding. 26 combined HCP with partner typically makes game.'
      },
      {
        title: 'Standard American Opening Bids',
        content: '1NT = 15-17 HCP balanced hand. 1♠/1♥ = 5+ cards in the major, 12-21 HCP. 1♣/1♦ = 3+ cards in the minor, 12-21 HCP. 2♣ = Very strong hand, 22+ HCP. 2♥/2♠/2♦ = Weak two, 6-10 HCP with 6-card suit.'
      },
      {
        title: 'The Play',
        content: 'The player to the left of the declarer makes the opening lead. Declarer\'s partner (the Dummy) then lays their cards face up on the table. Declarer plays both their own hand and the Dummy. Play goes clockwise. You must follow suit if possible. If you can\'t follow suit, you may trump or discard.'
      },
      {
        title: 'Winning Tricks',
        content: 'The highest card of the suit led wins the trick, unless a trump card is played. The winner of each trick leads to the next. After all 13 tricks, count how many your side won.'
      },
      {
        title: 'Scoring',
        content: 'If declarer makes their contract, they score points. Major suit tricks (♥♠) score 30 points each. Minor suit tricks (♣♦) score 20 each. No Trump: 40 for first trick, 30 each after. 100+ points in one hand = Game. Make 3 Games = Rubber. Failing the contract gives defenders penalty points.'
      },
    ],
    tips: [
      'Count your HCP before bidding — 12 is the minimum to open',
      'Support partner\'s major suit with 3+ cards',
      'Lead the top of a sequence against any contract',
      'Second hand plays low, third hand plays high',
      'Draw trumps early as declarer',
      'Count the cards that have been played',
    ]
  },
  rummy: {
    title: 'How to Play Rummy',
    icon: '♥',
    intro: 'Rummy is one of the most popular card games in the world, loved for its combination of luck and strategy. The goal is simple: form your cards into valid sets and runs before your opponent.',
    sections: [
      { title: 'The Basics', content: 'Rummy is played with a standard 52-card deck. In a 2-player game, each player gets 10 cards. The remaining cards form the draw pile with one card face-up as the discard pile.' },
      { title: 'Melds — Sets and Runs', content: 'Sets (also called Groups): Three or four cards of the same rank but different suits. Example: 7♠ 7♥ 7♦. Runs (also called Sequences): Three or more consecutive cards of the same suit. Example: 4♥ 5♥ 6♥ 7♥.' },
      { title: 'On Your Turn', content: 'Each turn has two steps: 1) Draw — pick the top card from the draw pile OR take the top card from the discard pile. 2) Discard — place one card face-up on the discard pile.' },
      { title: 'Winning — Going Out', content: 'When all your cards form valid melds (sets and runs), you can "go out" by discarding your final card. Your opponent scores penalty points equal to the value of their remaining unmelded cards.' },
      { title: 'Knocking', content: 'You can also "knock" when your unmelded cards total 10 points or less. This ends the hand. If your count is lower than your opponent\'s, you win. If your opponent has fewer points, they win (an "undercut").' },
      { title: 'Card Values', content: 'Ace = 1 point, Face cards (J Q K) = 10 points each, Number cards = face value. High cards in your hand when someone goes out cost you points.' },
    ],
    tips: [
      'Draw from the discard pile only if it completes a meld',
      'Keep track of what your opponent is picking up',
      'Discard high unconnected cards early',
      'A run needs at least 3 consecutive cards of the same suit',
      'Knock early if you have a low count — don\'t wait for gin',
      'Watch the discard pile to know what suits to avoid',
    ]
  },
  solitaire: {
    title: 'How to Play Solitaire',
    icon: '♣',
    intro: 'Klondike Solitaire is the classic one-player card game that has entertained people for generations. The goal is to build four foundation piles, one per suit, from Ace to King.',
    sections: [
      { title: 'The Setup', content: '28 cards are dealt into 7 tableau columns. Column 1 has 1 card (face up), column 2 has 2 cards (1 face down, 1 face up), and so on. The remaining 24 cards form the stock pile.' },
      { title: 'The Foundation', content: 'The four foundation slots (top right) need to be built up by suit from Ace to King: A 2 3 4 5 6 7 8 9 10 J Q K. You win when all 52 cards are in the foundations.' },
      { title: 'Moving Cards in the Tableau', content: 'Cards in the tableau columns can be moved onto a card of the opposite color and next higher rank. Red on black, black on red. Example: Black 7 can go on Red 8. Only Kings can be placed on empty columns.' },
      { title: 'The Stock Pile', content: 'Click the face-down stock pile to turn over cards one at a time into the waste pile. The top waste card is available to play. When the stock runs out, click the empty space to reset and go through again.' },
      { title: 'Strategy', content: 'Focus on uncovering face-down cards in the tableau first. Move cards to foundations as soon as possible. Try to build sequences in the tableau to create more options. An empty column is very valuable — use it wisely.' },
    ],
    tips: [
      'Always move Aces and 2s to the foundation immediately',
      'Uncover face-down cards before playing to the foundation',
      'Don\'t empty a column unless you have a King ready',
      'Build tableau sequences down in alternating colours',
      'Go through the stock pile systematically',
      'Use the Undo button if you make a mistake',
    ]
  }
}

export default function HowToPlay() {
  const [activeGame, setActiveGame] = useState('bridge')
  const game = GAMES[activeGame]

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--felt-dark)' }}>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'3rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span className="section-eye">Learn</span>
          <h1 className="display-title" style={{ fontSize:'2.2rem', marginBottom:'0.5rem' }}>How to Play</h1>
          <p style={{ color:'var(--text-muted)' }}>Master the world's greatest card games</p>
        </div>

        {/* Game selector */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'2.5rem', flexWrap:'wrap', justifyContent:'center' }}>
          {Object.entries(GAMES).map(([id, g]) => (
            <button key={id} onClick={() => setActiveGame(id)} style={{
              padding:'0.6rem 1.5rem', borderRadius:8, fontWeight:600, fontSize:'0.95rem',
              background: activeGame===id ? 'var(--gold)' : 'var(--felt-light)',
              border: `2px solid ${activeGame===id ? 'var(--gold)' : 'var(--border)'}`,
              color: activeGame===id ? 'var(--felt-dark)' : 'var(--cream)',
              cursor:'pointer',
            }}>
              {g.icon} {g.title.replace('How to Play ','')}
            </button>
          ))}
        </div>

        {/* Game content */}
        <div key={activeGame}>
          {/* Intro */}
          <div style={{ background:'var(--felt-light)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem 2rem', marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'2.5rem' }}>{game.icon}</span>
              <h2 className="display-title" style={{ fontSize:'1.6rem' }}>{game.title}</h2>
            </div>
            <p style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:'0.95rem' }}>{game.intro}</p>
          </div>

          {/* Sections */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.5rem' }}>
            {game.sections.map((section, i) => (
              <div key={i} style={{ background:'var(--felt-light)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem 1.5rem' }}>
                <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--gold)', marginBottom:'0.5rem' }}>
                  {i+1}. {section.title}
                </h3>
                <p style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:'0.9rem' }}>{section.content}</p>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:12, padding:'1.25rem 1.5rem', marginBottom:'2rem' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--gold)', marginBottom:'0.75rem' }}>💡 Top Tips</h3>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {game.tips.map((tip, i) => (
                <li key={i} style={{ fontSize:'0.88rem', color:'var(--text-muted)', display:'flex', gap:'0.5rem' }}>
                  <span style={{ color:'var(--gold)', flexShrink:0 }}>→</span> {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div style={{ textAlign:'center' }}>
            <Link to={`/game/${activeGame}`} className="btn-gold" style={{ fontSize:'1rem', padding:'0.85rem 2rem', display:'inline-flex' }}>
              {game.icon} Play {game.title.replace('How to Play ','')} Now →
            </Link>
            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'0.75rem' }}>Free to play · No download · Real opponents</p>
          </div>
        </div>
      </div>
    </div>
  )
}
