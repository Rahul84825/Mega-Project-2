import { useState } from "react";
import { ChevronDown, PackageCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";

// ── Static filter config ───────────────────────────────────────────
export const SORT_OPTIONS = [
  { id: "default",    label: "Default"          },
  { id: "price_asc",  label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "newest",     label: "Newest First"      },
  { id: "popular",    label: "Most Popular"      },
];

export const PRICE_RANGES = [
  { id: "all",  label: "All Prices" },
  { id: "low",  label: "Under ₹500" },
  { id: "mid",  label: "₹500 – ₹1,000" },
  { id: "high", label: "Above ₹1,000" },
];

// ── Reusable Dropdown ──────────────────────────────────────────────
const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel   = options.find((o) => o.id === value)?.label || label;
  const isActive        = value !== "all" && value !== "default";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl border border-[#e8c9a0] px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap
          ${isActive
            ? "bg-[#e8883a] text-white"
            : "bg-[#fff3e0] text-[#3b2f2f] hover:bg-[#f5e1c8]"
          }`}
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 min-w-45 overflow-hidden rounded-xl border border-[#e8c9a0] bg-[#fff3e0] shadow-md">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => { onChange(option.id); setOpen(false); }}
                className={`w-full cursor-pointer px-4 py-3 text-left text-sm text-[#3b2f2f] transition-colors
                  ${value === option.id
                    ? "bg-[#f5e1c8] text-[#3b2f2f] font-semibold"
                    : "hover:bg-[#f5e1c8]"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main ProductFilter ─────────────────────────────────────────────
const ProductFilter = ({ filters, onChange, sortBy = "default", onSortChange, totalResults }) => {
  const { categories } = useProducts();
  const navigate = useNavigate();
  const activeCategories = (categories || []).filter((c) => c.is_active ?? c.isActive ?? c.active);

  const categoryOptions = [
    { id: "all", label: "All Categories" },
    ...activeCategories.map((c) => ({
      id:    String(c.slug || c.name || "").toLowerCase(),
      label: c.label || c.name,
    })),
  ];

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.price !== "all" ||
    sortBy !== "default" ||
    filters.inStock;

  const clearAll = () => {
    onChange({ search: "", category: "all", price: "all", inStock: false });
    onSortChange?.("default");
    navigate("/products", { replace: true });
  };

  const activeCategoryLabel =
    categoryOptions.find((c) => c.id === filters.category)?.label || filters.category;

  return (
    <div className="sticky top-16 z-30 border-b border-[#e8c9a0] bg-[#fff3e0] md:top-20">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">

          {/* Category */}
          <FilterDropdown
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(val) => onChange({ ...filters, category: val })}
          />

          {/* Price */}
          <FilterDropdown
            label="Price"
            value={filters.price}
            options={PRICE_RANGES}
            onChange={(val) => onChange({ ...filters, price: val })}
          />

          {/* Sort */}
          <FilterDropdown
            label="Sort"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(val) => onSortChange?.(val)}
          />

          {/* In Stock toggle — compact */}
          <button
            type="button"
            onClick={() => onChange({ ...filters, inStock: !filters.inStock })}
            title="In Stock Only"
            className={`flex items-center gap-1.5 rounded-xl border border-[#e8c9a0] px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap
              ${filters.inStock
                ? "bg-[#e8883a] text-white"
                : "bg-[#fff3e0] text-[#3b2f2f] hover:bg-[#f5e1c8]"
              }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In Stock</span>
          </button>

          {/* Clear + count */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {totalResults !== undefined && (
              <span className="text-xs font-medium text-[#6d4c41]">{totalResults} products found</span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-full border border-[#e8883a] px-4 py-1 text-[#e8883a] transition-all duration-200 hover:bg-[#e8883a] hover:text-white"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Active filter pills (only visible when filters are active) ── */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#e8c9a0] pt-3">
            {filters.category !== "all" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e1c8] px-3 py-1 text-xs font-medium text-[#3b2f2f]">
                {activeCategoryLabel}
                <button type="button" onClick={() => onChange({ ...filters, category: "all" })} className="text-[#3b2f2f] transition-colors hover:text-[#2d1b14]" aria-label="Remove category filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {filters.price !== "all" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e1c8] px-3 py-1 text-xs font-medium text-[#3b2f2f]">
                {PRICE_RANGES.find((p) => p.id === filters.price)?.label}
                <button type="button" onClick={() => onChange({ ...filters, price: "all" })} className="text-[#3b2f2f] transition-colors hover:text-[#2d1b14]" aria-label="Remove price filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {sortBy !== "default" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e1c8] px-3 py-1 text-xs font-medium text-[#3b2f2f]">
                {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                <button type="button" onClick={() => onSortChange?.("default")} className="text-[#3b2f2f] transition-colors hover:text-[#2d1b14]" aria-label="Remove sort filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e1c8] px-3 py-1 text-xs font-medium text-[#3b2f2f]">
                In Stock
                <button type="button" onClick={() => onChange({ ...filters, inStock: false })} className="text-[#3b2f2f] transition-colors hover:text-[#2d1b14]" aria-label="Remove in stock filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;