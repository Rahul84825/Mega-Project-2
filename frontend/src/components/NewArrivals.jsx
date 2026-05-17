import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionContainer from "./home/SectionContainer";
import { getDisplayPrice } from "@/services/utils/price";
import { normalizeProduct, useProducts } from "../context/ProductContext";

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
    categorySlug: normalizeSlug(
      normalized?.categorySlug ||
        (typeof normalized?.category === "string"
          ? normalized.category
          : normalized?.category?.slug || normalized?.category?.name)
    )
  };
};

function NewArrivals({ initialCategory = "all", title = "New Arrivals" }) {
  const { products: contextProducts, loading } = useProducts();
  const products = Array.isArray(contextProducts) ? contextProducts : [];
  const navigate = useNavigate();

  const normalizedProducts = useMemo(
    () =>
      (products || [])
        .map(normalizeProductForList)
        .map((product) => ({
          ...product,
          price: getDisplayPrice(product)
        })),
    [products]
  );

  const filteredProducts = useMemo(() => normalizedProducts, [normalizedProducts]);

  const heading =
    title || (normalizeSlug(initialCategory) === "all" ? "New Arrivals" : normalizeSlug(initialCategory));

  return (
    <section className="py-6 md:py-10 bg-[var(--cream)]">
      <SectionContainer>
        <div className="mb-4 md:mb-6 text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            {heading}
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-lg">
            {filteredProducts?.length || 0} premium items
          </p>
        </div>

        {loading && (
          <div className="py-12 text-left">
            <div className="text-[#2d1b14] font-bold">Loading sweets...</div>
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 justify-items-center">
              {(filteredProducts || []).map((product) => {
                const productId = product?._id || product?.id;

                return (
                  <ProductCard
                    key={productId}
                    product={product}
                    onClick={() => {
                      if (productId) {
                        navigate(`/product/${productId}`);
                      }
                    }}
                  />
                );
              })}
            </div>

            {(filteredProducts || []).length === 0 && (
              <div className="py-12 text-left text-[#6d4c41]">No products found</div>
            )}
          </>
        )}
      </SectionContainer>
    </section>
  );
}

export default NewArrivals;