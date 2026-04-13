import HeroSection from "../components/HeroSection";
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
