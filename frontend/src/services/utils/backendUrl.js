/**
 * Centralized Backend URL Resolution Logic
 *
 * Exclusively uses import.meta.env.VITE_API_URL to resolve the backend API and
 * Socket.IO server endpoints.
 *
 * Rules:
 * 1. Reads import.meta.env.VITE_API_URL.
 * 2. In Dev (or fallback): Defaults to "http://localhost:5000/api".
 * 3. Normalizes URL by stripping trailing "/api" or trailing slashes, so Axios baseURL
 *    (which appends "/api/...") and Socket.IO (which needs root origin) work consistently.
 * 4. Zero hardcoded production domains.
 */

export const getBaseBackendUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();

  let rawUrl = envUrl;

  if (!rawUrl) {
    if (import.meta.env.PROD) {
      console.warn(
        "[CONFIG WARNING] VITE_API_URL is missing in production environment variables! Defaulting to local backend."
      );
    }
    rawUrl = "http://localhost:5000/api";
  }

  // Strip trailing /api, /api/, or trailing slashes
  return rawUrl.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
};

/**
 * Returns normalized base origin for Axios or API clients (e.g. "https://mithai-world.onrender.com")
 */
export const getApiBaseUrl = () => {
  return getBaseBackendUrl();
};

/**
 * Returns normalized Socket.IO server URL (e.g. "https://mithai-world.onrender.com")
 */
export const getSocketUrl = () => {
  return getBaseBackendUrl();
};
