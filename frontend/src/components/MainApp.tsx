import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import TournamentSelector from './TournamentSelector';
import TournamentViewer from './TournamentViewer';
import AdminPanel from './AdminPanel';

const MainApp: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'tournaments' | 'tournament-view' | 'admin'>('tournaments');

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.username;
  };

  const getUserRole = () => {
    if (!user) return '';
    return user.role === 'ADMIN' ? ' (Admin)' : '';
  };

  const handleTournamentSelect = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setCurrentView('tournament-view');
  };

  const handleBackToTournaments = () => {
    setSelectedTournamentId(null);
    setCurrentView('tournaments');
  };

  const handleAdminClick = () => {
    setCurrentView('admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bridge Discussion</h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={handleBackToTournaments}
                className={`font-medium transition-colors ${
                  currentView === 'tournaments' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              {user?.role === 'ADMIN' && (
                <button 
                  onClick={handleAdminClick}
                  className={`font-medium transition-colors ${
                    currentView === 'admin' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Admin
                </button>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{getUserDisplayName()}</span>
                  <span className="text-blue-600">{getUserRole()}</span>
                </div>
              )}
              <button
                onClick={handleAuthClick}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isAuthenticated
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAuthenticated ? 'Sign Out' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'tournaments' && (
          <TournamentSelector onTournamentSelect={handleTournamentSelect} />
        )}
        
        {currentView === 'tournament-view' && selectedTournamentId && (
          <TournamentViewer 
            tournamentId={selectedTournamentId}
            onBack={handleBackToTournaments}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Bridge Bidding Discussion Platform</p>
            <p className="mt-1">
              {isAuthenticated ? (
                <>Connected to backend API • {user?.role === 'ADMIN' ? 'Admin access enabled' : 'User authenticated'}</>
              ) : (
                'Sign in to access full features and save your progress'
              )}
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default MainApp;