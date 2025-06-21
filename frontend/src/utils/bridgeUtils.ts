import { Hand, Card, Suit, Rank } from '../types/bridge';

/**
 * Parse a PBN hand string like "AKQ95.J743.A2.Q42" into a Hand object
 */
export function parsePBNHand(pbnString: string): Hand {
  const suits = pbnString.split('.');
  if (suits.length !== 4) {
    throw new Error('Invalid PBN hand format');
  }

  const [spadeStr, heartStr, diamondStr, clubStr] = suits;

  return {
    spades: parseCards(spadeStr, 'S'),
    hearts: parseCards(heartStr, 'H'),
    diamonds: parseCards(diamondStr, 'D'),
    clubs: parseCards(clubStr, 'C'),
  };
}

function parseCards(rankString: string, suit: Suit): Card[] {
  if (!rankString || rankString === '-') return [];
  
  return rankString.split('').map(rank => ({
    suit,
    rank: rank === 'T' ? 'T' : rank as Rank
  }));
}

/**
 * Get the display symbol for a suit
 */
export function getSuitSymbol(suit: Suit): string {
  const symbols = {
    'S': '♠',
    'H': '♥',
    'D': '♦',
    'C': '♣'
  };
  return symbols[suit];
}

/**
 * Get the CSS class for a suit color
 */
export function getSuitColor(suit: Suit): string {
  return suit === 'H' || suit === 'D' ? 'text-red-600' : 'text-black';
}

/**
 * Sort cards in standard bridge order (high to low)
 */
export function sortCards(cards: Card[]): Card[] {
  const rankOrder: { [key in Rank]: number } = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };

  return cards.sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
}

/**
 * Get vulnerability description
 */
export function getVulnerabilityText(vulnerability: string): string {
  switch (vulnerability) {
    case 'None': return 'Neither vulnerable';
    case 'NS': return 'North-South vulnerable';
    case 'EW': return 'East-West vulnerable';
    case 'Both': return 'Both vulnerable';
    default: return vulnerability;
  }
}

/**
 * Format hand for display with suit symbols
 */
export function formatHandDisplay(hand: Hand): string {
  const formatSuit = (cards: Card[], suit: Suit) => {
    if (cards.length === 0) return `${getSuitSymbol(suit)} —`;
    const sortedCards = sortCards(cards);
    return `${getSuitSymbol(suit)} ${sortedCards.map(c => c.rank).join('')}`;
  };

  return [
    formatSuit(hand.spades, 'S'),
    formatSuit(hand.hearts, 'H'),
    formatSuit(hand.diamonds, 'D'),
    formatSuit(hand.clubs, 'C')
  ].join('\n');
}