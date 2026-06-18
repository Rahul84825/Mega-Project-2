export const AUTH_STORAGE_KEY = "mithai-world-auth";
export const LEGACY_TOKEN_KEY = "token";
export const LEGACY_USER_KEY = "user";
export const SESSION_EXPIRED_EVENT = "mithai-world:session-expired";

let sessionExpiredNotified = false;

const base64UrlDecode = (input) => {
  if (!input) {
    return "";
  }

  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
  } catch (_error) {
    // Fall through to Buffer for non-browser or constrained environments.
  }

  try {
    return Buffer.from(padded, "base64").toString("utf8");
  } catch (_error) {
    return "";
  }
};

export const decodeJwtPayload = (token) => {
  const segments = String(token || "").split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = base64UrlDecode(segments[1]);
    return payload ? JSON.parse(payload) : null;
  } catch (_error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  // Add a 60-second buffer to handle minor clock skew between client and server
  // This prevents race conditions where the token is valid but the client clock is slightly ahead.
  return Date.now() >= (payload.exp * 1000) - 60000;
};

export const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
      const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

      if (!legacyToken || !legacyUser || isTokenExpired(legacyToken)) {
        return { user: null, token: null };
      }

      return {
        user: JSON.parse(legacyUser),
        token: legacyToken
      };
    }

    const parsed = JSON.parse(stored);
    const token = parsed?.token || null;

    if (!token || isTokenExpired(token)) {
      return { user: null, token: null };
    }

    return {
      user: parsed?.user || null,
      token
    };
  } catch (_error) {
    return { user: null, token: null };
  }
};

export const getStoredToken = () => {
  return getStoredAuth().token || "";
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