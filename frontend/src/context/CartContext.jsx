import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "mithai-world-cart";

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      // Prevent adding if stock is 0 or less
      if (!action.product || action.product.stock <= 0) {
        return state;
      }
      const existing = state.find((i) => i._id === action.product._id);
      if (existing) {
        // Don't exceed stock limit
        const newQty = Math.min(existing.qty + 1, action.product.stock);
        return state.map((i) =>
          i._id === action.product._id ? { ...i, qty: newQty } : i
        );
      }
      return [...state, { ...action.product, qty: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i._id !== action.id);
    case "UPDATE_QTY":
      return state.map((i) =>
        i._id === action.id ? { ...i, qty: Math.max(1, Math.min(action.qty, i.stock || 1)) } : i
      );
    case "CLEAR":
      return [];
    case "REPLACE":
      return Array.isArray(action.payload) ? action.payload : state;
    default:
      return state;
  }
}

const loadInitialCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
        dispatch({ type: "REPLACE", payload: Array.isArray(nextCart) ? nextCart : [] });
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
