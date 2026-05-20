import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionContainer from "./home/SectionContainer";
import { normalizeProduct, useProducts } from "../context/ProductContext";

function NewArrivals({ initialCategory = "all", title = "New Arrivals" }) {
  const { products: contextProducts, loading } = useProducts();
  const products = Array.isArray(contextProducts) ? contextProducts : [];
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    if (initialCategory === "all") return products.slice(0, 8);
    return products.filter(p => 
      p.categorySlug === initialCategory || 
      p.category === initialCategory
    ).slice(0, 8);
  }, [products, initialCategory]);

  return (
    <section className="py-12 md:py-16 bg-[var(--cream)]">
      <SectionContainer>
        <div className="section-title mb-10">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-medium tracking-widest uppercase">
            {initialCategory === 'all' ? 'Freshly Prepared' : 'Curated Collection'}
          </div>
          <h2 className="serif">{title}</h2>
          <p>Handcrafted sweets made with traditional recipes and premium ingredients.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-white rounded-2xl border border-[var(--surface-border)]" />)}
          </div>
        ) : (
          <>
            <div className="responsive-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center bg-white rounded-3xl border border-[var(--surface-border)] shadow-sm">
                <p className="text-[var(--muted)] font-medium">No products found in this category.</p>
                <button onClick={() => navigate("/sweets")} className="btn-outline mt-4">View All Sweets</button>
              </div>
            )}
            
            {filteredProducts.length > 0 && (
              <div className="mt-12 flex justify-center md:justify-start">
                <button onClick={() => navigate("/sweets")} className="btn-outline">
                  Browse Full Collection →
                </button>
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </section>
  );
}

export default NewArrivals;
