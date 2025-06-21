import React from 'react';

const SimpleDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌉 Bridge Discussion</h1>
          <p className="text-lg text-gray-600">
            Welcome to the bridge bidding discussion platform!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Sample Bridge Hand</h2>
          
          {/* Simple bridge table representation */}
          <div className="bg-green-800 rounded-lg p-8 text-white">
            <div className="grid grid-cols-3 gap-4 h-64">
              {/* North */}
              <div></div>
              <div className="text-center">
                <h3 className="font-bold">NORTH</h3>
                <div className="text-sm mt-2">
                  <div>♠ KQ95</div>
                  <div className="text-red-400">♥ A743</div>
                  <div className="text-red-400">♦ A2</div>
                  <div>♣ Q42</div>
                </div>
              </div>
              <div></div>

              {/* West */}
              <div className="text-center">
                <h3 className="font-bold">WEST</h3>
                <div className="text-sm mt-2">
                  <div>♠ T6</div>
                  <div className="text-red-400">♥ T6</div>
                  <div className="text-red-400">♦ JT9</div>
                  <div>♣ JT9865</div>
                </div>
              </div>

              {/* Center */}
              <div className="flex items-center justify-center">
                <div className="bg-green-900 rounded-lg p-4 text-center">
                  <div className="font-bold">Board 1</div>
                  <div className="text-sm">Dealer: North</div>
                  <div className="text-sm">None Vulnerable</div>
                </div>
              </div>

              {/* East */}
              <div className="text-center">
                <h3 className="font-bold">EAST</h3>
                <div className="text-sm mt-2">
                  <div>♠ J74</div>
                  <div className="text-red-400">♥ J985</div>
                  <div className="text-red-400">♦ Q543</div>
                  <div>♣ K7</div>
                </div>
              </div>

              {/* South */}
              <div></div>
              <div className="text-center">
                <h3 className="font-bold">SOUTH</h3>
                <div className="text-sm mt-2">
                  <div>♠ A832</div>
                  <div className="text-red-400">♥ KQ2</div>
                  <div className="text-red-400">♦ K876</div>
                  <div>♣ A3</div>
                </div>
              </div>
              <div></div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              This is a working version of the bridge application. 
              The full TypeScript version will be available once the module loading issue is resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDemo;