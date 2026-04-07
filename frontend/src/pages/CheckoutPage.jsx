import { useState } from "react";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";

export default function CheckoutPage({ setPage }) {
  const { cart, dispatch } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "Maharashtra" });
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await createOrder({ items: cart, customer: form, total });
      // Placeholder flow: replace with Razorpay checkout handler when backend payment route is ready.
      alert("Order created successfully. Payment gateway integration will be connected here next.");
      dispatch({ type: "CLEAR" });
      setPage("home");
    } catch (_error) {
      alert("Could not create order. Please try again.");
    } finally {
      setProcessing(false);
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
                <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: 28, padding: "14px 36px" }}>Continue to Payment →</button>
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
                  disabled={processing}
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: 13,
                    background: processing ? "#888" : "var(--burgundy)",
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
                    <>💳 Pay ₹{total} via Razorpay</>
                  )}
                </button>
                <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
                <button className="btn-outline" onClick={() => setStep(1)} style={{ width: "100%", padding: "13px", marginTop: 12, fontSize: 12 }}>← Back to Address</button>
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
