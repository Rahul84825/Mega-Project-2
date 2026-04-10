import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setApiAuthToken } from "../services/api";

const AUTH_STORAGE_KEY = "mithai-world-auth";
const AuthContext = createContext(null);

const loadInitialAuth = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(stored);
    return {
      user: parsed?.user || null,
      token: parsed?.token || null
    };
  } catch (_error) {
    return { user: null, token: null };
  }
};

export function AuthProvider({ children }) {
  const initialAuth = loadInitialAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  useEffect(() => {
    setApiAuthToken(token);

    try {
      if (user && token) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
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
        setUser(nextAuth?.user || null);
        setToken(nextAuth?.token || null);
      } catch (_error) {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (nextUser, nextToken) => {
    setUser(nextUser || null);
    setToken(nextToken || null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: Boolean(user?.isAdmin),
      login,
      logout
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
