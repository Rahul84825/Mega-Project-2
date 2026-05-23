import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";
import SectionContainer from "./home/SectionContainer";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";

const RecentlyViewed = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { user } = useAuth();
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    try {
      const userId = user?.id || user?._id || "guest";
      const storageKey = `recentlyViewed-${userId}`;
      const data = JSON.parse(localStorage.getItem(storageKey)) || [];
      // Support both old format (objects) and new format (ids)
      const ids = Array.isArray(data) 
        ? data.map(item => typeof item === 'object' ? (item._id || item.id) : item)
        : [];
      setViewedIds(ids.filter(Boolean));
    } catch (_error) {
      setViewedIds([]);
    }
  }, [user]);

  const items = useMemo(() => {
    if (!products || products.length === 0 || viewedIds.length === 0) return [];
    
    // Map IDs to fresh product data from context
    return viewedIds
      .map(id => products.find(p => p._id === id || p.id === id))
      .filter(Boolean);
  }, [products, viewedIds]);

  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-white border-t border-[var(--surface-border)] overflow-hidden">
      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-16 text-left">
          <div className="section-title mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--gold)] text-[10px] font-black tracking-widest uppercase">
               Your History
            </div>
            <h2 className="serif text-2xl md:text-3xl lg:text-4xl">Recently Viewed</h2>
            <p className="max-w-md text-xs md:text-sm font-medium text-[var(--muted)]">Items you've explored recently. Ready to add them to your bag?</p>
          </div>
        </div>

        {/* Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 no-scrollbar snap-x">
          {items.map((item, idx) => (
            <div 
              key={item._id || item.id} 
              className="min-w-[200px] sm:min-w-0 snap-start animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <ProductCard
                product={item}
              />
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default RecentlyViewed;
