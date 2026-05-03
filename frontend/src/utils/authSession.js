export const AUTH_STORAGE_KEY = "mithai-world-auth";
export const LEGACY_TOKEN_KEY = "token";
export const LEGACY_USER_KEY = "user";
export const SESSION_EXPIRED_EVENT = "mithai-world:session-expired";

let sessionExpiredNotified = false;

export const getStoredToken = () => {
  try {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      return legacyToken;
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return "";
    }

    const parsed = JSON.parse(stored);
    return parsed?.token || "";
  } catch (_error) {
    return "";
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (_error) {
    // Ignore storage failures in constrained environments.
  }
};

export const storeAuth = ({ user, token }) => {
  sessionExpiredNotified = false;

  try {
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
      return;
    }

    clearStoredAuth();
  } catch (_error) {
    // Ignore storage failures in constrained environments.
  }
};

export const notifySessionExpired = (message = "Session expired, please login again") => {
  if (sessionExpiredNotified) {
    return;
  }

  sessionExpiredNotified = true;

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (_error) {
    // Ignore storage failures in constrained environments.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { message }
      })
    );
  }
};