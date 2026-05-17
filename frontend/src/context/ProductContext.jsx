import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { calculateFinalPriceWithGST, calculateSellingPriceFromDiscount } from "../services/utils/priceCalculator";
import { getDisplayPrice, sortVariantsByLabel } from "@/services/utils/price";

const ProductContext = createContext(null);

const toArray = (value) => (Array.isArray(value) ? value : []);

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const OFFERS_STORAGE_KEY = "mithai-world-admin-offers";

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

export const normalizeProduct = (product) => {
  const normalizedVariants = sortVariantsByLabel(toArray(product?.variants))
    .map((variant, index) => {
      const mrp = Math.max(0, Math.round(Number(variant?.mrp ?? 0)));
      const discountPercent = Math.max(0, Math.min(100, Number(variant?.discountPercent ?? 0) || 0));
      const sellingPrice = Number.isFinite(Number(variant?.sellingPrice))
        ? Math.max(0, Math.round(Number(variant.sellingPrice)))
        : calculateSellingPriceFromDiscount(mrp, discountPercent);
      const finalPrice = Number.isFinite(Number(variant?.finalPrice))
        ? Math.max(0, Math.round(Number(variant.finalPrice)))
        : calculateFinalPriceWithGST(sellingPrice, Number(product?.gstPercent ?? 0) || 0);
      const stock = Math.max(0, Math.floor(Number(variant?.stock ?? 0)));
      return {
        _id: variant?._id || variant?.id || `variant_${index + 1}`,
        label: String(variant?.label || `Variant ${index + 1}`).trim(),
        mrp,
        discountPercent,
        sellingPrice,
        finalPrice,
        stock
      };
    })
    .filter((variant) => variant.mrp > 0);

  const gstPercent = Math.max(0, Math.min(100, Number(product?.gstPercent ?? 0) || 0));
  const fallbackPrice = Math.max(0, Number(product?.basePrice ?? product?.price ?? 0));
  const displayPrice = getDisplayPrice({
    variants: normalizedVariants.length
      ? normalizedVariants
      : [{ id: "default", label: "Default", price: 0, finalPrice: 0 }],
  });

  const stock = Number.isFinite(Number(product?.stock))
    ? Math.max(0, Math.round(Number(product.stock)))
    : normalizedVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const rawCategory = typeof product?.category === "string" ? product.category : product?.category?.slug || product?.category?.name || "";
  const categorySlug = toSlug(product?.categorySlug || rawCategory);

  return {
    ...product,
    basePrice: Math.round(displayPrice || fallbackPrice),
    gstPercent,
    variants: normalizedVariants,
    price: displayPrice,
    stock,
    categorySlug,
    images: toArray(product?.images).length ? toArray(product.images) : product?.image ? [product.image] : []
  };
};

const normalizeOrder = (order) => {
  const items = toArray(order?.items);
  const totals = order?.totals || {};
  const amount = Number(order?.amount || 0);
  const total = Number(totals?.grandTotal ?? order?.total ?? amount);
  const rawStatus = order?.status || order?.deliveryStatus || "PLACED";
  const status = String(rawStatus).toUpperCase();

  return {
    ...order,
    id: order?._id || order?.id,
    orderId: order?.orderId || order?._id || order?.id,
    items,
    itemCount: order?.itemCount || items.length,
    total: total || (amount > 1000 ? amount / 100 : amount),
    status,
    deliveryStatus: String(order?.deliveryStatus || "pending").toLowerCase(),
    deliveryOTP: order?.deliveryOTP || "",
    otpExpiresAt: order?.otpExpiresAt || null,
    deliveryVerified: Boolean(order?.deliveryVerified)
  };
};

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
    isActive,
    active: isActive,
    is_active: isActive,
    offerType: offer?.offerType || offer?.offer_type || "banner",
    discountPercent: Number(offer?.discountPercent ?? offer?.discount_percentage ?? 0),
    linked_product_id: offer?.linked_product_id || offer?.targetProduct || "",
    linked_category_id: offer?.linked_category_id || offer?.targetCategory || ""
  };
};

