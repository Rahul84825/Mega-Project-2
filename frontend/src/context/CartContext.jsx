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
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
