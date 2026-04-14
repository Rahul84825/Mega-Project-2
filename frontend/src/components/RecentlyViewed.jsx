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
    <section className="pattern-bg" style={{ padding: "0 32px 64px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
        <h2 className="serif" style={{ fontSize: 32, fontWeight: 700 }}>
          Recently Viewed
        </h2>
        <span className="ornament">✦</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{items.length} items</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
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
    </section>
  );
};

export default RecentlyViewed;
