import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setApiAuthToken } from "../services/api";
import { AUTH_STORAGE_KEY, SESSION_EXPIRED_EVENT, clearStoredAuth, storeAuth } from "../utils/authSession";
import { toast } from "../utils/toast";

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
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      const legacyToken = localStorage.getItem("token");
      const legacyUser = localStorage.getItem("user");

      if (!legacyToken || !legacyUser) {
        return { user: null, token: null };
      }

      return {
        user: normalizeUser(JSON.parse(legacyUser)),
        token: legacyToken
      };
    }

    const parsed = JSON.parse(stored);
    return {
      user: normalizeUser(parsed?.user || null),
      token: parsed?.token || null
    };
  } catch (_error) {
    return { user: null, token: null };
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const initialAuth = loadInitialAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  useEffect(() => {
    setApiAuthToken(token);

    try {
      if (user && token) {
        storeAuth({ user, token });
      } else {
        clearStoredAuth();
      }
    } catch (_error) {
      // Ignore storage errors in constrained environments.
    }
  }, [token, user]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      try {
        const nextAuth = event.newValue ? JSON.parse(event.newValue) : null;
        setUser(normalizeUser(nextAuth?.user || null));
        setToken(nextAuth?.token || null);
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
      toast.error(message);
      navigate("/login", { replace: true, state: { message } });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const login = (nextUser, nextToken) => {
    setUser(normalizeUser(nextUser || null));
    setToken(nextToken || null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.isAdmin === true,
      login,
      logout
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
