import React, { useState } from 'react';
import BridgeHandSimple, { parsePBNHand } from './BridgeHandSimple';
import BoardDiscussion from './BoardDiscussion';

const CompleteBridgeDemo: React.FC = () => {
  const [showDiscussion, setShowDiscussion] = useState(false);
  
  // Sample board data
  const sampleBoard = {
    id: '1',
    boardNumber: 1,
    dealer: 'NORTH',
    vulnerability: 'None',
    hands: {
      north: 'KQ95.A743.A2.Q42',
      south: 'A832.KQ2.K876.A3', 
      east: 'J74.J985.Q543.K7',
      west: 'T6.T6.JT9.JT9865',
    },
  };

  // Parse hands
  const hands = {
    north: parsePBNHand(sampleBoard.hands.north),
    south: parsePBNHand(sampleBoard.hands.south),
    east: parsePBNHand(sampleBoard.hands.east),
    west: parsePBNHand(sampleBoard.hands.west)
  };

  const getVulnerabilityText = (vulnerability: string): string => {
    switch (vulnerability) {
      case 'None': return 'Neither vulnerable';
      case 'NS': return 'North-South vulnerable';
      case 'EW': return 'East-West vulnerable';
      case 'Both': return 'Both vulnerable';
      default: return vulnerability;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bridge Discussion</h1>
                <p className="text-xs text-gray-500">Tuesday Evening Analysis</p>
              </div>
            </div>

            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Tournaments
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Recent Boards
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Labels
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Polls
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Bridge Discussion
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Analyze bridge hands from your Tuesday evening games. Discuss bidding sequences, 
              share your experiences, and learn from fellow players.
            </p>
          </div>

          {/* Bridge Board */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Sample Bridge Hand - Board {sampleBoard.boardNumber}
              </h3>
              <p className="text-gray-600">
                Interactive bridge hand display with proper card formatting and suit symbols.
              </p>
            </div>

            {/* Bridge Table */}
            <div className="bg-green-800 rounded-lg p-8 relative">
              {/* Board Information */}
              <div className="text-center mb-6">
                <div className="bg-white rounded-lg px-4 py-2 inline-block shadow-md">
                  <h3 className="text-lg font-bold text-gray-800">Board {sampleBoard.boardNumber}</h3>
                  <p className="text-sm text-gray-600">
                    Dealer: <span className="font-semibold">{sampleBoard.dealer}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {getVulnerabilityText(sampleBoard.vulnerability)}
                  </p>
                </div>
              </div>

              {/* Bridge Table Layout */}
              <div className="relative min-h-[500px] flex items-center justify-center">
                {/* North */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <BridgeHandSimple hand={hands.north} position="north" />
                </div>

                {/* West */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <BridgeHandSimple hand={hands.west} position="west" />
                </div>

                {/* East */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <BridgeHandSimple hand={hands.east} position="east" />
                </div>

                {/* South */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <BridgeHandSimple hand={hands.south} position="south" />
                </div>

                {/* Center of table - smaller and better positioned */}
                <div className="h-24 w-32 bg-green-900 rounded-lg border-2 border-green-700 flex items-center justify-center shadow-lg">
                  <div className="text-white text-xs font-semibold text-center">
                    <div>Table</div>
                    <div className="text-xs mt-1">Board {sampleBoard.boardNumber}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <button 
                onClick={() => setShowDiscussion(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                💬 Join Discussion
              </button>
              <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                🃏 Enter Bidding
              </button>
              <button 
                onClick={() => setShowDiscussion(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                📊 Create Poll
              </button>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-3">💬</div>
              <h4 className="font-semibold text-gray-800 mb-2">Threaded Comments</h4>
              <p className="text-gray-600 text-sm">
                Discuss each board with threaded comments. Share your analysis and learn from others.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-3">🃏</div>
              <h4 className="font-semibold text-gray-800 mb-2">Bidding Analysis</h4>
              <p className="text-gray-600 text-sm">
                Enter actual bidding sequences from your table with alerts and explanations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-3">📊</div>
              <h4 className="font-semibold text-gray-800 mb-2">Community Polls</h4>
              <p className="text-gray-600 text-sm">
                Create polls for bidding decisions and see how the community would handle each situation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Bridge Bidding Discussion Platform</p>
            <p className="mt-1">Analyze hands, discuss bidding, improve your game</p>
          </div>
        </div>
      </footer>

      {/* Board Discussion Modal */}
      {showDiscussion && (
        <BoardDiscussion
          boardId={sampleBoard.id}
          boardNumber={sampleBoard.boardNumber}
          isOpen={showDiscussion}
          onClose={() => setShowDiscussion(false)}
        />
      )}
    </div>
  );
};

export default CompleteBridgeDemo;