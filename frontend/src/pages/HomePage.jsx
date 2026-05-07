import HeroSection from "../components/HeroSection";
import CategoryCarousel from "../components/CategoryCarousel";
import OffersSection from "../components/home/OffersSection";
import NewArrivals from "../components/NewArrivals";
import RecentlyViewed from "../components/RecentlyViewed";

function HomePage({
  setPage,
  setSelectedCategory,
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
      {showHero && (
        <CategoryCarousel
          setPage={setPage}
          setSelectedCategory={setSelectedCategory}
          setSelectedProductId={setSelectedProductId}
        />
      )}
      {showHero && <OffersSection />}
      <NewArrivals
        setPage={setPage}
        setSelectedProductId={setSelectedProductId}
        products={products}
        setProducts={setProducts}
        initialCategory={initialCategory}
        title={catalogTitle}
      />
      {showHero && (
        <RecentlyViewed
          setPage={setPage}
          setSelectedProductId={setSelectedProductId}
        />
      )}
    </div>
  );
}

export default HomePage;
