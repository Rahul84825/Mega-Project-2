import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser as registerApi, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
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
        navigate(data.user?.isAdmin === true ? "/admin" : "/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (submitError) {
      console.error("Registration failed:", submitError);
      setError(getApiErrorMessage(submitError, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[var(--cream)]">
      <div className="w-full max-w-[520px] bg-white rounded-xl border border-[rgba(212,160,23,0.18)] p-6 sm:p-9 shadow-lg">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="serif text-3xl sm:text-4xl font-bold text-[var(--charcoal)] mb-2 sm:mb-3">
            Create account
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Customer registration for Mithai World
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 rounded-lg bg-[rgba(176,0,32,0.08)] border border-[rgba(176,0,32,0.18)] text-[var(--burgundy)] text-sm sm:text-[13px]">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
          
          {/* Name Field */}
          <div>
            <label className="text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2 sm:mb-2.5">
              Name
            </label>
            <input
              className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-[#e8d4b4] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all placeholder:text-[var(--muted)]"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2 sm:mb-2.5">
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
            <label className="text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2 sm:mb-2.5">
              Password
            </label>
            <input
              className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border border-[#e8d4b4] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all placeholder:text-[var(--muted)]"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Choose a password"
              autoComplete="new-password"
            />
          </div>

          {/* Register Button */}
          <button
            className="w-full py-3 sm:py-3.5 rounded-lg bg-[var(--burgundy)] hover:bg-[#8B1E3F] text-white font-bold text-sm sm:text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center text-sm sm:text-[13px] text-[var(--muted)]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[var(--burgundy)] hover:text-[#8B1E3F] font-bold transition-colors bg-none border-none cursor-pointer p-0 inline"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}

export default Register;
