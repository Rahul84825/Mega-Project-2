import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { calculateTotals } from "shared/utils/pricing";
import { useAuth } from "./AuthContext";

const ProductContext = createContext(null);

const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeProduct = (product) => {
  const productId = String(product?._id || product?.id || "");
  
  const normalizedVariants = toArray(product?.variants).map((variant, index) => {
    const mrp = Math.round(Number(variant?.mrp || 0));
    const sellingPrice = Math.round(Number(variant?.sellingPrice || mrp));
    const variantId = variant?._id || variant?.id || `${productId}_v${index}`;
    
    return {
      ...variant,
      _id: String(variantId),
      mrp,
      sellingPrice,
      finalPrice: sellingPrice,
      stock: Number(variant?.stock || 0),
      isAvailable: variant?.isAvailable !== undefined ? Boolean(variant.isAvailable) : true
    };
  });

  const basePrice = normalizedVariants.length > 0 
    ? Math.min(...normalizedVariants.map(v => v.sellingPrice))
    : Math.round(Number(product?.price || product?.basePrice || 0));

  return {
    ...product,
    _id: productId,
    id: productId,
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
    quantity: Number(item.quantity || 1),
    gstRate: Number(item.gstRate || 0)
  }));

  const { subtotal, deliveryFee, total, gstTotal } = calculateTotals(items);

  return {
    ...order,
    _id: String(order?._id || order?.id || ""),
    items,
    subtotal: order?.totals?.itemsSubtotal || order?.subtotal || subtotal,
    deliveryFee: order?.totals?.shippingFee ?? order?.deliveryFee ?? deliveryFee,
    gstTotal: order?.totals?.gstTotal || order?.gstTotal || gstTotal,
    total: order?.totals?.grandTotal || order?.total || total,
    status: (order?.status || "PLACED").toUpperCase()
  };
};

const normalizeCategory = (category) => ({
  _id: String(category?._id || category?.id || ""),
  id: String(category?.id || category?._id || ""),
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
    id: String(offer?._id || offer?.id || ""),
    _id: String(offer?._id || offer?.id || ""),
    isActive,
    active: isActive,
    is_active: isActive,
    offerType: offer?.offerType || offer?.offer_type || "banner",
    discountPercent: Number(offer?.discountPercent ?? offer?.discount_percentage ?? 0),
    linked_product_id: offer?.linked_product_id || offer?.targetProduct || "",
    linked_category_id: offer?.linked_category_id || offer?.targetCategory || ""
  };
};

// --- REDUCER SETUP ---

const initialState = {
  products: [],
  orders: [],
  offers: [],
  categories: [],
  loading: true,
  loadingError: null,
};

const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  UPSERT_PRODUCT: 'UPSERT_PRODUCT',
  REMOVE_PRODUCT: 'REMOVE_PRODUCT',
  UPSERT_ORDER: 'UPSERT_ORDER',
  UPSERT_CATEGORY: 'UPSERT_CATEGORY',
  REMOVE_CATEGORY: 'REMOVE_CATEGORY',
  UPSERT_OFFER: 'UPSERT_OFFER',
  REMOVE_OFFER: 'REMOVE_OFFER',
};

function productReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, loadingError: action.payload, loading: false };
    case actionTypes.SET_DATA:
      return { ...state, ...action.payload, loading: false, loadingError: null };
    
    // Product Actions
    case actionTypes.UPSERT_PRODUCT: {
      const p = normalizeProduct(action.payload);
      const exists = state.products.some(x => x._id === p._id);
      return {
        ...state,
        products: exists 
          ? state.products.map(x => x._id === p._id ? p : x)
          : [p, ...state.products]
      };
    }
    case actionTypes.REMOVE_PRODUCT:
      return { ...state, products: state.products.filter(p => p._id !== action.payload) };

    // Order Actions
    case actionTypes.UPSERT_ORDER: {
      const o = normalizeOrder(action.payload);
      const exists = state.orders.some(x => x._id === o._id);
      return {
        ...state,
        orders: exists
          ? state.orders.map(x => x._id === o._id ? o : x)
          : [o, ...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    }

    // Category Actions
    case actionTypes.UPSERT_CATEGORY: {
      const c = normalizeCategory(action.payload);
      const exists = state.categories.some(x => x._id === c._id);
      const updated = exists 
        ? state.categories.map(x => x._id === c._id ? c : x)
        : [...state.categories, c];
      return { ...state, categories: updated.sort((a, b) => a.name.localeCompare(b.name)) };
    }
    case actionTypes.REMOVE_CATEGORY:
      return { ...state, categories: state.categories.filter(c => c._id !== action.payload) };

    // Offer Actions
    case actionTypes.UPSERT_OFFER: {
      const off = normalizeOffer(action.payload);
      const exists = state.offers.some(x => x._id === off._id);
      return {
        ...state,
        offers: exists
          ? state.offers.map(x => x._id === off._id ? off : x)
          : [off, ...state.offers]
      };
    }
    case actionTypes.REMOVE_OFFER:
      return { ...state, offers: state.offers.filter(o => o._id !== action.payload) };

    default:
      return state;
  }
}

