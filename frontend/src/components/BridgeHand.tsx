import React from 'react';
import { Hand, Card, Suit } from '../types/bridge';
import { getSuitSymbol, getSuitColor, sortCards } from '../utils/bridgeUtils';

interface BridgeHandProps {
  hand: Hand;
  position: 'north' | 'south' | 'east' | 'west';
  className?: string;
}

const BridgeHand: React.FC<BridgeHandProps> = ({ hand, position, className = '' }) => {
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
    <div className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm ${positionStyles[position]} ${className}`}>
      <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">
        {position}
      </div>
      <div className="space-y-0.5">
        {renderSuit(hand.spades, 'S')}
        {renderSuit(hand.hearts, 'H')}
        {renderSuit(hand.diamonds, 'D')}
        {renderSuit(hand.clubs, 'C')}
      </div>
    </div>
  );
};

export default BridgeHand;