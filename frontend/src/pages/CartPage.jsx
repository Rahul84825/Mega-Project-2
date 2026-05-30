import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { calculateTotals, formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";
import { checkDeliveryAvailability, getApiErrorMessage } from "../services/api";
import { MapPin, Truck, Loader2, Info, ArrowRight } from "lucide-react";

function CartPage() {
  const { cart, dispatch } = useCart();
  const navigate = useNavigate();

  // ── DELIVERY ESTIMATION STATES ──
  const [pincode, setPincode] = useState(localStorage.getItem("mithai-world-last-pincode") || "");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const { 
    subtotal, 
    deliveryFee, 
    total, 
    deliveryThreshold,
    deliveryLabel 
  } = calculateTotals(cart, {
    pincode: pincode,
    // Override with real fee from backend if available
    manualShipping: deliveryInfo?.deliveryAvailable ? deliveryInfo.deliveryFee : null
  });

  const amountNeeded = Math.max(0, deliveryThreshold - subtotal);

  // ── EFFECT: Validate Pincode ──
  useEffect(() => {
    async function validate() {
      const pc = String(pincode).trim();
      if (pc.length !== 6) {
        setDeliveryInfo(null);
        setPincodeError("");
        return;
      }

      setIsValidating(true);
      setPincodeError("");
      try {
        const data = await checkDeliveryAvailability(pc);
        if (data.success) {
          setDeliveryInfo(data);
          if (!data.deliveryAvailable) {
            setPincodeError(data.message || "Delivery unavailable.");
          } else {
            localStorage.setItem("mithai-world-last-pincode", pc);
          }
        }
      } catch (err) {
        setPincodeError(getApiErrorMessage(err));
      } finally {
        setIsValidating(false);
      }
    }
    validate();
  }, [pincode]);

  if (cart.length === 0) {
    return (
      <div className="page-enter min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 py-20">
        <div className="text-6xl">🛒</div>
        <h2 className="serif text-3xl md:text-4xl text-center">Your cart is empty</h2>
        <p className="text-[var(--muted)] text-center text-sm md:text-base">Add some sweet goodness first!</p>
        <button 
          className="btn-primary mt-2 px-6 py-3 rounded-lg" 
          onClick={() => navigate("/")}
        >
          Browse Sweets
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter bg-white min-h-[60vh] px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
          <h1 className="serif text-2xl md:text-3xl lg:text-4xl font-medium text-[var(--charcoal)]">
            Your Cart <span className="ornament">✦</span>
          </h1>
          
          <div className="flex items-center gap-4 bg-[var(--cream)]/50 px-4 py-2 rounded-full border border-[#e8d4b4]">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-[#8b4513] flex items-center justify-center text-[10px] text-white font-bold">
                  {i}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b4513]">3-Step Fast Checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Items column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}::${item.variantId}`}
                className="group bg-white rounded-[24px] border border-[#e8d4b4] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:row gap-5 items-start sm:items-center"
              >
                {/* Image */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#fffaf3] rounded-2xl border border-[#f5e6d3] overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover mix-blend-multiply p-2"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="serif text-lg md:text-xl font-bold text-[var(--charcoal)] mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#f5e6d3] rounded text-[10px] font-bold text-[#8b4513] uppercase tracking-wider">
                      {item.variantLabel || "Regular"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{item.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-6">
                  <div className="flex items-center border border-[#e8d4b4] rounded-xl bg-[#fffaf3] overflow-hidden">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: { ...item, quantity: item.quantity - 1 }
                        })
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#f5e6d3] text-[#8b4513] transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-[var(--charcoal)] text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: { ...item, quantity: item.quantity + 1 }
                        })
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#f5e6d3] text-[#8b4513] transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-lg text-[var(--burgundy)]">
                      {formatCurrency((Number(item?.price) || 0) * item.quantity)}
                    </div>
                    <button
                      onClick={() =>
                        dispatch({ type: "REMOVE_ITEM", payload: item })
                      }
                      className="text-[10px] font-bold text-[#ccc] hover:text-rose-500 uppercase tracking-widest mt-1 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar / Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[32px] border border-[#e8d4b4] p-8 shadow-xl lg:sticky lg:top-24">
              <h2 className="serif text-2xl font-bold text-[var(--charcoal)] mb-8 flex items-center gap-3">
                Order Summary <div className="h-px flex-1 bg-[#e8d4b4]" />
              </h2>

              <div className="space-y-5 mb-8">
                {/* ── DELIVERY ESTIMATOR ── */}
                <div className="bg-[#fffaf3] border border-[#e8d4b4] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b67b3a]">Estimate Delivery</label>
                    {isValidating && <Loader2 size={12} className="animate-spin text-[#8b4513]" />}
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a67f52]" size={16} />
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-Digit Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-[#e8d4b4] rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:border-[#8b4513] outline-none transition-colors"
                    />
                  </div>
                  {pincodeError ? (
                    <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <Info size={10} /> {pincodeError}
                    </p>
                  ) : deliveryInfo?.deliveryAvailable ? (
                    <div className="text-[10px] font-bold text-emerald-600 flex flex-col gap-0.5">
                      <span className="uppercase tracking-widest">✓ Available in {deliveryInfo.area}</span>
                      <span className="text-[#a67f52] opacity-70 italic">Est. Time: {deliveryInfo.eta}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#7a5c3a] opacity-60">Enter pincode for accurate shipping fees.</p>
                  )}
                </div>

                <div className="flex justify-between text-sm font-bold text-[#7a5c3a]">
                  <span className="uppercase tracking-widest opacity-60">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-[#7a5c3a]">
                  <div className="flex flex-col">
                    <span className="uppercase tracking-widest opacity-60">Delivery Charges</span>
                    <span className="text-[9px] text-[#b67b3a] font-medium">{pincode ? deliveryLabel : "Based on location"}</span>
                  </div>
                  {!pincode ? (
                    <span className="font-black text-emerald-600">FREE*</span>
                  ) : deliveryFee === 0 ? (
                    <span className="font-black text-emerald-600">FREE</span>
                  ) : (
                    <span>{formatCurrency(deliveryFee)}</span>
                  )}
                </div>

                {!pincode && (
                  <p className="text-[9px] text-[var(--muted)] italic -mt-3">
                    *Final delivery charges are calculated at checkout based on delivery location.
                  </p>
                )}

                {deliveryFee > 0 && amountNeeded > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                      Add <span className="font-black">{formatCurrency(amountNeeded)}</span> more for <span className="underline underline-offset-2">FREE DELIVERY</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-6 border-t border-[#e8d4b4] mb-8">
                <div className="flex justify-between items-end mb-1">
                  <span className="serif text-xl font-bold text-[var(--charcoal)]">Total</span>
                  <span className="serif text-3xl font-black text-[var(--burgundy)] tracking-tighter">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-[var(--muted)] text-right italic">
                  {TAX_MESSAGE}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  disabled={pincodeError || isValidating}
                  className="w-full bg-[#8b4513] text-white py-4 rounded-[18px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-900/10 hover:bg-[#2d1b0e] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  onClick={() => navigate("/checkout")}
                >
                  Checkout <ArrowRight size={16} />
                </button>
                <button
                  className="w-full py-3 rounded-[18px] border-2 border-[#e8d4b4] font-bold text-[10px] uppercase tracking-widest text-[#7a5c3a] hover:bg-[#fffaf3] transition-colors"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
