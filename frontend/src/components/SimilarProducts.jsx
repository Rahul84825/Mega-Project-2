import ProductCard from "./ProductCard";

function SimilarProducts({ titleCategory, products }) {
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section className="pdp-animate-3 py-8 md:py-12 lg:py-14">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8 md:mb-10 lg:mb-12">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#3b2417] whitespace-nowrap">
          More from <span className="text-[#e8883a]">{titleCategory}</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4a017]/35 to-transparent hidden md:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {products.map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default SimilarProducts;
