import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";

function CategoryCarousel({ setPage, setSelectedCategory, setSelectedProductId }) {
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
    setPage("category");
    setSelectedCategory?.(categorySlug);
    setSelectedProductId(null);
    navigate(`/products?category=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-[#fff3e0]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#2d1b14] tracking-tight">
            Explore by Category
          </h2>
          <p className="text-center text-[#6d4c41] mt-2 text-sm md:text-base font-medium">
            Discover our collection organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {homepageCategories.map((category) => (
            <button
              key={category._id || category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className="group relative w-full max-w-[340px] aspect-[4/5] overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8883a] focus:ring-offset-2"
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
      </div>
    </section>
  );
}

export default CategoryCarousel;
