import React, { useState, useEffect } from 'react';
import BridgeWebsHandViewer from './BridgeWebsHandViewer';
import Comments from './Comments';
import PollCreator from './PollCreator';
import BoardPollList from './BoardPollList';
import BiddingEntry from './BiddingEntry';
import LabelManager from './LabelManager';
import { boardAPI, API_BASE_URL } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  date: string;
  venue?: string;
  boards: Board[];
  pbnFileUrl?: string;
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

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
      const data = await boardAPI.getTournament(tournamentId);
      setTournament(data.tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'boardChange' && data.boardNumber) {
          if (tournament) {
            const newBoardIndex = tournament.boards.findIndex(b => b.boardNumber.toString() === data.boardNumber.toString());
            if (newBoardIndex !== -1) {
              setCurrentBoardIndex(newBoardIndex);
            }
          }
        }
      } catch (error) {
        // Not a json message, ignore
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [tournament]);

  const currentBoard = tournament?.boards[currentBoardIndex];



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
    <div className="w-full">
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
          
          <div className="text-center">
              <div className="text-xl font-bold">Board {currentBoard.boardNumber}</div>
              <div className="text-sm text-gray-500">
                {currentBoardIndex + 1} of {tournament.boards.length}
              </div>
            </div>
        </div>
      </div>

      {/* Main content area with side-by-side layout */}
      <div className="flex flex-wrap gap-8 justify-center">
        
        {/* Left column: Board display */}
        <div className="flex-grow-0 flex-shrink-0 basis-[1100px]">
          <div>

            {/* BridgeWebs Hand Viewer */}
            {tournament.pbnFileUrl && (() => {
              const baseUrl = API_BASE_URL.replace('/api', '');
              const pbnUrl = `${baseUrl}${tournament.pbnFileUrl}`;
              
              return (
                <BridgeWebsHandViewer
                  pbnFileUrl={`/bsol/bsol_v1.08/ddummy.htm?file=${encodeURIComponent(
                    pbnUrl
                  )}`}
                />
              );
            })()}
          </div>
        </div>

        {/* Right column: Tab navigation and content */}
        <div className="flex-grow flex-shrink-0 basis-[600px]">
          <div className="bg-white rounded-lg shadow-md sticky top-8 overflow-hidden">
            {/* Tab headers */}
            <div className="border-b border-gray-200">
              <nav className="flex justify-around">
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
            <div className="p-6" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
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
                <LabelManager
                  boardId={currentBoard.id}
                  showBoardLabels={true}
                  canCreateLabels={isAdmin}
                  onLabelChange={() => {
                    // Optionally refresh board data
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentViewer;
