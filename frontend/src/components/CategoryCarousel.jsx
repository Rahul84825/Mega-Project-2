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
    <section className="py-12 md:py-16 bg-[var(--cream)] pattern-bg">
      <SectionContainer>
        <div className="section-title mb-10">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-medium tracking-widest uppercase">
            Browse Our World
          </div>
          <h2 className="serif">Explore by Category</h2>
          <p>Discover our wide range of premium Indian delights, sorted by tradition.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {homepageCategories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category.slug)}
              className="group relative w-full h-48 sm:h-56 overflow-hidden rounded-2xl border border-[var(--surface-border)] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-[var(--charcoal)] transition-transform duration-700 group-hover:scale-110">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/20 to-[var(--burgundy)]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-5 z-10 text-left">
                <h3 className="text-white font-medium text-sm sm:text-base md:text-lg drop-shadow-md leading-tight">
                  {category.name}
                </h3>
                <div className="w-8 h-0.5 bg-[var(--saffron)] mt-2 transition-all duration-500 group-hover:w-16" />
                <div className="flex items-center gap-2 text-[10px] font-medium text-white/80 mt-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  Shop Now <ArrowRight size={12} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}

export default CategoryCarousel;
