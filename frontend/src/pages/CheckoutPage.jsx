import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
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

function CheckoutPage({ setPage, setPaymentInfo, setProducts }) {
  const { cart, dispatch } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" });
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const isMountedRef = useRef(true);
  const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

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
      const { data: createOrderResponse } = await api.post("/payment/create-order", {
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
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                customer: form,
                items: cart,
                amount: total,
                currency: "INR",
                status: "Pending"
              }
            };

            const { data: verifyResponse } = await api.post("/payment/verify", verificationPayload);

            if (!verifyResponse?.success) {
              throw new Error(verifyResponse?.message || "Payment verification failed");
            }

            if (typeof setProducts === "function") {
              const refreshedProducts = await getProducts();
              setProducts(Array.isArray(refreshedProducts) ? refreshedProducts : []);
            }

            dispatch({ type: "CLEAR" });
            setPaymentInfo?.(verifyResponse.order);
            setPage("order-success");
          } catch (verifyError) {
            if (isMountedRef.current) {
              setErrorMessage(getApiErrorMessage(verifyError, "Payment verification failed."));
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
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all ${
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

                {/* Payment Button */}
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
                    <>{scriptReady ? `💳 Pay ₹${total} via Razorpay` : scriptLoading ? "Loading Razorpay..." : "Payment Gateway Unavailable"}</>
                  )}
                </button>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Back Button */}
                <button
                  className="w-full mt-3 py-3 rounded-lg border-2 border-[#e8d4b4] bg-white text-[var(--charcoal)] font-bold text-sm md:text-base hover:bg-[#f5e6d3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processing}
                  onClick={() => setStep(1)}
                >
                  ← Back to Address
                </button>
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

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="serif text-lg md:text-xl font-bold">Total</span>
                <span className="serif text-2xl md:text-3xl font-black text-[var(--saffron)]">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
