import { useState } from "react";
import ProductFilter from "../components/ProductFilter";
import ProductGrid, { DEFAULT_FILTERS } from "../components/ProductGrid";

const ProductsPage = ({ initialCategory = "all" }) => {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    category: initialCategory || "all"
  });
  const [sortBy, setSortBy] = useState("default");
  const heading = initialCategory === "all" ? "All Products" : "Products";

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <h1 className="mb-6 text-3xl font-semibold text-[#3b2f2f] md:text-4xl">{heading}</h1>
      </section>
      <ProductFilter
        filters={filters}
        onChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <ProductGrid
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        initialFilters={{ category: initialCategory || "all" }}
      />
    </>
  );
};

export default ProductsPage;
