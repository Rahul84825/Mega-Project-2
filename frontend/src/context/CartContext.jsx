import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "mithai-world-cart";

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
      return action.payload;

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], () => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

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
