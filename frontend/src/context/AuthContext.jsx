import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
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
import { initPushNotifications, unregisterPushNotifications } from "../services/pushNotificationService";

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
  
  if (typeof window !== "undefined" && window.startupTimestamps && !window.startupTimestamps.authInit) {
    window.startupTimestamps.authInit = Date.now();
    console.log("MithaiWorldStartup: AUTH_CONTEXT_INIT_MS: " + window.startupTimestamps.authInit + " (diff from html: " + (window.startupTimestamps.authInit - window.startupTimestamps.htmlLoad) + "ms)");
  }

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

  // Keep refs in sync with state to prevent stale closures in event listeners
  const tokenRef = useRef(token);
  const userRef = useRef(user);

  useEffect(() => {
    tokenRef.current = token;
    userRef.current = user;
  }, [token, user]);

  useEffect(() => {
    console.log("AUTH_RESTORED: Auth state initialized from storage");
    if (typeof window !== "undefined" && window.startupTimestamps) {
      window.startupTimestamps.authReady = Date.now();
      console.log("MithaiWorldStartup: AUTH_READY_MS: " + window.startupTimestamps.authReady + " (diff from html: " + (window.startupTimestamps.authReady - window.startupTimestamps.htmlLoad) + "ms)");
    }
    console.log("AUTH_READY: Auth state is fully initialized and ready");
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

        // Prevent infinite loops on WebView/Capacitor environments where item set triggers event in same window
        if (nextToken === tokenRef.current) {
          return;
        }

        if (nextToken && isTokenExpired(nextToken)) {
          console.log("AUTH_CONTEXT_SETUSER: Token in storage is expired, setting user to null");
          setUser(null);
          setToken(null);
          return;
        }

        const normalizedNextUser = normalizeUser(nextAuth?.user || null);
        console.log("AUTH_CONTEXT_SETUSER: Storage event updated user state", normalizedNextUser);
        setUser(normalizedNextUser);
        setToken(nextToken);
      } catch (_error) {
        console.log("AUTH_CONTEXT_SETUSER: Error parsing storage event, clearing auth state");
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
      console.log("AUTH_CONTEXT_SETUSER: Session expired event triggered, clearing user state");
      setUser(null);
      setToken(null);
      setApiAuthToken(null);
      clearStoredAuth();
      toast.error(message);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const login = useCallback((nextUser, nextToken) => {
    const normalizedToken = nextToken || null;

    if (!normalizedToken || isTokenExpired(normalizedToken)) {
      console.log("AUTH_CONTEXT_SETUSER: Login rejected due to expired or missing token");
      setUser(null);
      setToken(null);
      clearStoredAuth();
      setApiAuthToken(null);
      return false;
    }

    const normalizedNextUser = normalizeUser(nextUser || null);
    console.log("AUTH_CONTEXT_SETUSER: Setting user profile in AuthContext", normalizedNextUser);
    setUser(normalizedNextUser);
    setToken(normalizedToken);
    setApiAuthToken(normalizedToken);
    return true;
  }, []);

  const logout = useCallback(({ reason, redirect = true } = {}) => {
    if (user?.isAdmin === true) {
      unregisterPushNotifications().catch(err => console.error("FCM: Failed to unregister push notifications:", err));
    }

    console.log("AUTH_CONTEXT_SETUSER: Logging out user, setting state to null");
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
    clearStoredAuth();
    localStorage.removeItem("mithaiworld_login_popup_shown");

    if (reason) {
      toast.info(reason);
    } else if (redirect) {
      toast.success("Successfully logged out");
    }

    if (redirect) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (authReady && user && user.isAdmin) {
      initPushNotifications(true);
    }
  }, [authReady, user]);

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
