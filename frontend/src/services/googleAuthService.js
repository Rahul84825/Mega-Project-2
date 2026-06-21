let scriptPromise = null;
let initPromise = null;
let initializedClientId = null;
let credentialCallback = null;
let currentRenderTarget = null;
let currentRenderToken = 0;

const GOOGLE_SCRIPT_SELECTOR = 'script[data-google-identity="true"]';

export const getGoogleClientId = (clientId) => {
  const resolvedClientId = (clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  if (!resolvedClientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is missing");
  }

  return resolvedClientId;
};

export const loadGoogleScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(GOOGLE_SCRIPT_SELECTOR);

    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve(true);
        return;
      }
      console.log("Removing stale or failed Google script tag from DOM to avoid hanging promise.");
      existingScript.remove();
    }

    console.log("Injecting fresh Google Identity Services script...");
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => {
      console.log("Google Identity Services script loaded successfully.");
      resolve(true);
    };
    script.onerror = (err) => {
      console.log("Google Identity Services script failed to load. Cleaning up script tag.");
      script.remove();
      reject(new Error("Google Identity Services failed to load"));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

export const initializeGoogleAuth = async (clientId, onCredential) => {
  const resolvedClientId = getGoogleClientId(clientId);

  credentialCallback = onCredential;

  if (initPromise && initializedClientId === resolvedClientId) {
    await initPromise;
    return true;
  }

  initPromise = loadGoogleScript()
    .then(() => {
      if (!window.google?.accounts?.id) {
        throw new Error("Google Identity Services unavailable");
      }

      if (initializedClientId !== resolvedClientId) {
        window.google.accounts.id.initialize({
          client_id: resolvedClientId,
          callback: (response) => {
            if (typeof credentialCallback === "function") {
              credentialCallback(response);
            }
          }
        });

        initializedClientId = resolvedClientId;
      }

      return true;
    })
    .catch((error) => {
      initPromise = null;
      initializedClientId = null;
      throw error;
    });

  return initPromise;
};

export const renderGoogleButton = async (container, options = {}) => {
  const {
    clientId,
    onCredential,
    theme = "outline",
    size = "large",
    text = "continue_with",
    shape = "pill",
    width = 320
  } = options;

  if (!container) {
    throw new Error("Google button container not found");
  }

  if (!container.isConnected) {
    throw new Error("Google button container is not ready");
  }

  const resolvedClientId = getGoogleClientId(clientId);
  await initializeGoogleAuth(resolvedClientId, onCredential);

  const measuredWidth = container.getBoundingClientRect().width || container.clientWidth || width;
  const buttonWidth = Math.max(240, Math.min(width, Math.floor(measuredWidth || width)));
  const renderToken = ++currentRenderToken;

  if (currentRenderTarget && currentRenderTarget !== container) {
    currentRenderTarget.innerHTML = "";
  }

  currentRenderTarget = container;
  container.innerHTML = "";

  window.google.accounts.id.renderButton(container, {
    theme,
    size,
    type: "standard",
    text,
    shape,
    width: buttonWidth
  });

  return () => {
    if (currentRenderToken === renderToken && currentRenderTarget === container && container.isConnected) {
      container.innerHTML = "";
    }
  };
};
