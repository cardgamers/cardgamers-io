import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const chapters = [
  {
    id: 'what-is-bridge',
    num: '01',
    title: 'What is Bridge?',
    sections: [
      {
        heading: 'The Game in One Paragraph',
        content: `Bridge is a trick-taking card game for four players split into two partnerships. You and your partner sit opposite each other and work together to win tricks — rounds where each player plays one card. Before the cards are played, both sides go through a bidding phase called the auction, where you and your partner exchange coded messages about your hands to agree on how many tricks you'll try to win. The side that bids highest becomes the declaring side and must fulfil their promise. The other side tries to stop them.`,
      },
      {
        heading: 'Why Bridge is Different',
        content: `Most card games are about the cards you're dealt. Bridge is about what you do with them. The bidding system means you're constantly communicating with your partner using a shared language of bids. The card play involves planning, counting, and inference. Bridge players say the game takes five minutes to learn and a lifetime to master — and they mean it as a compliment.`,
      },
      {
        heading: 'The Table Setup',
        content: `Four players sit around a table and are referred to by compass points: North, South, East, and West. North and South are partners. East and West are partners. Partners sit opposite each other. One player is designated the Dealer for each hand — this rotates clockwise after every deal.`,
      },
      {
        heading: 'The Deck',
        content: `Bridge uses a standard 52-card deck with no jokers. Cards rank from highest to lowest: Ace, King, Queen, Jack, 10, 9, 8, 7, 6, 5, 4, 3, 2. The four suits are Spades (♠), Hearts (♥), Diamonds (♦), and Clubs (♣). Suits also have a rank in Bridge — from highest to lowest: Spades, Hearts, Diamonds, Clubs. This ranking matters during bidding.`,
      },
    ],
  },
  {
    id: 'the-deal',
    num: '02',
    title: 'The Deal and Your Hand',
    sections: [
      {
        heading: 'Dealing the Cards',
        content: `The Dealer shuffles the deck and deals all 52 cards one at a time, face down, clockwise starting with the player to their left. Each player receives exactly 13 cards. Pick up your cards and sort them by suit — most players arrange them alternating red and black suits (e.g. Spades, Hearts, Diamonds, Clubs) from left to right.`,
      },
      {
        heading: 'Counting High Card Points (HCP)',
        content: `Before you can bid intelligently, you need to assess the strength of your hand. Bridge players use a simple point-count system:\n\nAce = 4 points\nKing = 3 points\nQueen = 2 points\nJack = 1 point\n\nCount up the points in your hand. This number is your High Card Points (HCP). The entire deck contains 40 HCP. An average hand has 10 HCP. A hand with 12 or more HCP is generally strong enough to open the bidding.`,
      },
      {
        heading: 'Distribution Points',
        content: `Beyond high cards, the shape of your hand matters. A hand with a long suit (6+ cards) or a very short suit (void or singleton) is more powerful than its HCP suggest. As you get more experienced, you'll add distribution points: a void (no cards in a suit) = 3 points, a singleton (one card) = 2 points, a doubleton (two cards) = 1 point. Beginners can ignore these for now and focus on HCP.`,
      },
      {
        heading: 'What Makes a Good Hand?',
        content: `A hand with 12+ HCP is an opening hand. A hand with 6-11 HCP is a responding hand — not strong enough to open, but worth bidding if your partner opens first. A hand with 0-5 HCP is a weak hand — you'll usually pass. The key insight: your partnership's combined HCP determines what contract you can make. 25+ points together usually makes a Game. 33+ points can make a Small Slam (12 tricks). 37+ points can make a Grand Slam (all 13 tricks).`,
      },
    ],
  },
  {
    id: 'the-auction',
    num: '03',
    title: 'The Auction — How Bidding Works',
    sections: [
      {
        heading: 'What is a Bid?',
        content: `A bid is a promise. When you bid "2 Hearts," you're promising that your partnership will win at least 8 tricks (6 + 2) with Hearts as the trump suit. Every bid has two parts: a number (1 through 7) and a denomination (Clubs, Diamonds, Hearts, Spades, or No Trump). The number tells your partner how many tricks above six you expect to win. The denomination tells them your preferred trump suit — or that you want to play with no trump suit at all.`,
      },
      {
        heading: 'The Order of Bidding',
        content: `The auction starts with the Dealer and proceeds clockwise. On your turn you can:\n\nBid — name a contract higher than the current highest bid\nPass — decline to bid (say "Pass")\nDouble — challenge the opponents' bid, increasing the stakes\nRedouble — respond to a double, raising the stakes further\n\nThe auction ends when three consecutive players pass after any bid (or when all four players pass on the first round, which results in a redeal).`,
      },
      {
        heading: 'How Bids Rank',
        content: `Bids must always be higher than the previous bid. A higher bid means either a higher number, or the same number in a higher-ranking denomination. The ranking from lowest to highest is: Clubs, Diamonds, Hearts, Spades, No Trump. So 1♠ is higher than 1♥, and 2♣ is higher than 1NT. You cannot bid 1♥ after someone has already bid 1♠ — you would need to bid at least 2♥.`,
      },
      {
        heading: 'The Contract',
        content: `When the auction ends, the final bid becomes the contract. The partnership that made the highest bid becomes the declaring side. The player who first named the winning denomination for their side becomes the Declarer. Their partner becomes the Dummy. The contract tells you exactly what the Declarer must achieve: for example, 3NT means winning at least 9 tricks with no trump suit.`,
      },
      {
        heading: 'What is Trump?',
        content: `The trump suit is a "super suit" that beats every card in every other suit. If Hearts is trump and you can't follow the suit led, you can play a Heart to win the trick — even the 2♥ beats the Ace of any non-trump suit. If two trump cards are played to the same trick, the higher trump wins. In a No Trump (NT) contract, there is no trump suit — the highest card in the suit led always wins the trick.`,
      },
    ],
  },
  {
    id: 'opening-bids',
    num: '04',
    title: 'Opening Bids — Starting the Conversation',
    sections: [
      {
        heading: 'When to Open',
        content: `You open the bidding (make the first bid) when you have 12 or more High Card Points. With fewer than 12 HCP, you usually pass and let your partner open if they can. Opening the bidding tells your partner immediately that you have a reasonably strong hand.`,
      },
      {
        heading: 'Opening 1 of a Suit',
        content: `With 12-21 HCP and a suit of 4 or more cards, open at the one level in your longest suit. With two suits of equal length, open the higher-ranking one if they're both majors (Spades/Hearts) or both minors (Diamonds/Clubs). With 5+ Spades or Hearts, always open your major suit first — finding a major suit fit is the priority in Standard American bidding.\n\nExamples:\n♠ AK75 ♥ Q82 ♦ KJ3 ♣ 974 → Open 1♠ (12 HCP, 4-card Spade suit)\n♠ 83 ♥ AQJ65 ♦ AK4 ♣ 932 → Open 1♥ (14 HCP, 5-card Heart suit)`,
      },
      {
        heading: 'Opening 1 No Trump (1NT)',
        content: `Open 1NT with 15-17 HCP and a balanced hand. A balanced hand has no void (zero cards in a suit), no singleton (one card), and no more than one doubleton (two cards). The ideal shapes are 4-3-3-3, 4-4-3-2, or 5-3-3-2. Opening 1NT is very descriptive — your partner knows your HCP within a 3-point range and knows your hand is balanced. This precision makes 1NT openings very powerful.`,
      },
      {
        heading: 'Strong 2 Clubs Opening',
        content: `Open 2♣ with 22+ HCP or any hand powerful enough to make game (10 tricks in a major, 11 in a minor, or 9 in NT) almost on your own. This is the strongest opening bid in Bridge and is completely artificial — it says nothing about your Club suit. It simply shouts "I have an enormous hand." Your partner must respond (even with zero points) and the auction continues until game is at least reached.`,
      },
      {
        heading: 'Preemptive Openings',
        content: `Open at the 2, 3, or 4 level with a long suit (6-8 cards) but a weak hand (6-10 HCP). This is called a preemptive bid. Its purpose is to use up the opponents' bidding space before they can find their best contract. Opening 3♥ means "I have a 7-card Heart suit and a weak hand — compete or get out of the way." Preempts are a double-edged sword: they disrupt the opponents but also tie your partner's hands.`,
      },
    ],
  },
  {
    id: 'responding',
    num: '05',
    title: 'Responding to Partner\'s Opening Bid',
    sections: [
      {
        heading: 'Your Job as Responder',
        content: `When your partner opens, your job is to help reach the best contract. You need to tell partner about your hand strength and your suit preferences. The bidding system is a two-way conversation — opener describes their hand first, responder narrows it down, and together you find your ideal contract. Never panic with a weak hand. Pass is always an option.`,
      },
      {
        heading: 'Responding to 1 of a Suit',
        content: `With 0-5 HCP: Pass. Your combined points probably don't reach game.\nWith 6-9 HCP (weak): Bid 1NT or raise partner's suit to the two-level with 3+ card support.\nWith 10-12 HCP (invitational): Jump to 2NT or raise partner's suit to the three-level. You're inviting game but not forcing it.\nWith 13+ HCP (game-forcing): Bid a new suit at the one level, jump to 3NT, or raise partner's major suit to game (4♥ or 4♠).`,
      },
      {
        heading: 'The Magic Number: 26 Points',
        content: `The golden rule of Bridge bidding: 25-26 combined points usually makes a Game contract (3NT, 4♥, or 4♠). When you and your partner together know you have at least 25 points, you should bid to game. When you're unsure, make an invitational bid. When you know you're short, stay low. Everything in Bridge bidding flows from this fundamental principle.`,
      },
      {
        heading: 'Responding to 1NT',
        content: `Opener has shown 15-17 HCP balanced. Now you do the maths:\n0-7 points: Pass or bid 2♣ (Stayman) to look for a major fit.\n8-9 points: Invite game with 2NT.\n10+ points: Bid 3NT (or use Stayman/Jacoby Transfers to find a major suit fit).\n\nStayman (2♣): Asks opener "do you have a 4-card major?" Opener bids 2♥, 2♠, or 2♦ (no major). Essential convention to learn early.`,
      },
      {
        heading: 'Raising Partner\'s Suit',
        content: `Supporting partner's suit is the most natural response. To raise from 1♥ to 2♥ you need 3+ Hearts and 6-9 HCP. To raise to 3♥ (invitational) you need 4+ Hearts and 10-12 HCP. To jump to game (4♥) you need 4+ Hearts and 13+ HCP, or a very distributional hand with less. Finding an 8-card major suit fit (your 4 + partner's 4, or your 3 + partner's 5) is the holy grail of Bridge bidding — it usually produces the best results.`,
      },
    ],
  },
  {
    id: 'play-of-the-hand',
    num: '06',
    title: 'Playing the Hand',
    sections: [
      {
        heading: 'The Opening Lead',
        content: `Once the auction ends, the player to the left of the Declarer makes the opening lead — they play the first card face-up to start the first trick. This happens before the Dummy hand is revealed. The opening lead is one of the most important moments in Bridge. Defenders typically lead the top of a sequence (KQJ, QJ10) or fourth-highest from their longest and strongest suit. Never lead away from an Ace against a suit contract — it almost always costs a trick.`,
      },
      {
        heading: 'The Dummy',
        content: `After the opening lead, Declarer's partner (the Dummy) lays all their cards face-up on the table, sorted by suit. The Dummy takes no further part in the hand — Declarer plays both hands. The Dummy's cards are visible to everyone. This is one of Bridge's unique features: it gives Declarer complete information about their own side's cards and turns the problem into a planning exercise.`,
      },
      {
        heading: 'Winning Tricks',
        content: `Each trick consists of four cards, one from each player, played clockwise. The player who leads plays first. Other players must follow suit — play a card in the same suit as the card led. If you can't follow suit, you may play any card (including a trump). The highest card in the suit led wins the trick, unless a trump card is played, in which case the highest trump wins. The winner of each trick leads to the next trick.`,
      },
      {
        heading: 'Declarer\'s Plan',
        content: `Before playing a single card, Declarer should make a plan. Count your winners — tricks you can win without giving up the lead. Count your losers — tricks you'll probably lose. In a NT contract, plan how to develop extra tricks by establishing long suits. In a suit contract, plan how to handle your losers: can you ruff (trump) them in the Dummy? Can you discard them on Dummy's long suit? The best declarers plan the whole hand in the first 30 seconds.`,
      },
      {
        heading: 'The Hold-Up Play',
        content: `A classic declarer technique in NT contracts: if the opponents lead a long suit, don't win the trick immediately. "Hold up" — let them win the first one (or two). This exhausts the dangerous defender's cards in that suit. If they eventually win a trick and lead the suit again, their partner (who may now have won entries to their hand) has none left to return. The hold-up separates a dangerous defender from their partner.`,
      },
    ],
  },
  {
    id: 'defense',
    num: '07',
    title: 'Defense — Stopping the Contract',
    sections: [
      {
        heading: 'The Defenders\' Goal',
        content: `Defenders win the hand by taking enough tricks to prevent Declarer from making their contract. If the contract is 4♠ (10 tricks needed), the defenders need just 4 tricks to defeat it. Defense is harder than declaring because partners can't see each other's hands — you must infer each other's holdings from the bidding and the cards played.`,
      },
      {
        heading: 'Signals',
        content: `Defenders communicate through the cards they play. The two most important signals are:\n\nAttitude: Playing a high card in a suit (when following or discarding) shows you like that suit. A low card shows you dislike it.\nCount: Play high-low (first a high card, then lower) to show an even number of cards in a suit. Play low then high to show an odd number.\n\nThese signals help your partner know what to lead when they win a trick.`,
      },
      {
        heading: 'Leading Against NT',
        content: `The standard lead against No Trump is fourth-highest from your longest and strongest suit. If you have ♠ KJ854, lead the ♠5 (fourth from the top). This establishes your long suit for later. Lead the top of a sequence (KQJ, QJ10) if you have one — it's safer and doesn't give up a trick immediately. Avoid leading suits where you have Ace-x — leading the Ace may give away a trick.`,
      },
      {
        heading: 'Leading Against Suit Contracts',
        content: `Against suit contracts, leading partner's bid suit is usually best. If partner hasn't bid, lead the top of a sequence, or a singleton (hoping to get a ruff later). Avoid leading away from Kings or Queens — it often gifts Declarer a trick. The Ace lead is safer here than in NT: lead Ace if you have Ace-King, or if you have a singleton Ace and expect to ruff the return.`,
      },
      {
        heading: 'Second Hand Low, Third Hand High',
        content: `Two classic defensive principles:\n\nSecond hand low: When you're the second player to a trick and Declarer leads small, play low. Don't spend a high card unnecessarily — wait to see what the fourth player plays.\nThird hand high: When you're the third player to a trick and your partner has led, play your highest card (or top of a sequence) to try to win the trick or force out Declarer's high card.\n\nThese rules have many exceptions, but they're the right default for beginners.`,
      },
    ],
  },
  {
    id: 'scoring',
    num: '08',
    title: 'Scoring',
    sections: [
      {
        heading: 'Trick Points',
        content: `You score points for each trick won above six (called "book"). The points per trick depend on the denomination:\n\nClubs or Diamonds (minor suits): 20 points per trick\nHearts or Spades (major suits): 30 points per trick\nNo Trump: 40 points for the first trick, 30 for each after\n\nSo 3NT bid and made scores 40+30+30 = 100 trick points. 4♠ bid and made scores 30×4 = 120 trick points.`,
      },
      {
        heading: 'Game and Slam Bonuses',
        content: `Reaching 100 trick points in a single deal earns a Game bonus. The game contracts are: 3NT (100 pts), 4♥ or 4♠ (120 pts), 5♣ or 5♦ (100 pts). Making game earns a bonus of 300 points (not vulnerable) or 500 points (vulnerable). Bidding and making a Small Slam (12 tricks, 6-level) earns 500 or 750. A Grand Slam (all 13 tricks, 7-level) earns 1000 or 1500. These bonuses make aggressive bidding worth the risk.`,
      },
      {
        heading: 'Undertricks (Going Down)',
        content: `If Declarer fails to make the contract, the defenders score points for each undertrick — each trick short of the contract. Not vulnerable: 50 points per undertrick. Vulnerable: 100 points per undertrick. If Declarer was doubled, the penalties are much harsher. Going down 3 doubled and vulnerable can cost 800 points — a catastrophic result. This is why knowing when to stop bidding is as important as knowing when to bid.`,
      },
      {
        heading: 'Vulnerability',
        content: `Vulnerability is a special status that increases both rewards and penalties. In Rubber Bridge, you become vulnerable after winning your first game. Vulnerable bonuses for game, slam, and overtricks are higher — but so are the penalties for going down. In Duplicate Bridge, vulnerability is pre-assigned for each deal. Playing aggressively when vulnerable and cautiously when not is a key strategic adjustment.`,
      },
      {
        heading: 'Rubber Bridge vs. Duplicate Bridge',
        content: `Rubber Bridge is the traditional home game. A rubber is won when one side makes two games. The winning side scores a 700-point rubber bonus (or 500 if the opponents also made a game). Duplicate Bridge is the tournament form. The same hand is played at multiple tables and teams are compared against each other — your score depends not on how many points you made, but whether you did better or worse than others playing the same cards. Duplicate removes the luck of the deal and rewards pure skill.`,
      },
    ],
  },
  {
    id: 'conventions',
    num: '09',
    title: 'Key Conventions Every Beginner Should Know',
    sections: [
      {
        heading: 'What is a Convention?',
        content: `A convention is a bid that doesn't mean what it literally says. Instead of describing your cards, it sends a coded message your partner understands. Conventions let you exchange more precise information during the auction. You must agree on conventions with your partner before you play — using an undisclosed convention against opponents is against the rules.`,
      },
      {
        heading: 'Stayman (2♣ after 1NT)',
        content: `After partner opens 1NT, bidding 2♣ (Stayman) asks "do you have a 4-card major suit?" It says nothing about your Clubs. Partner responds 2♥ (four Hearts), 2♠ (four Spades), or 2♦ (no 4-card major). Use Stayman when you have 8+ points and a 4-card major — you might find a better contract in a major suit rather than 3NT. Stayman is the single most important convention in Bridge.`,
      },
      {
        heading: 'Blackwood (4NT)',
        content: `When your side is clearly heading for a slam, bid 4NT to ask partner how many Aces they hold. Partner responds: 5♣ = 0 or 4 Aces, 5♦ = 1 Ace, 5♥ = 2 Aces, 5♠ = 3 Aces. If you find you're not missing more than one Ace, bid the slam. Blackwood prevents the embarrassing situation of reaching 6♠ only to discover the opponents hold two Aces. A simple but crucial safety check before committing to a slam.`,
      },
      {
        heading: 'Jacoby Transfers (2♦/2♥ after 1NT)',
        content: `After partner opens 1NT, bid 2♦ to show 5+ Hearts (partner bids 2♥), or bid 2♥ to show 5+ Spades (partner bids 2♠). Why? It makes the stronger 1NT opener the Declarer in the major suit, keeping their hand hidden from the opening lead. Jacoby Transfers are standard in most modern bidding systems and are well worth learning after you've mastered Stayman.`,
      },
      {
        heading: 'Negative Double',
        content: `When your partner opens 1 of a suit and the opponent overcalls, a double by you (the Responder) is not a penalty double — it's a Negative Double showing the unbid major suit(s) and at least 6 HCP. For example: partner opens 1♦, opponent bids 1♠, and you double — you're showing 4+ Hearts and asking partner to bid Hearts if possible. Negative Doubles solve the problem of running out of bidding space when an opponent interferes.`,
      },
    ],
  },
  {
    id: 'strategy-tips',
    num: '10',
    title: 'Strategy Tips for Beginners',
    sections: [
      {
        heading: 'Draw Trump First (Usually)',
        content: `When you're Declarer in a suit contract, usually draw trumps early — lead trumps until the opponents have none left. This prevents them from ruffing your winners with small trumps. The exception: sometimes you need to ruff losers in Dummy before drawing trump. Count how many trumps the opponents have and draw them systematically.`,
      },
      {
        heading: 'Count Your Tricks Before You Play',
        content: `In NT contracts: count your sure winners before touching a card. If you need 9 tricks and have 7, you need 2 more. Where will they come from? Identify which suits can produce extra tricks and work on them immediately. Don't cash winners in one suit just because you can — plan the order carefully so you don't lose the lead before establishing your tricks.`,
      },
      {
        heading: 'The Finesse',
        content: `A finesse is an attempt to win a trick with a card that's not the highest in the suit, by taking advantage of the position of a higher card held by the opponents. The classic finesse: you hold ♠AQ in Dummy and ♠32 in hand. Lead small from hand toward the AQ. If the opponent to your left holds the ♠K, play the ♠Q — it will win if that opponent doesn't play the King. Finesses succeed 50% of the time, so use them when you need extra tricks rather than when you don't.`,
      },
      {
        heading: 'Don\'t Lead Into Tenaces',
        content: `A tenace is a broken high-card combination like AQ or KJ. Leading into a tenace (leading the suit where the opponent holds the tenace) gives them a free finesse. Defenders in particular should avoid leading suits where Declarer is likely to hold AQ or KJ. Force Declarer to lead those suits themselves — make them guess which finesse to take.`,
      },
      {
        heading: 'Watch the Cards Played',
        content: `Bridge rewards players who count. Track which high cards have been played — if you've seen the ♠A, ♠K, and ♠Q, your ♠J is now the highest Spade left. Track the distribution — if a player shows out of Hearts early, you know where all the remaining Hearts are. Even keeping rough count of which suits have been played out transforms your card play from guesswork into inference.`,
      },
      {
        heading: 'Bid What You Can Make, Not What You Hope For',
        content: `The most common beginner mistake is overbidding — pushing to game or slam with insufficient values, hoping partner has the right cards. Bid what your combined values support, not your dreams. Going down in 4♠ when 3♠ makes is a terrible result. Accuracy beats optimism. As you improve, you'll learn how to push for close games and slams — but start by being honest about your values.`,
      },
    ],
  },
  {
    id: 'glossary',
    num: '11',
    title: 'Bridge Glossary — Key Terms',
    sections: [
      {
        heading: 'Essential Terminology',
        content: `Auction: The bidding phase of Bridge.\nBalanced hand: A hand with no void, no singleton, and at most one doubleton. Shapes: 4-3-3-3, 4-4-3-2, 5-3-3-2.\nBook: The first 6 tricks won by Declarer — the "free" tricks included in every contract.\nContract: The final bid that determines the target number of tricks and the trump suit.\nDeclarer: The player who first named the contract's denomination on the winning side. They play both their hand and Dummy's.\nDistribution: The pattern of suit lengths in a hand (e.g. 5-4-3-1 means five cards in one suit, four in another, etc.).\nDouble: A call that increases the scoring of a contract — either punishing opponents or showing strength.\nDummy: Declarer's partner, who lays their cards face-up after the opening lead.\nEntry: A card that allows you to reach a particular hand (your own or Dummy's).\nFinesse: An attempt to win a trick with a non-top card by guessing the position of a higher card.\nFit: An 8+ card holding in the same suit between the two partners.\nGame: A contract worth 100+ trick points — 3NT, 4♥, 4♠, 5♣, or 5♦.\nHCP: High Card Points — Ace=4, King=3, Queen=2, Jack=1.\nOpening lead: The first card played, by the defender to Declarer's left.\nOvertrick: A trick won by Declarer beyond the contract requirement.\nPartscore: A contract scoring fewer than 100 trick points.\nPreempt: An opening bid at the 2-level or higher with a long suit and weak hand, designed to disrupt opponents.\nRuff: To win a trick by playing a trump when unable to follow suit.\nSlam: A 6-level contract (Small Slam) or 7-level contract (Grand Slam).\nVoid: Having no cards in a particular suit.\nVulnerable: A status (after winning one game in Rubber Bridge) that increases bonuses and penalties.`,
      },
    ],
  },
]

