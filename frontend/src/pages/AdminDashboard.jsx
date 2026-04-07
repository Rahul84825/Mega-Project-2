import { useEffect, useState } from "react";
import api, { getProducts } from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("products");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "", stock: "" });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [productsData, ordersResponse] = await Promise.all([
          getProducts(),
          api.get("/orders")
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        const ordersData = ordersResponse?.data?.orders || ordersResponse?.data || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (_error) {
        setProducts([]);
        setOrders([]);
      }
    };

    if (otpVerified) {
      fetchAdminData();
    }
  }, [otpVerified]);

  const handleOtp = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const verifyOtp = () => {
    if (otp.join("") === "123456") setOtpVerified(true);
    else alert("Invalid OTP. Try 123456");
  };

  const addProduct = async () => {
    // Placeholder: connect to secured admin endpoint with auth token when backend is ready.
    const payload = {
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock)
    };
    try {
      const response = await api.post("/products", payload);
      const created = response?.data?.product || response?.data;
      if (created) {
        setProducts((prev) => [...prev, created]);
      }
    } catch (_error) {
      setProducts((prev) => [
        ...prev,
        {
          ...payload,
          _id: Date.now().toString(),
          image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400"
        }
      ]);
    } finally {
      setShowAddModal(false);
      setNewProduct({ name: "", price: "", category: "", stock: "" });
    }
  };

  const deleteProduct = async (id) => {
    // Placeholder: replace with real admin delete endpoint when auth flow is live.
    try {
      await api.delete(`/products/${id}`);
    } catch (_error) {
      // Ignore API error in placeholder mode and update UI optimistically.
    }
    setProducts((prev) => prev.filter((x) => x._id !== id));
  };

  const updateOrderStatus = async (id, status) => {
    // Placeholder: replace with real admin order status update endpoint.
    try {
      await api.patch(`/orders/${id}`, { status });
    } catch (_error) {
      // Ignore API error in placeholder mode and update UI optimistically.
    }
    setOrders((prev) => prev.map((x) => (x.id === id || x._id === id ? { ...x, status } : x)));
  };

  if (!otpVerified) {
    return (
      <div className="page-enter" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ background: "white", padding: 48, maxWidth: 420, width: "100%", border: "1px solid rgba(212,160,23,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h2 className="serif" style={{ fontSize: 30, marginBottom: 8 }}>Admin Access</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>Enter the 6-digit OTP sent to your registered mobile. (Use: 123456)</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
            {otp.map((v, i) => (
              <input
                key={i}
                id={`otp-${i + 1}`}
                maxLength={1}
                value={v}
                onChange={(e) => handleOtp(e.target.value, i)}
                style={{ width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700, border: "2px solid", borderColor: v ? "var(--saffron)" : "#E8DDD0", background: v ? "rgba(244,160,36,0.06)" : "white", outline: "none", fontFamily: "Cormorant Garamond, serif" }}
              />
            ))}
          </div>
          <button className="btn-primary" onClick={verifyOtp} style={{ width: "100%", padding: "14px" }}>Verify & Enter</button>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>Resend OTP</div>
        </div>
      </div>
    );
  }

  const statusColor = (s) => ({ Delivered: "#2C6E49", Shipped: "#1A5276", Processing: "#7D3C98", Pending: "#B7950B" }[s] || "#888");

  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "#1A0F0A" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--saffron)", textTransform: "uppercase", marginBottom: 4 }}>Admin Panel</div>
            <h1 className="serif" style={{ fontSize: 36, color: "white" }}>Mithai World Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[ ["📦", products.length, "Products"], ["🛍️", orders.length, "Orders"], ["💰", "₹" + orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString(), "Revenue"] ].map(([icon, val, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.06)", padding: "16px 24px", textAlign: "center", border: "1px solid rgba(244,160,36,0.15)" }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid rgba(244,160,36,0.15)" }}>
          {["products", "orders"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "12px 28px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "DM Sans, sans-serif",
                color: activeTab === t ? "var(--saffron)" : "rgba(255,255,255,0.4)",
                borderBottom: activeTab === t ? "2px solid var(--saffron)" : "2px solid transparent",
                marginBottom: -1
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="serif" style={{ fontSize: 24, color: "white" }}>Product Management</h2>
              <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: 11, padding: "10px 20px" }}>+ Add Product</button>
            </div>
            {showAddModal && (
              <div style={{ background: "rgba(244,160,36,0.06)", border: "1px solid rgba(244,160,36,0.2)", padding: 24, marginBottom: 20 }}>
                <h3 className="serif" style={{ color: "var(--saffron)", marginBottom: 16 }}>New Product</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {["name", "price", "category", "stock"].map((f) => (
                    <div key={f}>
                      <label style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f}</label>
                      <input className="input-field" placeholder={f} value={newProduct[f]} onChange={(e) => setNewProduct({ ...newProduct, [f]: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(244,160,36,0.2)", color: "white" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn-primary" onClick={addProduct}>Save</button>
                  <button className="btn-outline" onClick={() => setShowAddModal(false)} style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(244,160,36,0.15)" }}>
                    {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: 2, color: "var(--saffron)", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p._id}
                      style={{ borderBottom: "1px solid rgba(244,160,36,0.07)", transition: "background 0.2s" }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(244,160,36,0.04)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover" }} />
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}><span className="badge" style={{ background: "rgba(244,160,36,0.12)", color: "var(--saffron)" }}>{p.category}</span></td>
                      <td style={{ padding: "14px 16px", fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "var(--saffron)" }}>₹{p.price}</td>
                      <td style={{ padding: "14px 16px", color: p.stock < 15 ? "#F4A024" : "rgba(255,255,255,0.6)" }}>{p.stock}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className="badge" style={{ background: p.stock > 0 ? "rgba(44,110,73,0.2)" : "rgba(139,26,26,0.2)", color: p.stock > 0 ? "#6ACEA0" : "#E87070" }}>
                          {p.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button onClick={() => deleteProduct(p._id)} style={{ background: "none", border: "1px solid rgba(232,112,112,0.3)", color: "#E87070", padding: "5px 14px", fontSize: 11, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="serif" style={{ fontSize: 24, color: "white", marginBottom: 20 }}>Orders</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((o) => {
                const orderId = o.id || o._id;
                return (
                  <div key={orderId} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(244,160,36,0.1)", padding: 24, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 100px" }}>
                      <div style={{ fontSize: 11, color: "var(--saffron)", letterSpacing: 1 }}>{orderId}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{o.date}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontWeight: 500 }}>{o.customer?.name || o.customer || "Customer"}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{o.items?.length || o.items || 0} items</div>
                    </div>
                    <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", fontWeight: 700 }}>₹{o.total || 0}</div>
                    <select
                      value={o.status || "Pending"}
                      onChange={(e) => updateOrderStatus(orderId, e.target.value)}
                      style={{
                        background: "transparent",
                        border: `1.5px solid ${statusColor(o.status || "Pending")}40`,
                        color: statusColor(o.status || "Pending"),
                        padding: "8px 14px",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "DM Sans, sans-serif",
                        outline: "none"
                      }}
                    >
                      {["Pending", "Processing", "Shipped", "Delivered"].map((s) => (
                        <option key={s} style={{ background: "#1A0F0A" }}>{s}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
