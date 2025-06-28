// This is a new file: frontend/src/components/BridgeWebsHandViewer.tsx
import React from 'react';
import { constructBridgeWebsUrl } from '../utils/bridgeWebsUtils';

interface BridgeWebsHandViewerProps {
  pbnFileUrl: string;
}

const BridgeWebsHandViewer: React.FC<BridgeWebsHandViewerProps> = ({ pbnFileUrl }) => {
  const url = constructBridgeWebsUrl(pbnFileUrl);

  return (
    <div className="w-full aspect-[840/507] rounded-lg shadow-md">
      <iframe
        src={url}
        title={`Double Dummy Solver - BridgeWebs`}
        className="w-full h-full border-0 rounded-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default BridgeWebsHandViewer;