import React, { useState, useEffect } from 'react';
import { biddingAPI } from '../utils/api';

interface BiddingSequence {
  id: string;
  user: {
    id: string;
    username: string;
  };
  bids: Array<{
    id: string;
    seat: string;
    call: string;
    level?: number;
    suit?: string;
    isAlert: boolean;
  }>;
  createdAt: string;
}

interface BiddingSequenceSelectorProps {
  boardId: string;
  selectedBiddingTableId?: string;
  onSelect: (biddingTableId: string | null) => void;
  className?: string;
}

const BiddingSequenceSelector: React.FC<BiddingSequenceSelectorProps> = ({
  boardId,
  selectedBiddingTableId,
  onSelect,
  className = ''
}) => {
  const [biddingSequences, setBiddingSequences] = useState<BiddingSequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBiddingSequences();
  }, [boardId]);

  const fetchBiddingSequences = async () => {
    try {
      setLoading(true);
      const response = await biddingAPI.getBiddingTables(boardId);
      setBiddingSequences(response.biddingTables || []);
    } catch (err) {
      setError('Failed to load bidding sequences');
    } finally {
      setLoading(false);
    }
  };

  const formatBid = (bid: any): string => {
    const specialCalls = ['Pass', 'Double', 'Redouble'];
    if (specialCalls.includes(bid.call)) {
      return bid.call;
    }
    
    // Convert letter to symbol
    const suitSymbols: { [key: string]: string } = {
      'C': '♣',
      'D': '♦', 
      'H': '♥',
      'S': '♠',
      'NT': 'NT'
    };
    
    return `${bid.level}${suitSymbols[bid.suit] || bid.suit}`;
  };

  const formatBiddingSequence = (bids: any[]): string => {
    return bids.slice(0, 8).map(bid => formatBid(bid)).join(' - ') + (bids.length > 8 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading bidding sequences...</div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">{error}</div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Link to Bidding Sequence (optional)
      </label>
      
      {biddingSequences.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          No bidding sequences available for this board yet.
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="flex items-center">
              <input
                type="radio"
                name="biddingSequence"
                checked={!selectedBiddingTableId}
                onChange={() => onSelect(null)}
                className="mr-2"
              />
              <span className="text-sm">No bidding sequence</span>
            </label>
          </div>
          
          {biddingSequences.map((sequence, index) => (
            <div key={sequence.id}>
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="biddingSequence"
                  checked={selectedBiddingTableId === sequence.id}
                  onChange={() => onSelect(sequence.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Sequence #{index + 1} by {sequence.user.username}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatBiddingSequence(sequence.bids)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(sequence.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BiddingSequenceSelector;