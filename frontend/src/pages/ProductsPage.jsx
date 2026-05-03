import { useMemo, useState } from "react";
import { useProducts } from "../context/ProductContext";
import ProductFilter from "../components/ProductFilter";
import ProductGrid from "../components/ProductGrid";
import { getDisplayPrice } from "@/utils/price";

const DEFAULT_FILTERS = {
  category: "",
  price: "",
  sort: "default",
  inStock: false,
};

const normalizeCategory = (value) => {
  const next = String(value || "").trim().toLowerCase();
  return next === "all" ? "" : next;
};

const getProductCategory = (product) => {
  const categoryValue = product?.category;

  if (typeof categoryValue === "string") {
    return normalizeCategory(categoryValue);
  }

  return normalizeCategory(categoryValue?.slug || categoryValue?.name || product?.categorySlug);
};

const getProductSortPrice = (product) => {
  return getDisplayPrice(product);
};

const ProductsPage = ({ initialCategory = "all" }) => {
  const { products, loading } = useProducts();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    category: normalizeCategory(initialCategory),
  }));

  const updateFilters = (updater) => {
    setFilters((prev) => (typeof updater === "function" ? updater(prev) : { ...prev, ...updater }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const filteredProducts = useMemo(() => {
    const selectedCategory = normalizeCategory(filters.category);
    const selectedPrice = String(filters.price || "").trim();
    const selectedSort = filters.sort || "default";

    const nextProducts = (products || []).filter((product) => {
      if (selectedCategory && getProductCategory(product) !== selectedCategory) {
        return false;
      }

      if (filters.inStock) {
        const hasStock = Array.isArray(product?.variants)
          ? product.variants.some((variant) => Number(variant?.stock || 0) > 0)
          : Number(product?.stock || 0) > 0;
        if (!hasStock) {
          return false;
        }
      }

      if (selectedPrice) {
        const productPrice = getDisplayPrice(product);

        if (selectedPrice === "low" && productPrice > 500) return false;
        if (selectedPrice === "mid" && (productPrice < 500 || productPrice > 1000)) return false;
        if (selectedPrice === "high" && productPrice < 1000) return false;
      }

      return true;
    });

    return nextProducts.sort((a, b) => {
      const aPrice = getProductSortPrice(a);
      const bPrice = getProductSortPrice(b);

      switch (selectedSort) {
        case "price_asc":
          return aPrice - bPrice;
        case "price_desc":
          return bPrice - aPrice;
        default:
          return 0;
      }
    });
  }, [products, filters]);

  const heading = filters.category ? "Products" : "All Products";

  return (
    <div className="min-h-screen bg-[#fff8f0]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <h1 className="mb-6 text-3xl font-semibold text-[#3b2f2f] md:text-4xl">{heading}</h1>
        <ProductFilter
          filters={filters}
          onChange={updateFilters}
          totalResults={filteredProducts.length}
          onClear={clearFilters}
        />
        <ProductGrid products={filteredProducts} loading={loading} onClearFilters={clearFilters} />
      </div>
    </div>
  );
};

export default ProductsPage;
