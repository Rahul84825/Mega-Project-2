import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const API_ROOT = (API || "http://localhost:5000").replace(/\/+$/, "").replace(/\/api$/i, "");

const api = axios.create({
  baseURL: `${API_ROOT}/api`
});

const authUrl = (path) => `${API_ROOT}/api/auth${path}`;

export const setApiAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const getProducts = async () => {
  const { data } = await api.get("/products");
  return data?.products || data || [];
};

export const getCategories = async () => {
  const { data } = await api.get("/categories");
  return data?.categories || data || [];
};

export const createCategory = async (payload) => {
  const { data } = await api.post("/categories", payload);
  return data?.category || data || null;
};

export const createCategoryWithImage = async (name, imageFile, showInNavbar = false, showInHomepage = false, is_active = true) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("is_active", is_active);
  formData.append("showInNavbar", showInNavbar);
  formData.append("showInHomepage", showInHomepage);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const { data } = await api.post("/categories", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data?.category || data || null;
};

export const updateCategory = async (slug, payload) => {
  const { data } = await api.put(`/categories/${slug}`, payload);
  return data?.category || data || null;
};

export const updateCategoryWithImage = async (id, name, imageFile, showInNavbar = false, showInHomepage = false, is_active = true) => {
  const formData = new FormData();
  if (name !== undefined) {
    formData.append("name", name);
  }
  if (is_active !== undefined) {
    formData.append("is_active", is_active);
  }
  formData.append("showInNavbar", showInNavbar);
  formData.append("showInHomepage", showInHomepage);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const { data } = await api.put(`/categories/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data?.category || data || null;
};

export const deleteCategory = async (slug) => {
  const { data } = await api.delete(`/categories/${slug}`);
  return data;
};

export const getHeroSlides = async () => {
  const { data } = await api.get("/hero-slides");
  return data?.slides || data || [];
};

export const getHeroSlidesAdmin = async () => {
  const { data } = await api.get("/hero-slides/admin");
  return data?.slides || data || [];
};

export const createHeroSlide = async (payload) => {
  const { data } = await api.post("/hero-slides", payload);
  return data?.slide || data || null;
};

export const updateHeroSlide = async (id, payload) => {
  const { data } = await api.patch(`/hero-slides/${id}`, payload);
  return data?.slide || data || null;
};

export const deleteHeroSlide = async (id) => {
  const { data } = await api.delete(`/hero-slides/${id}`);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post(authUrl("/login"), payload);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post(authUrl("/register"), payload);
  return data;
};

export const loginWithGoogle = async (payload) => {
  const { data } = await api.post(authUrl("/google"), payload);
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data?.product || data || null;
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

export const getOrders = async () => {
  const { data } = await api.get("/orders");
  return data?.orders || data || [];
};

export const updateDeliveryStatus = async (payload) => {
  const { data } = await api.patch("/orders/delivery-status", payload);
  return data;
};

export const verifyDeliveryOTP = async (payload) => {
  const { data } = await api.post("/orders/verify-delivery", payload);
  return data;
};

export const resendDeliveryOTP = async (payload) => {
  const { data } = await api.post("/orders/resend-otp", payload);
  return data;
};

export default api;