export default function BridgeLearnPage() {
  usePageMeta('/learn/bridge')
  const [activeChapter, setActiveChapter] = useState(chapters[0].id)
  const [openSections, setOpenSections] = useState({})

  const current = chapters.find(c => c.id === activeChapter)

  function toggleSection(key) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--felt-dark)' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(35,77,56,0.8), rgba(15,34,25,0.95))', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem', fontWeight: 600 }}>
            ♠ Complete Beginner's Guide
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: 'var(--cream)', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            How to Play Bridge
          </h1>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 580, marginBottom: '1.5rem' }}>
            From your very first hand to bidding systems and card play strategy — everything a beginner needs to start playing Bridge with confidence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.9rem', padding: '0.6rem 1.4rem' }}>
              ♠ Play Bridge Free →
            </Link>
            <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.35)' }}>
              11 chapters · No sign-up needed to play
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Sidebar — chapter list */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 80 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 700 }}>Chapters</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.55rem 0.75rem', borderRadius: 8, border: 'none',
                  background: activeChapter === ch.id ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: activeChapter === ch.id ? 'var(--gold)' : 'rgba(245,240,232,0.55)',
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem', fontWeight: activeChapter === ch.id ? 600 : 400,
                  borderLeft: activeChapter === ch.id ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '0.6rem', opacity: 0.5, flexShrink: 0, fontFamily: 'monospace' }}>{ch.num}</span>
                {ch.title}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.4rem' }}>Ready to play?</p>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>Practice what you've learned against our bots.</p>
            <Link to="/game/bridge" style={{ display: 'block', textAlign: 'center', fontSize: '0.78rem', padding: '0.5rem', background: 'var(--gold)', color: 'var(--felt-dark)', borderRadius: 7, fontWeight: 700, textDecoration: 'none' }}>
              Play Bridge →
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>Chapter {current.num}</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--cream)', marginBottom: '2rem', borderBottom: '1px solid rgba(201,168,76,0.12)', paddingBottom: '1rem' }}>
            {current.title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {current.sections.map((section, i) => {
              const key = `${current.id}-${i}`
              const isOpen = openSections[key] !== false // default open
              return (
                <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 12, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleSection(key)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.95rem' }}>{section.heading}</span>
                    <span style={{ color: 'var(--gold)', fontSize: '0.9rem', flexShrink: 0, marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                      {section.content.split('\n').map((line, li) => (
                        line.trim() === ''
                          ? <br key={li} />
                          : <p key={li} style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.72)', lineHeight: 1.85, marginBottom: '0.5rem' }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(201,168,76,0.1)', gap: '1rem', flexWrap: 'wrap' }}>
            {chapters.findIndex(c => c.id === activeChapter) > 0 ? (
              <button
                onClick={() => setActiveChapter(chapters[chapters.findIndex(c => c.id === activeChapter) - 1].id)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 1.1rem', color: 'rgba(245,240,232,0.7)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Previous
              </button>
            ) : <div />}
            {chapters.findIndex(c => c.id === activeChapter) < chapters.length - 1 ? (
              <button
                onClick={() => { setActiveChapter(chapters[chapters.findIndex(c => c.id === activeChapter) + 1].id); window.scrollTo(0, 0) }}
                className="btn-gold"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
              >
                Next Chapter →
              </button>
            ) : (
              <Link to="/game/bridge" className="btn-gold" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
                ♠ Start Playing →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
