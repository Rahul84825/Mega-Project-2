import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import ProductFilter from "../components/ProductFilter";
import ProductGrid from "../components/ProductGrid";
import { getDisplayPrice } from "@/utils/price";
import { normalizeCategory, getProductCategory } from "@/utils/category";

const DEFAULT_FILTERS = {
  category: "",
  price: "",
  sort: "default",
  inStock: false,
};

const getProductSortPrice = (product) => {
  return getDisplayPrice(product);
};

const ProductsPage = ({ initialCategory = "all" }) => {
  const { products, loading } = useProducts();
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  // Sync filters with URL query parameters - watch location.search for changes
  useEffect(() => {
    // Extract all filters from URL
    const urlCategory = searchParams.get("category");
    const urlPrice = searchParams.get("price");
    const urlSort = searchParams.get("sort");
    const urlInStock = searchParams.get("inStock") === "true";

    // Normalize values
    const normalizedCategory = normalizeCategory(urlCategory || "");
    const normalizedPrice = String(urlPrice || "").trim();
    const normalizedSort = String(urlSort || "default").trim();

    // Update all filters to match URL state
    setFilters({
      category: normalizedCategory,
      price: normalizedPrice,
      sort: normalizedSort,
      inStock: urlInStock,
    });
  }, [searchParams, location.search]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3b2f2f]">{heading}</h1>
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
