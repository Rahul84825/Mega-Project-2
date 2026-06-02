import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import ProductFilter from "../components/ProductFilter";
import SectionContainer from "../components/home/SectionContainer";
import { Filter, SlidersHorizontal, PackageSearch } from "lucide-react";
import { SEO } from "../components/common";

function ProductsPage() {
  const location = useLocation();
  const { products, loading } = useProducts();
  const [filters, setFilters] = useState({
    category: "",
    price: "",
    sort: "default",
    inStock: false,
    search: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const search = params.get("search");
    
    setFilters(prev => ({ 
      ...prev, 
      category: category ? category.toLowerCase() : "",
      search: search ? search.toLowerCase() : ""
    }));
  }, [location.search]);

  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? products.filter(p => p.isActive !== false) : [];
    
    // Search Filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cat = typeof p.category === 'object' ? (p.category?.name || p.category?.slug) : p.category;
        const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
        return name.includes(q) || desc.includes(q) || (cat && String(cat).toLowerCase().includes(q)) || tags.includes(q);
      });
    }

    // Category Filter
    if (filters.category) {
      list = list.filter(p => {
        const pCat = typeof p.category === 'object' ? (p.category?.slug || p.category?.name) : p.category;
        return String(pCat || "").toLowerCase() === filters.category.toLowerCase();
      });
    }

    // Price Filter
    if (filters.price) {
      list = list.filter(p => {
        const price = p.price || p.basePrice || 0;
        if (filters.price === "low") return price < 500;
        if (filters.price === "mid") return price >= 500 && price <= 1000;
        if (filters.price === "high") return price > 1000;
        return true;
      });
    }

    // Stock Filter
    if (filters.inStock) {
      list = list.filter(p => p.stock > 0);
    }

    // Sort
    if (filters.sort === "price_asc") list.sort((a, b) => (a.price || a.basePrice) - (b.price || b.basePrice));
    if (filters.sort === "price_desc") list.sort((a, b) => (b.price || b.basePrice) - (a.price || a.basePrice));
    if (filters.sort === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return list;
  }, [products, filters]);

  const handleFilterChange = (patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      price: "",
      sort: "default",
      inStock: false
    });
  };

  const pageTitle = filters.category 
    ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Collection`
    : "Our Sweet Collection";
  
  const pageDesc = filters.category
    ? `Browse our premium ${filters.category} collection. Handcrafted with love and delivered fresh across Pune.`
    : "Explore our complete range of premium Indian sweets, dry fruit mithai, and traditional treats. Order online for delivery in Pune.";

  return (
    <div className="page-enter bg-[var(--cream)] min-h-[60vh] pb-20 pt-4">
      <SEO 
        title={pageTitle}
        description={pageDesc}
        canonical="/sweets"
      />
      <SectionContainer>
        <div className="flex flex-col gap-8">
          <div className="section-title mb-0 border-b border-[var(--surface-border)] pb-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-medium text-[var(--gold)] uppercase tracking-widest mb-3">
              <PackageSearch size={14} /> Our Collection
            </div>
            <h1 className="serif text-4xl md:text-5xl">Mithai & Treats</h1>
            <p className="font-medium">{filteredProducts.length} unique items available for delivery.</p>
          </div>

          {/* ── FILTER ── */}
          <div className="sticky top-16 z-30 bg-[var(--cream)] py-2">
            <ProductFilter 
              filters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
              totalResults={filteredProducts.length}
            />
          </div>

          {/* ── GRID ── */}
          <div>
            {loading ? (
              <div className="responsive-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-3xl border border-[var(--surface-border)] shadow-sm">
                <div className="h-16 w-16 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
                  <Filter size={32} strokeWidth={1.5} />
                </div>
                <h3 className="serif text-2xl text-[var(--charcoal)] mb-2 font-medium">No sweets found</h3>
                <p className="text-[var(--muted)] max-w-xs mx-auto font-medium">Try selecting a different category or clearing your filters.</p>
                <button onClick={clearFilters} className="btn-primary mt-6">Clear All Filters</button>
              </div>
            ) : (
              <div className="responsive-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

export default ProductsPage;
