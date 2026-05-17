import HeroSection from "../components/HeroSection";
import CategoryCarousel from "../components/CategoryCarousel";
import NewArrivals from "../components/NewArrivals";
import OurJourney from "../components/OurJourney";
import OffersSection from "../components/home/OffersSection";
import RecentlyViewed from "../components/RecentlyViewed";

function HomePage({ showHero = true, initialCategory = "all", catalogTitle = "New Arrivals" }) {
  return (
    <div className="page-enter bg-[var(--cream)]">
      {showHero && <HeroSection />}
      {showHero && <OffersSection />}
      {showHero && <CategoryCarousel />}
      <NewArrivals initialCategory={initialCategory} title={catalogTitle} />
      {showHero && <RecentlyViewed />}
      <OurJourney />
    </div>
  );
}

export default HomePage;
