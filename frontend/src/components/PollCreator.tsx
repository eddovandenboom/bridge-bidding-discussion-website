import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollAPI } from '../utils/api';
import BiddingSequenceSelector from './BiddingSequenceSelector';

interface PollCreatorProps {
  boardId: string;
  onPollCreated?: (poll: any) => void;
  onClose?: () => void;
}

const PollCreator: React.FC<PollCreatorProps> = ({ boardId, onPollCreated, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pollType: 'BIDDING' as 'BIDDING' | 'PLAY' | 'GENERAL',
  });
  const [options, setOptions] = useState([
    { text: '', description: '' },
    { text: '', description: '' },
  ]);
  const [selectedBiddingTableId, setSelectedBiddingTableId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index: number, field: 'text' | 'description', value: string) => {
    setOptions(prev => prev.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    ));
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions(prev => [...prev, { text: '', description: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be signed in to create a poll');
      return;
    }

    // Validate form
    if (!formData.title.trim()) {
      setError('Poll title is required');
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await pollAPI.createPoll(
        boardId,
        formData.title.trim(),
        formData.description.trim(),
        formData.pollType,
        validOptions.map(opt => ({
          text: opt.text.trim(),
          description: opt.description.trim() || undefined
        })),
        selectedBiddingTableId || undefined
      );

      if (onPollCreated) {
        onPollCreated(response.poll);
      }

      // Reset form
      setFormData({ title: '', description: '', pollType: 'BIDDING' });
      setOptions([{ text: '', description: '' }, { text: '', description: '' }]);
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  const pollTypeDescriptions = {
    BIDDING: 'Ask about bidding decisions and conventions',
    PLAY: 'Discuss card play strategies and techniques',
    GENERAL: 'General questions about the hand or situation'
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Create Poll</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poll Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Question *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., What should South bid with this hand?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Poll Type */}
        <div>
          <label htmlFor="pollType" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Type
          </label>
          <select
            id="pollType"
            name="pollType"
            value={formData.pollType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BIDDING">Bidding</option>
            <option value="PLAY">Play</option>
            <option value="GENERAL">General</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {pollTypeDescriptions[formData.pollType]}
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Context (optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Provide additional context or explanation for your poll..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Answer Options *
          </label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                  placeholder={`Option ${index + 1} text...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  required
                />
                <input
                  type="text"
                  value={option.description}
                  onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                  placeholder="Optional explanation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            ))}
          </div>
          
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Option
            </button>
          )}
        </div>

        {/* Bidding Sequence Selector */}
        <BiddingSequenceSelector
          boardId={boardId}
          selectedBiddingTableId={selectedBiddingTableId}
          onSelect={setSelectedBiddingTableId}
          className="mt-6"
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !isAuthenticated}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>

      {!isAuthenticated && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Sign in to create polls and participate in discussions</p>
        </div>
      )}
    </div>
  );
};

export default PollCreator;