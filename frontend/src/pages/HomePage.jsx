import HeroSection from "../components/HeroSection";
import CategoryCarousel from "../components/CategoryCarousel";
import NewArrivals from "../components/NewArrivals";
import OurJourney from "../components/OurJourney";
import OffersSection from "../components/home/OffersSection";
import RecentlyViewed from "../components/RecentlyViewed";
import SignatureSweets from "../components/SignatureSweets";
import TrustSignals from "../components/TrustSignals";
import Newsletter from "../components/Newsletter";
import { SEO } from "../components/common";

function HomePage({ showHero = true, initialCategory = "all", catalogTitle = "New Arrivals" }) {
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Bakery", "Store", "LocalBusiness"],
        "@id": "https://mithaipune.com/#localbusiness",
        "name": "Mithai World",
        "url": "https://mithaipune.com",
        "logo": "https://mithaipune.com/android-chrome-512.png",
        "image": "https://mithaipune.com/og-image.png",
        "description": "Premium authentic Indian sweets, dry fruit mithai, and festive gift boxes in Viman Nagar, Pune. Freshly handcrafted daily.",
        "telephone": ["+91 95112 89914", "+91 98581 06106"],
        "email": "mithaipune@gmail.com",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Shop no. 04, Roshma Residency, Central Line, near HDFC Bank, Konark Nagar, Clover Park, Viman Nagar",
          "addressLocality": "Pune",
          "addressRegion": "Maharashtra",
          "postalCode": "411014",
          "addressCountry": "IN"
        },
        "hasMap": "https://maps.google.com/?q=Mithai+World+Viman+Nagar+Pune",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "09:00",
            "closes": "22:30"
          }
        ],
        "sameAs": [
          "https://instagram.com/mithaiworld",
          "https://wa.me/919511289914"
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://mithaipune.com/#organization",
        "name": "Mithai World",
        "url": "https://mithaipune.com",
        "logo": "https://mithaipune.com/android-chrome-512.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91 95112 89914",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi", "Marathi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://mithaipune.com/#website",
        "url": "https://mithaipune.com",
        "name": "Mithai World",
        "description": "Order authentic Indian sweets, dry fruit mithai, and festive gift boxes online from Mithai World, Viman Nagar, Pune.",
        "publisher": {
          "@id": "https://mithaipune.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://mithaipune.com/sweets?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <div className="page-enter bg-[var(--cream)]">
      <SEO 
        title="Mithai World | Best Authentic Indian Sweets in Viman Nagar, Pune"
        description="Discover the finest collection of authentic Indian sweets, dry fruit mithai, and traditional festive gift boxes at Mithai World, Viman Nagar, Pune. Handcrafted daily."
        keywords="Mithai World, Mithai Pune, Best Sweet Shop Pune, Mithai Shop Viman Nagar, Sweets Delivery Pune, Indian Sweets Pune, Fresh Mithai Pune, Premium Sweets Pune, Dry Fruit Sweets Pune"
        canonical="/"
        schemaData={schemaData}
      />
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
