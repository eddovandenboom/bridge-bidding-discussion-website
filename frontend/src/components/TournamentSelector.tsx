import React, { useState, useEffect } from 'react';
import { boardAPI } from '../utils/api';

interface Tournament {
  id: string;
  name: string;
  date: string;
  venue?: string;
  boards: { id: string }[]; // Just count, not full board data
}

interface TournamentSelectorProps {
  onTournamentSelect: (tournamentId: string) => void;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({ onTournamentSelect }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      // Use the existing tournaments API and extract only what we need
      const fullResponse = await boardAPI.getTournaments();
      setTournaments(fullResponse.tournaments.map(t => ({
        ...t,
        boards: t.boards.map(b => ({ id: b.id }))
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bridge Tournaments
        </h1>
        <p className="text-lg text-gray-600">
          Select a tournament to analyze boards and participate in discussions
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tournaments available yet.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new bridge sessions.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              onClick={() => onTournamentSelect(tournament.id)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tournament.name}
                    </h3>
                    <p className="text-blue-600 font-medium">
                      {formatDate(tournament.date)}
                    </p>
                    {tournament.venue && (
                      <p className="text-gray-600 mt-1">
                        📍 {tournament.venue}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {tournament.boards.length} boards
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-sm">
                      Click to explore boards and join discussions
                    </p>
                    <div className="flex items-center text-blue-600">
                      <span className="text-sm font-medium">Enter tournament</span>
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentSelector;