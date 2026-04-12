import { useEffect, useMemo } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function CartDrawer({ setPage }) {
  const { cart, dispatch, isCartOpen, closeCart } = useCart();

  const total = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0), [cart]);

  useEffect(() => {
    if (!isCartOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCartOpen, closeCart]);

  const updateQty = (id, qty) => {
    dispatch({ type: "UPDATE_QTY", id, qty });
  };

  const removeItem = (id) => {
    dispatch({ type: "REMOVE", id });
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isCartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!isCartOpen}
    >
      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] md:w-[460px] lg:w-[500px] max-w-full bg-[#fff8ee] text-[#3b2417] shadow-2xl border-l border-[#e8d4b4] transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-[#e8d4b4] px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#e8883a]">Your Cart</p>
              <h2 className="text-xl font-semibold text-[#3b2417]">Cart</h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8d4b4] text-[#3b2417] transition-colors hover:bg-black/5"
              aria-label="Close cart drawer"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8d4b4] bg-[#fffaf3] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-[#3b2417]">Your cart is empty</p>
                <p className="mt-2 text-sm text-[#7a634a]">Add some mithai to see it here.</p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 rounded-full border border-[#e8883a]/40 px-4 py-2 text-sm font-semibold text-[#e8883a] transition-colors hover:bg-[#e8883a]/10"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-[#e8d4b4] bg-[#fffaf3] p-3">
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-[#3b2417]">{item.name}</h3>
                            <p className="mt-1 text-xs text-[#7a634a]">{item.category || "Mithai"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item._id)}
                            className="rounded-full p-1.5 text-[#7a634a] transition-colors hover:bg-black/5 hover:text-[#3b2417]"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-[#e8883a]">{formatPrice(item.price)}</div>

                          <div className="flex items-center bg-[#fff8ec] rounded-lg shadow-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQty(item._id, (Number(item.qty) || 1) - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f5e1c8] text-[#3b2f2f] transition-all duration-200 hover:bg-[#e8883a] hover:text-white"
                              aria-label={`Decrease ${item.name}`}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-center text-sm font-medium text-[#3b2f2f]">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item._id, (Number(item.qty) || 1) + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f5e1c8] text-[#3b2f2f] transition-all duration-200 hover:bg-[#e8883a] hover:text-white"
                              aria-label={`Increase ${item.name}`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="border-t border-[#e8d4b4] px-5 py-4">
            <div className="flex items-center justify-between text-sm text-[#7a634a]">
              <span>Total</span>
              <span className="text-lg font-semibold text-[#3b2417]">{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                closeCart();
                setPage?.("checkout");
              }}
              className="mt-4 w-full rounded-full bg-[#e8883a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#f0a24f]"
              disabled={cart.length === 0}
            >
              Checkout
            </button>
          </footer>
        </div>
      </aside>
    </div>
  );
}