const readLegacyOffers = () => {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeOffer) : [];
  } catch (_error) {
    return [];
  }
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
      const data = await api.get("/api/products");
      const nextProducts = toArray(data?.products || data?.data?.products || data).map(normalizeProduct);
      setProducts(nextProducts);
      return nextProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get("/api/orders");
      const nextOrders = toArray(data?.orders || data?.data?.orders || data).map(normalizeOrder);
      setOrders(nextOrders);
      return nextOrders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get("/api/categories");
      const nextCategories = toArray(data?.categories || data?.data?.categories || data)
        .map(normalizeCategory)
        .filter((category) => Boolean(category.slug && category.name));
      setCategories(nextCategories);
      return nextCategories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      throw error;
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const data = await api.get("/api/offers");
      const nextOffers = toArray(data?.offers || data?.data?.offers || data).map(normalizeOffer);

      if (nextOffers.length === 0) {
        const legacyOffers = readLegacyOffers();
        const token = localStorage.getItem("token");

        if (legacyOffers.length > 0 && token) {
          const migratedOffers = [];

          for (const offer of legacyOffers) {
            const payload = {
              title: offer.title,
              description: offer.description,
              image: offer.image,
              discount_percentage: Number(offer.discountPercent || offer.discount_percentage || 0),
              offer_type: offer.offerType || offer.offer_type || "banner",
              linked_product_id: offer.linked_product_id || offer.targetProduct || "",
              linked_category_id: offer.linked_category_id || offer.targetCategory || "",
              priority: Number(offer.priority || 0),
              isActive: Boolean(offer.isActive ?? offer.active ?? offer.is_active ?? true)
            };

            const created = await api.post("/api/offers", payload);
            migratedOffers.push(normalizeOffer(created?.offer || created));
          }

          localStorage.removeItem(OFFERS_STORAGE_KEY);
          setOffers(migratedOffers);
          return migratedOffers;
        }
      }

      setOffers(nextOffers);
      return nextOffers;
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers([]);
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchOffers()]);
  }, [fetchProducts, fetchCategories, fetchOffers]);

  /**
   * IMPORTANT: fetchOrders is NOT called automatically at startup.
   * Admin data (orders, offers) are protected routes that require authentication.
   * Fetching them on public pages causes 401 spam.
   * Admin routes will call fetchOrders explicitly when needed.
   */
  useEffect(() => {
    let active = true;

    const loadInitialCatalog = async () => {
      try {
        setLoading(true);
        setLoadingError("");
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (error) {
        if (active) {
          setLoadingError(error?.message || "Failed to load catalog");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialCatalog();

    // ✅ SOCKET.IO INTEGRATION: Connect to real-time updates
    if (!socket.connected) {
      socket.connect();
    }

    // Listen for product updates from admin
    const handleProductUpdate = (updatedProduct) => {
      if (active) {
        const normalized = normalizeProduct(updatedProduct);
        setProducts((prev) =>
          prev.map((p) => ((p._id || p.id) === (normalized._id || normalized.id) ? normalized : p))
        );
      }
    };

    // Listen for new product created
    const handleProductCreated = (newProduct) => {
      if (active) {
        const normalized = normalizeProduct(newProduct);
        setProducts((prev) => [normalized, ...prev]);
      }
    };

    // Listen for product deleted
    const handleProductDeleted = (productId) => {
      if (active) {
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
      }
    };

    // Listen for stock updates
    const handleStockUpdate = ({ productId, variantId, newStock }) => {
      if (active) {
        setProducts((prev) =>
          prev.map((product) => {
            if ((product._id || product.id) !== productId) return product;
            
            if (variantId) {
              // Variant product
              return {
                ...product,
                variants: (product.variants || []).map((v) =>
                  ((v._id || v.id) === variantId ? { ...v, stock: newStock } : v)
                )
              };
            } else {
              // Simple product
              return { ...product, stock: newStock };
            }
          })
        );
      }
    };

    // Listen for category updates
    const handleCategoryUpdate = (updatedCategory) => {
      if (active) {
        const normalized = normalizeCategory(updatedCategory);
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === (normalized._id || normalized.id) ? normalized : c))
        );
      }
    };

    // Listen for category created
    const handleCategoryCreated = (newCategory) => {
      if (active) {
        const normalized = normalizeCategory(newCategory);
        setCategories((prev) => [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name)));
      }
    };

    // Listen for category deleted
    const handleCategoryDeleted = (categoryId) => {
      if (active) {
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== categoryId));
      }
    };

    // Listen for new order created (admin notification)
    const handleNewOrder = (newOrder) => {
      if (active) {
        const normalized = normalizeOrder(newOrder);
        setOrders((prev) => [normalized, ...prev]);
      }
    };

    // Listen for order status update (admin notification)
    const handleOrderUpdated = (updatedOrder) => {
      if (active) {
        const normalized = normalizeOrder(updatedOrder);
        setOrders((prev) =>
          prev.map((o) => ((o._id || o.id) === (normalized._id || normalized.id) ? normalized : o))
        );
      }
    };

    // Attach socket listeners
    socket.on("product:updated", handleProductUpdate);
    socket.on("product:created", handleProductCreated);
    socket.on("product:deleted", handleProductDeleted);
    socket.on("stock:updated", handleStockUpdate);
    socket.on("category:updated", handleCategoryUpdate);
    socket.on("category:created", handleCategoryCreated);
    socket.on("category:deleted", handleCategoryDeleted);
    socket.on("newOrder", handleNewOrder);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      active = false;
      // Clean up socket listeners
      socket.off("product:updated", handleProductUpdate);
      socket.off("product:created", handleProductCreated);
      socket.off("product:deleted", handleProductDeleted);
      socket.off("stock:updated", handleStockUpdate);
      socket.off("category:updated", handleCategoryUpdate);
      socket.off("category:created", handleCategoryCreated);
      socket.off("category:deleted", handleCategoryDeleted);
      socket.off("newOrder", handleNewOrder);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    const handleFocus = () => {
      fetchProducts().catch(() => {});
      fetchCategories().catch(() => {});
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchProducts]);

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

  const updateOrderState = useCallback((updatedOrder) => {
    if (!updatedOrder) {
      return null;
    }

    const normalized = normalizeOrder(updatedOrder);
    const updatedId = normalized._id || normalized.id || normalized.orderId;
    setOrders((prev) =>
      prev.map((order) => {
        const orderId = order._id || order.id || order.orderId;
        return orderId === updatedId ? normalized : order;
      })
    );
    return normalized;
  }, []);

  const acceptOrder = useCallback(async (orderId, etaMinutes) => {
    const data = await api.patch(`/api/orders/${orderId}/accept`, { etaMinutes });
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const rejectOrder = useCallback(async (orderId, reason) => {
    const data = await api.patch(`/api/orders/${orderId}/reject`, { reason });
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const markOrderReady = useCallback(async (orderId) => {
    const data = await api.patch(`/api/orders/${orderId}/ready`);
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

  const markOrderDelivered = useCallback(async (orderId) => {
    const data = await api.patch(`/api/orders/${orderId}/delivered`);
    return updateOrderState(data?.order || data);
  }, [updateOrderState]);

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
    console.log("📝 Creating offer with payload:", payload);
    const data = await api.post("/api/offers", payload);
    console.log("✅ Create offer response:", data);
    const created = normalizeOffer(data?.offer || data);
    setOffers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOffer = useCallback(async (id, payload) => {
    console.log("✏️ Updating offer", id, "with payload:", payload);
    const data = await api.put(`/api/offers/${id}`, payload);
    console.log("✅ Update offer response:", data);
    const updatedOffer = normalizeOffer(data?.offer || data);
    setOffers((prev) => prev.map((offer) => ((offer._id || offer.id) === id ? updatedOffer : offer)));
    return updatedOffer;
  }, []);

  const deleteOffer = useCallback(async (id) => {
    console.log("🗑️ Deleting offer:", id);
    await api.delete(`/api/offers/${id}`);
    setOffers((prev) => prev.filter((offer) => (offer._id || offer.id) !== id));
    return true;
  }, []);

  const toggleOffer = useCallback(async (id) => {
    const current = offers.find((offer) => (offer._id || offer.id) === id);
    if (!current) {
      throw new Error("Offer not found");
    }

    const nextActive = !Boolean(current.isActive);
    console.log("🔄 Toggling offer active state:", { id, current: current.isActive, nextActive });

    setOffers((prev) =>
      prev.map((offer) => ((offer._id || offer.id) === id ? { ...offer, isActive: nextActive, active: nextActive, is_active: nextActive } : offer))
    );

    try {
      const data = await api.patch(`/api/offers/${id}/toggle`, { isActive: nextActive });
      console.log("✅ Toggle offer response:", data);
      const updatedOffer = normalizeOffer(data?.offer || data);
      setOffers((prev) => prev.map((offer) => ((offer._id || offer.id) === id ? updatedOffer : offer)));
      return updatedOffer;
    } catch (error) {
      console.error("❌ Offer toggle failed, rolling back:", error);
      setOffers((prev) =>
        prev.map((offer) => ((offer._id || offer.id) === id ? { ...offer, isActive: current.isActive, active: current.isActive, is_active: current.isActive } : offer))
      );
      throw error;
    }
  }, [offers]);

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
      refresh,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      toggleCategoryFeatured,
      addProduct,
      updateProduct,
      deleteProduct,
      acceptOrder,
      rejectOrder,
      markOrderReady,
      markOrderDelivered,
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
      loading,
      loadingError,
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
      acceptOrder,
      rejectOrder,
      markOrderReady,
      markOrderDelivered,
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
