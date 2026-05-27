import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { calculateTotals, formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";
import api, { getApiErrorMessage, checkDeliveryAvailability } from "../services/api";
import StoreMap from "../components/common/StoreMap";
import LocationCard from "../components/common/LocationCard";
import { Phone, MessageSquare, MapPin, Truck, MapPinOff, Loader2 } from "lucide-react";

let razorpayScriptPromise;

const loadRazorpayScript = () => {
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

const CHECKOUT_STORAGE_KEY = "mithai-world-checkout-state";

function CheckoutPage() {
  const { cart, dispatch } = useCart();
  const { fetchProducts } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load initial state from localStorage
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.form || { name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" };
    } catch {
      return { name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" };
    }
  });

  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.step || 1;
    } catch {
      return 1;
    }
  });

  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isOrderSuccessful, setIsOrderSuccessful] = useState(false);

  // ── NEW: Delivery Availability States ──
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const isMountedRef = useRef(true);

  // Derive pricing totals using the shared pricing engine with backend override
  const { 
    subtotal, 
    total, 
    deliveryFee, 
    gstTotal, 
    packingTotal,
    couponDiscount, 
    isFreeDelivery, 
    deliveryThreshold, 
    deliveryLabel, 
    outOfReach: localOutOfReach 
  } = calculateTotals(cart, { 
    coupon: appliedCoupon, 
    pincode: form.pincode,
    // OVERRIDE: Use backend-calculated fee if we have a successful availability check
    manualShipping: deliveryInfo?.deliveryAvailable ? deliveryInfo.deliveryFee : null
  });

  // Effective availability based on backend check and error state
  const isAvailable = useMemo(() => {
    if (form.pincode.length < 6) return true; // Don't block while typing
    if (pincodeError) return false;
    if (deliveryInfo) return deliveryInfo.deliveryAvailable;
    return true; // Default to true until validation completes
  }, [pincodeError, deliveryInfo, form.pincode]);

  const isAddressValid = form.name && form.phone && form.address && form.city && form.pincode.length === 6 && isAvailable;

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({ form, step }));
  }, [form, step]);

  // ── EFFECT: Validate Pincode via Backend ──
  useEffect(() => {
    async function validatePincode() {
      const pc = String(form.pincode).trim();
      
      // Only trigger on exact 6 digits
      if (pc.length !== 6) {
        setDeliveryInfo(null);
        setPincodeError("");
        return;
      }

      setIsValidatingPincode(true);
      setPincodeError("");
      
      try {
        const data = await checkDeliveryAvailability(pc);
        if (data.success) {
          setDeliveryInfo(data);
          if (data.deliveryAvailable) {
            // Auto-fill City from authoritative backend data
            setForm(prev => ({ ...prev, city: data.city || "Pune" }));
          } else {
            setPincodeError(data.message || "Delivery unavailable for this pincode.");
          }
        }
      } catch (err) {
        setPincodeError(getApiErrorMessage(err, "Could not validate pincode."));
        setDeliveryInfo(null);
      } finally {
        setIsValidatingPincode(false);
      }
    }

    validatePincode();
  }, [form.pincode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Pincode restriction: Numbers only, max 6
    if (name === "pincode") {
      const val = value.replace(/\D/g, "").slice(0, 6);
      setForm(prev => ({ ...prev, [name]: val }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const { data } = await api.post("/api/coupons/validate", { 
        code: couponCode, 
        subtotal 
      });
      if (data.success) {
        setAppliedCoupon(data.coupon);
        setCouponCode("");
      } else {
        setCouponError(data.message || "Invalid coupon");
      }
    } catch (err) {
      setCouponError(getApiErrorMessage(err));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleOrderSuccess = async (order) => {
    setIsOrderSuccessful(true);
    dispatch({ type: "CLEAR" });
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    // Persist last order ID for recovery if page refreshes
    if (order?._id) sessionStorage.setItem("last_order_id", order._id);
    
    // Non-blocking fetch
    fetchProducts().catch(console.error);
    
    navigate("/payment-success", { state: { order }, replace: true });
  };

  const handleOnlinePayment = async () => {
    if (!scriptReady) return setErrorMessage("Payment gateway loading...");
    if (!isAvailable) return setErrorMessage("Delivery not available for this location");
    
    setProcessing(true);
    try {
      const { data: orderData } = await api.post("/api/payment/create-order", { amount: total });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Mithai World",
        order_id: orderData.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#8B1E3F" },
        handler: async (res) => {
          try {
            const { data: verifyData } = await api.post("/api/payment/verify", {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              orderData: {
                customer: { ...form, userId: user?.userId || user?._id },
                shippingAddress: { 
                  line1: form.address, 
                  city: form.city, 
                  state: form.state, 
                  postalCode: form.pincode, 
                  country: "IN",
                  // Save coordinates if we have them from the backend check
                  geo: deliveryInfo?.geo || null
                },
                items: cart.map(i => ({ ...i, productId: i.productId })),
                amount: total,
                totals: { 
                  itemsSubtotal: subtotal, 
                  shippingFee: deliveryFee, 
                  gstTotal, 
                  packingTotal,
                  grandTotal: total, 
                  currency: "INR",
                  couponCode: appliedCoupon?.code
                },
                metadata: {
                  distanceKm: deliveryInfo?.distanceKm || 0,
                  geocodedAddress: deliveryInfo?.formattedAddress || ""
                }
              }
            });
            if (verifyData.success) handleOrderSuccess(verifyData.order);
            else throw new Error("Verification failed");
          } catch (err) {
            setErrorMessage("Payment verification failed");
          }
        },
        modal: { ondismiss: () => setProcessing(false) }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setErrorMessage("Could not initiate payment");
      setProcessing(false);
    }
  };

  if (cart.length === 0 && !isOrderSuccessful) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <h2 className="serif text-3xl mb-4">Your cart is empty</h2>
        <button onClick={() => navigate("/")} className="btn-primary">Go Shopping</button>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-[60vh] bg-[var(--cream)] px-4 py-8 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="section-title mb-10">
          <h2 className="serif">Checkout</h2>
          <p>Complete your order and enjoy premium Indian sweets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* ── STEP 1: ADDRESS ── */}
            <div className={`bg-white rounded-2xl border border-[var(--surface-border)] p-6 transition-opacity ${step === 2 ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center font-medium">1</div>
                <h3 className="serif text-xl">Delivery Address</h3>
              </div>
              
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Email</label>
                    <input name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="john@example.com" />
                  </div>
                  <div className="md:col-span-2 relative">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Full Address</label>
                    <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Flat, Street, Area" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Pincode</label>
                    <div className="relative">
                      <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="411014" />
                      {isValidatingPincode && (
                        <div className="absolute right-4 bottom-3 text-[var(--burgundy)]">
                          <Loader2 size={18} className="animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Pune" readOnly />
                  </div>
                  
                  {pincodeError && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPinOff size={16} />
                        <span className="font-bold uppercase tracking-tight">Delivery Unavailable</span>
                      </div>
                      {pincodeError}. We are currently unable to deliver to this pincode automatically. 
                      <span className="block mt-1 font-bold">Please contact us at +91 98819 88751 for manual assistance.</span>
                    </div>
                  )}

                  {!pincodeError && deliveryInfo?.deliveryAvailable && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Delivery Available</span>
                      </div>
                      <div className="text-xs font-medium">
                        Area: <span className="font-bold">{deliveryInfo.area}</span> <br />
                        Est. Delivery: <span className="font-bold">{deliveryInfo.eta}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={!isAddressValid || isValidatingPincode}
                    onClick={() => setStep(2)}
                    className="md:col-span-2 btn-primary h-12 mt-4 disabled:opacity-50"
                  >
                    {!isAvailable ? "Delivery Unavailable" : isValidatingPincode ? "Validating Pincode..." : "Review Order & Pay →"}
                  </button>
                </div>
              )}
              {step === 2 && (
                <div className="text-sm font-medium text-[var(--charcoal)]">
                  {form.name} • {form.phone} <br />
                  {form.address}, {form.city} - {form.pincode}
                  <button onClick={() => setStep(1)} className="text-[var(--burgundy)] font-medium ml-2 underline">Edit</button>
                </div>
              )}
            </div>

            {/* ── STEP 2: PAYMENT ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[var(--surface-border)] p-6 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center font-medium">2</div>
                  <h3 className="serif text-xl">Payment Method</h3>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    { id: 'razorpay', label: 'Online Payment', desc: 'UPI, Cards, Net Banking', icon: '💳' }
                  ].map(method => (
                    <label 
                      key={method.id}
                      className="flex items-center p-4 rounded-xl border-2 border-[var(--saffron)] bg-[var(--surface-strong)]/30 transition-all cursor-default"
                    >
                      <div className="text-2xl mr-4">{method.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--charcoal)]">{method.label}</div>
                        <div className="text-[11px] text-[var(--muted)]">{method.desc}</div>
                      </div>
                      <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center border-[var(--burgundy)]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[var(--burgundy)]" />
                      </div>
                    </label>
                  ))}
                </div>

                {errorMessage && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{errorMessage}</div>}

                <button 
                  disabled={processing}
                  onClick={handleOnlinePayment}
                  className="w-full btn-primary h-12 shadow-lg"
                >
                  {processing ? 'Processing...' : `Place Order (${formatCurrency(total)})`}
                </button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR: SUMMARY ── */}
          <div className="space-y-6">
            <div className="bg-[var(--charcoal)] rounded-2xl p-6 text-white sticky top-28 shadow-2xl">
              <h3 className="serif text-xl text-[var(--saffron)] mb-6">Order Summary</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-6 border-b border-white/10 pb-6">
                {cart.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                    <img src={item.image} className="h-12 w-12 rounded-lg object-cover bg-white/10" alt="" />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-white/60">{item.variantLabel} × {item.quantity}</div>
                    </div>
                    <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-xs font-medium text-white/70 mb-6">
                <div className="flex justify-between">
                  <span>Items (Excl. Tax)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {gstTotal > 0 && (
                  <div className="flex justify-between text-[var(--saffron)]">
                    <span>GST Amount</span>
                    <span>{formatCurrency(gstTotal)}</span>
                  </div>
                )}
                {packingTotal > 0 && (
                  <div className="flex justify-between text-[var(--saffron)]">
                    <span>Packing Charges</span>
                    <span>{formatCurrency(packingTotal)}</span>
                  </div>
                )}
                
                {/* ── COUPON SECTION ── */}
                <div className="py-4 border-y border-white/5 my-2 space-y-3">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="OFFER CODE"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-[var(--saffron)] transition-colors"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="bg-[var(--saffron)] text-[var(--charcoal)] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-white transition-colors"
                      >
                        {validatingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 duration-300">
                      <div>
                        <div className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase">Applied: {appliedCoupon.code}</div>
                        <div className="text-[9px] text-emerald-400/70 font-medium">Extra savings unlocked!</div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-white/40 hover:text-white transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div className="text-[10px] font-bold text-red-400 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
                      ⚠️ {couponError}
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Coupon Discount</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5 mb-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                      <Truck size={10} /> {deliveryLabel}
                    </span>
                    <span>Delivery Fee</span>
                  </div>
                  <span className={deliveryFee === 0 ? "text-emerald-400 font-bold" : ""}>
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                  </span>
                </div>

                {!isFreeDelivery && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 animate-in fade-in duration-500">
                    <p className="text-[10px] leading-tight text-white/80">
                      Add <span className="text-[var(--saffron)] font-bold">{formatCurrency(deliveryThreshold - subtotal)}</span> more for <span className="text-emerald-400 font-bold tracking-tight">FREE DELIVERY</span> in this area.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-lg font-medium pt-4 border-t border-white/10">
                <span className="serif text-[var(--saffron)]">Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <p className="text-[10px] text-center text-white/40 mt-4 italic">{TAX_MESSAGE}</p>
            </div>
          </div>
        </div>

        

      </div>
    </div>
  );
}

export default CheckoutPage;
