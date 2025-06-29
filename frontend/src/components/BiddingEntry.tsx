import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { biddingAPI } from '../utils/api';

interface Bid {
  seat: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  level?: number;
  suit?: string;
  call: string;
  isAlert: boolean;
  alertText?: string;
  comment?: string;
}

interface BiddingTable {
  id: string;
  bids: (Bid & { id: string; position: number })[];
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface BiddingEntryProps {
  boardId: string;
  boardNumber: number;
  dealer: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  onClose?: () => void;
}

const BiddingEntry: React.FC<BiddingEntryProps> = ({ 
  boardId, 
  boardNumber, 
  dealer, 
  onClose 
}) => {
  const { isAuthenticated } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentSeat, setCurrentSeat] = useState<'NORTH' | 'SOUTH' | 'EAST' | 'WEST'>(dealer);
  const [biddingTables, setBiddingTables] = useState<BiddingTable[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertText, setAlertText] = useState('');
  const [comment, setComment] = useState('');
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [selectedBidForAlert, setSelectedBidForAlert] = useState<string>('');
  const [selectedBidIndex, setSelectedBidIndex] = useState<number>(-1);

  const seats: ('NORTH' | 'SOUTH' | 'EAST' | 'WEST')[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  const levels = [1, 2, 3, 4, 5, 6, 7];
  const suits = [
    { letter: 'C', symbol: '♣', color: 'text-black' },
    { letter: 'D', symbol: '♦', color: 'text-red-600' },
    { letter: 'H', symbol: '♥', color: 'text-red-600' },
    { letter: 'S', symbol: '♠', color: 'text-black' },
    { letter: 'NT', symbol: 'NT', color: 'text-blue-600' }
  ];
  const specialCalls = ['Pass', 'Double', 'Redouble'];

  useEffect(() => {
    fetchBiddingTables();
  }, [boardId]);

  // Reset bidding state when board changes
  useEffect(() => {
    setBids([]);
    setCurrentSeat(dealer);
    setError(null);
    setAlertText('');
    setComment('');
    setShowAlertDialog(false);
    setSelectedBidForAlert('');
    setSelectedBidIndex(-1);
  }, [boardId, dealer]);

  const fetchBiddingTables = async () => {
    try {
      const response = await biddingAPI.getBiddingTables(boardId);
      setBiddingTables(response.biddingTables);
    } catch (err) {
      setError('Failed to load existing bidding sequences');
    }
  };

  const getNextSeat = (seat: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'): 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' => {
    const index = seats.indexOf(seat);
    return seats[(index + 1) % 4];
  };

  const getSuitLevel = (suit: string): number => {
    const suitOrder = ['C', 'D', 'H', 'S', 'NT'];
    return suitOrder.indexOf(suit);
  };

  const isValidBid = (level: number, suit: string): boolean => {
    const lastBid = bids.filter(bid => !specialCalls.includes(bid.call)).pop();
    
    if (!lastBid) {
      return true; // First bid is always valid
    }

    const lastLevel = lastBid.level || 0;
    const lastSuitLevel = getSuitLevel(lastBid.suit || '');
    const newSuitLevel = getSuitLevel(suit);

    // Must bid higher level, or same level with higher suit
    return level > lastLevel || (level === lastLevel && newSuitLevel > lastSuitLevel);
  };

  const isBiddingComplete = (): boolean => {
    if (bids.length < 4) return false;
    
    const lastFourBids = bids.slice(-4);
    
    // Check if last 4 bids are all passes
    if (lastFourBids.every(bid => bid.call === 'Pass')) {
      return true;
    }
    
    // Check if last 3 bids are passes (after an opening bid)
    if (bids.length >= 4) {
      const lastThreeBids = bids.slice(-3);
      const hasNonPassBid = bids.some(bid => bid.call !== 'Pass');
      if (hasNonPassBid && lastThreeBids.every(bid => bid.call === 'Pass')) {
        return true;
      }
    }
    
    return false;
  };

  const canMakeCall = (call: string, level?: number, suit?: string): boolean => {
    if (isBiddingComplete()) return false;
    
    if (specialCalls.includes(call)) {
      if (call === 'Double') {
        // Can only double opponent's bid
        const lastBid = bids[bids.length - 1];
        if (!lastBid || specialCalls.includes(lastBid.call)) return false;
        
        // Check if last bid was by opponent
        const currentPlayerTeam = ['NORTH', 'SOUTH'].includes(currentSeat) ? 'NS' : 'EW';
        const lastBidderTeam = ['NORTH', 'SOUTH'].includes(lastBid.seat) ? 'NS' : 'EW';
        return currentPlayerTeam !== lastBidderTeam;
      }
      
      if (call === 'Redouble') {
        // Can only redouble if last call was a double by opponent
        const lastBid = bids[bids.length - 1];
        if (!lastBid || lastBid.call !== 'Double') return false;
        
        // Check if double was by opponent
        const currentPlayerTeam = ['NORTH', 'SOUTH'].includes(currentSeat) ? 'NS' : 'EW';
        const lastBidderTeam = ['NORTH', 'SOUTH'].includes(lastBid.seat) ? 'NS' : 'EW';
        return currentPlayerTeam !== lastBidderTeam;
      }
      
      return true; // Pass is always allowed
    }
    
    // For suit bids, check if it's higher than the last bid
    return level !== undefined && suit !== undefined && isValidBid(level, suit);
  };

  const addBid = (call: string, level?: number, suit?: string) => {
    if (!canMakeCall(call, level, suit)) {
      return; // Invalid bid
    }

    const newBid: Bid = {
      seat: currentSeat,
      level,
      suit,
      call,
      isAlert: false,
      alertText: '',
      comment: ''
    };

    setBids(prev => [...prev, newBid]);
    
    if (!isBiddingComplete()) {
      setCurrentSeat(getNextSeat(currentSeat));
    }
  };

  const removeBid = (index: number) => {
    setBids(prev => {
      const newBids = prev.slice(0, index);
      // Update current seat based on remaining bids
      if (newBids.length > 0) {
        const lastBidSeat = newBids[newBids.length - 1].seat;
        setCurrentSeat(getNextSeat(lastBidSeat));
      } else {
        setCurrentSeat(dealer);
      }
      return newBids;
    });
  };

  const toggleAlert = (index: number) => {
    setSelectedBidIndex(index);
    setSelectedBidForAlert(formatBid(bids[index]));
    setShowAlertDialog(true);
    setAlertText(bids[index].alertText || '');
    setComment(bids[index].comment || '');
  };

  const saveAlert = (index: number) => {
    setBids(prev => prev.map((bid, i) => 
      i === index 
        ? { 
            ...bid, 
            isAlert: alertText.length > 0,
            alertText: alertText.trim() || undefined,
            comment: comment.trim() || undefined
          }
        : bid
    ));
    setShowAlertDialog(false);
    setAlertText('');
    setComment('');
  };

  const saveBiddingSequence = async () => {
    if (!isAuthenticated) {
      setError('You must be signed in to save bidding sequences');
      return;
    }

    if (bids.length === 0) {
      setError('Please add some bids before saving');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await biddingAPI.createBiddingTable(boardId, bids);
      
      // Refresh the bidding tables list
      await fetchBiddingTables();
      
      // Clear current bidding sequence
      setBids([]);
      setCurrentSeat(dealer);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bidding sequence');
    } finally {
      setSaving(false);
    }
  };

  const loadBiddingTable = (table: BiddingTable) => {
    setBids(table.bids.map(bid => ({
      seat: bid.seat,
      level: bid.level || undefined,
      suit: bid.suit || undefined,
      call: bid.call,
      isAlert: bid.isAlert,
      alertText: bid.alertText || undefined,
      comment: bid.comment || undefined
    })));
    
    // Set current seat to next after last bid
    if (table.bids.length > 0) {
      const lastBid = table.bids[table.bids.length - 1];
      setCurrentSeat(getNextSeat(lastBid.seat));
    } else {
      setCurrentSeat(dealer);
    }
  };

  const formatBid = (bid: Bid): string => {
    if (specialCalls.includes(bid.call)) {
      return bid.call;
    }
    const suitInfo = suits.find(s => s.letter === bid.suit);
    return `${bid.level}${suitInfo?.symbol || bid.suit}`;
  };

  const formatBidWithColor = (bid: Bid): React.JSX.Element => {
    if (specialCalls.includes(bid.call)) {
      return <span>{bid.call}</span>;
    }
    const suitInfo = suits.find(s => s.letter === bid.suit);
    return (
      <span>
        {bid.level}
        <span className={suitInfo?.color || 'text-gray-700'}>
          {suitInfo?.symbol || bid.suit}
        </span>
      </span>
    );
  };

  const formatBiddingSequence = (bids: any[]): React.JSX.Element => {
    // Create a helper function to format individual bids
    const formatSingleBid = (bid: any): string => {
      if (bid.call === 'Pass') return 'p';
      if (bid.call === 'Double') return 'x';
      if (bid.call === 'Redouble') return 'xx';
      
      const suitInfo = suits.find(s => s.letter === bid.suit);
      return `${bid.level}${suitInfo?.symbol || bid.suit}`;
    };

    if (bids.length === 0) {
      return <span className="text-gray-500">No bids</span>;
    }

    // Group bids into rounds of 4
    const rounds: string[][] = [];
    for (let i = 0; i < bids.length; i += 4) {
      const round: string[] = [];
      for (let j = 0; j < 4; j++) {
        if (i + j < bids.length) {
          const bid = bids[i + j];
          const bidText = formatSingleBid(bid);
          round.push(bid.isAlert ? `${bidText}*` : bidText);
        } else {
          round.push('');
        }
      }
      rounds.push(round);
    }

    // Determine seat order starting with dealer
    const seatOrder = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
    const dealerIndex = seatOrder.indexOf(dealer);
    const orderedSeats = [...seatOrder.slice(dealerIndex), ...seatOrder.slice(0, dealerIndex)];

    return (
      <div className="font-mono text-sm">
        {/* Header row with seat symbols */}
        <div className="grid grid-cols-4 gap-4 mb-1 font-semibold text-gray-600">
          {orderedSeats.map(seat => (
            <div key={seat} className="text-left">{seat[0]}</div>
          ))}
        </div>
        {/* Bid rows */}
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="grid grid-cols-4 gap-4">
            {round.map((bid, bidIndex) => (
              <div key={bidIndex} className="text-left">
                {bid || ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Bidding Entry - Board {boardNumber}
          </h3>
          <p className="text-gray-600">Dealer: {dealer}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Current Bidding Sequence */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Current Bidding Sequence</h4>
        </div>

        {/* Bidding Table Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(() => {
            const seatOrder = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
            const dealerIndex = seatOrder.indexOf(dealer);
            const orderedSeats = [...seatOrder.slice(dealerIndex), ...seatOrder.slice(0, dealerIndex)];
            
            return orderedSeats.map((seat) => (
              <div key={seat} className="font-bold text-center p-2 bg-gray-100 rounded">
                {seat}
              </div>
            ));
          })()}
          
          {Array.from({ length: Math.max(1, Math.ceil(bids.length / 4)) }).map((_, rowIndex) => {
            const seatOrder = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
            const dealerIndex = seatOrder.indexOf(dealer);
            const orderedSeats = [...seatOrder.slice(dealerIndex), ...seatOrder.slice(0, dealerIndex)];
            
            return orderedSeats.map((seat, seatIndex) => {
              const bidIndex = rowIndex * 4 + seatIndex;
              const bid = bidIndex < bids.length ? bids[bidIndex] : null;
              
              return (
                <div
                  key={`${rowIndex}-${seat}`}
                  className="p-2 text-center border border-gray-200 rounded min-h-[40px] flex items-center justify-center relative"
                >
                  {bid ? (
                    <div className="flex items-center justify-between w-full px-2">
                      <div className="flex-grow text-center">
                        {formatBidWithColor(bid)}
                        {bid.isAlert && (
                          <span className="text-red-600 text-xs ml-1">*</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAlert(bidIndex);
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                        title="Add/Edit Alert"
                      >
                        !
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            });
          }).flat()}
        </div>

        {/* Bidding Buttons */}
        {isAuthenticated && (
          <div className="space-y-4">
            {/* Level and Suit Bids */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Suit Bids {isBiddingComplete() && <span className="text-red-600">(Bidding Complete)</span>}
              </h5>
              <div className="grid grid-cols-5 gap-2">
                {levels.map(level => (
                  <div key={level} className="space-y-1">
                    <div className="text-center text-xs font-medium text-gray-600">{level}</div>
                    {suits.map(suit => {
                      const canMake = canMakeCall(`${level}${suit.letter}`, level, suit.letter);
                      return (
                        <button
                          key={`${level}${suit.letter}`}
                          onClick={() => addBid(`${level}${suit.letter}`, level, suit.letter)}
                          disabled={!canMake}
                          className={`w-full px-2 py-1 text-sm border rounded transition-colors ${
                            canMake 
                              ? 'border-gray-300 hover:bg-blue-50 hover:border-blue-300' 
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{level}</span>
                          <span className={suit.color}>{suit.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Special Calls */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Special Calls</h5>
              <div className="flex space-x-2">
                {specialCalls.map(call => {
                  const canMake = canMakeCall(call);
                  return (
                    <button
                      key={call}
                      onClick={() => addBid(call)}
                      disabled={!canMake}
                      className={`px-4 py-2 border rounded transition-colors ${
                        canMake 
                          ? 'border-gray-300 hover:bg-gray-50' 
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {call}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {bids.length} bid{bids.length !== 1 ? 's' : ''} entered
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => removeBid(bids.length - 1)}
                  disabled={bids.length === 0}
                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  title="Remove the last bid from the sequence"
                >
                  Delete Last
                </button>
                <button
                  onClick={() => removeBid(0)}
                  disabled={bids.length === 0}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  title="Clear the entire bidding sequence"
                >
                  Clear All
                </button>
                <button
                  onClick={saveBiddingSequence}
                  disabled={saving || bids.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Bidding Sequence'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center py-4 text-gray-500">
            Sign in to enter bidding sequences
          </div>
        )}
      </div>

      {/* Existing Bidding Tables */}
      {biddingTables.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-300 p-6">
          <h4 className="text-lg font-semibold mb-4">Saved Bidding Sequences</h4>
          <div className="space-y-4">
            {biddingTables.map((table, index) => (
              <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h5 className="font-medium">Sequence #{index + 1}</h5>
                    <p className="text-sm text-gray-600">by {table.user.username}</p>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <button
                      onClick={() => loadBiddingTable(table)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Load & Edit
                    </button>
                    <span className="text-sm text-gray-500">
                      {new Date(table.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {formatBiddingSequence(table.bids)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {showAlertDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-bold mb-4">Alert Information</h4>
            <p className="text-gray-600 mb-3">Bid: {selectedBidForAlert}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Explanation
                </label>
                <input
                  type="text"
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  placeholder="e.g., Stayman, Transfer, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (optional)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Additional notes about this bid"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAlertDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedBidIndex !== -1) {
                    saveAlert(selectedBidIndex);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingEntry;