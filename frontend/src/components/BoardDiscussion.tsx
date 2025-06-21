import React, { useState, useEffect } from 'react';
import Comments from './Comments';
import PollCreator from './PollCreator';
import PollDisplay from './PollDisplay';
import BiddingEntry from './BiddingEntry';
import LabelManager from './LabelManager';
import { boardAPI } from '../utils/api';

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
  options: any[];
}

interface BoardDiscussionProps {
  boardId: string;
  boardNumber: number;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'comments' | 'polls' | 'create-poll' | 'bidding' | 'labels';
}

const BoardDiscussion: React.FC<BoardDiscussionProps> = ({ 
  boardId, 
  boardNumber, 
  isOpen, 
  onClose,
  initialTab = 'comments'
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'polls' | 'create-poll' | 'bidding' | 'labels'>(initialTab);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [boardData, setBoardData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && boardId) {
      fetchBoardData();
    }
  }, [isOpen, boardId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoard(boardId);
      setPolls(response.board.polls || []);
      setBoardData(response.board);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePollCreated = (newPoll: Poll) => {
    setPolls(prev => [newPoll, ...prev]);
    setActiveTab('polls');
  };

  const handlePollUpdate = (updatedPoll: Poll) => {
    setPolls(prev => prev.map(poll => 
      poll.id === updatedPoll.id ? updatedPoll : poll
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Board {boardNumber} Discussion</h2>
            <p className="text-blue-100 text-sm">Share your analysis and insights</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💬 Comments
            </button>
            <button
              onClick={() => setActiveTab('polls')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'polls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Polls {polls.length > 0 && `(${polls.length})`}
            </button>
            <button
              onClick={() => setActiveTab('create-poll')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'create-poll'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ➕ Create Poll
            </button>
            <button
              onClick={() => setActiveTab('bidding')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bidding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🃏 Bidding
            </button>
            <button
              onClick={() => setActiveTab('labels')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'labels'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏷️ Labels
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <>
                {activeTab === 'comments' && (
                  <Comments boardId={boardId} />
                )}

                {activeTab === 'polls' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Community Polls</h3>
                      <p className="text-gray-600">
                        Vote on bridge decisions and see what the community thinks
                      </p>
                    </div>

                    {polls.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-gray-500 text-lg mb-4">No polls created yet</p>
                        <button
                          onClick={() => setActiveTab('create-poll')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create First Poll
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {polls.map((poll) => (
                          <PollDisplay
                            key={poll.id}
                            poll={poll}
                            onPollUpdate={handlePollUpdate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'create-poll' && (
                  <PollCreator
                    boardId={boardId}
                    onPollCreated={handlePollCreated}
                    onClose={() => setActiveTab('polls')}
                  />
                )}

                {activeTab === 'bidding' && boardData && (
                  <BiddingEntry
                    boardId={boardId}
                    boardNumber={boardNumber}
                    dealer={boardData.dealer}
                  />
                )}

                {activeTab === 'labels' && (
                  <LabelManager
                    boardId={boardId}
                    showBoardLabels={true}
                    onLabelChange={() => {
                      // Optionally refresh board data or update parent component
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Bridge discussion for Board {boardNumber}
            </div>
            <div className="flex space-x-4">
              <span>{polls.length} polls</span>
              <span>•</span>
              <span>Public discussion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDiscussion;