import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts } from "../services/api";

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product?.price || 0),
  stock: Number(product?.stock || 0),
  categorySlug: normalizeSlug(product?.categorySlug || (typeof product?.category === "string" ? product.category : product?.category?.slug || product?.category?.name))
});

function NewArrivals({ setPage, setSelectedProductId, products, setProducts, initialCategory = "all", title = "New Arrivals" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProducts();
        setProducts((Array.isArray(data) ? data : []).map(normalizeProduct));
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

  const normalizedProducts = useMemo(
    () => (products || []).map(normalizeProduct),
    [products]
  );

  const filteredProducts = useMemo(() => normalizedProducts, [normalizedProducts]);

  const heading = title || (normalizeSlug(initialCategory) === "all" ? "New Arrivals" : normalizeSlug(initialCategory));

  return (
    <div className="pattern-bg" style={{ padding: "32px 32px 0", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 32 }}>
          <h2 className="serif" style={{ fontSize: 32, fontWeight: 700 }}>
            {heading}
          </h2>
          <span className="ornament">✦</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{filteredProducts.length} items</span>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
            <div className="serif" style={{ fontSize: 20 }}>
              Loading sweets...
            </div>
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
              {filteredProducts.map((p) => (
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
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍬</div>
                <div className="serif" style={{ fontSize: 20 }}>
                  No sweets found
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NewArrivals;
