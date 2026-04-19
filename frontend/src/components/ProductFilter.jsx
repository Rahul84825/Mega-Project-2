import { useState, useRef, useEffect } from "react";
import { ChevronDown, PackageCheck, X, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";

export const SORT_OPTIONS = [
  { id: "default",    label: "Default"           },
  { id: "price_asc",  label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "newest",     label: "Newest First"       },
  { id: "popular",    label: "Most Popular"       },
];

export const PRICE_RANGES = [
  { id: "all",  label: "All Prices"     },
  { id: "low",  label: "Under ₹500"    },
  { id: "mid",  label: "₹500 – ₹1,000" },
  { id: "high", label: "Above ₹1,000"  },
];

// ── Dropdown ──────────────────────────────────────────────────────
const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedLabel = options.find((o) => o.id === value)?.label || label;
  const isActive = value !== "all" && value !== "default";

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold
                    transition-colors duration-150 whitespace-nowrap select-none
          ${isActive
            ? "bg-[#b91c1c] text-white"
            : "text-[#3b2f2f] hover:bg-gray-100"
          }`}
      >
        {selectedLabel}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200
                      ${open ? "rotate-180" : ""} ${isActive ? "opacity-80" : "opacity-50"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[164px] overflow-hidden
                        rounded-xl bg-white border border-[#f0e6d6]
                        shadow-[0_8px_24px_rgba(139,80,20,0.12)]">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onChange(option.id); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-[12px] transition-colors duration-100
                ${value === option.id
                  ? "bg-[#fdf5ec] text-[#7a4a20] font-semibold"
                  : "text-[#3b2f2f] hover:bg-[#fdf5ec]"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────
const ProductFilter = ({ filters, onChange, sortBy = "default", onSortChange, totalResults }) => {
  const { categories } = useProducts();
  const navigate = useNavigate();

  const activeCategories = (categories || []).filter(
    (c) => c.is_active ?? c.isActive ?? c.active
  );

  const categoryOptions = [
    { id: "all", label: "All Categories" },
    ...activeCategories.map((c) => ({
      id:    String(c.slug || c.name || "").toLowerCase(),
      label: c.label || c.name,
    })),
  ];

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.price    !== "all" ||
    sortBy           !== "default" ||
    filters.inStock;

  const clearAll = () => {
    onChange({ search: "", category: "all", price: "all", inStock: false });
    onSortChange?.("default");
    navigate("/products", { replace: true });
  };

  const activeCategoryLabel =
    categoryOptions.find((c) => c.id === filters.category)?.label || filters.category;

  return (
    <div className="sticky top-16 z-30 md:top-20 bg-[#f8f5ef] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Filter row ── */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">

          {/* Label anchor */}
          <div className="flex items-center gap-1.5 pr-1 mr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#a0836b]" />
            <span className="hidden sm:block text-[11px] font-semibold text-[#a0836b] uppercase tracking-wider">
              Filters
            </span>
          </div>

          <FilterDropdown
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(val) => onChange({ ...filters, category: val })}
          />
          <FilterDropdown
            label="Price"
            value={filters.price}
            options={PRICE_RANGES}
            onChange={(val) => onChange({ ...filters, price: val })}
          />
          <FilterDropdown
            label="Sort by"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(val) => onSortChange?.(val)}
          />

          {/* In Stock */}
          <button
            type="button"
            onClick={() => onChange({ ...filters, inStock: !filters.inStock })}
            className={`flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2
                        text-[12px] font-semibold transition-colors duration-150 whitespace-nowrap shrink-0
              ${filters.inStock
                ? "bg-[#b91c1c] text-white"
                : "text-[#3b2f2f] hover:bg-gray-100"
              }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In Stock</span>
          </button>

          {/* Right: count + clear */}
          <div className="ml-auto flex items-center gap-3 shrink-0 pl-2">
            {totalResults !== undefined && (
              <span className="text-[12px] text-[#a0836b] whitespace-nowrap">
                <span className="font-semibold text-[#3b2f2f]">{totalResults}</span> products
              </span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2
                           text-[11px] font-semibold text-[#a0836b]
                           hover:text-[#b91c1c] hover:bg-gray-100
                           transition-colors duration-150 whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Active pills ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            <span className="text-[11px] text-[#a0836b] mr-0.5 shrink-0">Active:</span>

            {[
              filters.category !== "all" && {
                label: activeCategoryLabel,
                onRemove: () => onChange({ ...filters, category: "all" }),
              },
              filters.price !== "all" && {
                label: PRICE_RANGES.find((p) => p.id === filters.price)?.label,
                onRemove: () => onChange({ ...filters, price: "all" }),
              },
              sortBy !== "default" && {
                label: SORT_OPTIONS.find((s) => s.id === sortBy)?.label,
                onRemove: () => onSortChange?.("default"),
              },
              filters.inStock && {
                label: "In Stock",
                onRemove: () => onChange({ ...filters, inStock: false }),
              },
            ]
              .filter(Boolean)
              .map(({ label, onRemove }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full
                             bg-[#fbe8c8] px-3 py-1 text-[11px] font-semibold text-[#7a4a20]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={onRemove}
                    className="flex items-center justify-center w-3.5 h-3.5 rounded-full
                               bg-[#e0c090] hover:bg-[#c8a060] transition-colors"
                    aria-label={`Remove ${label} filter`}
                  >
                    <X className="w-2 h-2" />
                  </button>
                </span>
              ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductFilter;