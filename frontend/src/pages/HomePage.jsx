import HeroSection from "../components/HeroSection";
import CategoryCarousel from "../components/CategoryCarousel";
import NewArrivals from "../components/NewArrivals";
import OurJourney from "../components/OurJourney";
import OffersSection from "../components/home/OffersSection";
import RecentlyViewed from "../components/RecentlyViewed";
import SignatureSweets from "../components/SignatureSweets";
import TrustSignals from "../components/TrustSignals";
import Newsletter from "../components/Newsletter";

function HomePage({ showHero = true, initialCategory = "all", catalogTitle = "New Arrivals" }) {
  return (
    <div className="page-enter bg-[var(--cream)]">
      {showHero && <HeroSection />}
      {showHero && <OffersSection />}
      {showHero && <CategoryCarousel />}
      {showHero && <SignatureSweets />}
      <NewArrivals initialCategory={initialCategory} title={catalogTitle} />
      {showHero && <TrustSignals />}
      {showHero && <RecentlyViewed />}
      <OurJourney />
      {showHero && <Newsletter />}
    </div>
  );
}

export default HomePage;
