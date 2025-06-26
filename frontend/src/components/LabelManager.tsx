import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { labelAPI } from '../utils/api';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface LabelStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  userVoted: boolean;
  voteCount: number;
  isGloballyApplied: boolean;
}

interface LabelManagerProps {
  boardId?: string;
  onLabelChange?: () => void;
  showBoardLabels?: boolean;
}

const LabelManager: React.FC<LabelManagerProps> = ({ 
  boardId, 
  onLabelChange, 
  showBoardLabels = false 
}) => {
  const { isAuthenticated } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelStatuses, setLabelStatuses] = useState<LabelStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (showBoardLabels && boardId) {
      fetchBoardLabelStatus();
    } else {
      fetchLabels();
    }
  }, [boardId, showBoardLabels]);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await labelAPI.getLabels();
      setLabels(response.labels);
    } catch (err) {
      setError('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardLabelStatus = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const response = await labelAPI.getBoardLabelStatus(boardId);
      setLabelStatuses(response.labels.sort((a: LabelStatus, b: LabelStatus) => b.voteCount - a.voteCount));
    } catch (err) {
      setError('Failed to load board label status');
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async () => {
    if (!isAuthenticated || !newLabel.name.trim()) return;

    try {
      setError(null);
      await labelAPI.createLabel(
        newLabel.name.trim(),
        newLabel.color,
        newLabel.description.trim() || undefined
      );
      
      setNewLabel({ name: '', color: '#3B82F6', description: '' });
      setShowCreateForm(false);
      
      if (showBoardLabels && boardId) {
        await fetchBoardLabelStatus();
      } else {
        await fetchLabels();
      }
      onLabelChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label');
    }
  };

  const deleteLabel = async (labelId: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this label?')) return;

    try {
      setError(null);
      await labelAPI.deleteLabel(labelId);
      
      if (showBoardLabels && boardId) {
        await fetchBoardLabelStatus();
      } else {
        await fetchLabels();
      }
      onLabelChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label');
    }
  };

  const handleVoteChange = async (labelId: string) => {
    if (!isAuthenticated || !boardId) return;

    const originalStatuses = [...labelStatuses];
    setLabelStatuses(prevStatuses =>
      prevStatuses.map(status =>
        status.id === labelId
          ? { ...status, userVoted: !status.userVoted }
          : status
      )
    );

    try {
      setError(null);
      const response = await labelAPI.toggleLabelVote(boardId, labelId);
      
      setLabelStatuses(prevStatuses => {
        const newStatuses = prevStatuses.map(status =>
          status.id === labelId
            ? {
                ...status,
                userVoted: response.userVoted,
                voteCount: response.status.voteCount,
                isGloballyApplied: response.status.isGlobal,
              }
            : status
        );
        return newStatuses.sort((a: LabelStatus, b: LabelStatus) => b.voteCount - a.voteCount);
      });

      onLabelChange?.();
    } catch (err) {
      setLabelStatuses(originalStatuses);
      setError(err instanceof Error ? err.message : 'Failed to vote on label');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading labels...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {showBoardLabels ? 'Board Label Voting' : 'Label Management'}
        </h3>
        {isAuthenticated && !showBoardLabels && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Label'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showBoardLabels && !isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm">
          Please log in to vote on labels for this board.
        </div>
      )}

      {/* Create Label Form */}
      {showCreateForm && isAuthenticated && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Create New Label</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="e.g., Slam Deal, Interesting Defense"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex space-x-2">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewLabel({ ...newLabel, color })}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newLabel.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={newLabel.description}
              onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
              placeholder="Brief description of when to use this label"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={createLabel}
              disabled={!newLabel.name.trim()}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Create Label
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="space-y-2">
        {showBoardLabels ? (
          labelStatuses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🏷️</div>
              <p>No labels available yet</p>
              {isAuthenticated && (
                <p className="text-sm mt-1">Create labels in the Label Management section</p>
              )}
            </div>
          ) : (
            labelStatuses.map((labelStatus) => (
              <div
                key={labelStatus.id}
                className={`p-4 border rounded-lg transition-colors ${
                  labelStatus.isGloballyApplied
                    ? 'bg-green-50 border-green-200'
                    : labelStatus.voteCount > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: labelStatus.color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{labelStatus.name}</span>
                        {labelStatus.isGloballyApplied && (
                          <span className="text-green-600 text-sm font-medium">⭐ Global</span>
                        )}
                        {!labelStatus.isGloballyApplied && labelStatus.voteCount > 0 && (
                          <span className="text-yellow-600 text-sm font-medium">📈 Trending</span>
                        )}
                      </div>
                      {labelStatus.description && (
                        <p className="text-sm text-gray-600 mt-1">{labelStatus.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {labelStatus.voteCount > 0 ? (
                          `${labelStatus.voteCount} vote${labelStatus.voteCount > 1 ? 's' : ''}`
                        ) : (
                          'No votes yet'
                        )}
                      </div>
                    </div>
                  </div>

                  {isAuthenticated && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={labelStatus.userVoted}
                        onChange={() => handleVoteChange(labelStatus.id)}
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        title={labelStatus.userVoted ? 'Remove your vote' : 'Vote for this label'}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {labelStatus.userVoted ? 'Voted' : 'Vote'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          labels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🏷️</div>
              <p>No labels created yet</p>
              {isAuthenticated && (
                <p className="text-sm mt-1">Create your first label to start organizing boards</p>
              )}
            </div>
          ) : (
            labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: label.color }}
                  />
                  <div>
                    <span className="font-medium text-gray-900">{label.name}</span>
                    {label.description && (
                      <p className="text-sm text-gray-600 mt-1">{label.description}</p>
                    )}
                  </div>
                </div>

                {isAuthenticated && (
                  <button
                    onClick={() => deleteLabel(label.id)}
                    className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                    title="Delete label"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Global Labels Summary */}
      {showBoardLabels && labelStatuses.some(l => l.isGloballyApplied) && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Globally Applied Labels:</h4>
          <div className="flex flex-wrap gap-2">
            {labelStatuses
              .filter(l => l.isGloballyApplied)
              .map((labelStatus) => (
                <span
                  key={labelStatus.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: labelStatus.color }}
                >
                  {labelStatus.name} ({labelStatus.voteCount})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelManager;