import React, { useState, useEffect } from 'react';
import BridgeHandSimple, { parsePBNHand } from './BridgeHandSimple';
import Comments from './Comments';
import PollCreator from './PollCreator';
import BoardPollList from './BoardPollList';
import BiddingEntry from './BiddingEntry';
import LabelManager from './LabelManager';

interface Tournament {
  id: string;
  name: string;
  date: string;
  venue?: string;
  boards: Board[];
}

interface Board {
  id: string;
  boardNumber: number;
  dealer: string;
  vulnerability: string;
  northHand: string;
  southHand: string;
  eastHand: string;
  westHand: string;
  labels?: Array<{
    id: string;
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface TournamentViewerProps {
  tournamentId: string;
  initialBoardNumber?: number;
  onBack: () => void;
}

const TournamentViewer: React.FC<TournamentViewerProps> = ({ 
  tournamentId, 
  initialBoardNumber = 1,
  onBack 
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentBoardIndex, setCurrentBoardIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'polls' | 'create-poll' | 'bidding' | 'labels'>('comments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament && tournament.boards.length > 0) {
      const boardIndex = tournament.boards.findIndex(b => b.boardNumber === initialBoardNumber);
      setCurrentBoardIndex(Math.max(0, boardIndex));
    }
  }, [tournament, initialBoardNumber]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        throw new Error('Tournament not found');
      }
      const data = await response.json();
      setTournament(data.tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const currentBoard = tournament?.boards[currentBoardIndex];

  const goToPreviousBoard = () => {
    if (currentBoardIndex > 0) {
      setCurrentBoardIndex(currentBoardIndex - 1);
    }
  };

  const goToNextBoard = () => {
    if (tournament && currentBoardIndex < tournament.boards.length - 1) {
      setCurrentBoardIndex(currentBoardIndex + 1);
    }
  };



  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tournaments
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading tournament</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tournaments
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No boards available in this tournament.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tournaments
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600">{formatDate(tournament.date)}</p>
            {tournament.venue && <p className="text-gray-500">📍 {tournament.venue}</p>}
          </div>
          
          {/* Board navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousBoard}
              disabled={currentBoardIndex === 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous board"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-xl font-bold">Board {currentBoard.boardNumber}</div>
              <div className="text-sm text-gray-500">
                {currentBoardIndex + 1} of {tournament.boards.length}
              </div>
            </div>
            
            <button
              onClick={goToNextBoard}
              disabled={currentBoardIndex === tournament.boards.length - 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next board"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Board display - always visible */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold mb-2">Board {currentBoard.boardNumber}</h2>
          
          {/* Labels */}
          {currentBoard.labels && currentBoard.labels.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2 mt-3">
              {currentBoard.labels.map((boardLabel) => (
                <span
                  key={boardLabel.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: boardLabel.label.color }}
                >
                  {boardLabel.label.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bridge Table Layout */}
        <div className="bg-green-800 rounded-lg p-12 relative min-h-[600px]">
          <div className="relative min-h-[500px] flex items-center justify-center">
            {/* North */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <BridgeHandSimple 
                hand={parsePBNHand(currentBoard.northHand)} 
                position="north"
                isDealer={currentBoard.dealer === 'NORTH'}
              />
            </div>

            {/* West */}
            <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <BridgeHandSimple 
                hand={parsePBNHand(currentBoard.westHand)} 
                position="west"
                isDealer={currentBoard.dealer === 'WEST'}
              />
            </div>

            {/* East */}
            <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2">
              <BridgeHandSimple 
                hand={parsePBNHand(currentBoard.eastHand)} 
                position="east"
                isDealer={currentBoard.dealer === 'EAST'}
              />
            </div>

            {/* South */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <BridgeHandSimple 
                hand={parsePBNHand(currentBoard.southHand)} 
                position="south"
                isDealer={currentBoard.dealer === 'SOUTH'}
              />
            </div>

            {/* Center */}
            <div className="h-20 w-32 bg-green-900 rounded-lg border-2 border-green-700 flex items-center justify-center shadow-lg">
              <div className="text-white text-sm font-semibold text-center">
                <div>Board {currentBoard.boardNumber}</div>
                <div className="text-xs mt-1">Vul: {currentBoard.vulnerability}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation and content */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Tab headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'comments', label: 'Comments', icon: '💬' },
              { id: 'polls', label: 'Polls', icon: '📊' },
              { id: 'create-poll', label: 'Create Poll', icon: '➕' },
              { id: 'bidding', label: 'Bidding', icon: '🃏' },
              { id: 'labels', label: 'Labels', icon: '🏷️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'comments' && (
            <Comments boardId={currentBoard.id} />
          )}
          
          {activeTab === 'polls' && (
            <BoardPollList boardId={currentBoard.id} />
          )}
          
          {activeTab === 'create-poll' && (
            <PollCreator 
              boardId={currentBoard.id}
              onPollCreated={() => setActiveTab('polls')}
              onClose={() => setActiveTab('polls')}
            />
          )}
          
          {activeTab === 'bidding' && (
            <BiddingEntry 
              boardId={currentBoard.id}
              boardNumber={currentBoard.boardNumber}
              dealer={currentBoard.dealer as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'}
              onClose={() => {}}
            />
          )}
          
          {activeTab === 'labels' && (
            <LabelManager boardId={currentBoard.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentViewer;