import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { calculateTotals } from "../utils/priceCalculator";

const ProductContext = createContext(null);

const toArray = (value) => (Array.isArray(value) ? value : []);

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const normalizeProduct = (product) => {
  const normalizedVariants = toArray(product?.variants).map((variant, index) => {
    const mrp = Math.round(Number(variant?.mrp || 0));
    const sellingPrice = Math.round(Number(variant?.sellingPrice || mrp));
    return {
      ...variant,
      _id: variant?._id || variant?.id || `v_${index}`,
      mrp,
      sellingPrice,
      finalPrice: sellingPrice,
      stock: Number(variant?.stock || 0)
    };
  });

  const basePrice = normalizedVariants.length > 0 
    ? Math.min(...normalizedVariants.map(v => v.sellingPrice))
    : Math.round(Number(product?.price || product?.basePrice || 0));

  return {
    ...product,
    _id: product?._id || product?.id,
    variants: normalizedVariants,
    basePrice,
    price: basePrice,
    stock: normalizedVariants.reduce((sum, v) => sum + v.stock, 0) || Number(product?.stock || 0),
    images: toArray(product?.images || product?.image)
  };
};

const normalizeOrder = (order) => {
  const items = toArray(order?.items).map(item => ({
    ...item,
    price: Number(item.price || item.sellingPriceAtPurchase || 0),
    quantity: Number(item.quantity || 1)
  }));

  const { subtotal, deliveryFee, total } = calculateTotals(items);

  return {
    ...order,
    _id: order?._id || order?.id,
    items,
    subtotal: order?.totals?.itemsSubtotal || order?.subtotal || subtotal,
    deliveryFee: order?.totals?.shippingFee ?? order?.deliveryFee ?? deliveryFee,
    total: order?.totals?.grandTotal || order?.total || total,
    status: (order?.status || "PLACED").toUpperCase()
  };
};

const normalizeCategory = (category) => ({
  _id: category?._id || category?.id || "",
  id: category?.id || category?._id || "",
  name: String(category?.name || "").trim(),
  slug: String(category?.slug || "").trim().toLowerCase(),
  image: category?.image || null,
  is_active: category?.is_active ?? category?.isActive ?? category?.active ?? true,
  showInNavbar: category?.showInNavbar ?? category?.isFeatured ?? false,
  showInHomepage: category?.showInHomepage ?? false,
  type: String(category?.type || "other").trim().toLowerCase() === "sweets" ? "sweets" : "other",
  order: Number(category?.order || 0)
});

const normalizeOffer = (offer = {}) => {
  const isActive = offer?.isActive !== undefined
    ? Boolean(offer.isActive)
    : offer?.active !== undefined
      ? Boolean(offer.active)
      : offer?.is_active !== undefined
        ? Boolean(offer.is_active)
        : true;

  return {
    ...offer,
    id: offer?._id || offer?.id,
    _id: offer?._id || offer?.id,
    isActive,
    active: isActive,
    is_active: isActive,
    offerType: offer?.offerType || offer?.offer_type || "banner",
    discountPercent: Number(offer?.discountPercent ?? offer?.discount_percentage ?? 0),
    linked_product_id: offer?.linked_product_id || offer?.targetProduct || "",
    linked_category_id: offer?.linked_category_id || offer?.targetCategory || ""
  };
};

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/api/products");
      const list = toArray(data?.products || data).map(normalizeProduct);
      setProducts(list);
      return list;
    } catch (error) { console.error(error); return []; }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/api/orders");
      const list = toArray(data?.orders || data).map(normalizeOrder);
      const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
      return sorted;
    } catch (error) { console.error(error); return []; }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/api/categories");
      const list = toArray(data?.categories || data).map(normalizeCategory);
      setCategories(list);
      return list;
    } catch (error) { console.error(error); return []; }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await api.get("/api/offers");
      const list = toArray(data?.offers || data).map(normalizeOffer);
      setOffers(list);
      return list;
    } catch (error) { console.error(error); return []; }
  }, []);

  const refreshAll = useCallback(() => {
    return Promise.all([fetchProducts(), fetchCategories(), fetchOffers()]);
  }, [fetchProducts, fetchCategories, fetchOffers]);

  const updateOrderState = useCallback((updatedOrder) => {
    if (!updatedOrder) return null;
    const normalized = normalizeOrder(updatedOrder);
    const updatedId = normalized._id || normalized.id;
    setOrders((prev) => prev.map((order) => (order._id === updatedId || order.id === updatedId ? normalized : order)));
    return normalized;
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshAll()
      .catch(err => setLoadingError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));

    if (!socket.connected) socket.connect();

    socket.on("order:new", (order) => {
      const normalized = normalizeOrder(order);
      setOrders(prev => [normalized, ...prev]);
    });

    socket.on("order:updated", (order) => updateOrderState(order));
    socket.on("product:updated", () => fetchProducts());
    socket.on("stock:updated", () => fetchProducts());

    return () => {
      socket.off("order:new");
      socket.off("order:updated");
      socket.off("product:updated");
      socket.off("stock:updated");
    };
  }, [refreshAll, fetchProducts, updateOrderState]);

  useEffect(() => {
    const handleFocus = () => {
      fetchProducts().catch(() => {});
      fetchCategories().catch(() => {});
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchProducts, fetchCategories]);

  const addProduct = useCallback(async (payload) => {
    const { data } = await api.post("/api/products", payload);
    const created = normalizeProduct(data?.product || data);
    setProducts((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateProduct = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/products/${id}`, payload);
    const updated = normalizeProduct(data?.product || data);
    setProducts((prev) => prev.map((p) => (p._id === id || p.id === id ? updated : p)));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((p) => p._id !== id && p.id !== id));
    return true;
  }, []);

  const addCategory = useCallback(async (payload) => {
    const { data } = await api.post("/api/categories", payload);
    const created = normalizeCategory(data?.category || data);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const updateCategory = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/categories/${id}`, payload);
    const updated = normalizeCategory(data?.category || data);
    setCategories((prev) => prev.map((c) => (c._id === id || c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await api.delete(`/api/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c._id !== id && c.id !== id));
    return true;
  }, []);

  const toggleCategory = useCallback(async (id) => {
    const existing = categories.find((c) => c._id === id || c.id === id);
    if (!existing) throw new Error("Category not found");
    return updateCategory(id, { is_active: !existing.is_active });
  }, [categories, updateCategory]);

  const toggleCategoryFeatured = useCallback(async (id) => {
    const existing = categories.find((c) => c._id === id || c.id === id);
    if (!existing) throw new Error("Category not found");
    return updateCategory(id, { showInNavbar: !existing.showInNavbar });
  }, [categories, updateCategory]);

  const acceptOrder = useCallback(async (orderId, etaMinutes) => {
    const { data } = await api.patch(`/api/orders/${orderId}/accept`, { etaMinutes });
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const rejectOrder = useCallback(async (orderId, reason) => {
    const { data } = await api.patch(`/api/orders/${orderId}/reject`, { reason });
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const verifyPickupOtp = useCallback(async (orderId, otp) => {
    const { data } = await api.post(`/api/orders/${orderId}/verify-pickup`, { otp });
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const markOrderReady = useCallback(async (orderId) => {
    const { data } = await api.patch(`/api/orders/${orderId}/ready`);
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const markOrderDelivered = useCallback(async (orderId) => {
    const { data } = await api.patch(`/api/orders/${orderId}/delivered`);
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const addOffer = useCallback(async (payload) => {
    const { data } = await api.post("/api/offers", payload);
    const created = normalizeOffer(data?.offer || data);
    setOffers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOffer = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/offers/${id}`, payload);
    const updated = normalizeOffer(data?.offer || data);
    setOffers((prev) => prev.map((o) => (o._id === id || o.id === id ? updated : o)));
    return updated;
  }, []);

  const deleteOffer = useCallback(async (id) => {
    await api.delete(`/api/offers/${id}`);
    setOffers((prev) => prev.filter((o) => o._id !== id && o.id !== id));
    return true;
  }, []);

  const toggleOffer = useCallback(async (id) => {
    const current = offers.find((o) => o._id === id || o.id === id);
    if (!current) throw new Error("Offer not found");
    const nextActive = !current.isActive;
    setOffers((prev) => prev.map((o) => (o._id === id || o.id === id ? { ...o, isActive: nextActive } : o)));
    try {
      const { data } = await api.patch(`/api/offers/${id}/toggle`, { isActive: nextActive });
      return updateOffer(id, data?.offer || data);
    } catch (error) {
      setOffers((prev) => prev.map((o) => (o._id === id || o.id === id ? { ...o, isActive: !nextActive } : o)));
      throw error;
    }
  }, [offers, updateOffer]);

  const value = useMemo(
    () => ({
      products,
      orders,
      offers,
      categories,
      loading,
      loadingError,
      fetchCategories,
      fetchProducts,
      fetchOrders,
      fetchOffers,
      refresh: refreshAll,
      refreshAll,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      toggleCategoryFeatured,
      acceptOrder,
      rejectOrder,
      markOrderReady,
      markOrderDelivered,
      addOffer,
      updateOffer,
      deleteOffer,
      toggleOffer,
      updateOrderState
    }),
    [
      products, orders, offers, categories, loading, loadingError,
      fetchCategories, fetchProducts, fetchOrders, fetchOffers, refreshAll,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory, toggleCategory, toggleCategoryFeatured,
      acceptOrder, rejectOrder, markOrderReady, markOrderDelivered,
      addOffer, updateOffer, deleteOffer, toggleOffer, updateOrderState
    ]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};
