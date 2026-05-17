import { useEffect, useRef, useState } from "react";
import { ChevronDown, PackageCheck, X, SlidersHorizontal } from "lucide-react";
import { useProducts } from "../context/ProductContext";

export const SORT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "price_asc", label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "newest", label: "Newest First" },
  { id: "popular", label: "Most Popular" }
];

export const PRICE_RANGES = [
  { id: "", label: "All Prices" },
  { id: "low", label: "Under ₹500" },
  { id: "mid", label: "₹500 – ₹1,000" },
  { id: "high", label: "Above ₹1,000" }
];

const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedLabel = options.find((option) => option.id === value)?.label || label;
  const isActive = value !== "" && value !== "default";

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          console.log("[ProductFilter] dropdown toggle", label);
          setOpen((current) => !current);
        }}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium whitespace-nowrap select-none transition-all duration-150 active:scale-[0.98]
          ${isActive
            ? "border-[#d4a017] bg-[#d4a017] text-white shadow-sm"
            : "border-[#e8d5b7] bg-[#fffaf3] text-[#3b2417] hover:border-red-900/20 hover:bg-[#fff3e0]"
          }`}
      >
        {selectedLabel}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"} ${isActive ? "opacity-90" : "opacity-50"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[16px] border border-[#e8d5b7] bg-[#fffaf3] shadow-[0_10px_32px_rgba(122,40,40,0.12)] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col py-1">
            {options.map((option) => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    console.log("[ProductFilter] dropdown click", label, option.id);
                    onChange?.(option.id);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors duration-150
                    ${isSelected
                      ? "bg-[#7a2828]/5 text-[#d4a017]"
                      : "bg-transparent text-[#3b2417] hover:bg-[#e8883a]/10"
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

const ProductFilter = ({ filters, onChange, totalResults, onClear }) => {
  const { categories } = useProducts();

  const activeCategories = (categories || []).filter((category) => category?.is_active ?? category?.isActive ?? category?.active);

  const categoryOptions = [
    { id: "", label: "All Categories" },
    ...activeCategories.map((category) => ({
      id: String(category?.slug || category?.name || "").toLowerCase(),
      label: category?.label || category?.name || "Category"
    }))
  ];

  const hasActiveFilters =
    filters.category !== "" ||
    filters.price !== "" ||
    filters.sort !== "default" ||
    filters.inStock;

  const activeCategoryLabel = categoryOptions.find((item) => item.id === filters.category)?.label || filters.category;

  const updateFilters = (patch) => {
    console.log("[ProductFilter] updateFilters", patch);
    if (typeof onChange === "function") {
      onChange(patch);
    }
  };

  const activePills = [
    filters.category !== "" && {
      label: activeCategoryLabel,
      onRemove: () => updateFilters({ category: "" })
    },
    filters.price !== "" && {
      label: PRICE_RANGES.find((item) => item.id === filters.price)?.label,
      onRemove: () => updateFilters({ price: "" })
    },
    filters.sort !== "default" && {
      label: SORT_OPTIONS.find((item) => item.id === filters.sort)?.label,
      onRemove: () => updateFilters({ sort: "default" })
    },
    filters.inStock && {
      label: "In Stock",
      onRemove: () => updateFilters({ inStock: false })
    }
  ].filter(Boolean);

  return (
    <div className="w-full border-b border-[#e8d5b7] bg-[#fff8f0] px-4 py-4 sm:px-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 flex shrink-0 items-center gap-1.5 text-[#a0836b]">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Filters</span>
        </div>

        <FilterDropdown
          label="Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(value) => updateFilters({ category: value })}
        />
        <FilterDropdown
          label="Price"
          value={filters.price}
          options={PRICE_RANGES}
          onChange={(value) => updateFilters({ price: value })}
        />
        <FilterDropdown
          label="Sort by"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(value) => updateFilters({ sort: value })}
        />

        <button
          type="button"
          onClick={() => {
            console.log("[ProductFilter] toggle in stock", !filters.inStock);
            updateFilters({ inStock: !filters.inStock });
          }}
          className={`inline-flex shrink-0 select-none items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium transition-all duration-150 active:scale-[0.98]
            ${filters.inStock
              ? "border-[#d4a017] bg-[#d4a017] text-white shadow-sm"
              : "border-[#e8d5b7] bg-[#fffaf3] text-[#3b2417] hover:border-red-900/20 hover:bg-[#fff3e0]"
            }`}
        >
          <PackageCheck className="h-3.5 w-3.5" />
          <span>In Stock</span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          {totalResults !== undefined && (
            <span className="whitespace-nowrap text-[11px] text-[#a0836b] sm:text-[12px]">
              <span className="font-semibold text-[#3b2417]">{totalResults}</span> products
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                console.log("[ProductFilter] clear filters");
                onClear?.();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#a0836b]/50 bg-transparent px-3 py-1.5 text-[11px] font-medium text-[#a0836b] transition-all duration-150 active:scale-[0.98] hover:border-[#7a2828]/50 hover:bg-[#7a2828]/5 hover:text-[#7a2828] sm:text-[12px]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-medium text-[#a0836b]">Active:</span>
          {activePills.map(({ label, onRemove }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-yellow-300/90 px-2 py-2 text-[10px] font-medium tracking-wide text-yellow-900 sm:px-3 sm:text-[11px]"
            >
              {label}
              <button
                type="button"
                onClick={() => {
                  console.log("[ProductFilter] remove pill", label);
                  onRemove();
                }}
                aria-label={`Remove ${label} filter`}
                className="flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-yellow-400/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductFilter;