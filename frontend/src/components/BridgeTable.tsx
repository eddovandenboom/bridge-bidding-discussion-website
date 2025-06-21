import React from 'react';
import { Seat } from '../types/bridge';
import { parsePBNHand, getVulnerabilityText } from '../utils/bridgeUtils';
import BridgeHand from './BridgeHand';

interface BridgeTableProps {
  board: {
    id: string;
    boardNumber: number;
    dealer: Seat;
    vulnerability: string;
    hands: {
      north: string;
      south: string;
      east: string;
      west: string;
    };
  };
  className?: string;
}

const BridgeTable: React.FC<BridgeTableProps> = ({ board, className = '' }) => {
  // Parse PBN hands - in a real app this would come from the API already parsed
  const hands = {
    north: parsePBNHand(board.hands.north as string),
    south: parsePBNHand(board.hands.south as string),
    east: parsePBNHand(board.hands.east as string),
    west: parsePBNHand(board.hands.west as string)
  };

  return (
    <div className={`bg-green-800 rounded-lg p-6 ${className}`}>
      {/* Board Information */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-lg px-4 py-2 inline-block shadow-md">
          <h3 className="text-lg font-bold text-gray-800">Board {board.boardNumber}</h3>
          <p className="text-sm text-gray-600">
            Dealer: <span className="font-semibold">{board.dealer}</span>
          </p>
          <p className="text-sm text-gray-600">
            {getVulnerabilityText(board.vulnerability)}
          </p>
        </div>
      </div>

      {/* Bridge Table Layout */}
      <div className="relative">
        {/* North */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <BridgeHand hand={hands.north} position="north" />
        </div>

        {/* West */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
          <BridgeHand hand={hands.west} position="west" />
        </div>

        {/* East */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
          <BridgeHand hand={hands.east} position="east" />
        </div>

        {/* South */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
          <BridgeHand hand={hands.south} position="south" />
        </div>

        {/* Center of table */}
        <div className="h-48 w-80 bg-green-800 rounded-lg border-4 border-green-700 mx-auto relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-sm font-semibold bg-green-900 px-3 py-1 rounded">
              Bridge Table
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeTable;