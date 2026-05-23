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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {homepageCategories.map((category, idx) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category.slug)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="group relative w-full h-[300px] sm:h-[400px] lg:h-[450px] overflow-hidden rounded-[32px] sm:rounded-[48px] border border-[var(--surface-border)] shadow-md hover:shadow-3xl transition-all duration-700 hover:-translate-y-2 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="absolute inset-0 bg-[var(--charcoal)] overflow-hidden">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-all duration-1000 ease-out group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/20 to-[var(--burgundy)]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10 z-10 text-left">
                <h3 className="serif text-white font-bold text-2xl sm:text-3xl lg:text-4xl drop-shadow-2xl leading-tight transition-transform duration-500 group-hover:-translate-y-2">
                  {category.name}
                </h3>
                <div className="w-12 h-1 bg-[var(--saffron)] mt-4 transition-all duration-700 ease-out group-hover:w-full group-hover:bg-[var(--gold)] shadow-[0_0_20px_rgba(212,160,23,0.6)]" />
                
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/90 mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500 delay-100">
                  Explore Collection <ArrowRight size={14} className="text-[var(--gold)]" />
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
