// This is a new file: frontend/src/components/BridgeWebsHandViewer.tsx
import React from 'react';
import { constructBridgeWebsUrl } from '../utils/bridgeWebsUtils';

interface BridgeWebsHandViewerProps {
  pbnFileUrl: string;
}

const BridgeWebsHandViewer: React.FC<BridgeWebsHandViewerProps> = ({ pbnFileUrl }) => {
  const url = constructBridgeWebsUrl(pbnFileUrl);

  return (
    <div className="w-full aspect-[840/320] rounded-lg shadow-md overflow-hidden">
      <iframe
        src={url}
        title={`Double Dummy Solver - BridgeWebs`}
        className="border-0 rounded-lg"
        style={{
          width: 'calc(100% / 1.3)',
          height: 'calc(100% / 1.3)',
          transform: 'scale(1.3)',
          transformOrigin: '0 0',
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default BridgeWebsHandViewer;