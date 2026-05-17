export {
  getGoogleClientId,
  initializeGoogleAuth,
  loadGoogleScript,
  renderGoogleButton
} from "./googleAuthService";
let scriptPromise = null;
let initializedClientId = null;
let callbackHandler = null;
let renderTarget = null;
let initPromise = null;

const GOOGLE_SCRIPT_SELECTOR = 'script[data-google-identity="true"]';

const loadScript = () => {
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
    const existing = document.querySelector(GOOGLE_SCRIPT_SELECTOR);

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

  return scriptPromise;
};

export const initializeGoogleAuth = async (clientId, callback) => {
  if (!clientId) {
    throw new Error("Google client id is missing");
  }

  callbackHandler = callback;
  renderTarget = null;

  if (initPromise && initializedClientId === clientId) {
    await initPromise;
    return true;
  }

  initPromise = loadScript().then(() => {
    if (!window.google?.accounts?.id) {
      throw new Error("Google Identity Services unavailable");
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (typeof callbackHandler === "function") {
          callbackHandler(response);
        }
      }
    });

    initializedClientId = clientId;
    return true;
  });

  return initPromise;
};

export const renderGoogleButton = async (container, options = {}) => {
  const { clientId, onCredential, theme = "outline", size = "large", text = "continue_with", shape = "pill", width = 320 } = options;

  if (!container) {
    throw new Error("Google button container not found");
  }

  await initializeGoogleAuth(clientId, onCredential);

  if (renderTarget && renderTarget !== container) {
    renderTarget.innerHTML = "";
  }

  renderTarget = container;
  container.innerHTML = "";

  window.google.accounts.id.renderButton(container, {
    theme,
    size,
    type: "standard",
    text,
    shape,
    width
  });

  return () => {
    if (renderTarget === container) {
      container.innerHTML = "";
    }
  };
};
