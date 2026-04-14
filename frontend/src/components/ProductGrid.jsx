import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageX, RefreshCcw } from "lucide-react";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductContext";

const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-3xl border border-[#e8c9a0] bg-[#fff8ec]">
    {/* Mock Image Area */}
    <div className="bg-slate-200/60 aspect-square w-full" />
    
    {/* Mock Content Area */}
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="space-y-2.5">
        <div className="h-4 bg-slate-200/60 rounded-full w-4/5" />
        <div className="h-3 bg-slate-200/60 rounded-full w-1/2" />
      </div>
      
      {/* Push to bottom */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="h-6 bg-slate-200/60 rounded-full w-1/3" />
        <div className="h-10 w-10 bg-slate-200/60 rounded-full" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ onClear, isSearch, query }) => (
  <div className="col-span-full flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
    <div className="flex w-full max-w-lg flex-col items-center rounded-4xl border border-[#e8c9a0] bg-[#fff8ec] p-10 text-center sm:p-14">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff3e0]">
        <PackageX className="h-12 w-12 text-[#6d4c41]" />
      </div>
      <h3 className="mb-2 text-xl font-bold tracking-tight text-[#3b2f2f]">
        {isSearch ? `No results for "${query}"` : "No products found"}
      </h3>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-[#6d4c41]">
        {isSearch 
          ? "We couldn't find anything matching your search. Try checking for typos or using broader terms." 
          : "We couldn't find any products matching your current filters. Try adjusting them to see more results."}
      </p>
      <button 
        onClick={onClear}
        className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
      >
        {isSearch ? "Browse All Products" : (
          <>
            <RefreshCcw className="w-4 h-4" /> Clear All Filters
          </>
        )}
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
  onCountChange
}) => {
  const { products, loading } = useProducts();
  const [searchParams] = useSearchParams();
  const categoryFromURL = toSlug(searchParams.get("category"));

  // Sync filters when URL params change.
  useEffect(() => {
    if (initialFilters && onFiltersChange) {
      onFiltersChange({
        ...DEFAULT_FILTERS,
        search: initialFilters.search || "",
        category: initialFilters.category || "all",
        price: initialFilters.price || "all",
        inStock: Boolean(initialFilters.inStock)
      });
    }
  }, [initialFilters, onFiltersChange]);

  useEffect(() => {
    if (categoryFromURL && onFiltersChange) {
      onFiltersChange((prev) => ({ ...prev, category: categoryFromURL }));
    }
  }, [categoryFromURL, onFiltersChange]);

  const filteredProducts = useMemo(() => {
    const baseFiltered = (products || []).filter((product) => {
      // search
      if (filters.search && !(product.name || "").toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // category (URL slug has priority)
      const productCategorySlug = toSlug(product.categorySlug);
      if (categoryFromURL && productCategorySlug !== categoryFromURL) {
        return false;
      }

      const selectedCategory = toSlug(filters.category || "all");
      if (!categoryFromURL && selectedCategory !== "all" && productCategorySlug !== selectedCategory) {
        return false;
      }

      // stock
      if (filters.inStock && Number(product.stock || 0) <= 0) {
        return false;
      }

      // price
      if (filters.price !== "all") {
        const price = Number(product.price || 0);
        if (filters.price === "low" && price > 500) return false;
        if (filters.price === "mid" && (price < 500 || price > 1000)) return false;
        if (filters.price === "high" && price < 1000) return false;
      }

      return true;
    });

    return baseFiltered.sort((a, b) => {
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
    <div className="min-h-screen bg-[#fff3e0]">
      <div className="mx-auto mt-6 mb-6 min-h-[60vh] max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filteredProducts.length === 0
            ? <EmptyState onClear={clearFilters} isSearch={!!(filters.search || "")} query={filters.search || ""} />
            : filteredProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                />
              ))
          }
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;