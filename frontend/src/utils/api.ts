// API utilities for frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('bridgeToken');
};

// Set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('bridgeToken', token);
};

// Remove auth token from localStorage
const removeAuthToken = (): void => {
  localStorage.removeItem('bridgeToken');
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
};

// Tournament and Board API functions
export const boardAPI = {
  getTournaments: async () => {
    return await apiRequest('/tournaments');
  },

  getTournament: async (tournamentId: string) => {
    return await apiRequest(`/tournaments/${tournamentId}`);
  },

  getBoard: async (boardId: string) => {
    return await apiRequest(`/boards/${boardId}`);
  },

  getRecentBoards: async (limit: number = 10) => {
    return await apiRequest(`/recent?limit=${limit}`);
  },

  searchTournaments: async (filters: any) => {
    const params = new URLSearchParams();
    
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.vulnerability) params.append('vulnerability', filters.vulnerability);
    if (filters.dealer) params.append('dealer', filters.dealer);
    if (filters.boardNumberFrom) params.append('boardNumberFrom', filters.boardNumberFrom);
    if (filters.boardNumberTo) params.append('boardNumberTo', filters.boardNumberTo);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    
    // Handle multiple label IDs
    if (filters.selectedLabels && filters.selectedLabels.length > 0) {
      filters.selectedLabels.forEach((labelId: string) => {
        params.append('labels', labelId);
      });
    }
    
    return await apiRequest(`/search?${params.toString()}`);
  },

  addComment: async (boardId: string, content: string, parentId?: string) => {
    return await apiRequest(`/boards/${boardId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  },
};

// Poll API functions
export const pollAPI = {
  createPoll: async (boardId: string, title: string, description: string, pollType: 'BIDDING' | 'PLAY' | 'GENERAL', options: { text: string; description?: string }[], biddingTableId?: string) => {
    return await apiRequest(`/boards/${boardId}/polls`, {
      method: 'POST',
      body: JSON.stringify({ title, description, pollType, options, biddingTableId }),
    });
  },

  vote: async (pollId: string, optionId: string) => {
    return await apiRequest(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  getPoll: async (pollId: string) => {
    return await apiRequest(`/polls/${pollId}`);
  },

  closePoll: async (pollId: string) => {
    return await apiRequest(`/polls/${pollId}/close`, {
      method: 'PATCH',
    });
  },
};

// Bidding API functions
export const biddingAPI = {
  createBiddingTable: async (boardId: string, bids: any[]) => {
    return await apiRequest(`/boards/${boardId}/bidding`, {
      method: 'POST',
      body: JSON.stringify({ bids }),
    });
  },

  getBiddingTables: async (boardId: string) => {
    return await apiRequest(`/boards/${boardId}/bidding`);
  },

  updateBiddingTable: async (biddingTableId: string, bids: any[]) => {
    return await apiRequest(`/bidding/${biddingTableId}`, {
      method: 'PUT',
      body: JSON.stringify({ bids }),
    });
  },

  deleteBiddingTable: async (biddingTableId: string) => {
    return await apiRequest(`/bidding/${biddingTableId}`, {
      method: 'DELETE',
    });
  },

  getBiddingTable: async (biddingTableId: string) => {
    return await apiRequest(`/bidding/${biddingTableId}`);
  },
};

// Label API functions
export const labelAPI = {
  getLabels: async () => {
    return await apiRequest('/labels');
  },

  createLabel: async (name: string, color?: string, description?: string) => {
    return await apiRequest('/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color, description }),
    });
  },

  updateLabel: async (labelId: string, name: string, color?: string, description?: string) => {
    return await apiRequest(`/labels/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color, description }),
    });
  },

  deleteLabel: async (labelId: string) => {
    return await apiRequest(`/labels/${labelId}`, {
      method: 'DELETE',
    });
  },

  // New voting-based label system
  toggleLabelVote: async (boardId: string, labelId: string) => {
    return await apiRequest(`/labels/boards/${boardId}/labels/${labelId}/vote`, {
      method: 'POST',
    });
  },

  getBoardLabelStatus: async (boardId: string) => {
    return await apiRequest(`/labels/boards/${boardId}/status`);
  },

  // Legacy functions for backwards compatibility

  getBoardLabels: async (boardId: string) => {
    return await apiRequest(`/labels/boards/${boardId}`);
  },
};

// Tournament management API functions (Admin only)
export const tournamentAPI = {
  importPBN: async (file: File) => {
    const formData = new FormData();
    formData.append('pbnFile', file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/tournaments/import-pbn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getStats: async () => {
    return await apiRequest('/tournaments/stats');
  },

  deleteTournament: async (tournamentId: string) => {
    return await apiRequest(`/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  },
};

export { getAuthToken, setAuthToken, removeAuthToken };