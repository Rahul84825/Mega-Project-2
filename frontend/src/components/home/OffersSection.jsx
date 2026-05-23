import { useMemo, useEffect, useState } from "react";
import { useProducts } from "../../context/ProductContext";
import OfferCard from "./OfferCard";
import SectionContainer from "./SectionContainer";
import { Tag } from "lucide-react";

const OffersSection = () => {
  const { offers } = useProducts();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const activeOffers = useMemo(() => {
    return (offers || [])
      .filter((o) => o.is_active !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [offers]);

  if (!activeOffers.length && !loading) return null;

  return (
    <section className="py-12 md:py-24 bg-[var(--cream)] relative overflow-hidden">
      {/* Subtle Background Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-[var(--burgundy)]/3 pointer-events-none select-none serif">OFFERS</div>

      <SectionContainer className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="section-title mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
              <Tag size={12} className="animate-bounce" /> Exclusive Deals
            </div>
            <h2 className="serif text-3xl md:text-4xl">Festive Offers</h2>
            <p className="max-w-xl text-sm md:text-base leading-relaxed font-medium text-[var(--muted)]">Don't miss out on our limited-time curated selections at special prices. Pure tradition, pure joy.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {activeOffers.map((offer, idx) => (
            <div 
              key={offer._id} 
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default OffersSection;
