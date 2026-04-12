import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { getCategories, getProducts } from "../services/api";

const normalizeSlug = (value) => String(value || "").trim().toLowerCase();

export default function NewArrivals({ setPage, setSelectedProductId, products, setProducts, initialCategory = "all", title = "New Arrivals" }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(normalizeSlug(initialCategory) || "all");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setCategory(normalizeSlug(initialCategory) || "all");
  }, [initialCategory]);

  useEffect(() => {
    const fetchCategoryOptions = async () => {
      try {
        const data = await getCategories();
        if (!Array.isArray(data)) {
          console.warn("[NewArrivals] Categories API returned non-array:", data);
        }
        const normalized = (Array.isArray(data) ? data : [])
          .map((item) => ({ name: item?.name || "", slug: normalizeSlug(item?.slug) }))
          .filter((item) => Boolean(item.name && item.slug));

        if (!normalized.length) {
          console.warn("[NewArrivals] Categories API returned empty category list");
        }

        setCategoryOptions(normalized);
      } catch (_error) {
        console.error("[NewArrivals] Failed to fetch categories", _error);
        setCategoryOptions([]);
      }
    };

    fetchCategoryOptions();
  }, []);

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

  const categories = useMemo(() => [{ name: "ALL", slug: "all" }, ...categoryOptions], [categoryOptions]);

  const filtered = products.filter((product) => {
    const productCategory = normalizeSlug(product?.category);
    const selectedCategory = normalizeSlug(category);
    const categoryMatches = selectedCategory === "all" || selectedCategory === "" || productCategory === selectedCategory;

    return categoryMatches && (product.name || "").toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    console.log("[NewArrivals] Filtering products", {
      selectedCategory: normalizeSlug(category),
      totalProducts: products.length,
      filteredProducts: filtered.length
    });
  }, [category, filtered.length, products.length]);

  const heading = title || (normalizeSlug(category) === "all" ? "New Arrivals" : category);

  return (
    <div className="pattern-bg" style={{ padding: "32px 32px 0", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
          paddingBottom: 28,
          borderBottom: "1px solid rgba(212,160,23,0.2)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              style={{
                padding: "7px 18px",
                fontSize: 12,
                letterSpacing: 0.5,
                border: "1.5px solid",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "DM Sans, sans-serif",
                borderColor: normalizeSlug(category) === c.slug ? "var(--burgundy)" : "rgba(139,115,85,0.3)",
                background: normalizeSlug(category) === c.slug ? "var(--burgundy)" : "white",
                color: normalizeSlug(category) === c.slug ? "white" : "var(--muted)",
              }}
            >
              {c.name}
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
          <h2 className="serif" style={{ fontSize: 32, fontWeight: 700 }}>
            {heading}
          </h2>
          <span className="ornament">✦</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{filtered.length} items</span>
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
