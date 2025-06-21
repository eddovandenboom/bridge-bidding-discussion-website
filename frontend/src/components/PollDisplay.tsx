import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

interface PollDisplayProps {
  poll: Poll;
  onPollUpdate?: (poll: Poll) => void;
  onClose?: () => void;
}

const PollDisplay: React.FC<PollDisplayProps> = ({ poll, onPollUpdate, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate vote statistics
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  
  // Find user's current vote
  const userVote = poll.options.find(option => 
    option.votes.some(vote => vote.user.id === user?.id)
  );

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated) {
      setError('You must be signed in to vote');
      return;
    }

    if (!poll.isActive) {
      setError('This poll is no longer accepting votes');
      return;
    }

    try {
      setVoting(true);
      setError(null);

      const response = await pollAPI.vote(poll.id, optionId);
      
      if (onPollUpdate) {
        onPollUpdate(response.poll);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (votes: number): number => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
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

  const getPollTypeColor = (pollType: string): string => {
    switch (pollType) {
      case 'BIDDING': return 'bg-blue-100 text-blue-800';
      case 'PLAY': return 'bg-green-100 text-green-800';
      case 'GENERAL': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPollTypeIcon = (pollType: string): string => {
    switch (pollType) {
      case 'BIDDING': return '🃏';
      case 'PLAY': return '♠';
      case 'GENERAL': return '💭';
      default: return '📊';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Poll Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPollTypeColor(poll.pollType)}`}>
              {getPollTypeIcon(poll.pollType)} {poll.pollType}
            </span>
            {!poll.isActive && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Closed
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{poll.title}</h3>
          {poll.description && (
            <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>By {poll.user.username}</span>
            <span>•</span>
            <span>{formatDate(poll.createdAt)}</span>
            <span>•</span>
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl ml-4"
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

      {/* Poll Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes.length);
          const isUserChoice = userVote?.id === option.id;
          const canVote = isAuthenticated && poll.isActive;

          return (
            <div
              key={option.id}
              className={`border rounded-lg p-4 transition-all ${
                canVote ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50' : ''
              } ${isUserChoice ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => canVote && !voting && handleVote(option.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{option.text}</span>
                    {isUserChoice && (
                      <span className="text-blue-600 text-sm">✓ Your choice</span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-gray-600 text-sm mt-1">{option.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-gray-900">{percentage}%</div>
                  <div className="text-sm text-gray-500">{option.votes.length}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isUserChoice ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Voters (for transparency) */}
              {option.votes.length > 0 && (
                <div className="text-xs text-gray-500">
                  Voted by: {option.votes.map(vote => vote.user.username).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        {!isAuthenticated ? (
          <p className="text-gray-500 text-sm text-center">
            Sign in to participate in this poll
          </p>
        ) : !poll.isActive ? (
          <p className="text-gray-500 text-sm text-center">
            This poll has been closed by the creator
          </p>
        ) : userVote ? (
          <p className="text-green-600 text-sm text-center">
            You voted for "{userVote.text}". You can change your vote by selecting another option.
          </p>
        ) : (
          <p className="text-blue-600 text-sm text-center">
            Click on an option to cast your vote
          </p>
        )}

        {voting && (
          <div className="text-center mt-2">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Casting vote...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDisplay;