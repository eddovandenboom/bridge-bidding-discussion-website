import React from 'react';
import BridgeTable from './BridgeTable';

const BoardDemo: React.FC = () => {
  // Sample board data - in a real app this would come from the API
  const sampleBoard = {
    id: '1',
    boardNumber: 1,
    dealer: 'NORTH' as const,
    vulnerability: 'None',
    hands: {
      north: 'KQ95.A743.A2.Q42',
      south: 'A832.KQ2.K876.A3',
      east: 'J74.J985.Q543.K7',
      west: 'T6.T6.JT9.JT9865',
    },
  };

  return (
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

      {/* Sample Board */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Sample Bridge Hand
          </h3>
          <p className="text-gray-600">
            This is how bridge boards will be displayed on the platform. 
            Each hand shows the cards in standard bridge notation with suit symbols.
          </p>
        </div>

        <BridgeTable board={sampleBoard} />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add Comment
          </button>
          <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
            Enter Bidding
          </button>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors">
            Create Poll
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
  );
};

export default BoardDemo;