import { useCart } from "../context/CartContext";

function CartPage({ setPage }) {
  const { cart, dispatch } = useCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 999 ? 0 : 60;
  const total = subtotal + delivery;

  if (cart.length === 0) {
    return (
      <div className="page-enter" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 64 }}>🛒</div>
        <h2 className="serif" style={{ fontSize: 32 }}>Your cart is empty</h2>
        <p style={{ color: "var(--muted)" }}>Add some sweet goodness first!</p>
        <button className="btn-primary" onClick={() => setPage("home")} style={{ marginTop: 8 }}>Browse Sweets</button>
      </div>
    );
  }

  return (
    <div className="page-enter pattern-bg" style={{ padding: "48px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="serif" style={{ fontSize: 40, marginBottom: 40 }}>Your Cart <span className="ornament">✦</span></h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.map((item) => (
              <div key={item._id} style={{ background: "white", padding: 24, display: "flex", gap: 20, alignItems: "center", border: "1px solid rgba(212,160,23,0.1)", boxShadow: "0 2px 8px rgba(44,24,16,0.04)" }}>
                <img src={item.image} alt={item.name} style={{ width: 90, height: 90, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{item.category} · per 250g</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E8DDD0" }}>
                    <button onClick={() => dispatch({ type: "UPDATE_QTY", id: item._id, qty: item.qty - 1 })} style={{ width: 36, height: 36, background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--burgundy)" }}>−</button>
                    <span style={{ width: 36, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.qty}</span>
                    <button onClick={() => dispatch({ type: "UPDATE_QTY", id: item._id, qty: item.qty + 1 })} style={{ width: 36, height: 36, background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--burgundy)" }}>+</button>
                  </div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, fontWeight: 700, color: "var(--burgundy)", minWidth: 80, textAlign: "right" }}>₹{item.price * item.qty}</div>
                  <button onClick={() => dispatch({ type: "REMOVE", id: item._id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#ccc", padding: 4 }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", padding: 32, border: "1px solid rgba(212,160,23,0.15)", position: "sticky", top: 88 }}>
            <h2 className="serif" style={{ fontSize: 24, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(212,160,23,0.2)" }}>Order Summary</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--muted)" }}>
                <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--muted)" }}>
                <span>Delivery</span>
                <span style={{ color: delivery === 0 ? "#2C6E49" : "inherit" }}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
              </div>
              {delivery > 0 && <div style={{ fontSize: 12, color: "var(--saffron)", background: "rgba(244,160,36,0.08)", padding: "8px 12px" }}>Add ₹{999 - subtotal} more for free delivery</div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid rgba(212,160,23,0.2)", marginBottom: 24 }}>
              <span className="serif" style={{ fontSize: 20, fontWeight: 700 }}>Total</span>
              <span className="serif" style={{ fontSize: 24, fontWeight: 700, color: "var(--burgundy)" }}>₹{total}</span>
            </div>
            <button className="btn-primary" onClick={() => setPage("checkout")} style={{ width: "100%", padding: "15px", fontSize: 12 }}>Proceed to Checkout</button>
            <button className="btn-outline" onClick={() => setPage("home")} style={{ width: "100%", padding: "13px", fontSize: 12, marginTop: 12 }}>Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
