import { useMemo, useEffect, useState } from "react";
import { useProducts } from "../../context/ProductContext";
import OfferCard from "./OfferCard";
import SectionContainer from "./SectionContainer";

// Compact skeleton loader for offers
const OfferSkeletonCard = () => (
  <div className="w-full max-w-[340px] overflow-hidden rounded-3xl border border-[#ecdcc2] bg-[#fff8ee] shadow-md">
    <div className="aspect-[4/5] w-full animate-pulse bg-[#f3e7d4]" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-2/3 rounded-full bg-[#ead9c2]" />
      <div className="h-3 w-full rounded-full bg-[#eedec8]" />
      <div className="h-3 w-5/6 rounded-full bg-[#eedec8]" />
    </div>
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

  const activeOffers = useMemo(() => {
    if (!Array.isArray(offers)) return [];

    return offers
      .filter((offer) => offer.isActive ?? offer.is_active ?? offer.active ?? true)
      .sort((a, b) => {
        const priorityA = Number(a.priority || 0);
        const priorityB = Number(b.priority || 0);
        return priorityB - priorityA;
      });
  }, [offers]);

  if (!activeOffers.length && !loading) {
    return null;
  }

  return (
    <section className="py-6 md:py-10 bg-[var(--cream)]">
      <SectionContainer>
        <div className="mb-4 md:mb-6 text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            Festive Offers
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-lg">
            Celebrate with our premium collections, specially curated for you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 justify-items-center">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <OfferSkeletonCard key={`skeleton-${idx}`} />
              ))
            : activeOffers.map((offer) => (
                <OfferCard key={offer._id || offer.id} offer={offer} />
              ))}
        </div>

        {!loading && activeOffers.length === 0 && (
          <div className="py-8 text-left">
            <div className="inline-flex flex-col items-start">
              <div className="text-4xl mb-3 opacity-20">◆</div>
              <p className="text-sm font-bold text-[#7a2828]">No Offers Available</p>
              <p className="text-xs text-[#8b6f47] mt-1">Check back soon for exciting promotions</p>
            </div>
          </div>
        )}
      </SectionContainer>
    </section>
  );
};

export default OffersSection;
