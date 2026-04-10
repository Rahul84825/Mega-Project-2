import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser as registerApi, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      const data = await registerApi(form);

      if (data?.token && data?.user) {
        login(data.user, data.token);
        navigate(data.user?.isAdmin ? "/admin" : "/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "var(--cream)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "white", border: "1px solid rgba(212,160,23,0.18)", padding: 36, boxShadow: "0 18px 40px rgba(26,15,10,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="serif" style={{ fontSize: 34, color: "var(--charcoal)", marginBottom: 8 }}>Create account</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Customer registration for Mithai World</div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(176,0,32,0.08)", color: "var(--burgundy)", border: "1px solid rgba(176,0,32,0.18)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Name</label>
            <input
              className="input-field"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
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
              placeholder="Choose a password"
              autoComplete="new-password"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "14px 18px" }}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          Already have an account? <button type="button" onClick={() => navigate("/login")} style={{ border: "none", background: "none", color: "var(--burgundy)", cursor: "pointer", padding: 0 }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
