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
import AvailableCoupons from "../components/checkout/AvailableCoupons";
import { Phone, MessageSquare, MapPin, Truck, MapPinOff, Loader2, Tag } from "lucide-react";

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
      const lastPincode = localStorage.getItem("mithai-world-last-pincode") || "";
      
      const baseForm = parsed?.form || { 
        name: "", 
        phone: "", 
        email: "", 
        address: "", // Keep for compatibility
        flatNo: "",
        buildingName: "",
        area: "",
        landmark: "",
        city: "", 
        pincode: "", 
        state: "Maharashtra"
      };
      
      // Prioritize pincode from shared storage if it exists and form pincode is empty
      if (lastPincode && !baseForm.pincode) {
        baseForm.pincode = lastPincode;
      }
      
      return baseForm;
    } catch {
      return { name: "", phone: "", email: "", address: "", city: "", pincode: localStorage.getItem("mithai-world-last-pincode") || "", state: "Maharashtra" };
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
  const [showOffers, setShowOffers] = useState(false);

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

  const fullAddressSummary = useMemo(() => {
    return [
      form.flatNo,
      form.buildingName,
      form.area,
      form.landmark,
      form.city,
      form.state,
      form.pincode
    ].filter(Boolean).map(s => String(s).trim()).join(", ");
  }, [form]);

  const isAddressValid = form.name && 
                        form.phone && 
                        form.flatNo && 
                        form.buildingName && 
                        form.area && 
                        form.city && 
                        form.state && 
                        form.pincode.length === 6 && 
                        isAvailable;

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
        orderAmount: subtotal,
        userId: user?.userId || user?._id
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

  const handleApplyAvailableCoupon = (code) => {
    setCouponCode(code);
    setShowOffers(false);
    // Auto-trigger validation
    setTimeout(() => {
      handleApplyCoupon();
    }, 100);
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
    
    console.log("🔵 PAYMENT_STEP_1_CREATE_ORDER_REQUEST", { amount: total, timestamp: new Date().toISOString() });
    setProcessing(true);
    try {
      const { data: orderData } = await api.post("/api/payment/create-order", { amount: total });
      console.log("🟢 PAYMENT_STEP_2_CREATE_ORDER_SUCCESS", { orderId: orderData.orderId, timestamp: new Date().toISOString() });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Mithai World",
        order_id: orderData.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#8B1E3F" },
        handler: async (res) => {
          console.log("🟡 PAYMENT_STEP_4_PAYMENT_SUCCESS_CALLBACK", { 
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            timestamp: new Date().toISOString()
          });
          try {
            // Automatically generate full address string
            const generatedFullAddress = [
              form.flatNo,
              form.buildingName,
              form.area,
              form.landmark,
              form.city,
              form.state,
              form.pincode
            ].filter(Boolean).map(s => String(s).trim()).join(", ");

            const verifyPayload = {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              orderData: {
                customer: { 
                  name: form.name, 
                  phone: form.phone, 
                  email: form.email, 
                  userId: user?.userId || user?._id 
                },
                shippingAddress: { 
                  line1: generatedFullAddress, // Backward compatibility
                  flatNo: form.flatNo,
                  buildingName: form.buildingName,
                  area: form.area,
                  landmark: form.landmark,
                  city: form.city, 
                  state: form.state, 
                  pincode: form.pincode,
                  postalCode: form.pincode, 
                  fullAddress: generatedFullAddress,
                  country: "IN",
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
                notes: "",
                metadata: {
                  distanceKm: deliveryInfo?.distanceKm || 0,
                  geocodedAddress: deliveryInfo?.formattedAddress || ""
                }
              }
            };
            console.log("🔵 PAYMENT_STEP_5_VERIFY_REQUEST_SENT", { 
              orderId: res.razorpay_order_id, 
              paymentId: res.razorpay_payment_id,
              timestamp: new Date().toISOString() 
            });
            const { data: verifyData } = await api.post("/api/payment/verify", verifyPayload);
            if (verifyData.success) {
              console.log("🟢 PAYMENT_STEP_9_PAYMENT_COMPLETED", { orderId: verifyData.order?._id, timestamp: new Date().toISOString() });
              handleOrderSuccess(verifyData.order);
            } else {
              throw new Error(verifyData.message || "Verification failed");
            }
          } catch (err) {
            console.error("❌ PAYMENT_VERIFICATION_ERROR", err);
            const msg = getApiErrorMessage(err, "Payment verification failed");
            setErrorMessage(msg);
          }
        },
        modal: { 
          ondismiss: () => {
            console.warn("🟠 PAYMENT_MODAL_DISMISSED");
            setProcessing(false);
          }
        }
      };
      console.log("🟣 PAYMENT_STEP_3_RAZORPAY_MODAL_OPENED", { orderId: orderData.orderId, timestamp: new Date().toISOString() });
      new window.Razorpay(options).open();
    } catch (err) {
      console.error("❌ PAYMENT_INITIATION_ERROR", err);
      const msg = getApiErrorMessage(err, "Could not initiate payment");
      setErrorMessage(msg);
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
    <div className="page-enter min-h-[60vh] bg-[var(--cream)] px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="section-title mb-8 lg:mb-10">
          <h2 className="serif lg:text-5xl text-4xl">Checkout</h2>
          <p className="text-sm lg:text-base opacity-80">Complete your order and enjoy premium Indian sweets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">
          <div className="space-y-6 lg:space-y-10">
            {/* ── STEP 1: ADDRESS ── */}
            <div className={`bg-white rounded-2xl border border-[var(--surface-border)] p-5 md:p-6 transition-opacity ${step === 2 ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-8 w-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center font-medium">1</div>
                <h3 className="serif text-xl">Delivery Address</h3>
              </div>
              
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Email</label>
                    <input name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="[EMAIL_ADDRESS]" />
                  </div>

                  {/* ── STRUCTURED ADDRESS FIELDS ── */}
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Flat / House No</label>
                      <input name="flatNo" value={form.flatNo} onChange={handleChange} className="input-field" placeholder="Flat no." />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Building / Society</label>
                      <input name="buildingName" value={form.buildingName} onChange={handleChange} className="input-field" placeholder="Building name" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Area / Locality</label>
                    <input name="area" value={form.area} onChange={handleChange} className="input-field" placeholder="Area" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Landmark (Optional)</label>
                    <input name="landmark" value={form.landmark} onChange={handleChange} className="input-field" placeholder="Landmark" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">City</label>
                      <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Pune" readOnly />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">State</label>
                      <input name="state" value={form.state} onChange={handleChange} className="input-field" placeholder="Maharashtra" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] block mb-1.5">Pincode</label>
                      <div className="relative">
                        <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="Pincode" />
                        {isValidatingPincode && (
                          <div className="absolute right-4 bottom-3 text-[var(--burgundy)]">
                            <Loader2 size={18} className="animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {pincodeError && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPinOff size={16} />
                        <span className="font-bold uppercase tracking-tight">Not Serviceable</span>
                      </div>
                      <p className="font-bold">{pincodeError}</p>
                      <span className="block mt-1 opacity-70">Please contact us at +91 98819 88751 for special assistance.</span>
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
                  {fullAddressSummary}
                  <button onClick={() => setStep(1)} className="text-[var(--burgundy)] font-medium ml-2 underline">Edit</button>
                </div>
              )}
            </div>

            {/* ── STEP 2: PAYMENT ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-[var(--surface-border)] p-5 md:p-6 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center font-medium">2</div>
                  <h3 className="serif text-xl">Payment Method</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { id: 'razorpay', label: 'Online Payment', desc: 'UPI, Cards, Net Banking', icon: '💳' }
                  ].map(method => (
                    <label 
                      key={method.id}
                      className="flex items-center p-3 md:p-4 rounded-xl border-2 border-[var(--saffron)] bg-[var(--surface-strong)]/30 transition-all cursor-default"
                    >
                      <div className="text-2xl mr-4">{method.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[var(--charcoal)]">{method.label}</div>
                        <div className="text-[10px] text-[var(--muted)]">{method.desc}</div>
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
                  className="w-full btn-primary h-11 md:h-12 shadow-lg text-sm"
                >
                  {processing ? 'Processing...' : `Place Order (${formatCurrency(total)})`}
                </button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR: SUMMARY ── */}
          <div className="space-y-6">
            <div className="bg-[var(--charcoal)] rounded-2xl p-5 md:p-6 text-white sticky top-28 shadow-2xl">
              <h3 className="serif text-xl text-[var(--saffron)] mb-5">Order Summary</h3>
              <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 mb-5 border-b border-white/10 pb-5">
                {cart.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                    <img src={item.image} className="h-10 w-10 rounded-lg object-cover bg-white/10" alt="" />
                    <div className="flex-1 min-w-0 text-[11px]">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-white/60">{item.variantLabel} × {item.quantity}</div>
                    </div>
                    <div className="font-medium text-xs">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5 text-[11px] font-medium text-white/70 mb-5">
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

                  <button 
                    onClick={() => setShowOffers(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[var(--saffron)] hover:text-white transition-colors border border-[var(--saffron)]/20 rounded-lg bg-[var(--saffron)]/5"
                  >
                    <Tag size={10} /> View Available Offers
                  </button>
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

        {showOffers && (
          <AvailableCoupons 
            subtotal={subtotal} 
            onApply={handleApplyAvailableCoupon} 
            onClose={() => setShowOffers(false)} 
            userId={user?.userId || user?._id}
          />
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;
