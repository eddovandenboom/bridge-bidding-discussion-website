import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PollDisplay from './PollDisplay';
import { pollAPI } from '../utils/api';

interface PollOption {
  id: string;
  text: string;
  description?: string;
  votes: {
    id: string;
    user: {
      id: string;
      username: string;
    };
  }[];
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  pollType: 'BIDDING' | 'PLAY' | 'GENERAL';
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  options: PollOption[];
}

interface BoardPollListProps {
  boardId: string;
}

const BoardPollList: React.FC<BoardPollListProps> = ({ boardId }) => {
  const { isAuthenticated } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, [boardId]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch polls for this board
      const data = await pollAPI.getBoardPolls(boardId);
      setPolls(data.polls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handlePollUpdate = (updatedPoll: Poll) => {
    setPolls(prev => prev.map(poll => 
      poll.id === updatedPoll.id ? updatedPoll : poll
    ));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading polls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading polls</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchPolls}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
        <p className="text-gray-500 mb-4">
          Be the first to create a poll for this board! Polls are great for discussing bidding decisions or card play strategies.
        </p>
        {!isAuthenticated && (
          <p className="text-sm text-gray-400">
            Sign in to create polls and participate in voting
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Board Polls ({polls.length})
        </h3>
        <button
          onClick={fetchPolls}
          className="text-sm text-blue-600 hover:text-blue-700"
          title="Refresh polls"
        >
          🔄 Refresh
        </button>
      </div>

      {polls.map((poll) => (
        <div key={poll.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{poll.title}</h4>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span>by {poll.user.username}</span>
                  <span>{formatDate(poll.createdAt)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    poll.pollType === 'BIDDING' ? 'bg-blue-100 text-blue-800' :
                    poll.pollType === 'PLAY' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {poll.pollType}
                  </span>
                </div>
              </div>
              {!poll.isActive && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                  Closed
                </span>
              )}
            </div>
            {poll.description && (
              <p className="mt-2 text-sm text-gray-600">{poll.description}</p>
            )}
          </div>
          
          <div className="p-4">
            <PollDisplay 
              poll={poll} 
              onPollUpdate={handlePollUpdate}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardPollList;