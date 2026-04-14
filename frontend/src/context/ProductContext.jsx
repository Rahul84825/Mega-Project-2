import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const OFFERS_STORAGE_KEY = "mithai-world-admin-offers";

const ProductContext = createContext(null);

const toArray = (value) => (Array.isArray(value) ? value : []);

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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

const normalizeProduct = (product) => {
  const stock = Number(product?.stock || 0);
  const rawCategory = typeof product?.category === "string" ? product.category : product?.category?.slug || product?.category?.name || "";
  const categorySlug = toSlug(product?.categorySlug || rawCategory);
  return {
    ...product,
    stock,
    inStock: stock > 0,
    categorySlug,
    images: toArray(product?.images).length ? toArray(product.images) : product?.image ? [product.image] : []
  };
};

const normalizeOrder = (order) => {
  const items = toArray(order?.items);
  const amount = Number(order?.amount || 0);
  const total = Number(order?.total || 0);

  return {
    ...order,
    id: order?._id || order?.id,
    orderId: order?.orderId || order?._id || order?.id,
    items,
    itemCount: order?.itemCount || items.length,
    total: total || (amount > 1000 ? amount / 100 : amount),
    status: order?.status || (order?.deliveryStatus === "delivered" ? "delivered" : "processing"),
    deliveryStatus: order?.deliveryStatus || "pending",
    deliveryOTP: order?.deliveryOTP || "",
    otpExpiresAt: order?.otpExpiresAt || null,
    deliveryVerified: Boolean(order?.deliveryVerified)
  };
};

const loadStoredOffers = () => {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState(loadStoredOffers);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
    } catch (_error) {
      // Ignore storage errors.
    }
  }, [offers]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get("/api/products");
      const nextProducts = toArray(data?.products || data).map(normalizeProduct);
      setProducts(nextProducts);
      return nextProducts;
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      throw error;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get("/api/orders");
      const nextOrders = toArray(data?.orders || data).map(normalizeOrder);
      setOrders(nextOrders);
      return nextOrders;
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      throw error;
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      console.log("🔄 Fetching categories from /api/categories...");
      const data = await api.get("/api/categories");
      console.log("✅ Categories API response:", data);
      const nextCategories = toArray(data?.categories || data)
        .map(normalizeCategory)
        .filter((category) => Boolean(category.slug && category.name));
      console.log("✅ Normalized categories:", nextCategories);
      setCategories(nextCategories);
      return nextCategories;
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setCategories([]);
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchOrders(), fetchCategories()]);
  }, [fetchProducts, fetchOrders, fetchCategories]);

  useEffect(() => {
    refresh().catch(() => {
      // Admin components surface fetch failures.
    });
  }, [refresh]);

  const addProduct = useCallback(
    async (payload) => {
      const data = await api.post("/api/products", payload);
      const created = normalizeProduct(data?.product || data);
      setProducts((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateProduct = useCallback(async (id, payload) => {
    const data = await api.put(`/api/products/${id}`, payload);
    const updated = normalizeProduct(data?.product || data);
    setProducts((prev) => prev.map((product) => ((product._id || product.id) === id ? updated : product)));
    return updated;
  }, []);

  const addCategory = useCallback(async (payload) => {
    try {
      console.log("📝 Adding category with payload:", payload);
      const data = await api.post("/api/categories", payload);
      console.log("✅ Add category response:", data);
      const created = normalizeCategory(data?.category || data);
      console.log("✅ Normalized new category:", created);
      setCategories((prev) => {
        const updated = [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
        console.log("✅ Updated categories list:", updated);
        return updated;
      });
      return created;
    } catch (error) {
      console.error("❌ Error adding category:", error);
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id, payload) => {
    try {
      console.log("✏️ Updating category", id, "with payload:", payload);
      const data = await api.put(`/api/categories/${id}`, payload);
      console.log("✅ Update category response:", data);
      const updated = normalizeCategory(data?.category || data);
      setCategories((prev) =>
        prev
          .map((category) => ((category._id || category.id) === id ? updated : category))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      // Keep products consistent when category slug changes.
      const previous = categories.find((category) => (category._id || category.id) === id);
      const previousSlug = toSlug(previous?.slug);
      const updatedSlug = toSlug(updated?.slug);
      if (previousSlug && updatedSlug && updatedSlug !== previousSlug) {
        console.log("📦 Updating products with slug change:", previousSlug, "→", updatedSlug);
        setProducts((prev) =>
          prev.map((product) => {
            const productSlug = toSlug(product?.categorySlug || product?.category);
            return productSlug === previousSlug
              ? { ...product, category: updatedSlug, categorySlug: updatedSlug }
              : product;
          })
        );
      }

      return updated;
    } catch (error) {
      console.error("❌ Error updating category:", error);
      throw error;
    }
  }, [categories]);

  const deleteCategory = useCallback(async (id) => {
    try {
      console.log("🗑️ Deleting category", id);
      await api.delete(`/api/categories/${id}`);
      console.log("✅ Category deleted successfully");
      setCategories((prev) => prev.filter((category) => (category._id || category.id) !== id));
      return true;
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      throw error;
    }
  }, []);

  const toggleCategory = useCallback(async (id) => {
    try {
      const existing = categories.find((category) => (category._id || category.id) === id);
      if (!existing) {
        throw new Error("Category not found");
      }
      console.log("🔄 Toggling category active status:", id);
      return updateCategory(id, { is_active: !Boolean(existing.is_active) });
    } catch (error) {
      console.error("❌ Error toggling category:", error);
      throw error;
    }
  }, [categories, updateCategory]);

  const toggleCategoryFeatured = useCallback(async (id) => {
    try {
      const existing = categories.find((category) => (category._id || category.id) === id);
      if (!existing) {
        throw new Error("Category not found");
      }
      console.log("⭐ Toggling category navbar visibility:", id);
      return updateCategory(id, { showInNavbar: !Boolean(existing.showInNavbar) });
    } catch (error) {
      console.error("❌ Error toggling category navbar visibility:", error);
      throw error;
    }
  }, [categories, updateCategory]);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((product) => (product._id || product.id) !== id));
    return true;
  }, []);

  const toggleStock = useCallback(
    async (id) => {
      const product = products.find((item) => (item._id || item.id) === id);
      if (!product) {
        throw new Error("Product not found");
      }

      const nextStock = product.inStock ? 0 : Math.max(1, Number(product.stock || 0));
      return updateProduct(id, {
        stock: nextStock
      });
    },
    [products, updateProduct]
  );

  const setHeroProduct = useCallback(
    async (id) => {
      const updates = products.map((product) => {
        const productId = product._id || product.id;
        return api.put(`/api/products/${productId}`, {
          isHero: productId === id
        });
      });

      await Promise.all(updates);
      await fetchProducts();
    },
    [products, fetchProducts]
  );

  const updateOrder = useCallback(async (orderId, payload) => {
    const data = await api.put(`/api/orders/${orderId}`, payload);
    const updatedOrder = normalizeOrder(data?.order || data);
    setOrders((prev) => prev.map((order) => ((order._id || order.id) === orderId ? updatedOrder : order)));
    return updatedOrder;
  }, []);

  const markOrderDelivered = useCallback(
    async (orderId) =>
      updateOrder(orderId, {
        status: "delivered",
        deliveryStatus: "delivered",
        deliveryVerified: true
      }),
    [updateOrder]
  );

  const markOrderPaid = useCallback(
    async (orderId) =>
      updateOrder(orderId, {
        paymentStatus: "paid"
      }),
    [updateOrder]
  );

  const addIncomingOrder = useCallback((incomingOrder) => {
    const normalized = normalizeOrder(incomingOrder);
    const incomingId = normalized._id || normalized.id || normalized.orderId;

    if (!incomingId) {
      return { order: normalized, isNew: false };
    }

    let isNew = false;
    setOrders((prev) => {
      const exists = prev.some((order) => {
        const orderId = order._id || order.id || order.orderId;
        return orderId === incomingId;
      });

      if (exists) {
        return prev.map((order) => {
          const orderId = order._id || order.id || order.orderId;
          return orderId === incomingId ? { ...order, ...normalized } : order;
        });
      }

      isNew = true;
      return [normalized, ...prev];
    });

    return { order: normalized, isNew };
  }, []);

  const addOffer = useCallback(async (payload) => {
    const created = {
      ...payload,
      _id: `offer_${Date.now().toString(36)}`,
      id: `offer_${Date.now().toString(36)}`,
      active: payload?.is_active !== undefined ? Boolean(payload.is_active) : true,
      isActive: payload?.is_active !== undefined ? Boolean(payload.is_active) : true,
      offerType: payload?.offer_type || "banner",
      discountPercent: Number(payload?.discount_percentage || 0),
      image: payload?.image || "",
      title: payload?.title || "Offer",
      description: payload?.description || "",
      priority: Number(payload?.priority || 0),
      themeColor: payload?.theme_color
    };

    setOffers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOffer = useCallback(async (id, payload) => {
    let updatedOffer = null;
    setOffers((prev) =>
      prev.map((offer) => {
        const offerId = offer._id || offer.id;
        if (offerId !== id) {
          return offer;
        }

        updatedOffer = {
          ...offer,
          ...payload,
          offerType: payload?.offer_type || offer.offerType,
          discountPercent: payload?.discount_percentage ?? offer.discountPercent,
          active: payload?.is_active !== undefined ? Boolean(payload.is_active) : offer.active,
          isActive: payload?.is_active !== undefined ? Boolean(payload.is_active) : offer.isActive,
          themeColor: payload?.theme_color || offer.themeColor
        };

        return updatedOffer;
      })
    );

    return updatedOffer;
  }, []);

  const deleteOffer = useCallback(async (id) => {
    setOffers((prev) => prev.filter((offer) => (offer._id || offer.id) !== id));
    return true;
  }, []);

  const toggleOffer = useCallback(async (id) => {
    setOffers((prev) =>
      prev.map((offer) => {
        const offerId = offer._id || offer.id;
        if (offerId !== id) {
          return offer;
        }

        const nextActive = !(offer.isActive !== undefined ? offer.isActive : offer.active);
        return {
          ...offer,
          active: nextActive,
          isActive: nextActive
        };
      })
    );

    return true;
  }, []);

  const value = useMemo(
    () => ({
      products,
      orders,
      offers,
      categories,
      fetchCategories,
      fetchProducts,
      fetchOrders,
      refresh,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      toggleCategoryFeatured,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleStock,
      setHeroProduct,
      markOrderDelivered,
      markOrderPaid,
      addIncomingOrder,
      addOffer,
      updateOffer,
      deleteOffer,
      toggleOffer
    }),
    [
      products,
      orders,
      offers,
      categories,
      fetchCategories,
      fetchProducts,
      fetchOrders,
      refresh,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      toggleCategoryFeatured,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleStock,
      setHeroProduct,
      markOrderDelivered,
      markOrderPaid,
      addIncomingOrder,
      addOffer,
      updateOffer,
      deleteOffer,
      toggleOffer
    ]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }
  return context;
};
