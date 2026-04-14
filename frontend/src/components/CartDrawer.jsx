import { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";
import { formatPrice } from "../utils/priceCalculator";

function CartDrawer({ setPage }) {
  const { cart, isCartOpen, closeCart } = useCart();

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart]
  );

  const delivery = cartTotal >= 999 ? 0 : 79;
  const grandTotal = cartTotal + delivery;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };

    if (isCartOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCartOpen, closeCart]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = isCartOpen ? "hidden" : "";
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isCartOpen]);

  const handleCheckout = useCallback(() => {
    closeCart();
    setPage?.("checkout");
  }, [closeCart, setPage]);

  return createPortal(
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        className={`bg-[#3b2417]/45 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "min(28rem, 100vw)",
          zIndex: 9999,
          transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        className="bg-[#fffdf9] shadow-2xl border-l border-[#e8d4b4] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1e1cb] shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#e8883a]" />
            <h2 className="text-base font-bold text-[#3b2417]">Your Cart</h2>
            {cartCount > 0 && (
              <span className="bg-[#e8883a] text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full leading-none">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex bg-[#fffdf9] items-center border-none justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-16">
              <div className="w-20 h-20 bg-[#fff4e4] rounded-full flex items-center justify-center border border-[#f1dfc5]">
                <ShoppingCart className="w-9 h-9 text-[#d7b788]" />
              </div>
              <div>
                <p className="font-bold text-[#5c412f] mb-1">Your cart is empty</p>
                <p className="text-sm text-[#9a8064]">Add some products to get started</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 text-sm font-semibold text-[#fffdf9] p-3 rounded-full border-none bg-[#e8883a] hover:bg-[#CF762E] " 
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => <CartItem key={item.cartItemId || item._id || item.id} item={item} />)
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-[#f1e1cb] px-5 py-4 space-y-3 bg-[#fffdf9]">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#876b51]">
                <span>Subtotal</span>
                <span className="font-medium text-[#4b3324]">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[#876b51]">
                <span>Delivery</span>
                {delivery === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  <span className="font-medium text-[#4b3324]">{formatPrice(delivery)}</span>
                )}
              </div>
              {delivery > 0 && (
                <p className="text-[11px] text-[#9a8064]">
                  Add {formatPrice(999 - cartTotal)} more for free delivery
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#f1e1cb]">
              <span className="font-bold text-[#3b2417]">Total</span>
              <span className="text-xl font-black text-[#3b2417]">{formatPrice(grandTotal)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-[#3b2417] hover:bg-[#e8883a] text-white font-bold py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-[#3b2417]/10 active:scale-95 text-sm"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

export default CartDrawer;