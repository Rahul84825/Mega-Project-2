import axios from "axios";
import { getStoredToken, notifySessionExpired } from "./utils/authSession";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isNative = window.Capacitor?.isNativePlatform() || window.location.protocol === "capacitor:";
    if (isNative || (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168."))) {
      return "https://mega-project-2-b880.onrender.com";
    }
  }
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return rawUrl.replace(/\/api\/?$/, "");
};

const API_ROOT = getBackendUrl();
const DEFAULT_TIMEOUT = 15000;

const api = axios.create({
  baseURL: API_ROOT,
  timeout: DEFAULT_TIMEOUT,
  withCredentials: true
});

const isAuthEndpoint = (url = "") => String(url).includes("/api/auth/");

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

let sessionWarningShown = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";

    if (status === 401 && !isAuthEndpoint(requestUrl) && !sessionWarningShown) {
      sessionWarningShown = true;
      notifySessionExpired("Session expired, please login again");
    }

    if (status !== 401) {
      sessionWarningShown = false;
    }

    return Promise.reject(error);
  }
);

const withTimeout = (config = {}, timeout = DEFAULT_TIMEOUT) => ({
  timeout,
  ...config
});

const authUrl = (path) => `/api/auth${path}`;

export const setApiAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const createAbortController = () => new AbortController();

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (axios.isCancel(error)) {
    return "Request canceled";
  }

  const rawMessage = error?.response?.data?.message || error?.message || fallback;
  
  // Clean database or validation messages as a robust backup shield
  const lowerMsg = String(rawMessage).toLowerCase();
  if (
    lowerMsg.includes("validation failed") ||
    lowerMsg.includes("imagesnapshot") ||
    lowerMsg.includes("mongodb") ||
    lowerMsg.includes("mongoose") ||
    lowerMsg.includes("cast error") ||
    lowerMsg.includes("syntaxerror")
  ) {
    return "Something went wrong while creating your order. Please contact support if the issue continues.";
  }

  return rawMessage;
};

export const getProducts = async (page = 1, limit = 20, config = {}) => {
  const { data } = await api.get("/api/products", withTimeout({
    params: { page: Math.max(1, page), limit: Math.min(Math.max(1, limit), 100) },
    ...config
  }));

  return {
    products: data?.products || [],
    pagination: data?.pagination || {}
  };
};

export const getCategories = async (config = {}) => {
  const { data } = await api.get("/api/categories", withTimeout(config));
  return data?.categories || data || [];
};

export const createCategory = async (payload, config = {}) => {
  const { data } = await api.post("/api/categories", payload, withTimeout(config));
  return data?.category || data || null;
};

export const createCategoryWithImage = async (name, imageFile, showInNavbar = false, showInHomepage = false, is_active = true, config = {}) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("is_active", is_active);
  formData.append("showInNavbar", showInNavbar);
  formData.append("showInHomepage", showInHomepage);
  if (imageFile) formData.append("image", imageFile);

  const { data } = await api.post("/api/categories", formData, withTimeout({
    headers: { "Content-Type": "multipart/form-data" },
    ...config
  }));
  return data?.category || data || null;
};

export const updateCategory = async (slug, payload, config = {}) => {
  const { data } = await api.put(`/api/categories/${slug}`, payload, withTimeout(config));
  return data?.category || data || null;
};

export const updateCategoryWithImage = async (id, name, imageFile, showInNavbar = false, showInHomepage = false, is_active = true, config = {}) => {
  const formData = new FormData();
  if (name !== undefined) formData.append("name", name);
  if (is_active !== undefined) formData.append("is_active", is_active);
  formData.append("showInNavbar", showInNavbar);
  formData.append("showInHomepage", showInHomepage);
  if (imageFile) formData.append("image", imageFile);

  const { data } = await api.put(`/api/categories/${id}`, formData, withTimeout({
    headers: { "Content-Type": "multipart/form-data" },
    ...config
  }));
  return data?.category || data || null;
};

export const deleteCategory = async (slug, config = {}) => {
  const { data } = await api.delete(`/api/categories/${slug}`, withTimeout(config));
  return data;
};

export const getHeroSlides = async (config = {}) => {
  const { data } = await api.get("/api/hero-slides", withTimeout(config));
  return data?.slides || data || [];
};

export const getHeroSlidesAdmin = async (config = {}) => {
  const { data } = await api.get("/api/hero-slides/admin", withTimeout(config));
  return data?.slides || data || [];
};

export const createHeroSlide = async (payload, config = {}) => {
  const { data } = await api.post("/api/hero-slides", payload, withTimeout(config));
  return data?.slide || data || null;
};

export const updateHeroSlide = async (id, payload, config = {}) => {
  const { data } = await api.patch(`/api/hero-slides/${id}`, payload, withTimeout(config));
  return data?.slide || data || null;
};

export const deleteHeroSlide = async (id, config = {}) => {
  const { data } = await api.delete(`/api/hero-slides/${id}`, withTimeout(config));
  return data;
};

export const loginUser = async (payload, config = {}) => {
  const { data } = await api.post(authUrl("/login"), payload, withTimeout(config));
  return data;
};

export const registerUser = async (payload, config = {}) => {
  const { data } = await api.post(authUrl("/register"), payload, withTimeout(config));
  return data;
};

export const loginWithGoogle = async (payload, config = {}) => {
  const { data } = await api.post(authUrl("/google"), payload, withTimeout(config));
  return data;
};

export const getProductById = async (id, config = {}) => {
  const { data } = await api.get(`/api/products/${id}`, withTimeout(config));
  return data?.product || data || null;
};

export const createOrder = async (payload, config = {}) => {
  const { data } = await api.post("/api/orders", payload, withTimeout(config));
  return data;
};

export const getOrders = async (config = {}) => {
  const { data } = await api.get("/api/orders", withTimeout(config));
  return data?.orders || data || [];
};

export const updateDeliveryStatus = async (payload, config = {}) => {
  const { data } = await api.patch("/api/orders/delivery-status", payload, withTimeout(config));
  return data;
};

export const checkDeliveryAvailability = async (pincode, config = {}) => {
  const { data } = await api.post("/api/delivery/check-availability", { pincode }, withTimeout(config));
  return data;
};

export default api;
