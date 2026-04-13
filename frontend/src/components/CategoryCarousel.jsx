import { useProducts } from "../context/ProductContext";

function CategoryCarousel({ setPage, setSelectedProductId }) {
  const { categories } = useProducts();

  // Filter only categories that should show on homepage
  const homepageCategories = (categories || [])
    .filter((cat) => cat.showInHomepage && cat.is_active)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .slice(0, 6);

  if (!homepageCategories.length) {
    return null;
  }

  const handleCategoryClick = (categorySlug) => {
    setPage("home");
    setSelectedProductId(null);
  };

  return (
    <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-[#fff8ec] to-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#2d1b14] text-center mb-2 tracking-tight">
          Explore by Category
        </h2>
        <p className="text-center text-[#6d4c41] mb-12 text-sm md:text-base font-medium">
          Discover our collection organized by category
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {homepageCategories.map((category) => (
            <button
              key={category._id || category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8883a] focus:ring-offset-2"
            >
              {/* Background Image */}
              {category.image ? (
                <div className="relative w-full h-40 md:h-48 lg:h-56 overflow-hidden bg-[#f5e1c8]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300" />
                </div>
              ) : (
                <div className="relative w-full h-40 md:h-48 lg:h-56 bg-gradient-to-br from-[#e8883a] to-[#c9a84c] group-hover:from-[#d97706] group-hover:to-[#e8883a] transition-all duration-300 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />
                </div>
              )}

              {/* Text Content */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <h3 className="text-white font-extrabold text-lg md:text-xl lg:text-2xl drop-shadow-lg line-clamp-2 px-2">
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
