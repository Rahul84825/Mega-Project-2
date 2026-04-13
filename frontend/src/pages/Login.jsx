import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(script);
  });
};

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const destination = location.state?.from || (isAdmin === true ? "/admin" : "/");

  const clearStaleAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("mithai-world-auth");
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, isAuthenticated, navigate]);

  useEffect(() => {
    let isMounted = true;

    const initGoogle = async () => {
      try {
        await loadGoogleScript();
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId || !googleButtonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) {
              return;
            }

            try {
              setGoogleLoading(true);
              setError("");
              clearStaleAuth();
              const data = await loginWithGoogle({ idToken: response.credential });
              console.log("Login response:", data);
              if (data?.token && data?.user) {
                login(data.user, data.token);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                console.log("Stored user:", localStorage.getItem("user"));
                navigate(data.user?.isAdmin === true ? "/admin" : "/", { replace: true });
              }
            } catch (googleError) {
              console.error("Google login failed:", googleError);
              if (isMounted) {
                setError(getApiErrorMessage(googleError, "Google login failed."));
              }
            } finally {
              if (isMounted) {
                setGoogleLoading(false);
              }
            }
          }
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
          shape: "pill",
          width: 320
        });
      } catch (googleError) {
        if (isMounted) {
          setError(getApiErrorMessage(googleError, "Google login is unavailable right now."));
        }
      }
    };

    initGoogle();

    return () => {
      isMounted = false;
    };
  }, [login, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      clearStaleAuth();
      const data = await loginUser(form);
      console.log("Login response:", data);

      if (data?.token && data?.user) {
        login(data.user, data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("Stored user:", localStorage.getItem("user"));
        navigate(data.user?.isAdmin === true ? "/admin" : "/", { replace: true });
      }
    } catch (submitError) {
      console.error("Login failed:", submitError);
      setError(getApiErrorMessage(submitError, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "var(--cream)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "white", border: "1px solid rgba(212,160,23,0.18)", padding: 36, boxShadow: "0 18px 40px rgba(26,15,10,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="serif" style={{ fontSize: 34, color: "var(--charcoal)", marginBottom: 8 }}>Welcome back</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Sign in to your Mithai World account</div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(176,0,32,0.08)", color: "var(--burgundy)", border: "1px solid rgba(176,0,32,0.18)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Email</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Password</label>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "14px 18px" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ margin: "22px 0 18px", display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: 12 }}>
          <div style={{ height: 1, flex: 1, background: "rgba(139,115,85,0.25)" }} />
          <span>OR</span>
          <div style={{ height: 1, flex: 1, background: "rgba(139,115,85,0.25)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={googleButtonRef} />
        </div>
        {googleLoading && (
          <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Checking Google account...</div>
        )}

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          New customer? <button type="button" onClick={() => navigate("/register")} style={{ border: "none", background: "none", color: "var(--burgundy)", cursor: "pointer", padding: 0 }}>Create an account</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
