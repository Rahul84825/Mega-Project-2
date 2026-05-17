import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { calculateCartTotals } from "../utils/pricingUtils";
import api, { getApiErrorMessage, getProducts } from "../services/api";

let razorpayScriptPromise;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.defer = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

function CheckoutPage({ setPaymentInfo, setProducts }) {
  const { cart, dispatch } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" });
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' or 'cod'
  const isMountedRef = useRef(true);
  
  // Use centralized pricing utility
  const { subtotal, deliveryFee, gst, total } = calculateCartTotals(cart);

  useEffect(() => {
    isMountedRef.current = true;

    loadRazorpayScript().then((loaded) => {
      if (isMountedRef.current) {
        setScriptReady(loaded);
        setScriptLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const requiredAddressFields = ["name", "phone", "email", "address", "city", "pincode", "state"];
  const isAddressValid = requiredAddressFields.every((key) => String(form[key] || "").trim().length > 0);

  // Validate that all cart items have sufficient stock
  const validateCartStock = () => {
    for (const item of cart) {
      if (!item.stock || item.stock <= 0) {
        return `${item.name} is no longer in stock`;
      }
      if (item.quantity > item.stock) {
        return `Only ${item.stock} ${item.name} available, but you have ${item.quantity} in cart`;
      }
    }
    return null;
  };

  const continueToPayment = () => {
    if (!isAddressValid) {
      setErrorMessage("Please complete all delivery details before continuing.");
      return;
    }

    const stockError = validateCartStock();
    if (stockError) {
      setErrorMessage(stockError);
      return;
    }

    setErrorMessage("");
    setStep(2);
  };

  /**
   * TEMPORARY COD FLOW: Direct order creation without Razorpay
   * This is a fallback for development/testing purposes
   */
  const handleCODOrder = async () => {
    if (!isAddressValid) {
      setErrorMessage("Please complete all delivery details before continuing.");
      return;
    }

    const stockError = validateCartStock();
    if (stockError) {
      setErrorMessage(stockError);
      return;
    }

    setErrorMessage("");
    setProcessing(true);

    try {
      const orderPayload = {
        // Amount required by backend validator
        amount: total,
        currency: "INR",
        
        // Customer and delivery information
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone
        },
        shippingAddress: {
          line1: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.pincode,
          country: "IN"
        },
        
        // Order items with snapshot data - MUST include variantId for backend validation
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || "",
          variantLabel: item.variantLabel || "Default",
          name: item.name,
          price: Number(item.price) || 0,
          quantity: item.quantity,
          image: item.image
        })),
        
        // Centralized pricing totals
        totals: {
          subtotal,
          deliveryFee,
          gst,
          total,
          currency: "INR"
        },
        
        // Payment information
        payment: {
          method: "COD",
          status: "PENDING"
        },
        paymentMethod: "COD",
        paymentStatus: "PENDING"
      };

      // Debug logging - verify payload structure before sending
      console.log("📦 COD Order Payload Structure:", {
        hasAmount: !!orderPayload.amount,
        amount: orderPayload.amount,
        hasTotals: !!orderPayload.totals,
        totals: orderPayload.totals,
        hasCustomer: !!orderPayload.customer,
        itemCount: orderPayload.items?.length || 0,
        paymentMethod: orderPayload.payment?.method
      });
      console.log("📦 Full order payload:", orderPayload);

      const { data: orderResponse } = await api.post("/api/orders", orderPayload);

      if (!orderResponse?.success || !orderResponse?.order) {
        throw new Error(orderResponse?.message || "Failed to create order");
      }

      console.log("✅ Order created successfully:", orderResponse.order);

      // Refresh products and clear cart
      if (typeof setProducts === "function") {
        const refreshedProducts = await getProducts();
        setProducts(Array.isArray(refreshedProducts) ? refreshedProducts : []);
      }

      dispatch({ type: "CLEAR" });
      setPaymentInfo?.(orderResponse.order);

      // Redirect to success page
      navigate("/order-success", { state: { order: orderResponse.order } });
    } catch (error) {
      if (isMountedRef.current) {
        const errorMsg = getApiErrorMessage(error, "Failed to place order");
        const backendError = error?.response?.data;

        console.error("❌ Order creation failed:", errorMsg);
        console.error("Backend error details:", backendError);

        if (backendError?.errors?.length > 0) {
          const fieldErrors = backendError.errors.map((e) => `${e.field}: ${e.message}`).join("\n");
          setErrorMessage(`Validation Error:\n${fieldErrors}`);
        } else {
          setErrorMessage(backendError?.message || errorMsg);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setProcessing(false);
      }
    }
  };

  const handlePayment = async () => {
    if (!scriptReady || !window.Razorpay) {
      setErrorMessage("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setErrorMessage("Missing Razorpay key configuration.");
      return;
    }

    setErrorMessage("");
    setProcessing(true);
    try {
      const { data: createOrderResponse } = await api.post("/api/payment/create-order", {
        amount: total,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      });

      const checkoutOrderId = createOrderResponse?.orderId;

      if (!checkoutOrderId) {
        throw new Error("Unable to create payment order");
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: createOrderResponse.amount,
        currency: createOrderResponse.currency || "INR",
        name: "Mithai World",
        description: "Sweet treats checkout",
        order_id: checkoutOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#8B1E3F"
        },
        modal: {
          ondismiss: () => {
            if (isMountedRef.current) {
              setProcessing(false);
            }
          }
        },
        handler: async (response) => {
          try {
            console.log("💳 Razorpay payment successful, verifying...", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature?.substring(0, 16) + "..."
            });

            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                customer: {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  address: form.address,
                  city: form.city,
                  state: form.state,
                  pincode: form.pincode
                },
                items: cart.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId || "",
                  variantLabel: item.variantLabel || "Default",
                  name: item.name,
                  price: Number(item.price) || 0,
                  quantity: item.quantity,
                  image: item.image
                })),
                amount: total,
                currency: "INR",
                status: "Pending"
              }
            };

            console.log("📤 Sending verification payload to backend...");
            const { data: verifyResponse } = await api.post("/api/payment/verify", verificationPayload);

            console.log("📥 Verification response received:", {
              success: verifyResponse?.success,
              hasOrder: !!verifyResponse?.order,
              message: verifyResponse?.message
            });

            if (!verifyResponse?.success) {
              const errorMsg = verifyResponse?.message || verifyResponse?.details || "Payment verification failed";
              console.error("❌ Payment verification failed:", errorMsg);
              throw new Error(errorMsg);
            }

            console.log("✅ Payment verified, clearing cart and redirecting...");

            if (typeof setProducts === "function") {
              const refreshedProducts = await getProducts();
              setProducts(Array.isArray(refreshedProducts) ? refreshedProducts : []);
            }

            dispatch({ type: "CLEAR" });
            setPaymentInfo?.(verifyResponse.order);
            navigate("/order-success", { state: { order: verifyResponse.order } });
          } catch (verifyError) {
            if (isMountedRef.current) {
              const errorMsg = getApiErrorMessage(verifyError, "Payment verification failed");
              const backendError = verifyError?.response?.data;
              
              console.error("❌ PAYMENT VERIFICATION FAILED - DETAILED DEBUG INFO");
              console.error("Status Code:", verifyError?.response?.status);
              console.error("Backend Message:", backendError?.message);
              console.error("Backend Errors Array:", backendError?.errors);
              console.error("Full Backend Response:", backendError);
              console.error("Axios Error Message:", verifyError?.message);
              console.error("Full Error Object:", verifyError);
              
              // Show backend error with details if available
              if (backendError?.errors?.length > 0) {
                const fieldErrors = backendError.errors.map(e => `${e.field}: ${e.message}`).join("\n");
                setErrorMessage(`Validation Error:\n${fieldErrors}`);
              } else {
                setErrorMessage(backendError?.message || errorMsg);
              }
            }
          } finally {
            if (isMountedRef.current) {
              setProcessing(false);
            }
          }
        }
      });

      razorpay.on("payment.failed", (response) => {
        if (isMountedRef.current) {
          setErrorMessage(response?.error?.description || "Payment failed. Please try again.");
          setProcessing(false);
        }
      });

      razorpay.open();
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(getApiErrorMessage(error, "Could not start payment."));
      }
    } finally {
      if (isMountedRef.current) {
        setProcessing(false);
      }
    }
  };

  const fields1 = [
    { label: "Full Name", name: "name", placeholder: "Priya Sharma" },
    { label: "Phone Number", name: "phone", placeholder: "+91 98765 43210" },
    { label: "Email Address", name: "email", placeholder: "priya@example.com" }
  ];
  const fields2 = [
    { label: "Full Address", name: "address", placeholder: "House No., Street, Area" },
    { label: "City", name: "city", placeholder: "Pune" },
    { label: "PIN Code", name: "pincode", placeholder: "411001" }
  ];

  return (
    <div className="page-enter min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-14">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-8 md:mb-12 lg:mb-16">
          <div className="flex items-center gap-4 md:gap-6">
            {["Address", "Review & Pay"].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base transition-all ${
                  step > i + 1 ? 'bg-green-600 text-white'
                  : step === i + 1 ? 'bg-[var(--burgundy)] text-white'
                  : 'bg-[#e8d4b4] text-[var(--muted)]'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`ml-2 text-xs md:text-sm font-medium ${step === i + 1 ? 'text-[var(--charcoal)]' : 'text-[var(--muted)]'}`}>
                  {label}
                </span>
                {i === 0 && (
                  <div className={`w-8 md:w-12 h-0.5 ml-4 md:ml-6 transition-all ${step > 1 ? 'bg-[var(--saffron)]' : 'bg-[#e8d4b4]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Stack on mobile, grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8d4b4] p-6 md:p-8">
            {step === 1 ? (
              <>
                <h2 className="serif text-2xl md:text-3xl font-bold text-[var(--charcoal)] mb-6 md:mb-8">
                  Delivery Address
                </h2>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
                  {fields1.map((field) => (
                    <div key={field.name} className="md:col-span-2">
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
                        {field.label}
                      </label>
                      <input
                        className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg border border-[#e8d4b4] focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all"
                        name={field.name}
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        onChange={handleChange}
                      />
                    </div>
                  ))}
                </div>

                {/* Address Details Section */}
                <h3 className="serif text-lg md:text-xl font-bold text-[var(--charcoal)] mb-4 md:mb-6">
                  Address Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
                  {fields2.map((field) => (
                    <div key={field.name}>
                      <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
                        {field.label}
                      </label>
                      <input
                        className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg border border-[#e8d4b4] focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all"
                        name={field.name}
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        onChange={handleChange}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
                      State
                    </label>
                    <select
                      className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg border border-[#e8d4b4] focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/20 focus:border-[var(--saffron)] transition-all"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                    >
                      {["Maharashtra", "Gujarat", "Delhi", "Karnataka", "Tamil Nadu", "Rajasthan"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Continue Button */}
                <button
                  className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 rounded-lg bg-[var(--burgundy)] hover:bg-[#8B1E3F] text-white font-bold text-sm md:text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processing}
                  onClick={continueToPayment}
                >
                  Continue to Payment →
                </button>
              </>
            ) : (
              <>
                <h2 className="serif text-2xl md:text-3xl font-bold text-[var(--charcoal)] mb-2 md:mb-4">
                  Review & Pay
                </h2>
                <div className="text-xs md:text-sm text-[var(--muted)] mb-6 md:mb-8">
                  📍 {form.address}, {form.city}, {form.state} — {form.pincode}
                </div>

                {/* Order Items Review */}
                <div className="bg-[var(--cream)] rounded-lg p-4 md:p-6 mb-6 md:mb-8 space-y-3 md:space-y-4">
                  {cart.map((item) => (
                    <div key={`${item.productId}::${item.variantId}`} className="flex justify-between items-center text-sm md:text-base py-2 border-b border-[#e8d4b4] last:border-0">
                      <span className="text-[var(--charcoal)]">{item.name} × {item.quantity}</span>
                      <span className="font-bold text-[var(--charcoal)]">₹{(Number(item.price) || 0) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6 md:mb-8 p-4 md:p-6 border-2 border-[#e8d4b4] rounded-lg">
                  <h3 className="text-sm md:text-base font-bold text-[var(--charcoal)] mb-4">
                    Choose Payment Method
                  </h3>

                  <div className="space-y-3">
                    {/* COD Option */}
                    <label className="flex items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-[var(--saffron)]" style={{borderColor: paymentMethod === "cod" ? "var(--saffron)" : "#e8d4b4", backgroundColor: paymentMethod === "cod" ? "rgba(255,160,0,0.05)" : "transparent"}}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[var(--burgundy)]"
                      />
                      <span className="ml-3">
                        <div className="font-bold text-[var(--charcoal)]">Cash on Delivery (COD)</div>
                        <div className="text-xs md:text-sm text-[var(--muted)]">Pay when your order arrives</div>
                      </span>
                    </label>

                    {/* Razorpay Option */}
                    <label className="flex items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-[var(--saffron)]" style={{borderColor: paymentMethod === "razorpay" ? "var(--saffron)" : "#e8d4b4", backgroundColor: paymentMethod === "razorpay" ? "rgba(255,160,0,0.05)" : "transparent"}}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[var(--burgundy)]"
                      />
                      <span className="ml-3">
                        <div className="font-bold text-[var(--charcoal)]">💳 Pay Online (Razorpay)</div>
                        <div className="text-xs md:text-sm text-[var(--muted)]">Credit card, Debit card, UPI, Wallet</div>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {paymentMethod === "cod" ? (
                    <button
                      className="w-full py-3 md:py-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm md:text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      onClick={handleCODOrder}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>✓ Place Order (₹{total.toFixed(2)} COD)</>
                      )}
                    </button>
                  ) : (
                    <button
                      className="w-full py-3 md:py-4 rounded-lg bg-[var(--burgundy)] hover:bg-[#8B1E3F] text-white font-bold text-sm md:text-base transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      onClick={handlePayment}
                      disabled={processing || !scriptReady}
                    >
                      {processing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>{scriptReady ? `💳 Pay ₹${total.toFixed(2)} via Razorpay` : scriptLoading ? "Loading Razorpay..." : "Payment Gateway Unavailable"}</>
                      )}
                    </button>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="mt-4 p-4 rounded-lg bg-red-50 border-2 border-red-400 text-red-800 text-sm shadow-sm">
                      <div className="font-bold mb-2">❌ Error</div>
                      <div className="whitespace-pre-wrap break-words">{errorMessage}</div>
                    </div>
                  )}

                  {/* Back Button */}
                  <button
                    className="w-full py-3 rounded-lg border-2 border-[#e8d4b4] bg-white text-[var(--charcoal)] font-bold text-sm md:text-base hover:bg-[#f5e6d3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={processing}
                    onClick={() => setStep(1)}
                  >
                    ← Back to Address
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--charcoal)] rounded-xl p-6 md:p-8 text-white sticky top-24">
              <h3 className="serif text-xl md:text-2xl font-bold text-[var(--saffron)] mb-6">
                Order ({cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} items)
              </h3>

              {/* Order Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-white/20 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {cart.slice(0, 5).map((item) => (
                  <div key={`${item.productId}::${item.variantId}`} className="flex gap-3 items-start">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm md:text-base font-medium truncate">{item.name}</div>
                      <div className="text-xs md:text-sm text-white/60">×{item.quantity} · ₹{(Number(item.price) || 0) * item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-white/20 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>GST (5%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="serif text-lg md:text-xl font-bold">Total</span>
                <span className="serif text-2xl md:text-3xl font-black text-[var(--saffron)]">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
