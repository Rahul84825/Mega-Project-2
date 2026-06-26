import { useState } from "react";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";

let isGoogleSignInInitialized = false;

const checkIsAndroid = () => {
  if (typeof window === "undefined") return false;
  if (window.Capacitor?.platform === "android") return true;
  if (Capacitor.getPlatform() === "android") return true;
  const ua = navigator.userAgent || "";
  return /android/i.test(ua) && (/wv/i.test(ua) || /Version\/[0-9.]+/i.test(ua));
};

function GoogleLoginButton({ onCredential, clientId, className = "" }) {
  const resolvedClientId = (clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const { containerRef, status, error } = useGoogleAuth({
    clientId: resolvedClientId,
    onCredential,
    enabled: Boolean(resolvedClientId)
  });

  const [androidLoading, setAndroidLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const isAndroid = checkIsAndroid();

  const handleAndroidLogin = async () => {
    try {
      console.log("GOOGLE_BUTTON_CLICKED: Android Google button clicked");
      console.log("ANDROID START");
      setAndroidLoading(true);
      setErrorText("");
      
      const androidClientId = "53177357536-roif1v4kllp72jketot1257mts32bq30.apps.googleusercontent.com";
      const webClientId = "53177357536-prea1mestrvmsou2137mqe1auh64ep14.apps.googleusercontent.com";
      let finalClientId = resolvedClientId;

      console.log("Exact Client ID at runtime:", finalClientId);

      if (finalClientId === androidClientId) {
        console.log("Android Client ID detected in initialize(). Replacing it with the Web Client ID:", webClientId);
        finalClientId = webClientId;
      }

      console.log("INITIALIZE START");
      if (!GoogleSignIn || typeof GoogleSignIn.initialize !== "function") {
        throw new Error("GoogleSignIn native plugin is not loaded or supported.");
      }

      if (!isGoogleSignInInitialized) {
        console.log("Calling GoogleSignIn.initialize() with client ID:", finalClientId);
        await GoogleSignIn.initialize({
          clientId: finalClientId,
        });
        isGoogleSignInInitialized = true;
      }
      console.log("initialize success");

      console.log("GOOGLE_SIGNIN_STARTED: Native Google sign-in started");
      const result = await GoogleSignIn.signIn();
      console.log("signIn success", result);
      
      if (result) {
        console.log("returned idToken:", result.idToken);
        console.log("returned user profile:", result.profile);
      }

      if (!result?.idToken) {
        throw new Error("Failed to obtain Google ID Token.");
      }

      console.log("GOOGLE_SIGNIN_SUCCESS: Native Google sign-in succeeded");
      console.log("GOOGLE_IDTOKEN_RECEIVED: Google ID Token received");

      if (typeof onCredential === "function") {
        onCredential({ credential: blockToken(result.idToken) });
      }
    } catch (err) {
      console.log("INITIALIZE FAILED or SIGN IN FAILED", err);
      console.error("Android Google Sign-In full error object:", err);
      // Suppress errors that happen when user closes/cancels the native dialog
      if (err?.message && !err.message.toLowerCase().includes("cancel")) {
        setErrorText(err.message || "Google Sign-In failed.");
      } else if (!err?.message) {
        setErrorText("Google Sign-In was cancelled or failed.");
      }
    } finally {
      setAndroidLoading(false);
    }
  };

  // Helper to ensure clean token
  const blockToken = (token) => {
    return token ? token.trim() : "";
  };

  if (isAndroid) {
    return (
      <div className={`flex w-full flex-col items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleAndroidLogin}
          disabled={androidLoading}
          className="flex min-h-[48px] w-full max-w-[320px] items-center justify-center gap-3 rounded-full border border-[#e8d4b4] bg-white px-6 py-3 font-medium text-[14px] sm:text-[15px] text-[#484848] shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          style={{ minHeight: 48 }}
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.86 3C6.18 7.53 8.87 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.46-1.1 2.69-2.33 3.51l3.63 2.82c2.13-1.96 3.76-4.85 3.76-8.48z"
            />
            <path
              fill="#FBBC05"
              d="M5.25 14.44A7.16 7.16 0 0 1 4.8 12c0-.85.15-1.67.45-2.44L1.39 6.56C.5 8.39 0 10.14 0 12c0 1.86.5 3.61 1.39 5.44l3.86-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.63-2.82c-1.1.74-2.5 1.18-4.33 1.18-3.13 0-5.82-2.49-6.77-5.52L1.39 15.93C3.37 19.82 7.35 22.5 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
        {androidLoading && (
          <p className="text-center text-[12px] sm:text-[13px] text-[var(--muted)]">
            Connecting to Google...
          </p>
        )}
        {errorText && (
          <p className="text-center text-[12px] sm:text-[13px] text-[var(--burgundy)]">
            {errorText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col items-center gap-2 ${className}`}>
      <div
        ref={containerRef}
        className="flex min-h-[48px] w-full max-w-[320px] items-center justify-center overflow-visible"
        style={{ minHeight: 48 }}
      />
      {status === "loading" && (
        <p className="text-center text-[12px] sm:text-[13px] text-[var(--muted)]">
          Connecting to Google...
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-[12px] sm:text-[13px] text-[var(--burgundy)]">
          {error}
        </p>
      )}
    </div>
  );
}

export default GoogleLoginButton;
