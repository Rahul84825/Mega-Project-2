import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";
import { calculateFinalPriceWithGST, calculateDiscount } from "../utils/priceCalculator";

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function ProductDetailPage({ productId, setPage, products }) {
  const { dispatch } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [showAllVariants, setShowAllVariants] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (_error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!product?._id) return;

    try {
      const stored = localStorage.getItem("recentlyViewed");
      let viewed = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        viewed = Array.isArray(parsed) ? parsed : [];
      }

      viewed = viewed.filter((p) => (p?._id || p?.id) !== product._id);
      viewed.unshift(product);
      viewed = viewed.slice(0, 8);

      localStorage.setItem("recentlyViewed", JSON.stringify(viewed));
    } catch (_error) {
      // Ignore malformed storage values.
    }
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    const currentCategorySlug = toSlug(product.categorySlug || product.category);
    return products
      .filter((p) => toSlug(p.categorySlug || p.category) === currentCategorySlug && p._id !== product._id)
      .slice(0, 3);
  }, [product, products]);

  const variants = useMemo(() => {
    const incoming = Array.isArray(product?.variants) ? product.variants : [];
    const normalized = incoming
      .map((variant, index) => {
        const mrp = Number(variant?.mrp ?? variant?.price ?? 0);
        const sellingPrice = Number(variant?.sellingPrice ?? variant?.price ?? 0);
        return {
          id: String(variant?.id || variant?._id || `variant_${index + 1}`),
          label: String(variant?.label || `Variant ${index + 1}`).trim(),
          mrp: Number.isFinite(mrp) ? Math.max(0, Math.round(mrp)) : 0,
          sellingPrice: Number.isFinite(sellingPrice) ? Math.max(0, Math.round(sellingPrice)) : 0
        };
      })
      .filter((variant) => variant.mrp > 0 && variant.sellingPrice > 0);

    if (normalized.length) {
      return normalized;
    }

    const fallbackPrice = Math.max(0, Number(product?.basePrice ?? product?.price ?? 0));
    return [{ id: "default", label: "Default", mrp: Math.round(fallbackPrice), sellingPrice: Math.round(fallbackPrice) }];
  }, [product]);

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id || "");
    setShowAllVariants(false);
  }, [variants, product?._id, product?.id]);

  if (loading) {
    return (
      <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "40px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="serif" style={{ fontSize: 24, color: "var(--muted)" }}>Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "40px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="serif" style={{ fontSize: 24, color: "var(--muted)", marginBottom: 16 }}>Product not found</div>
          <button className="btn-primary" onClick={() => setPage("home")}>Back to Shop</button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product?.inStock === false || Number(product?.stock || 1) <= 0;
  const gstPercent = Math.max(0, Math.min(100, Number(product?.gstPercent ?? 0) || 0));
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const discount = calculateDiscount(selectedVariant?.mrp || 0, selectedVariant?.sellingPrice || 0);
  const finalPrice = calculateFinalPriceWithGST(selectedVariant?.sellingPrice || 0, gstPercent);
  const visibleVariants = showAllVariants ? variants : variants.slice(0, 2);
  const extraCount = Math.max(0, variants.length - 2);

  const handleAdd = () => {
    if (isOutOfStock) {
      return;
    }
    const productId = product?._id || product?.id || product?.name || "product";
    const cartItemId = `${productId}::${selectedVariant?.id || "default"}`;
    for (let i = 0; i < qty; i += 1) {
      dispatch({
        type: "ADD",
        product: {
          ...product,
          cartItemId,
          selectedVariantId: selectedVariant?.id,
          variantLabel: selectedVariant?.label || "Default",
          basePrice: selectedVariant?.sellingPrice || 0,
          price: finalPrice,
          stock: Number(product?.stock || 99)
        }
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="page-enter pattern-bg" style={{ minHeight: "100vh", padding: "40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 32, display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
          <span onClick={() => setPage("home")} style={{ cursor: "pointer", color: "var(--burgundy)" }}>Shop</span>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span style={{ color: "var(--charcoal)" }}>{product.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start", marginBottom: 72 }}>
          <div style={{ position: "relative" }}>
            <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", boxShadow: "12px 12px 0 rgba(244,160,36,0.2)" }} />
            <div style={{ position: "absolute", top: -8, left: -8, width: 80, height: 80, border: "2px solid var(--saffron)", zIndex: -1 }} />
          </div>
          <div>
            <span className="badge" style={{ background: "rgba(244,160,36,0.15)", color: "var(--saffron)", marginBottom: 16, display: "inline-block", letterSpacing: 2, fontSize: 11, textTransform: "uppercase" }}>{product.category}</span>
            <h1 className="serif" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>{product.name}</h1>
            
            {variants.length > 0 && (
              <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {visibleVariants.map((variant) => {
                  const isActive = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500,
                        background: isActive ? "var(--burgundy)" : "rgba(212,160,23,0.15)",
                        color: isActive ? "white" : "var(--charcoal)",
                        transition: "all 0.2s"
                      }}
                    >
                      {variant.label}
                    </button>
                  );
                })}
                {extraCount > 0 && !showAllVariants && (
                  <button
                    type="button"
                    onClick={() => setShowAllVariants(true)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                      background: "rgba(212,160,23,0.15)",
                      color: "var(--charcoal)",
                      transition: "all 0.2s"
                    }}
                  >
                    +{extraCount}
                  </button>
                )}
                {extraCount > 0 && showAllVariants && (
                  <button
                    type="button"
                    onClick={() => setShowAllVariants(false)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                      background: "rgba(212,160,23,0.15)",
                      color: "var(--charcoal)",
                      transition: "all 0.2s"
                    }}
                  >
                    Show less
                  </button>
                )}
              </div>
            )}

            <div style={{ fontSize: 36, color: "var(--burgundy)", fontFamily: "Cormorant Garamond, serif", fontWeight: 700, marginBottom: 8 }}>₹{finalPrice}</div>
            {selectedVariant?.mrp > 0 && (
              <>
                <div style={{ fontSize: 14, color: "var(--muted)", textDecoration: "line-through", marginBottom: 4 }}>
                  MRP ₹{selectedVariant.mrp}
                </div>
                {discount > 0 && (
                  <div style={{ fontSize: 13, color: "var(--burgundy)", fontWeight: 600, marginBottom: 16 }}>
                    Save ₹{discount}
                  </div>
                )}
              </>
            )}
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 32 }}>incl. GST · Free delivery above ₹999</div>

            <div style={{ borderTop: "1px solid rgba(212,160,23,0.2)", paddingTop: 24, marginBottom: 32 }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Stock: {product.stock} boxes available</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E8DDD0", background: "white" }}>
                  <button disabled={isOutOfStock} onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 40, height: 44, background: "none", border: "none", fontSize: 18, cursor: isOutOfStock ? "not-allowed" : "pointer", color: "var(--burgundy)", opacity: isOutOfStock ? 0.5 : 1 }}>−</button>
                  <span style={{ width: 44, textAlign: "center", fontWeight: 600 }}>{qty}</span>
                  <button disabled={isOutOfStock || qty >= product.stock} onClick={() => setQty((q) => Math.min(product.stock, q + 1))} style={{ width: 40, height: 44, background: "none", border: "none", fontSize: 18, cursor: isOutOfStock || qty >= product.stock ? "not-allowed" : "pointer", color: "var(--burgundy)", opacity: isOutOfStock || qty >= product.stock ? 0.5 : 1 }}>+</button>
                </div>
                <button className="btn-primary" onClick={handleAdd} disabled={isOutOfStock} style={{ flex: 1, padding: "13px 28px", background: isOutOfStock ? "#b7b7b7" : added ? "#2C6E49" : "var(--burgundy)", cursor: isOutOfStock ? "not-allowed" : "pointer" }}>
                  {isOutOfStock ? "Out of Stock" : added ? "✓ Added to Cart" : `Add ${qty} to Cart — ₹${finalPrice * qty}`}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[ ["🥛", "Made with Pure Milk"], ["🌿", "No Preservatives"], ["📦", "Gift Packaging Available"], ["⭐", "Premium Quality"] ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <h2 className="serif" style={{ fontSize: 28, marginBottom: 28 }}>More from <span style={{ color: "var(--saffron)" }}>{product.category}</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {related.map((p) => (
                <ProductCard key={p._id} product={p} onClick={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
