import React, { useState, useEffect } from 'react';
import { labelAPI } from '../utils/api';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface SearchAndFilterProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
}

export interface SearchFilters {
  searchTerm: string;
  selectedLabels: string[];
  vulnerability: string;
  dealer: string;
  boardNumberFrom: string;
  boardNumberTo: string;
  dateFrom: string;
  dateTo: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  onSearch, 
  onClear 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    selectedLabels: [],
    vulnerability: '',
    dealer: '',
    boardNumberFrom: '',
    boardNumberTo: '',
    dateFrom: '',
    dateTo: ''
  });

  const vulnerabilityOptions = [
    { value: '', label: 'Any vulnerability' },
    { value: 'None', label: 'Neither vulnerable' },
    { value: 'NS', label: 'North-South vulnerable' },
    { value: 'EW', label: 'East-West vulnerable' },
    { value: 'Both', label: 'Both vulnerable' }
  ];

  const dealerOptions = [
    { value: '', label: 'Any dealer' },
    { value: 'NORTH', label: 'North' },
    { value: 'SOUTH', label: 'South' },
    { value: 'EAST', label: 'East' },
    { value: 'WEST', label: 'West' }
  ];

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await labelAPI.getLabels();
      setLabels(response.labels);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto-search when filters change
    onSearch(newFilters);
  };

  const handleLabelToggle = (labelId: string) => {
    const newSelectedLabels = filters.selectedLabels.includes(labelId)
      ? filters.selectedLabels.filter(id => id !== labelId)
      : [...filters.selectedLabels, labelId];
    
    handleFilterChange('selectedLabels', newSelectedLabels);
  };

  const clearAllFilters = () => {
    const emptyFilters: SearchFilters = {
      searchTerm: '',
      selectedLabels: [],
      vulnerability: '',
      dealer: '',
      boardNumberFrom: '',
      boardNumberTo: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(emptyFilters);
    onClear();
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.selectedLabels.length > 0 ||
      filters.vulnerability !== '' ||
      filters.dealer !== '' ||
      filters.boardNumberFrom !== '' ||
      filters.boardNumberTo !== '' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== ''
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search tournaments, board numbers, or comments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            isExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Filters
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {filters.selectedLabels.map(labelId => {
              const label = labels.find(l => l.id === labelId);
              return label ? (
                <span
                  key={labelId}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                  <button
                    onClick={() => handleLabelToggle(labelId)}
                    className="ml-1 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
            
            {filters.vulnerability && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                Vulnerability: {vulnerabilityOptions.find(v => v.value === filters.vulnerability)?.label}
                <button
                  onClick={() => handleFilterChange('vulnerability', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.dealer && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Dealer: {dealerOptions.find(d => d.value === filters.dealer)?.label}
                <button
                  onClick={() => handleFilterChange('dealer', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}

            {(filters.boardNumberFrom || filters.boardNumberTo) && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Boards: {filters.boardNumberFrom || '1'}-{filters.boardNumberTo || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('boardNumberFrom', '');
                    handleFilterChange('boardNumberTo', '');
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelToggle(label.id)}
                    className={`inline-flex items-center px-3 py-1 text-sm rounded-full border transition-colors ${
                      filters.selectedLabels.includes(label.id)
                        ? 'text-white border-transparent'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    style={filters.selectedLabels.includes(label.id) ? { backgroundColor: label.color } : {}}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Game Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vulnerability</label>
              <select
                value={filters.vulnerability}
                onChange={(e) => handleFilterChange('vulnerability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vulnerabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dealer</label>
              <select
                value={filters.dealer}
                onChange={(e) => handleFilterChange('dealer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dealerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Board Number Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board Number Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.boardNumberFrom}
                onChange={(e) => handleFilterChange('boardNumberFrom', e.target.value)}
                placeholder="From"
                min="1"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filters.boardNumberTo}
                onChange={(e) => handleFilterChange('boardNumberTo', e.target.value)}
                placeholder="To"
                min="1"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;