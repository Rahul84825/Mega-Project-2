import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

const RecentlyViewed = ({ setPage, setSelectedProductId }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (_error) {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-[var(--cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--charcoal)] mb-2">
            Recently Viewed
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)] font-medium">
            {items.length} items you've browsed
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {items.map((item) => (
            <ProductCard
              key={item._id || item.id}
              product={item}
              onClick={() => {
                const id = item._id || item.id;
                if (!id) return;
                setSelectedProductId?.(id);
                setPage?.("product");
                navigate(`/product/${id}`);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
