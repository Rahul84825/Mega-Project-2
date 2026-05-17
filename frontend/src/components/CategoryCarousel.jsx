import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import SectionContainer from "./home/SectionContainer";

function CategoryCarousel() {
  const { categories } = useProducts();
  const navigate = useNavigate();

  const homepageCategories = useMemo(
    () =>
      (categories || [])
        .filter((cat) => cat.showInHomepage === true && cat.is_active)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .slice(0, 6),
    [categories]
  );

  if (!homepageCategories.length) {
    return null;
  }

  const handleCategoryClick = (categorySlug) => {
    navigate(`/products?category=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <section className="py-6 md:py-10 bg-[#fff3e0]">
      <SectionContainer>
        <div className="mb-4 md:mb-6 text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#2d1b14] tracking-tight">
            Explore by Category
          </h2>
          <p className="mt-2 max-w-xl text-left text-[#6d4c41] text-sm md:text-base font-medium">
            Discover our collection organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 justify-items-center">
          {homepageCategories.map((category) => (
            <button
              key={category._id || category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className="group relative w-full max-w-[300px] h-[250px] aspect-[4/5] overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8883a] focus:ring-offset-2"
            >
              {/* Background Image */}
              {category.image ? (
                <div className="relative w-full h-full overflow-hidden bg-[#f5e1c8]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 pointer-events-none" />
                </div>
              ) : (
                <div className="relative w-full h-full bg-gradient-to-br from-[#e8883a] to-[#c9a84c] group-hover:from-[#d97706] group-hover:to-[#e8883a] transition-all duration-300 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all pointer-events-none" />
                </div>
              )}

              {/* Text Content */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center px-4">
                  <h3 className="text-white font-bold text-lg md:text-xl lg:text-2xl drop-shadow-lg line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-xs md:text-sm mt-2 drop-shadow font-medium">
                    Explore →
                  </p>
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
