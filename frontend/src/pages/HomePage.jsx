import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/api";

export default function HomePage({ setPage, setSelectedProductId, products, setProducts }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (_error) {
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (!products.length) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [products.length, setProducts]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div
        style={{
          background: "linear-gradient(135deg, var(--charcoal) 0%, #4A1010 60%, var(--burgundy) 100%)",
          padding: "72px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(244,160,36,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244,160,36,0.07) 0%, transparent 40%)" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 13, letterSpacing: 5, color: "var(--saffron)", textTransform: "uppercase", marginBottom: 16 }}>✦ Crafted with Love ✦</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: 20 }}>
            India's Finest
            <br />
            <span style={{ color: "var(--saffron)" }}>Mithai</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.8 }}>
            Handcrafted traditional sweets made from premium ingredients, delivered to your doorstep.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn-primary" style={{ padding: "14px 36px", fontSize: 12 }}>Shop Now</button>
            <button className="btn-outline" style={{ borderColor: "rgba(244,160,36,0.5)", color: "var(--saffron)", padding: "14px 36px", fontSize: 12 }}>Our Story</button>
          </div>
        </div>
      </div>

      <div className="pattern-bg" style={{ padding: "32px 32px 0", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 28, borderBottom: "1px solid rgba(212,160,23,0.2)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "7px 18px",
                  fontSize: 12,
                  letterSpacing: 0.5,
                  border: "1.5px solid",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "DM Sans, sans-serif",
                  borderColor: category === c ? "var(--burgundy)" : "rgba(139,115,85,0.3)",
                  background: category === c ? "var(--burgundy)" : "white",
                  color: category === c ? "white" : "var(--muted)"
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            className="input-field"
            placeholder="🔍  Search sweets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260, background: "white" }}
          />
        </div>

        <div style={{ paddingTop: 40, paddingBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 32 }}>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 700 }}>Our Collection</h2>
            <span className="ornament">✦</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{filtered.length} items</span>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <div className="serif" style={{ fontSize: 20 }}>Loading sweets...</div>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--burgundy)" }}>
              <div className="serif" style={{ fontSize: 20 }}>{error}</div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
                {filtered.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onClick={() => {
                      setSelectedProductId(p._id);
                      setPage("product");
                    }}
                  />
                ))}
              </div>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🍬</div>
                  <div className="serif" style={{ fontSize: 20 }}>No sweets found</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
