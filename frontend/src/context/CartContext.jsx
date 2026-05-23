import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const CART_STORAGE_BASE_KEY = "mithai-world-cart";

const getCartItemKey = (item) => {
  const productId = item?.productId || item?._id || item?.id || "";
  const variantId = item?.variantId || "default";
  return `${productId}::${variantId}`;
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { payload } = action;
      if (!payload?.productId) return state;

      const incomingKey = getCartItemKey(payload);
      const existing = state.find(i => getCartItemKey(i) === incomingKey);
      const stock = Number(payload.stock || 0);
      const incomingQty = Math.max(1, Number(payload.quantity || 1));

      if (existing) {
        const newQty = Math.min(existing.quantity + incomingQty, stock || 99);
        return state.map(i => getCartItemKey(i) === incomingKey ? { ...i, quantity: newQty } : i);
      }

      return [
        ...state,
        {
          productId: payload.productId,
          variantId: payload.variantId || "default",
          variantLabel: payload.variantLabel || "Default",
          name: payload.name,
          price: Number(payload.price) || 0,
          image: payload.image,
          quantity: incomingQty,
          stock: payload.stock
        },
      ];
    }

    case "UPDATE_QUANTITY": {
      const { productId, variantId, quantity } = action.payload;
      const key = `${productId}::${variantId || 'default'}`;
      return state.map(i => {
        if (getCartItemKey(i) !== key) return i;
        const stock = Number(i.stock || 99);
        return { ...i, quantity: Math.max(1, Math.min(quantity, stock)) };
      });
    }

    case "REMOVE_ITEM": {
      const key = getCartItemKey(action.payload);
      return state.filter(i => getCartItemKey(i) !== key);
    }

    case "CLEAR":
      return [];

    case "SYNC":
      return Array.isArray(action.payload) ? action.payload : [];

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id || "guest";
  const storageKey = `${CART_STORAGE_BASE_KEY}-${userId}`;

  const [cart, dispatch] = useReducer(cartReducer, [], () => {
    try {
      const raw = localStorage.getItem(`${CART_STORAGE_BASE_KEY}-${user?.id || user?._id || "guest"}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart when user changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const savedCart = raw ? JSON.parse(raw) : [];
      dispatch({ type: "SYNC", payload: savedCart });
    } catch {
      dispatch({ type: "SYNC", payload: [] });
    }
  }, [storageKey]);

  // Persist cart changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart   = () => setIsCartOpen(true);
  const closeCart  = () => setIsCartOpen(false);

  return (
    <CartContext.Provider value={{ cart, dispatch, isCartOpen, toggleCart, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
