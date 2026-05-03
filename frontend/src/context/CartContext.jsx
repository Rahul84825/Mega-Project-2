import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "mithai-world-cart";

const getCartItemId = (item) => item?.cartItemId || item?._id || item?.id;

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      if (!action.product) {
        return state;
      }

      const stockValue = Number(action.product.stock);
      const stock = Number.isFinite(stockValue) ? Math.max(0, stockValue) : Number.POSITIVE_INFINITY;

      if (stock <= 0) {
        return state;
      }

      const incomingId = getCartItemId(action.product);
      const existing = state.find((i) => getCartItemId(i) === incomingId);
      const incomingQty = Math.max(1, Number(action.product.quantity || 1));

      if (existing) {
        const newQty = Math.min(existing.qty + incomingQty, stock);
        return state.map((i) =>
          getCartItemId(i) === incomingId ? { ...i, qty: newQty } : i
        );
      }

      return [
        ...state,
        {
          ...action.product,
          cartItemId: incomingId,
          qty: incomingQty,
          variantLabel: action.product.variant?.label || action.product.variantLabel || "Default",
          image: action.product.image || action.product?.images?.[0],
          price: Number(action.product.price) || 0,
        },
      ];
    }
    case "UPDATE_QTY":
      return state.map((i) => {
        if (getCartItemId(i) !== action.id) {
          return i;
        }

        const stockValue = Number(i.stock);
        const stock = Number.isFinite(stockValue) ? Math.max(0, stockValue) : Number.POSITIVE_INFINITY;

        if (stock <= 0) {
          return i;
        }

        return { ...i, qty: Math.max(1, Math.min(action.qty, stock)) };
      });
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
