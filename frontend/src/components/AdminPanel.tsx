import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI, authAPI } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GUEST' | 'PENDING_APPROVAL';
  createdAt: string;
}

interface TournamentStats {
  totalTournaments: number;
  totalBoards: number;
  recentTournaments: Array<{
    id: string;
    name: string;
    date: string;
    venue: string;
    source: string;
    _count: {
      boards: number;
    };
  }>;
}

const AdminPanel: React.FC = () => {
  const { user, isAuthenticated, updateUserRole } = useAuth();
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);


  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchPendingUsers();
    }
  }, [isAdmin]);

  const fetchPendingUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      const response = await authAPI.getPendingUsers();
      setPendingUsers(response.users);
    } catch (err) {
      setError('Failed to load pending users.');
      console.error('Error fetching pending users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getStats();
      setStats(response);
    } catch (err) {
      setError('Failed to load tournament statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pbn')) {
        setError('Please select a .pbn file');
        setSelectedFile(null);
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a PBN file first');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportResult(null);

      console.log('Starting PBN import for file:', selectedFile.name);
      const result = await tournamentAPI.importPBN(selectedFile);
      
      setImportResult(
        `Successfully imported "${result.tournament.name}" with ${result.tournament.boardsCreated} boards`
      );
      
      // Refresh stats
      await fetchStats();
      
      // Clear file selection
      setSelectedFile(null);
      const fileInput = document.getElementById('pbn-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import PBN file');
    } finally {
      setImporting(false);
    }
  };

  const handleApproveUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to approve user "${username}"?`)) {
      return;
    }
    try {
      setError(null);
      await updateUserRole(userId, 'USER');
      setImportResult(`Successfully approved user "${username}".`);
      fetchPendingUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user.');
    }
  };

  const handleRejectUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to reject and delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setError(null);
      await authAPI.deleteUser(userId); // Assuming a deleteUser API exists or will be created
      setImportResult(`Successfully rejected and deleted user "${username}".`);
      fetchPendingUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user.');
    }
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete tournament "${tournamentName}"? This will also delete all associated boards and cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await tournamentAPI.deleteTournament(tournamentId);
      setImportResult(`Successfully deleted tournament "${tournamentName}"`);
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          Please log in to access the admin panel.
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Statistics</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading statistics...</span>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{stats.totalTournaments}</div>
              <div className="text-blue-600">Total Tournaments</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{stats.totalBoards}</div>
              <div className="text-green-600">Total Boards</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pending User Approvals */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending User Approvals</h2>
        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading pending users...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">
            No users pending approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((pendingUser) => (
                  <tr key={pendingUser.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pendingUser.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pendingUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pendingUser.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveUser(pendingUser.id, pendingUser.username)}
                        className="text-green-600 hover:text-green-800 mr-3"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectUser(pendingUser.id, pendingUser.username)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PBN Import */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import PBN File</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PBN File
            </label>
            <input
              id="pbn-file-input"
              type="file"
              accept=".pbn"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a .pbn file (max 5MB) containing tournament data
            </p>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Selected File:</div>
              <div className="text-sm text-gray-600">{selectedFile.name}</div>
              <div className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </span>
            ) : (
              'Import PBN File'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {importResult && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {importResult}
          </div>
        )}
      </div>

      {/* Recent Tournaments */}
      {stats && stats.recentTournaments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tournaments</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tournament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentTournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tournament.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tournament.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tournament.venue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tournament._count.boards}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tournament.source === 'PBN Upload' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tournament.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
