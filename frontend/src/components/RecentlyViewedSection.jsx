import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import ProductCard from "./ProductCard";

const RecentlyViewedSection = () => {
  const navigate = useNavigate();
  const { recentlyViewedProducts, clearRecentlyViewed } = useProducts();

  if (!recentlyViewedProducts?.length) return null;

  return (
    <section className="py-14 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 mb-2">
              <Clock3 className="w-4 h-4" />
              Continue Shopping
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Recently Viewed</h2>
            <p className="text-sm text-slate-500 mt-1">Quick access to products you explored recently.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-100"
            >
              Browse All
            </button>
            <button
              type="button"
              onClick={clearRecentlyViewed}
              className="rounded-full border border-slate-200 text-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {recentlyViewedProducts.slice(0, 5).map((product) => (
            <ProductCard key={product._id || product.id} product={product} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedSection;
