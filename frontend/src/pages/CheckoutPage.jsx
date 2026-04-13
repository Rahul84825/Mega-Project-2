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

export default function CheckoutPage({ setPage, setPaymentInfo, setProducts }) {
  const { cart, dispatch } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" });
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const isMountedRef = useRef(true);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

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
      if (item.qty > item.stock) {
        return `Only ${item.stock} ${item.name} available, but you have ${item.qty} in cart`;
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
    <div className="page-enter pattern-bg" style={{ padding: "48px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 48, justifyContent: "center" }}>
          {["Address", "Review & Pay"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: step > i + 1 ? "#2C6E49" : step === i + 1 ? "var(--burgundy)" : "#E8DDD0",
                    color: step >= i + 1 ? "white" : "var(--muted)",
                    fontWeight: 700,
                    fontSize: 14
                  }}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: step === i + 1 ? "var(--charcoal)" : "var(--muted)" }}>{s}</span>
              </div>
              {i === 0 && <div style={{ width: 60, height: 1, background: step > 1 ? "var(--saffron)" : "#E8DDD0", margin: "0 16px" }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40 }}>
          <div style={{ background: "white", padding: 36, border: "1px solid rgba(212,160,23,0.15)" }}>
            {step === 1 ? (
              <>
                <h2 className="serif" style={{ fontSize: 28, marginBottom: 28 }}>Delivery Address</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  {fields1.map((f) => (
                    <div key={f.name} style={{ gridColumn: f.name === "address" ? "span 2" : "auto" }}>
                      <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input className="input-field" name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                    </div>
                  ))}
                </div>
                <h3 className="serif" style={{ fontSize: 20, margin: "24px 0 16px" }}>Address Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
                  {fields2.map((f) => (
                    <div key={f.name} style={{ gridColumn: f.name === "address" ? "span 2" : "auto" }}>
                      <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input className="input-field" name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>State</label>
                    <select className="input-field" name="state" value={form.state} onChange={handleChange}>
                      {["Maharashtra", "Gujarat", "Delhi", "Karnataka", "Tamil Nadu", "Rajasthan"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="btn-primary" disabled={processing} onClick={continueToPayment} style={{ marginTop: 28, padding: "14px 36px", opacity: processing ? 0.7 : 1, cursor: processing ? "not-allowed" : "pointer" }}>Continue to Payment →</button>
              </>
            ) : (
              <>
                <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Review & Pay</h2>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
                  📍 {form.address}, {form.city}, {form.state} — {form.pincode}
                </div>
                <div style={{ background: "var(--cream)", padding: 20, marginBottom: 28 }}>
                  {cart.map((i) => (
                    <div key={i._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(212,160,23,0.1)", fontSize: 14 }}>
                      <span>{i.name} × {i.qty}</span>
                      <span style={{ fontWeight: 600 }}>₹{i.price * i.qty}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={handlePayment}
                  disabled={processing || !scriptReady}
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: 13,
                    background: processing || !scriptReady ? "#888" : "var(--burgundy)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12
                  }}
                >
                  {processing ? (
                    <>
                      <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Processing...
                    </>
                  ) : (
                    <>{scriptReady ? `💳 Pay ₹${total} via Razorpay` : scriptLoading ? "Loading Razorpay..." : "Payment Gateway Unavailable"}</>
                  )}
                </button>
                {errorMessage && <div style={{ marginTop: 12, color: "#B00020", fontSize: 13 }}>{errorMessage}</div>}
                <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
                <button className="btn-outline" disabled={processing} onClick={() => setStep(1)} style={{ width: "100%", padding: "13px", marginTop: 12, fontSize: 12, opacity: processing ? 0.7 : 1, cursor: processing ? "not-allowed" : "pointer" }}>← Back to Address</button>
              </>
            )}
          </div>

          <div style={{ background: "var(--charcoal)", padding: 28, color: "white", height: "fit-content" }}>
            <h3 className="serif" style={{ fontSize: 20, marginBottom: 20, color: "var(--saffron)" }}>Order ({cart.reduce((s, i) => s + i.qty, 0)} items)</h3>
            {cart.slice(0, 4).map((i) => (
              <div key={i._id} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <img src={i.image} style={{ width: 48, height: 48, objectFit: "cover" }} alt={i.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>×{i.qty} · ₹{i.price * i.qty}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(244,160,36,0.2)", paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="serif" style={{ fontSize: 20 }}>Total</span>
                <span className="serif" style={{ fontSize: 22, color: "var(--saffron)", fontWeight: 700 }}>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
