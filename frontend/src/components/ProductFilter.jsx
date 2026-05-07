import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        className={`inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-full border transition-all duration-150 whitespace-nowrap cursor-pointer select-none active:scale-[0.98]
          ${isActive 
            ? "bg-[#d4a017] border-[#d4a017] text-white shadow-sm" 
            : "bg-[#fffaf3] border-[#e8d5b7] text-[#3b2417] hover:bg-[#fff3e0] hover:border-red-900/20"
          }`}
      >
        {selectedLabel}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          } ${isActive ? "opacity-90" : "opacity-50"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[16px] bg-[#fffaf3] border border-[#e8d5b7] shadow-[0_10px_32px_rgba(122,40,40,0.12)] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col py-1">
            {options.map((option) => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { onChange(option.id); setOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150
                    ${isSelected 
                      ? "text-[#d4a017] bg-[#7a2828]/5" 
                      : "text-[#3b2417] bg-transparent hover:bg-[#e8883a]/10"
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────
const ProductFilter = ({ filters, onChange, totalResults, onClear }) => {
  const navigate = useNavigate();
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

  const activeCategoryLabel =
    categoryOptions.find((c) => c.id === filters.category)?.label || filters.category;

  // Sync filter changes to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.category) params.set("category", filters.category);
    if (filters.price) params.set("price", filters.price);
    if (filters.sort && filters.sort !== "default") params.set("sort", filters.sort);
    if (filters.inStock) params.set("inStock", "true");
    
    const queryString = params.toString();
    const newUrl = queryString ? `/products?${queryString}` : "/products";
    
    // Only navigate if URL would actually change
    if (window.location.pathname + window.location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [filters, navigate]);

  const updateFilters = (patch) => {
    onChange((prev) => ({ ...prev, ...patch }));
  };

  const activePills = [
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
  ].filter(Boolean);

  return (
    <div className="w-full bg-[#fff8f0] border-b border-[#e8d5b7] py-4 px-4 sm:px-0">
      
      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Label */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0 text-[#a0836b]">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
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

        {/* In Stock Toggle */}
        <button
          type="button"
          onClick={() => updateFilters({ inStock: !filters.inStock })}
          className={`inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-full border transition-all duration-150 shrink-0 select-none active:scale-[0.98]
            ${filters.inStock 
              ? "bg-[#d4a017] border-[#d4a017] text-white shadow-sm" 
              : "bg-[#fffaf3] border-[#e8d5b7] text-[#3b2417] hover:bg-[#fff3e0] hover:border-red-900/20"
            }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>In Stock</span>
        </button>

        {/* Right: count + clear */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          {totalResults !== undefined && (
            <span className="text-[11px] sm:text-[12px] text-[#a0836b] whitespace-nowrap">
              <span className="font-semibold text-[#3b2417]">{totalResults}</span> products
            </span>
          )}
          {hasActiveFilters && (
            <button 
              type="button" 
              onClick={() => onClear?.()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-[12px] font-medium rounded-full bg-transparent border border-dashed border-[#a0836b]/50 text-[#a0836b] hover:border-[#7a2828]/50 hover:text-[#7a2828] hover:bg-[#7a2828]/5 transition-all duration-150 active:scale-[0.98] shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Active filter tags ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[11px] font-medium text-[#a0836b] mr-1">
            Active:
          </span>
          {activePills.map(({ label, onRemove }) => (
            <span 
              key={label} 
              className="inline-flex items-center gap-1 bg-yellow-300/90 text-yellow-900 text-[10px] sm:text-[11px] font-medium px-2 sm:px-3 py-2 rounded-full tracking-wide"
            >
              {label}
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} filter`}
                className="flex items-center justify-center p-0.5 rounded-full hover:bg-yellow-400/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

    </div>
  );
};

export default ProductFilter;