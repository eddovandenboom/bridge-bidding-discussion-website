import React, { useState, useEffect } from 'react';
import { boardAPI } from '../utils/api';
import BoardDiscussion from './BoardDiscussion';
import SearchAndFilter from './SearchAndFilter';

type SearchFilters = {
  searchTerm: string;
  selectedLabels: string[];
  vulnerability: string;
  dealer: string;
  boardNumberFrom: string;
  boardNumberTo: string;
  dateFrom: string;
  dateTo: string;
};

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
  _count?: {
    comments: number;
    polls: number;
  };
}

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [discussionBoard, setDiscussionBoard] = useState<{ board: Board; initialTab: 'comments' | 'polls' | 'create-poll' | 'bidding' | 'labels' } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchFilters, setHasSearchFilters] = useState(false);

  useEffect(() => {
    if (!hasSearchFilters) {
      fetchTournaments();
    }
  }, [hasSearchFilters]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getTournaments();
      setTournaments(response.tournaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);
      
      // Check if any filters are actually applied
      const hasFilters = (
        filters.searchTerm.trim() !== '' ||
        filters.selectedLabels.length > 0 ||
        filters.vulnerability !== '' ||
        filters.dealer !== '' ||
        filters.boardNumberFrom !== '' ||
        filters.boardNumberTo !== '' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== ''
      );

      setHasSearchFilters(hasFilters);

      if (hasFilters) {
        const response = await boardAPI.searchTournaments(filters);
        setTournaments(response.tournaments);
      } else {
        // If no filters, load all tournaments
        const response = await boardAPI.getTournaments();
        setTournaments(response.tournaments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tournaments');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setHasSearchFilters(false);
    await fetchTournaments();
  };

  const getVulnerabilityText = (vulnerability: string): string => {
    switch (vulnerability) {
      case 'None': return 'Neither vulnerable';
      case 'NS': return 'North-South vulnerable';
      case 'EW': return 'East-West vulnerable';
      case 'Both': return 'Both vulnerable';
      default: return vulnerability;
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

  if (loading && !hasSearchFilters) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading tournaments</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Bridge Tournaments
        </h2>
        <p className="text-lg text-gray-600">
          View and analyze hands from recent bridge sessions
        </p>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {/* Search Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">Searching...</p>
          </div>
        </div>
      )}

      {!isSearching && tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {hasSearchFilters ? 'No boards match your search criteria.' : 'No tournaments available yet.'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {hasSearchFilters ? 'Try adjusting your filters or search terms.' : 'Check back later for new bridge sessions.'}
          </p>
        </div>
      ) : !isSearching ? (
        <div className="space-y-6">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold">{tournament.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-blue-100">{formatDate(tournament.date)}</p>
                  {tournament.venue && (
                    <p className="text-blue-100">{tournament.venue}</p>
                  )}
                </div>
              </div>

              <div className="p-6">
                {tournament.boards.length === 0 ? (
                  <p className="text-gray-500 text-center">No boards available for this tournament.</p>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Boards ({tournament.boards.length})
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tournament.boards.map((board) => (
                        <div
                          key={board.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedBoard(board)}
                        >
                          <div className="text-center mb-3">
                            <h5 className="font-bold text-lg">Board {board.boardNumber}</h5>
                            <p className="text-sm text-gray-600">Dealer: {board.dealer}</p>
                            <p className="text-sm text-gray-600">{getVulnerabilityText(board.vulnerability)}</p>
                            
                            {/* Labels */}
                            {board.labels && board.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-center mt-2">
                                {board.labels.map((boardLabel) => (
                                  <span
                                    key={boardLabel.id}
                                    className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: boardLabel.label.color }}
                                  >
                                    {boardLabel.label.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Activity indicators */}
                            {board._count && (
                              <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
                                {board._count.comments > 0 && (
                                  <span>💬 {board._count.comments}</span>
                                )}
                                {board._count.polls > 0 && (
                                  <span>📊 {board._count.polls}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              View Full Board →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Board Detail Modal */}
      {selectedBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Board {selectedBoard.boardNumber}</h3>
                <button
                  onClick={() => setSelectedBoard(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Bridge Table Layout */}
              <div className="bg-green-800 rounded-lg p-8 relative min-h-[600px]">
                {/* Board Information */}
                <div className="text-center mb-8">
                  <div className="bg-white rounded-lg px-4 py-2 inline-block shadow-md">
                    <h4 className="text-lg font-bold text-gray-800">Board {selectedBoard.boardNumber}</h4>
                    <p className="text-sm text-gray-600">Dealer: {selectedBoard.dealer}</p>
                    <p className="text-sm text-gray-600">{getVulnerabilityText(selectedBoard.vulnerability)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button 
                  onClick={() => {
                    if (selectedBoard) {
                      setDiscussionBoard({ board: selectedBoard, initialTab: 'comments' });
                      setSelectedBoard(null);
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  💬 Join Discussion
                </button>
                <button 
                  onClick={() => {
                    if (selectedBoard) {
                      setDiscussionBoard({ board: selectedBoard, initialTab: 'bidding' });
                      setSelectedBoard(null);
                    }
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  🃏 Enter Bidding
                </button>
                <button 
                  onClick={() => {
                    if (selectedBoard) {
                      setDiscussionBoard({ board: selectedBoard, initialTab: 'polls' });
                      setSelectedBoard(null);
                    }
                  }}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  📊 View Polls
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board Discussion Modal */}
      {discussionBoard && (
        <BoardDiscussion
          boardId={discussionBoard.board.id}
          boardNumber={discussionBoard.board.boardNumber}
          isOpen={!!discussionBoard}
          onClose={() => setDiscussionBoard(null)}
          initialTab={discussionBoard.initialTab}
        />
      )}
    </div>
  );
};

export default TournamentList;