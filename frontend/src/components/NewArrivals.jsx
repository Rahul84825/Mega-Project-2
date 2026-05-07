import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts } from "../services/api";
import { getDisplayPrice } from "@/utils/price";
import { normalizeProduct } from "../context/ProductContext";

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeProductForList = (product) => {
  const normalized = normalizeProduct(product);
  return {
    ...normalized,
    categorySlug: normalizeSlug(normalized?.categorySlug || (typeof normalized?.category === "string" ? normalized.category : normalized?.category?.slug || normalized?.category?.name))
  };
};

function NewArrivals({ setPage, setSelectedProductId, products, setProducts, initialCategory = "all", title = "New Arrivals" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProducts();
        setProducts((Array.isArray(data) ? data : []).map(normalizeProductForList));
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
    () => (products || []).map(normalizeProductForList).map((product) => ({
      ...product,
      price: getDisplayPrice(product),
    })),
    [products]
  );

  const filteredProducts = useMemo(() => normalizedProducts, [normalizedProducts]);

  const heading = title || (normalizeSlug(initialCategory) === "all" ? "New Arrivals" : normalizeSlug(initialCategory));

  return (
    <section className="py-10 md:py-14 bg-[var(--cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            {heading}
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium">
            {filteredProducts.length} premium items
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-[#2d1b14] font-bold">Loading sweets...</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 text-[#c5422b] font-medium">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
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
              <div className="text-center py-12 text-[#6d4c41]">No products found</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default NewArrivals;
