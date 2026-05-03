import { useState, useRef, useEffect } from "react";
import { ChevronDown, PackageCheck, X, SlidersHorizontal } from "lucide-react";
import { useProducts } from "../context/ProductContext";

export const SORT_OPTIONS = [
  { id: "default",    label: "Default"           },
  { id: "price_asc",  label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "newest",     label: "Newest First"       },
  { id: "popular",    label: "Most Popular"       },
];

export const PRICE_RANGES = [
  { id: "",     label: "All Prices"     },
  { id: "low",  label: "Under ₹500"    },
  { id: "mid",  label: "₹500 – ₹1,000" },
  { id: "high", label: "Above ₹1,000"  },
];

// ── Dropdown ──────────────────────────────────────────────────────
const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedLabel = options.find((o) => o.id === value)?.label || label;
  const isActive = value !== "" && value !== "default";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold
                    transition-colors duration-150 whitespace-nowrap select-none
          ${isActive
            ? "bg-[var(--burgundy)] border-[var(--burgundy)] text-white"
            : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--charcoal)] hover:bg-[var(--surface-strong)]"
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
                        rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
                        shadow-[0_8px_24px_rgba(139,80,20,0.10)]">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onChange(option.id); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-xs transition-colors duration-100
                ${value === option.id
                  ? "bg-[var(--surface-strong)] text-[var(--burgundy)] font-semibold"
                  : "text-[var(--charcoal)] hover:bg-[var(--surface-strong)]"
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
const ProductFilter = ({ filters, onChange, totalResults, onClear }) => {
  const { categories } = useProducts();

  const activeCategories = (categories || []).filter(
    (c) => c.is_active ?? c.isActive ?? c.active
  );

  const categoryOptions = [
    { id: "", label: "All Categories" },
    ...activeCategories.map((c) => ({
      id:    String(c.slug || c.name || "").toLowerCase(),
      label: c.label || c.name,
    })),
  ];

  const hasActiveFilters =
    filters.category !== "" ||
    filters.price    !== "" ||
    filters.sort     !== "default" ||
    filters.inStock;

  const clearAll = () => onClear?.();

  const activeCategoryLabel =
    categoryOptions.find((c) => c.id === filters.category)?.label || filters.category;

  const updateFilters = (patch) => {
    onChange((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="bg-[var(--cream)] border-b border-[var(--surface-border)]">
      <div className="flex flex-wrap items-center gap-2 py-3">

        {/* Label anchor */}
        <div className="flex items-center gap-1.5 pr-1 mr-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span className="hidden sm:block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Filters
          </span>
        </div>

        <FilterDropdown
          label="Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(val) => updateFilters({ category: val })}
        />
        <FilterDropdown
          label="Price"
          value={filters.price}
          options={PRICE_RANGES}
          onChange={(val) => updateFilters({ price: val })}
        />
        <FilterDropdown
          label="Sort by"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(val) => updateFilters({ sort: val })}
        />

        {/* In Stock */}
        <button
          type="button"
          onClick={() => updateFilters({ inStock: !filters.inStock })}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs
                      font-semibold transition-colors duration-150 whitespace-nowrap shrink-0
            ${filters.inStock
              ? "bg-[var(--burgundy)] border-[var(--burgundy)] text-white"
              : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--charcoal)] hover:bg-[var(--surface-strong)]"
            }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">In Stock</span>
        </button>

        {/* Right: count + clear */}
        <div className="ml-auto flex items-center gap-3 shrink-0 pl-2">
          {totalResults !== undefined && (
            <span className="text-xs text-[var(--muted)] whitespace-nowrap">
              <span className="font-semibold text-[var(--charcoal)]">{totalResults}</span> products
            </span>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-full border border-[var(--surface-border)]
                         bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--muted)]
                         hover:text-[var(--burgundy)] hover:bg-[var(--surface-strong)]
                         transition-colors duration-150 whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* ── Active pills ── */}
        {hasActiveFilters && (
          <div className="w-full flex flex-wrap items-center gap-1.5 pt-1 pb-2">
            <span className="text-[11px] text-[var(--muted)] mr-0.5 shrink-0">Active:</span>

            {[
              filters.category !== "" && {
                label: activeCategoryLabel,
                onRemove: () => updateFilters({ category: "" }),
              },
              filters.price !== "" && {
                label: PRICE_RANGES.find((p) => p.id === filters.price)?.label,
                onRemove: () => updateFilters({ price: "" }),
              },
              filters.sort !== "default" && {
                label: SORT_OPTIONS.find((s) => s.id === filters.sort)?.label,
                onRemove: () => updateFilters({ sort: "default" }),
              },
              filters.inStock && {
                label: "In Stock",
                onRemove: () => updateFilters({ inStock: false }),
              },
            ]
              .filter(Boolean)
              .map(({ label, onRemove }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full
                             bg-[var(--surface-strong)] px-3 py-1 text-[11px] font-semibold text-[var(--charcoal)]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={onRemove}
                    className="flex items-center justify-center w-3.5 h-3.5 rounded-full
                               bg-[var(--surface-border)] hover:bg-[var(--muted)] hover:text-white
                               transition-colors duration-150"
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