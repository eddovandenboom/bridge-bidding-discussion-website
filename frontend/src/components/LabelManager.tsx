import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { labelAPI } from '../utils/api';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  _count?: {
    boardLabels: number;
  };
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
  const [boardLabels, setBoardLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  useEffect(() => {
    fetchLabels();
    if (boardId && showBoardLabels) {
      fetchBoardLabels();
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

  const fetchBoardLabels = async () => {
    if (!boardId) return;
    
    try {
      const response = await labelAPI.getBoardLabels(boardId);
      setBoardLabels(response.boardLabels);
    } catch (err) {
      console.error('Failed to load board labels:', err);
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
      await fetchLabels();
      
      if (onLabelChange) onLabelChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label');
    }
  };

  const deleteLabel = async (labelId: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this label?')) return;

    try {
      setError(null);
      await labelAPI.deleteLabel(labelId);
      await fetchLabels();
      
      if (onLabelChange) onLabelChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label');
    }
  };

  const toggleBoardLabel = async (labelId: string) => {
    if (!isAuthenticated || !boardId) return;

    const isApplied = boardLabels.some(bl => bl.label.id === labelId);

    try {
      setError(null);
      if (isApplied) {
        await labelAPI.removeLabelFromBoard(boardId, labelId);
      } else {
        await labelAPI.applyLabelToBoard(boardId, labelId);
      }
      
      await fetchBoardLabels();
      if (onLabelChange) onLabelChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board labels');
    }
  };

  const isBoardLabelApplied = (labelId: string): boolean => {
    return boardLabels.some(bl => bl.label.id === labelId);
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
          {showBoardLabels ? 'Board Labels' : 'Label Management'}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Create Label Form */}
      {showCreateForm && isAuthenticated && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Create New Label</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="e.g., Slam Deal, Interesting Defense"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
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
        {labels.length === 0 ? (
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
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                showBoardLabels && isBoardLabelApplied(label.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {showBoardLabels && boardId && isAuthenticated && (
                  <input
                    type="checkbox"
                    checked={isBoardLabelApplied(label.id)}
                    onChange={() => toggleBoardLabel(label.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                )}
                
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: label.color }}
                />
                
                <div>
                  <span className="font-medium text-gray-900">{label.name}</span>
                  {label.description && (
                    <p className="text-sm text-gray-600 mt-1">{label.description}</p>
                  )}
                  {label._count && (
                    <p className="text-xs text-gray-500 mt-1">
                      Used in {label._count.boardLabels} board{label._count.boardLabels !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {!showBoardLabels && isAuthenticated && (
                <button
                  onClick={() => deleteLabel(label.id)}
                  className="text-red-600 hover:text-red-700 p-1 rounded"
                  title="Delete label"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Board Labels Summary */}
      {showBoardLabels && boardLabels.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Applied Labels:</h4>
          <div className="flex flex-wrap gap-2">
            {boardLabels.map((boardLabel) => (
              <span
                key={boardLabel.id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: boardLabel.label.color }}
              >
                {boardLabel.label.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Sign in to manage and apply labels
        </div>
      )}
    </div>
  );
};

export default LabelManager;