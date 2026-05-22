import ProductCard from "./ProductCard";

function SimilarProducts({ titleCategory, products }) {
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <div className="pdp-animate-3 py-6 md:py-10 lg:py-12">
      <div className="section-title mb-10">
        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-medium tracking-widest uppercase">
          Recommendation
        </div>
        <h2 className="serif">
          More from <span className="text-[var(--saffron)]">{titleCategory}</span>
        </h2>
        <p>You might also enjoy these handpicked favorites from the same collection.</p>
      </div>

      <div className="responsive-grid">
        {products.map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default SimilarProducts;
