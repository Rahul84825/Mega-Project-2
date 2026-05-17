import { useGoogleAuth } from "../../hooks/useGoogleAuth";

function GoogleLoginButton({ onCredential, clientId, className = "" }) {
  const resolvedClientId = (clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const { containerRef, status, error } = useGoogleAuth({
    clientId: resolvedClientId,
    onCredential,
    enabled: Boolean(resolvedClientId)
  });

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
