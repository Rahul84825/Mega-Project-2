import ProductCard from "./ProductCard";

function SimilarProducts({ titleCategory, products }) {
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section className="pdp-animate-3 py-6 md:py-10 lg:py-12">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4 md:mb-6 lg:mb-8">
        <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-[#3b2417] whitespace-nowrap">
          More from <span className="text-[#e8883a]">{titleCategory}</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4a017]/35 to-transparent hidden md:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 justify-items-center">
        {products.map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default SimilarProducts;
