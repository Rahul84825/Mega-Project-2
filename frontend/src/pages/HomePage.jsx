import HeroSection from "../components/HeroSection";
import CategoryCarousel from "../components/CategoryCarousel";
import NewArrivals from "../components/NewArrivals";

function HomePage({
  setPage,
  setSelectedProductId,
  products,
  setProducts,
  showHero = true,
  initialCategory = "all",
  catalogTitle = "New Arrivals"
}) {
  return (
    <div className="page-enter">
      {showHero && <HeroSection />}
      <CategoryCarousel setPage={setPage} setSelectedProductId={setSelectedProductId} />
      <NewArrivals
        setPage={setPage}
        setSelectedProductId={setSelectedProductId}
        products={products}
        setProducts={setProducts}
        initialCategory={initialCategory}
        title={catalogTitle}
      />
    </div>
  );
}

export default HomePage;
