import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionContainer from "./home/SectionContainer";
import { useProducts } from "../context/ProductContext";

const RecentlyViewed = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      // Support both old format (objects) and new format (ids)
      const ids = Array.isArray(data) 
        ? data.map(item => typeof item === 'object' ? (item._id || item.id) : item)
        : [];
      setViewedIds(ids.filter(Boolean));
    } catch (_error) {
      setViewedIds([]);
    }
  }, []);

  const items = useMemo(() => {
    if (!products || products.length === 0 || viewedIds.length === 0) return [];
    
    // Map IDs to fresh product data from context
    return viewedIds
      .map(id => products.find(p => p._id === id || p.id === id))
      .filter(Boolean);
  }, [products, viewedIds]);

  if (items.length === 0) return null;

  return (
    <section className="py-6 md:py-10 bg-[var(--cream)]">
      <SectionContainer>
        <div className="mb-4 md:mb-6 text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight text-[var(--charcoal)] mb-2">
            Recently Viewed
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium max-w-lg">
            {items.length} items you've browsed
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          {items.map((item) => (
            <ProductCard
              key={item._id || item.id}
              product={item}
              onClick={() => {
                const id = item._id || item.id;
                if (!id) return;
                navigate(`/product/${id}`);
              }}
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default RecentlyViewed;
