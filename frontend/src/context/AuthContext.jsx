import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setApiAuthToken } from "../services/api";

const AUTH_STORAGE_KEY = "mithai-world-auth";
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
  const initialAuth = loadInitialAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  useEffect(() => {
    setApiAuthToken(token);

    try {
      if (user && token) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
        // Legacy keys are kept for copied admin panel compatibility.
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

  const login = (nextUser, nextToken) => {
    setUser(normalizeUser(nextUser || null));
    setToken(nextToken || null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
