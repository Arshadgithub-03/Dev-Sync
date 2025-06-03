// webContainer.js - Manage the WebContainer instance for running code in-browser
import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

// Get or boot a singleton WebContainer instance
export const getWebContainer = async () => {
  // Ensure cross-origin isolation for SharedArrayBuffer support
  if (!self.crossOriginIsolated) {
    throw new Error(
      "SharedArrayBuffer requires crossOriginIsolated. Ensure your server includes the required headers."
    );
  }

  // Boot the WebContainer if not already created
  if(webContainerInstance === null) {
    webContainerInstance = await WebContainer.boot();
  }
  return webContainerInstance;
};

// Utility to verify if third-party resources support cross-origin isolation
export const verifyThirdPartyResources = async (urls) => {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const crossOriginResourcePolicy = response.headers.get('Cross-Origin-Resource-Policy');
        const accessControlAllowOrigin = response.headers.get('Access-Control-Allow-Origin');
        return {
          url,
          crossOriginResourcePolicy,
          accessControlAllowOrigin,
          supportsCrossOriginIsolated:
            crossOriginResourcePolicy === 'cross-origin' ||
            crossOriginResourcePolicy === 'same-origin',
        };
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );
  return results;
};