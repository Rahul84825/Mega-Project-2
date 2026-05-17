import { useEffect, useRef, useState } from "react";
import { renderGoogleButton, getGoogleClientId } from "../services/googleAuthService";

const DEFAULT_ERROR = "Google login is unavailable right now.";

export function useGoogleAuth({ clientId, onCredential, enabled = true, theme = "outline", size = "large", text = "continue_with", shape = "pill", width = 320 } = {}) {
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);
  const credentialRef = useRef(onCredential);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    credentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    const mountGoogleButton = async () => {
      if (!enabled) {
        setStatus("idle");
        setError("");
        return;
      }

      let resolvedClientId;

      try {
        resolvedClientId = getGoogleClientId(clientId);
      } catch (missingClientError) {
        if (!cancelled) {
          setStatus("error");
          setError(missingClientError.message || DEFAULT_ERROR);
        }

        return;
      }

      const container = containerRef.current;

      if (!container) {
        return;
      }

      try {
        setStatus("loading");
        setError("");

        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        const cleanup = await renderGoogleButton(container, {
          clientId: resolvedClientId,
          onCredential: (response) => credentialRef.current?.(response),
          theme,
          size,
          text,
          shape,
          width
        });

        if (cancelled) {
          cleanup?.();
          return;
        }

        cleanupRef.current = cleanup;
        setStatus("ready");
      } catch (renderError) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setError(renderError?.message || DEFAULT_ERROR);
      }
    };

    mountGoogleButton();

    return () => {
      cancelled = true;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [clientId, enabled, shape, size, text, theme, width]);

  return {
    containerRef,
    status,
    error,
    isReady: status === "ready",
    hasError: status === "error"
  };
}
