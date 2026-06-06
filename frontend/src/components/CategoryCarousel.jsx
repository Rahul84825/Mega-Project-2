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
      .filter((c) => c.is_active !== false && c.showInHomepage)
      .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by admin order
  }, [categories]);

  if (homepageCategories.length === 0) return null;

  return (
    <section className="py-8 md:py-16 bg-[var(--cream)] pattern-bg relative overflow-hidden">
      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div className="section-title mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
               Explore by Category
            </div>
            <h2 className="serif text-2xl md:text-3xl">Browse Our World</h2>
            <p className="max-w-xl text-xs md:text-sm">Discover our wide range of premium Indian delights, sorted by tradition and taste.</p>
          </div>
          
          <button 
            onClick={() => navigate("/sweets")}
            className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-[var(--burgundy)] hover:text-[var(--charcoal)] transition-colors group uppercase tracking-[0.2em]"
          >
            All Categories <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {homepageCategories.map((category, idx) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category.slug)}
              style={{ animationDelay: `${idx * 80}ms` }}
              className="group relative w-full h-32 sm:h-40 lg:h-44 overflow-hidden rounded-[20px] sm:rounded-[24px] border border-[var(--surface-border)] shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 active:scale-95 animate-in fade-in slide-in-from-bottom-3"
            >
              <div className="absolute inset-0 bg-[var(--charcoal)] overflow-hidden">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/20 to-[var(--burgundy)]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-70" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 z-10 text-left">
                <h3 className="serif text-white font-bold text-xs sm:text-sm lg:text-base drop-shadow-md leading-tight transition-transform duration-500 group-hover:-translate-y-0.5">
                  {category.name}
                </h3>
                <div className="w-6 h-0.5 bg-[var(--saffron)] mt-2 transition-all duration-500 ease-out group-hover:w-full group-hover:bg-[var(--gold)] shadow-[0_0_8px_rgba(212,160,23,0.4)]" />
              </div>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            </button>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}

export default CategoryCarousel;
