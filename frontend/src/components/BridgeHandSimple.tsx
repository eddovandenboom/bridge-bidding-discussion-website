import React from 'react';

// Simple types defined inline to avoid import issues
type Suit = 'S' | 'H' | 'D' | 'C';
type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

interface Card {
  suit: Suit;
  rank: Rank;
}

interface Hand {
  spades: Card[];
  hearts: Card[];
  diamonds: Card[];
  clubs: Card[];
}

interface BridgeHandProps {
  hand: Hand;
  position: 'north' | 'south' | 'east' | 'west';
  className?: string;
  isDealer?: boolean;
  isVulnerable?: boolean;
}

// Utility functions inline
const getSuitSymbol = (suit: Suit): string => {
  const symbols = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
  return symbols[suit];
};

const getSuitColor = (suit: Suit): string => {
  return suit === 'H' || suit === 'D' ? 'text-red-600' : 'text-black';
};

const sortCards = (cards: Card[]): Card[] => {
  const rankOrder: { [key in Rank]: number } = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return cards.sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
};

const parsePBNHand = (pbnString: string): Hand => {
  const suits = pbnString.split('.');
  if (suits.length !== 4) throw new Error('Invalid PBN hand format');

  const [spadeStr, heartStr, diamondStr, clubStr] = suits;
  
  const parseCards = (rankString: string, suit: Suit): Card[] => {
    if (!rankString || rankString === '-') return [];
    return rankString.split('').map(rank => ({ suit, rank: rank as Rank }));
  };

  return {
    spades: parseCards(spadeStr, 'S'),
    hearts: parseCards(heartStr, 'H'),
    diamonds: parseCards(diamondStr, 'D'),
    clubs: parseCards(clubStr, 'C'),
  };
};

const BridgeHandSimple: React.FC<BridgeHandProps> = ({ hand, position, className = '', isDealer = false, isVulnerable = false }) => {
  const renderSuit = (cards: Card[], suit: Suit) => {
    const sortedCards = sortCards(cards);
    const suitColor = getSuitColor(suit);
    
    return (
      <div key={suit} className="flex items-center space-x-1 mb-1">
        <span className={`text-lg font-bold ${suitColor}`}>
          {getSuitSymbol(suit)}
        </span>
        <span className="font-mono text-sm">
          {sortedCards.length === 0 ? '—' : sortedCards.map(card => card.rank).join('')}
        </span>
      </div>
    );
  };

  const positionStyles = {
    north: 'text-center',
    south: 'text-center', 
    east: 'text-left',
    west: 'text-right'
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm relative ${className}`}>
      <div className="text-xs font-semibold text-gray-600 mb-2 uppercase text-center flex items-center justify-center">
        {position}
        {isDealer && (
          <span className="ml-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded font-bold">
            D
          </span>
        )}
      </div>
      <div className={`space-y-0.5 ${positionStyles[position]}`}>
        {renderSuit(hand.spades, 'S')}
        {renderSuit(hand.hearts, 'H')}
        {renderSuit(hand.diamonds, 'D')}
        {renderSuit(hand.clubs, 'C')}
      </div>
    </div>
  );
};

// Export both the component and utility function
export default BridgeHandSimple;
export { parsePBNHand };