export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const isFetchingRef = useRef(false);
  const { isAdmin } = useAuth();
  const audioRef = useRef(null);

  // Initialize audio object
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.preload = "auto";
      audioRef.current.load();
    }
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      // Force reload if needed and play
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Audio playback failed (usually due to user interaction policy):", err);
          // Fallback: try to load and play again
          audioRef.current.load();
        });
      }
    }
  }, []);

  // --- CORE FETCHERS ---

  const refreshAll = useCallback(async (showLoading = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoading) dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      const [resProducts, resOrders, resCategories, resOffers] = await Promise.allSettled([
        api.get("/api/products"),
        api.get("/api/orders"),
        api.get("/api/categories"),
        api.get("/api/offers")
      ]);

      const payload = {};
      if (resProducts.status === 'fulfilled') {
        payload.products = toArray(resProducts.value.data?.products || resProducts.value.data).map(normalizeProduct);
      }
      if (resOrders.status === 'fulfilled') {
        payload.orders = toArray(resOrders.value.data?.orders || resOrders.value.data).map(normalizeOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      if (resCategories.status === 'fulfilled') {
        payload.categories = toArray(resCategories.value.data?.categories || resCategories.value.data).map(normalizeCategory);
      }
      if (resOffers.status === 'fulfilled') {
        payload.offers = toArray(resOffers.value.data?.offers || resOffers.value.data).map(normalizeOffer);
      }

      dispatch({ type: actionTypes.SET_DATA, payload });
    } catch (err) {
      console.error("Failed to load initial data", err);
      dispatch({ type: actionTypes.SET_ERROR, payload: err.message || "Failed to load data" });
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/api/products");
      dispatch({ type: actionTypes.SET_DATA, payload: { products: toArray(data?.products || data).map(normalizeProduct) } });
    } catch (err) { console.error("fetchProducts error", err); }
  }, []);

  const fetchCategories = useCallback(async () => {
     try {
      const { data } = await api.get("/api/categories");
      dispatch({ type: actionTypes.SET_DATA, payload: { categories: toArray(data?.categories || data).map(normalizeCategory) } });
    } catch (err) { console.error("fetchCategories error", err); }
  }, []);

  const fetchOrders = useCallback(async () => {
     try {
      const { data } = await api.get("/api/orders");
      const sorted = toArray(data?.orders || data).map(normalizeOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      dispatch({ type: actionTypes.SET_DATA, payload: { orders: sorted } });
    } catch (err) { console.error("fetchOrders error", err); }
  }, []);

  const fetchOffers = useCallback(async () => {
     try {
      const { data } = await api.get("/api/offers");
      dispatch({ type: actionTypes.SET_DATA, payload: { offers: toArray(data?.offers || data).map(normalizeOffer) } });
    } catch (err) { console.error("fetchOffers error", err); }
  }, []);


  // --- LIFECYCLE & SOCKETS ---

  useEffect(() => {
    refreshAll();

    if (!socket.connected) socket.connect();

    const handleNewOrder = (order) => {
      if (order) {
        dispatch({ type: actionTypes.UPSERT_ORDER, payload: order });
        // Play notification ONLY if user is confirmed as Admin
        // This ensures customers don't hear the Swiggy-style alert
        if (isAdmin === true) {
          playNotification();
        }
      }
    };

    const handleOrderUpdate = (order) => {
      if (order) dispatch({ type: actionTypes.UPSERT_ORDER, payload: order });
    };

    const handleProductUpdate = (product) => {
      if (product) dispatch({ type: actionTypes.UPSERT_PRODUCT, payload: product });
      else fetchProducts(); // fallback
    };

    const handleProductDeleted = (id) => {
      if (id) dispatch({ type: actionTypes.REMOVE_PRODUCT, payload: id });
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:updated", handleOrderUpdate);
    socket.on("product:updated", handleProductUpdate);
    socket.on("product:created", handleProductUpdate);
    socket.on("product:deleted", handleProductDeleted);
    socket.on("stock:updated", () => fetchProducts());

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:updated", handleOrderUpdate);
      socket.off("product:updated", handleProductUpdate);
      socket.off("product:created", handleProductUpdate);
      socket.off("product:deleted", handleProductDeleted);
      socket.off("stock:updated");
    };
  }, [refreshAll, fetchProducts, isAdmin, playNotification]);

  useEffect(() => {
    const handleFocus = () => refreshAll(false);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshAll]);

  // --- ACTIONS ---

  // Products
  const addProduct = useCallback(async (payload) => {
    const { data } = await api.post("/api/products", payload);
    const p = normalizeProduct(data?.product || data);
    dispatch({ type: actionTypes.UPSERT_PRODUCT, payload: p });
    return p;
  }, []);

  const updateProduct = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/products/${id}`, payload);
    const p = normalizeProduct(data?.product || data);
    dispatch({ type: actionTypes.UPSERT_PRODUCT, payload: p });
    return p;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/api/products/${id}`);
    dispatch({ type: actionTypes.REMOVE_PRODUCT, payload: String(id) });
    return true;
  }, []);

  const toggleProductStatus = useCallback(async (id, isActive) => {
    const { data } = await api.patch(`/api/products/${id}/toggle-status`, { isActive });
    const p = normalizeProduct(data?.product || data);
    dispatch({ type: actionTypes.UPSERT_PRODUCT, payload: p });
    return p;
  }, []);

  const toggleVariantStatus = useCallback(async (id, variantId, isAvailable) => {
    const { data } = await api.patch(`/api/products/${id}/variants/${variantId}/toggle-status`, { isAvailable });
    const p = normalizeProduct(data?.product || data);
    dispatch({ type: actionTypes.UPSERT_PRODUCT, payload: p });
    return p;
  }, []);

  // Categories
  const addCategory = useCallback(async (payload) => {
    const { data } = await api.post("/api/categories", payload);
    const c = normalizeCategory(data?.category || data);
    dispatch({ type: actionTypes.UPSERT_CATEGORY, payload: c });
    return c;
  }, []);

  const updateCategory = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/categories/${id}`, payload);
    const c = normalizeCategory(data?.category || data);
    dispatch({ type: actionTypes.UPSERT_CATEGORY, payload: c });
    return c;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await api.delete(`/api/categories/${id}`);
    dispatch({ type: actionTypes.REMOVE_CATEGORY, payload: String(id) });
    return true;
  }, []);

  const toggleCategory = useCallback(async (id) => {
    const existing = state.categories.find((c) => c._id === id);
    if (!existing) throw new Error("Category not found");
    return updateCategory(id, { is_active: !existing.is_active });
  }, [state.categories, updateCategory]);

  const toggleCategoryFeatured = useCallback(async (id) => {
    const existing = state.categories.find((c) => c._id === id);
    if (!existing) throw new Error("Category not found");
    return updateCategory(id, { showInNavbar: !existing.showInNavbar });
  }, [state.categories, updateCategory]);

  // Orders
  const updateOrderState = useCallback((updatedOrder) => {
    if (!updatedOrder) return null;
    const o = normalizeOrder(updatedOrder);
    dispatch({ type: actionTypes.UPSERT_ORDER, payload: o });
    return o;
  }, []);

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

  // Offers
  const addOffer = useCallback(async (payload) => {
    const { data } = await api.post("/api/offers", payload);
    const o = normalizeOffer(data?.offer || data);
    dispatch({ type: actionTypes.UPSERT_OFFER, payload: o });
    return o;
  }, []);

  const updateOffer = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/offers/${id}`, payload);
    const o = normalizeOffer(data?.offer || data);
    dispatch({ type: actionTypes.UPSERT_OFFER, payload: o });
    return o;
  }, []);

  const deleteOffer = useCallback(async (id) => {
    await api.delete(`/api/offers/${id}`);
    dispatch({ type: actionTypes.REMOVE_OFFER, payload: String(id) });
    return true;
  }, []);

  const toggleOffer = useCallback(async (id) => {
    const existing = state.offers.find((o) => o._id === id);
    if (!existing) throw new Error("Offer not found");
    const nextActive = !existing.isActive;
    
    // Optimistic Update
    dispatch({ type: actionTypes.UPSERT_OFFER, payload: { ...existing, isActive: nextActive } });
    
    try {
      const { data } = await api.patch(`/api/offers/${id}/toggle`, { isActive: nextActive });
      return updateOffer(id, data?.offer || data);
    } catch (error) {
      // Revert on failure
      dispatch({ type: actionTypes.UPSERT_OFFER, payload: existing });
      throw error;
    }
  }, [state.offers, updateOffer]);

  const value = {
    ...state,
    refreshAll,
    refresh: refreshAll, // alias for backwards compatibility
    fetchProducts,
    fetchCategories,
    fetchOrders,
    fetchOffers,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    toggleVariantStatus,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    toggleCategoryFeatured,
    acceptOrder,
    rejectOrder,
    verifyPickupOtp,
    markOrderReady,
    markOrderDelivered,
    updateOrderState,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOffer,
    playNotification
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};