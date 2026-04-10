import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

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

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const loginWithGoogle = async (payload) => {
  const { data } = await api.post("/auth/google", payload);
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
