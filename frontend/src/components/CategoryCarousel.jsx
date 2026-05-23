import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import SectionContainer from "./home/SectionContainer";
import { ArrowRight } from "lucide-react";

function CategoryCarousel() {
  const { categories } = useProducts();
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    navigate(`/sweets?category=${slug}`);
  };

  const homepageCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories
      .filter((c) => c.is_active !== false)
      .slice(0, 6);
  }, [categories]);

  if (homepageCategories.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-[var(--cream)] pattern-bg relative overflow-hidden">
      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-16">
          <div className="section-title mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
               Explore by Category
            </div>
            <h2 className="serif text-3xl md:text-4xl">Browse Our World</h2>
            <p className="max-w-xl text-sm md:text-base">Discover our wide range of premium Indian delights, sorted by tradition and taste.</p>
          </div>
          
          <button 
            onClick={() => navigate("/sweets")}
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-[var(--burgundy)] hover:text-[var(--charcoal)] transition-colors group uppercase tracking-[0.2em]"
          >
            All Categories <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {homepageCategories.map((category, idx) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category.slug)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="group relative w-full h-48 sm:h-64 overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[var(--surface-border)] shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-1.5 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="absolute inset-0 bg-[var(--charcoal)] overflow-hidden">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000 ease-out group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/20 to-[var(--burgundy)]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 z-10 text-left">
                <h3 className="text-white font-black text-xs sm:text-sm lg:text-base drop-shadow-lg leading-tight transition-transform duration-500 group-hover:-translate-y-1">
                  {category.name}
                </h3>
                <div className="w-6 h-0.5 bg-[var(--saffron)] mt-2 transition-all duration-700 ease-out group-hover:w-full group-hover:bg-[var(--gold)] shadow-[0_0_10px_rgba(212,160,23,0.5)]" />
                
                <div className="flex items-center gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/90 mt-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500 delay-100">
                  Shop Now <ArrowRight size={10} className="text-[var(--gold)]" />
                </div>
              </div>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            </button>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}

export default CategoryCarousel;
