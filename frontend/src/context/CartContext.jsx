import { createContext, useContext, useEffect, useReducer } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "mithai-world-cart";

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((i) => i._id === action.product._id);
      if (existing) {
        return state.map((i) =>
          i._id === action.product._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...state, { ...action.product, qty: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i._id !== action.id);
    case "UPDATE_QTY":
      return state.map((i) =>
        i._id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
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

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
