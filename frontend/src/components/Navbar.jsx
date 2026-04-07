import { useCart } from "../context/CartContext";

export default function Navbar({ page, setPage }) {
  const { cart } = useCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <nav style={{ background: "var(--charcoal)", color: "white", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 68 }}>
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}><img src="../assets/image.png" alt="Mithai World" style={{ width: 40, height: 40 }} /></span>
          <div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: "var(--saffron)" }}>Mithai World</div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Premium Indian Sweets</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["home", "admin"].map((p) => (
            <span
              key={p}
              onClick={() => setPage(p)}
              style={{
                cursor: "pointer",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: page === p ? "var(--saffron)" : "rgba(255,255,255,0.65)",
                transition: "color 0.2s",
                fontWeight: 500
              }}
            >
              {p === "home" ? "Shop" : "Admin"}
            </span>
          ))}
          <button className="btn-outline" onClick={() => setPage("cart")} style={{ position: "relative", borderColor: "var(--saffron)", color: "var(--saffron)", padding: "8px 18px" }}>
            🛒 Cart
            {total > 0 && (
              <span style={{ position: "absolute", top: -8, right: -8, background: "var(--saffron)", color: "var(--charcoal)", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{total}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
