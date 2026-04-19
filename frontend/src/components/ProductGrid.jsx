import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageX, Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "../context/ProductContext";

const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white border border-[#f0e6d6]">
    <div className="aspect-square w-full bg-[#f5ede0]" />
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3.5 bg-[#f0e6d6] rounded-full w-3/4" />
      <div className="h-3 bg-[#f0e6d6] rounded-full w-1/2" />
      <div className="mt-1 flex gap-2">
        <div className="h-6 w-14 bg-[#f0e6d6] rounded-md" />
        <div className="h-6 w-14 bg-[#f0e6d6] rounded-md" />
      </div>
      <div className="h-5 bg-[#f0e6d6] rounded-full w-1/3" />
      <div className="h-px bg-[#f0e6d6]" />
      <div className="h-9 bg-[#f0e6d6] rounded-xl w-full" />
    </div>
  </div>
);

const EmptyState = ({ onClear, isSearch, query }) => (
  <div className="col-span-full flex min-h-[52vh] flex-col items-center justify-center px-4 py-12">
    <div className="flex w-full max-w-sm flex-col items-center bg-white rounded-2xl
                    border border-[#f0e6d6] p-10 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf5ec]">
        {isSearch
          ? <Search className="h-6 w-6 text-[#a0836b]" />
          : <PackageX className="h-6 w-6 text-[#a0836b]" />
        }
      </div>
      <h3 className="mb-1.5 text-[15px] font-semibold text-[#1c1c1c]">
        {isSearch ? `No results for "${query}"` : "No products found"}
      </h3>
      <p className="mb-7 text-[13px] leading-relaxed text-[#a0836b] max-w-[240px]">
        {isSearch
          ? "Try different keywords or browse all products."
          : "Try adjusting your filters to see more results."}
      </p>
      <button
        onClick={onClear}
        className="px-6 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#a01818]
                   text-white text-[13px] font-semibold transition-colors duration-150"
      >
        {isSearch ? "Browse all products" : "Clear filters"}
      </button>
    </div>
  </div>
);

export const DEFAULT_FILTERS = {
  search: "",
  category: "all",
  price: "all",
  inStock: false,
};

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ProductGrid = ({
  filters = DEFAULT_FILTERS,
  onFiltersChange,
  sortBy = "default",
  onSortChange,
  initialFilters,
  onCountChange,
}) => {
  const { products, loading } = useProducts();
  const [searchParams] = useSearchParams();
  const categoryFromURL = toSlug(searchParams.get("category"));

  useEffect(() => {
    if (initialFilters && onFiltersChange) {
      onFiltersChange({
        ...DEFAULT_FILTERS,
        search:   initialFilters.search   || "",
        category: initialFilters.category || "all",
        price:    initialFilters.price    || "all",
        inStock:  Boolean(initialFilters.inStock),
      });
    }
  }, [initialFilters, onFiltersChange]);

  useEffect(() => {
    if (categoryFromURL && onFiltersChange) {
      onFiltersChange((prev) => ({ ...prev, category: categoryFromURL }));
    }
  }, [categoryFromURL, onFiltersChange]);

  const filteredProducts = useMemo(() => {
    const base = (products || []).filter((product) => {
      if (filters.search && !(product.name || "").toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      const productSlug = toSlug(product.categorySlug);
      if (categoryFromURL && productSlug !== categoryFromURL) return false;
      const selectedCategory = toSlug(filters.category || "all");
      if (!categoryFromURL && selectedCategory !== "all" && productSlug !== selectedCategory)
        return false;
      if (filters.inStock && Number(product.stock || 0) <= 0) return false;
      if (filters.price !== "all") {
        const price = Number(product.price || 0);
        if (filters.price === "low"  && price > 500)          return false;
        if (filters.price === "mid"  && (price < 500 || price > 1000)) return false;
        if (filters.price === "high" && price < 1000)         return false;
      }
      return true;
    });

    return base.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":  return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "newest":     return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "popular":    return (b.reviews || 0) - (a.reviews || 0);
        default:           return 0;
      }
    });
  }, [products, filters, sortBy, categoryFromURL]);

  const clearFilters = () => {
    onFiltersChange?.(DEFAULT_FILTERS);
    onSortChange?.("default");
  };

  useEffect(() => {
    if (onCountChange && !loading) onCountChange(filteredProducts.length);
  }, [filteredProducts.length, loading, onCountChange]);

  return (
    <div className="min-h-screen bg-[#fff8f0]">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Result count */}
        {!loading && filteredProducts.length > 0 && (
          <p className="text-[12px] text-[#a0836b] mb-4">
            Showing{" "}
            <span className="font-semibold text-[#3b2f2f]">{filteredProducts.length}</span>{" "}
            product{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        <div className="mt-6 mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filteredProducts.length === 0
            ? <EmptyState
                onClear={clearFilters}
                isSearch={!!(filters.search || "")}
                query={filters.search || ""}
              />
            : filteredProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))
          }
        </div>

      </div>
    </div>
  );
};

export default ProductGrid;