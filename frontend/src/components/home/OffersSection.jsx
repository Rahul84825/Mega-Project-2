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
    <section className="py-12 md:py-16 bg-[var(--cream)]">
      <SectionContainer>
        <div className="section-title mb-10">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-medium uppercase tracking-widest">
            <Tag size={12} className="inline mr-2" /> Exclusive Deals
          </div>
          <h2 className="serif">Festive Offers</h2>
          <p>Don't miss out on our limited-time curated selections at special prices.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default OffersSection;
