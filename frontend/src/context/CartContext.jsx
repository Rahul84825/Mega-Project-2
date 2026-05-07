import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "mithai-world-cart";

const getCartItemKey = (item) => {
  const productId = item?.productId || item?._id || item?.id || "";
  const variantId = item?.variantId || item?.variant?._id || item?.variant?.id || "default";
  return `${productId}::${variantId}`;
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      if (!action.product) {
        return state;
      }

      if (!action.product.productId || !action.product.variantId) {
        return state;
      }

      const stockValue = Number(action.product.stock);
      const stock = Number.isFinite(stockValue) ? Math.max(0, stockValue) : Number.POSITIVE_INFINITY;

      if (stock <= 0) {
        return state;
      }

      const incomingKey = getCartItemKey(action.product);
      const existing = state.find((i) => getCartItemKey(i) === incomingKey);
      const incomingQty = Math.max(1, Number(action.product.quantity || 1));

      if (existing) {
        const newQty = Math.min((existing.quantity || 0) + incomingQty, stock);
        return state.map((i) =>
          getCartItemKey(i) === incomingKey ? { ...i, quantity: newQty } : i
        );
      }

      return [
        ...state,
        {
          productId: action.product.productId,
          variantId: action.product.variantId,
          quantity: incomingQty,
          price: Number(action.product.price) || 0,
          name: action.product.name,
          image: action.product.image || action.product?.images?.[0],
          category: action.product.category,
          variantLabel: action.product.variant?.label || action.product.variantLabel || "Default",
          stock: action.product.stock
        },
      ];
    }
    case "UPDATE_QTY":
      return state.map((i) => {
        const actionKey = action.productId && action.variantId
          ? `${action.productId}::${action.variantId}`
          : action.id;
        if (getCartItemKey(i) !== actionKey) {
          return i;
        }

        const stockValue = Number(i.stock);
        const stock = Number.isFinite(stockValue) ? Math.max(0, stockValue) : Number.POSITIVE_INFINITY;

        if (stock <= 0) {
          return i;
        }

        return { ...i, quantity: Math.max(1, Math.min(action.quantity, stock)) };
      });
    case "REMOVE": {
      const actionKey = action.productId && action.variantId
        ? `${action.productId}::${action.variantId}`
        : action.id;
      return state.filter((i) => getCartItemKey(i) !== actionKey);
    }
    case "CLEAR":
      return [];
    case "REPLACE":
      return normalizeLoadedCart(action.payload);
    default:
      return state;
  }
}

const normalizeLoadedCart = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    productId: item?.productId || item?._id || item?.id || "",
    variantId: item?.variantId || item?.variant?._id || item?.variant?.id || "default",
    quantity: Number(item?.quantity ?? item?.qty ?? 1),
    price: Number(item?.price ?? item?.variant?.finalPrice ?? 0),
    name: item?.name,
    image: item?.image || item?.images?.[0],
    category: item?.category,
    variantLabel: item?.variantLabel || item?.variant?.label || "Default",
    stock: item?.stock ?? item?.variant?.stock
  })).filter((item) => item.productId);
};

const loadInitialCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeLoadedCart(parsed);
  } catch (_error) {
    return [];
  }
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], loadInitialCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (_error) {
      // Ignore write failures in constrained environments.
    }
  }, [cart]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== CART_STORAGE_KEY) {
        return;
      }

      try {
        const nextCart = event.newValue ? JSON.parse(event.newValue) : [];
        dispatch({ type: "REPLACE", payload: normalizeLoadedCart(nextCart) });
      } catch (_error) {
        dispatch({ type: "REPLACE", payload: [] });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleCart = () => {
    setIsCartOpen((open) => !open);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <CartContext.Provider value={{ cart, dispatch, isCartOpen, toggleCart, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
