import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, isAdmin, authReady } = useAuth();

  const destination = location.state?.from || (isAdmin === true ? "/admin" : "/");

  useEffect(() => {
    if (authReady && isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [authReady, destination, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      logout({ redirect: false });
      const data = await loginUser(form);

      if (data?.token && data?.user && login(data.user, data.token)) {
        if (data.user?.isAdmin !== true) {
          localStorage.setItem("mithaiworld_login_popup_shown", "true");
        }
        navigate(data.user?.isAdmin === true ? "/admin" : "/", { replace: true });
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[var(--cream)]">
      <div className="w-full max-w-[520px] bg-white rounded-xl border border-[rgba(212,160,23,0.18)] p-6 sm:p-9 shadow-lg">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="serif text-3xl sm:text-4xl font-medium text-[var(--charcoal)] mb-2 sm:mb-3">
            Welcome back
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Sign in to your Mithai World account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 rounded-lg bg-[rgba(176,0,32,0.08)] border border-[rgba(176,0,32,0.18)] text-[var(--burgundy)] text-sm sm:text-[13px]">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
          
          {/* Email Field */}
          <div>
            <label className="text-[11px] sm:text-[11px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-2 sm:mb-2.5">
              Email
            </label>
            <input
              className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-[#e8d4b4] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all placeholder:text-[var(--muted)]"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="text-[11px] sm:text-[11px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-2 sm:mb-2.5">
              Password
            </label>
            <input
              className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-[#e8d4b4] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all placeholder:text-[var(--muted)]"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Sign In Button */}
          <button
            className="w-full py-3 sm:py-3.5 rounded-lg bg-[var(--burgundy)] hover:bg-[#8B1E3F] text-white font-medium text-sm sm:text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
          <div className="h-px flex-1 bg-[rgba(139,115,85,0.25)]" />
          <span className="text-[11px] sm:text-[12px] font-medium text-[var(--muted)] whitespace-nowrap">OR</span>
          <div className="h-px flex-1 bg-[rgba(139,115,85,0.25)]" />
        </div>

        {/* Google Button */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <GoogleLoginButton
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            onCredential={async (response) => {
              if (!response?.credential) {
                return;
              }

              try {
                setGoogleLoading(true);
                setError("");
                logout({ redirect: false });
                const data = await loginWithGoogle({ idToken: response.credential });

                if (data?.token && data?.user && login(data.user, data.token)) {
                  if (data.user?.isAdmin !== true) {
                    localStorage.setItem("mithaiworld_login_popup_shown", "true");
                  }
                  navigate(data.user?.isAdmin === true ? "/admin" : "/", { replace: true });
                }
              } catch (googleError) {
                setError(getApiErrorMessage(googleError, "Google login failed."));
              } finally {
                setGoogleLoading(false);
              }
            }}
          />
        </div>
        
        {googleLoading && (
          <div className="text-center text-[12px] sm:text-[13px] text-[var(--muted)] mb-4">
            Checking Google account...
          </div>
        )}

        {/* Register Link */}
        <div className="text-center text-sm sm:text-[13px] text-[var(--muted)]">
          New customer?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-[var(--burgundy)] hover:text-[#8B1E3F] font-medium transition-colors bg-none border-none cursor-pointer p-0 inline"
          >
            Create an account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;
