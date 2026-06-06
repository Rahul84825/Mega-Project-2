import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setApiAuthToken } from "../services/api";
import {
  AUTH_STORAGE_KEY,
  SESSION_EXPIRED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  isTokenExpired,
  storeAuth
} from "../services/utils/authSession";
import { toast } from "../services/utils/toast";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    isAdmin: user.isAdmin === true
  };
};

const loadInitialAuth = () => {
  const { user, token } = getStoredAuth();

  return {
    user: normalizeUser(user),
    token: token || null
  };
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const initialAuth = useMemo(() => {
    const auth = loadInitialAuth();
    // Synchronously set the API token during initialization to prevent 
    // race conditions with child component effects making API calls.
    if (auth.token) {
      setApiAuthToken(auth.token);
    }
    return auth;
  }, []);

  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.log("AUTH_RESTORED: Auth state initialized from storage");
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    // Still sync the token on changes to ensure consistency
    setApiAuthToken(token);

    try {
      if (user && token) {
        storeAuth({ user, token });
      }
      // Removed clearStoredAuth() from here to prevent accidental clearing 
      // if loadInitialAuth() returns null due to temporary storage issues.
      // Explicit logouts and session expiry still call clearStoredAuth().
    } catch (_error) {
      // Ignore storage errors in constrained environments.
    }
  }, [authReady, token, user]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      try {
        const nextAuth = event.newValue ? JSON.parse(event.newValue) : null;
        const nextToken = nextAuth?.token || null;

        if (nextToken && isTokenExpired(nextToken)) {
          setUser(null);
          setToken(null);
          return;
        }

        setUser(normalizeUser(nextAuth?.user || null));
        setToken(nextToken);
      } catch (_error) {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleSessionExpired = (event) => {
      const message = event?.detail?.message || "Session expired, please login again";
      setUser(null);
      setToken(null);
      setApiAuthToken(null);
      clearStoredAuth();
      toast.error(message);
      navigate("/login", { replace: true, state: { message } });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const login = useCallback((nextUser, nextToken) => {
    const normalizedToken = nextToken || null;

    if (!normalizedToken || isTokenExpired(normalizedToken)) {
      setUser(null);
      setToken(null);
      clearStoredAuth();
      setApiAuthToken(null);
      return false;
    }

    setUser(normalizeUser(nextUser || null));
    setToken(normalizedToken);
    setApiAuthToken(normalizedToken);
    return true;
  }, []);

  const logout = useCallback(({ redirectToLogin = false, reason } = {}) => {
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
    clearStoredAuth();

    if (reason) {
      toast.info(reason);
    } else {
      toast.success("Successfully logged out");
    }

    if (redirectToLogin) {
      navigate("/login", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: authReady && Boolean(user && token),
      isAdmin: user?.isAdmin === true,
      authReady,
      login,
      logout
    }),
    [authReady, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
