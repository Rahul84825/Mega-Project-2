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
    const activeProducts = products.filter(p => p.isActive !== false);
    if (initialCategory === "all") return activeProducts.slice(0, 8);
    return activeProducts.filter(p => 
      p.categorySlug === initialCategory || 
      p.category === initialCategory
    ).slice(0, 8);
  }, [products, initialCategory]);

  return (
    <section className="py-12 md:py-28 bg-[var(--cream)] relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 h-[600px] w-[600px] bg-[var(--saffron)]/5 rounded-full blur-[120px] pointer-events-none" />

      <SectionContainer className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="section-title mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
               {initialCategory === 'all' ? 'Freshly Prepared' : 'Curated Collection'}
            </div>
            <h2 className="serif text-3xl md:text-4xl">{title}</h2>
            <p className="max-w-xl text-sm md:text-base leading-relaxed font-medium text-[var(--muted)]">Handcrafted sweets made with traditional recipes, premium desi ghee, and pure love.</p>
          </div>
          
          <button 
            onClick={() => navigate("/sweets")}
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-[var(--burgundy)] hover:text-[var(--charcoal)] transition-colors group uppercase tracking-[0.2em]"
          >
            Full Catalog <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="responsive-grid animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
               <div key={i} className="aspect-[3/4] bg-white rounded-3xl border border-[var(--surface-border)]" />
            ))}
          </div>
        ) : (
          <>
            <div className="responsive-grid">
              {filteredProducts.map((product, idx) => (
                <div 
                  key={product._id} 
                  className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-24 text-center bg-white rounded-[32px] border border-[var(--surface-border)] shadow-sm animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--muted)]/30">
                   <Sparkles size={40} />
                </div>
                <h3 className="serif text-2xl font-medium text-[var(--charcoal)] mb-2">No sweets here yet</h3>
                <p className="text-sm text-[var(--muted)] font-medium mb-8">Try a different category or check back later!</p>
                <button onClick={() => navigate("/sweets")} className="btn-primary h-12 px-8">Browse All Mithai</button>
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </section>
  );
}

export default NewArrivals;
