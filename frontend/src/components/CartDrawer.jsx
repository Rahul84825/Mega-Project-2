import { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag, ArrowRight, Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { calculateTotals, formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";

function CartDrawer() {
  const { cart, isCartOpen, closeCart, dispatch } = useCart();
  const navigate = useNavigate();

  const { subtotal, deliveryFee, gstTotal, total } = calculateTotals(cart);

  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isCartOpen]);

  const updateQty = (item, delta) => {
    const newQty = Math.max(1, item.quantity + delta);
    if (item.stock && newQty > item.stock) return;
    dispatch({ type: "UPDATE_QUANTITY", payload: { ...item, quantity: newQty } });
  };

  if (!isCartOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={closeCart} />
      
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        {/* ── HEADER ── */}
        <div className="p-6 border-b border-[var(--surface-border)] flex items-center justify-between bg-[var(--cream)]/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--burgundy)] text-white flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="serif text-xl font-medium text-[var(--charcoal)]">Your Cart</h2>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">{cart.length} unique items</p>
            </div>
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-[var(--surface-strong)] rounded-full transition-colors text-[var(--muted)]">
            <X size={24} />
          </button>
        </div>

        {/* ── ITEMS ── */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 bg-[var(--cream)] rounded-full flex items-center justify-center mb-4 text-[var(--muted)]">
                <ShoppingCart size={40} strokeWidth={1} />
              </div>
              <h3 className="serif text-xl mb-2 text-[var(--charcoal)]">Empty Cart</h3>
              <p className="text-sm text-[var(--muted)] mb-8">Add some delicious treats to get started.</p>
              <button onClick={closeCart} className="btn-outline">Go to Shop</button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 group">
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-[var(--surface-strong)] shrink-0 border border-[var(--surface-border)]">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-[var(--charcoal)] truncate pr-4">{item.name}</h4>
                    <button 
                      onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item })}
                      className="text-[var(--muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] font-medium text-[var(--gold)] uppercase tracking-wider mb-3">{item.variantLabel}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-[var(--surface-border)] rounded-lg bg-[var(--surface)] overflow-hidden h-8">
                      <button onClick={() => updateQty(item, -1)} className="px-2 hover:bg-[var(--cream)] transition-colors"><Minus size={12} /></button>
                      <span className="w-8 text-center text-xs font-medium text-[var(--charcoal)]">{item.quantity}</span>
                      <button onClick={() => updateQty(item, 1)} className="px-2 hover:bg-[var(--cream)] transition-colors"><Plus size={12} /></button>
                    </div>
                    <span className="text-sm font-medium text-[var(--charcoal)]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER ── */}
        {cart.length > 0 && (
          <div className="p-6 bg-[var(--cream)] border-t border-[var(--surface-border)] shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-medium text-[var(--muted)]">
                <span>Items Subtotal (Excl. Tax)</span>
                <span>{formatCurrency(calculateTotals(cart).netSubtotal)}</span>
              </div>
              {calculateTotals(cart).gstTotal > 0 && (
                <div className="flex justify-between text-xs font-medium text-[var(--muted)]">
                  <span>Estimated GST</span>
                  <span>{formatCurrency(calculateTotals(cart).gstTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-medium text-[var(--muted)]">
                <span>Delivery</span>
                <span>{calculateTotals(cart).deliveryFee === 0 ? 'FREE' : formatCurrency(calculateTotals(cart).deliveryFee)}</span>
              </div>
              <div className="h-px bg-[var(--surface-border)] my-2" />
              <div className="flex justify-between text-xl font-medium text-[var(--charcoal)]">
                <span>Total</span>
                <span className="text-[var(--burgundy)]">{formatCurrency(calculateTotals(cart).total)}</span>
              </div>
              <p className="text-[10px] text-center text-[var(--muted)] italic mt-2">{TAX_MESSAGE}</p>
            </div>
            
            <button 
              onClick={() => { closeCart(); navigate("/checkout"); }}
              className="w-full btn-primary h-14 shadow-xl"
            >
              Checkout Now <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CartDrawer;
