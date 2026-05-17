import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import ProductFilter from "../components/ProductFilter";
import ProductGrid from "../components/ProductGrid";
import { getDisplayPrice } from "@/services/utils/price";
import { normalizeCategory, getProductCategory } from "@/services/utils/category";

const DEFAULT_FILTERS = {
  category: "",
  price: "",
  sort: "default",
  inStock: false,
};

const getProductSortPrice = (product) => {
  return getDisplayPrice(product);
};

const getProductCreatedAt = (product) => {
  return new Date(product?.createdAt || product?.created_at || 0).getTime();
};

const getProductPopularityScore = (product) => {
  return Number(product?.salesCount || product?.soldCount || product?.views || product?.popularity || 0);
};

const ProductsPage = () => {
  const { products, loading } = useProducts();

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * URL = SINGLE SOURCE OF TRUTH
   */
  const filters = useMemo(() => {
    const nextFilters = {
      category: normalizeCategory(
        searchParams.get("category") || DEFAULT_FILTERS.category
      ),
      price: searchParams.get("price") || DEFAULT_FILTERS.price,
      sort: searchParams.get("sort") || DEFAULT_FILTERS.sort,
      inStock: searchParams.get("inStock") === "true",
    };
    return nextFilters;
  }, [searchParams]);

  /**
   * Update URL params directly
   */
  const updateFilters = (updates) => {
    console.log("[ProductsPage] updateFilters", updates, "from", searchParams.toString());
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      // Remove empty/default values from URL
      if (
        value === "" ||
        value === false ||
        value === null ||
        value === undefined ||
        value === "default"
      ) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toString());
      }
    });

    console.log("[ProductsPage] next query", nextParams.toString() || "(empty)");
    setSearchParams(nextParams);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    console.log("[ProductsPage] clearFilters");
    setSearchParams({});
  };

  /**
   * Filter + sort products
   */
  const filteredProducts = useMemo(() => {
    const selectedCategory = normalizeCategory(filters.category);
    const selectedPrice = String(filters.price || "").trim();
    const selectedSort = filters.sort || "default";

    const nextProducts = (products || []).filter((product) => {
      /**
       * Category filter
       */
      if (
        selectedCategory &&
        getProductCategory(product) !== selectedCategory
      ) {
        return false;
      }

      /**
       * Stock filter
       */
      if (filters.inStock) {
        const hasStock = Array.isArray(product?.variants)
          ? product.variants.some(
              (variant) => Number(variant?.stock || 0) > 0
            )
          : Number(product?.stock || 0) > 0;

        if (!hasStock) {
          return false;
        }
      }

      /**
       * Price filter
       */
      if (selectedPrice) {
        const productPrice = getDisplayPrice(product);

        if (selectedPrice === "low" && productPrice > 500) {
          return false;
        }

        if (
          selectedPrice === "mid" &&
          (productPrice < 500 || productPrice > 1000)
        ) {
          return false;
        }

        if (selectedPrice === "high" && productPrice < 1000) {
          return false;
        }
      }

      return true;
    });

    /**
     * Sorting
     */
    return nextProducts.sort((a, b) => {
      const aPrice = getProductSortPrice(a);
      const bPrice = getProductSortPrice(b);
      const aCreatedAt = getProductCreatedAt(a);
      const bCreatedAt = getProductCreatedAt(b);
      const aPopularity = getProductPopularityScore(a);
      const bPopularity = getProductPopularityScore(b);

      switch (selectedSort) {
        case "price_asc":
          return aPrice - bPrice;

        case "price_desc":
          return bPrice - aPrice;

        case "newest":
          return bCreatedAt - aCreatedAt;

        case "popular":
          return bPopularity - aPopularity;

        default:
          return 0;
      }
    });
  }, [products, filters]);

  useEffect(() => {
    console.log("[ProductsPage] URL params changed", searchParams.toString() || "(empty)", filters);
  }, [searchParams, filters]);

  useEffect(() => {
    console.log("[ProductsPage] filtered product count", filteredProducts.length);
  }, [filteredProducts.length]);

  const heading = filters.category ? "Products" : "All Products";

  return (
    <div className="min-h-screen bg-[#fff8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3b2f2f]">
          {heading}
        </h1>

        <ProductFilter
          filters={filters}
          onChange={updateFilters}
          totalResults={filteredProducts.length}
          onClear={clearFilters}
        />

        <ProductGrid
          products={filteredProducts}
          loading={loading}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
};

export default ProductsPage;