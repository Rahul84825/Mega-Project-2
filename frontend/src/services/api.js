import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

export const getProducts = async () => {
  const { data } = await api.get("/products");
  return data?.products || data || [];
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

export default api;
