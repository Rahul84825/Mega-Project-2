// Simple toast notification utility using browser's native approach
let toastElement = null;

const createToastElement = () => {
  if (toastElement) return toastElement;

  const container = document.createElement("div");
  container.id = "toast-container";
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  toastElement = container;
  return container;
};

const removeToast = (element) => {
  element.style.opacity = "0";
  element.style.transform = "translateX(400px)";
  setTimeout(() => {
    element.remove();
  }, 300);
};

export const showToast = (message, type = "info", duration = 3000) => {
  const container = createToastElement();

  const toast = document.createElement("div");
  toast.style.cssText = `
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    opacity: 1;
    transform: translateX(0);
    transition: all 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
  `;

  // Color scheme based on type
  const schemes = {
    success: {
      bg: "#d4edda",
      text: "#155724",
      border: "#c3e6cb"
    },
    error: {
      bg: "#f8d7da",
      text: "#721c24",
      border: "#f5c6cb"
    },
    warning: {
      bg: "#fff3cd",
      text: "#856404",
      border: "#ffeaa7"
    },
    info: {
      bg: "#d1ecf1",
      text: "#0c5460",
      border: "#bee5eb"
    }
  };

  const scheme = schemes[type] || schemes.info;
  toast.style.backgroundColor = scheme.bg;
  toast.style.color = scheme.text;
  toast.style.border = `1px solid ${scheme.border}`;
  toast.textContent = message;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return () => removeToast(toast);
};

export const toast = {
  success: (msg, duration) => showToast(msg, "success", duration),
  error: (msg, duration) => showToast(msg, "error", duration),
  warning: (msg, duration) => showToast(msg, "warning", duration),
  info: (msg, duration) => showToast(msg, "info", duration)
};

export default toast;
