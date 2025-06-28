// This is a new file: frontend/src/utils/bridgeWebsUtils.ts

export const constructBridgeWebsUrl = (pbnFileUrl: string): string => {
  const baseUrl = '/bsol/bsol_v1.08/ddummy.htm';

  if (pbnFileUrl.includes(baseUrl)) {
    return pbnFileUrl;
  }
  
  const params = new URLSearchParams({
    file: pbnFileUrl,
  });

  return `${baseUrl}?${params.toString()}`;
};