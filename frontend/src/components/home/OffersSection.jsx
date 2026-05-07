import { useMemo, useEffect, useState } from "react";
import { useProducts } from "../../context/ProductContext";
import OfferCard from "./OfferCard";

// Compact skeleton loader for offers
const OfferSkeletonCard = () => (
  <div className="w-full max-w-[340px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#fff8ee] to-[#f8ead7] border border-[#ecdcc2] h-56 sm:h-64 md:h-72 animate-pulse shadow-md">
    <div className="w-full h-full bg-gradient-to-br from-[#f5e6d3] to-[#e5d8c4]" />
  </div>
);

const OffersSection = () => {
  const { offers } = useProducts();
  const [loading, setLoading] = useState(true);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter active offers and sort by priority
  const activeOffers = useMemo(() => {
    if (!Array.isArray(offers)) return [];
    
    return offers
      .filter((offer) => offer.is_active ?? offer.isActive ?? true)
      .sort((a, b) => {
        const priorityA = Number(a.priority || 0);
        const priorityB = Number(b.priority || 0);
        return priorityB - priorityA;
      });
  }, [offers]);

  // Hide section if no active offers
  if (!activeOffers.length && !loading) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-[var(--cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            Festive Offers
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-lg mx-auto">
            Celebrate with our premium collections, specially curated for you
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 justify-items-center">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <OfferSkeletonCard key={`skeleton-${idx}`} />
              ))
            : activeOffers.map((offer) => (
                <OfferCard key={offer._id || offer.id} offer={offer} />
              ))}
        </div>

        {/* Empty State */}
        {!loading && activeOffers.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex flex-col items-center">
              <div className="text-4xl mb-3 opacity-20">◆</div>
              <p className="text-sm font-bold text-[#7a2828]">No Offers Available</p>
              <p className="text-xs text-[#8b6f47] mt-1">Check back soon for exciting promotions</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OffersSection;
