import { useState } from "react";
import { useCart } from "../context/CartContext";

function ProductCard({ product, onClick }) {
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock === 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      dispatch({ type: "ADD", product });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: "white",
        cursor: "pointer",
        overflow: "hidden",
        border: "1px solid rgba(212,160,23,0.15)",
        boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
        opacity: isOutOfStock ? 0.6 : 1
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: 200 }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
          onMouseOver={(e) => {
            if (!isOutOfStock) e.target.style.transform = "scale(1.08)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span className="badge" style={{ background: "var(--saffron)", color: "var(--charcoal)", fontSize: 10, fontWeight: 600 }}>{product.category}</span>
        </div>
        {isOutOfStock ? (
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span className="badge" style={{ background: "#8B1E3F", color: "white", fontSize: 10 }}>Out of Stock</span>
          </div>
        ) : product.stock < 15 && (
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span className="badge" style={{ background: "var(--burgundy)", color: "white", fontSize: 10 }}>Low Stock</span>
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <div className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4, color: "var(--charcoal)" }}>{product.name}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>per 250g box</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--burgundy)", fontFamily: "Cormorant Garamond, serif" }}>₹{product.price}</span>
          </div>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={isOutOfStock}
            style={{
              padding: "9px 18px",
              fontSize: 11,
              background: isOutOfStock ? "#ccc" : added ? "#2C6E49" : "var(--burgundy)",
              cursor: isOutOfStock ? "not-allowed" : "pointer"
            }}
          >
            {isOutOfStock ? "Out of Stock" : added ? "✓ Added" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
