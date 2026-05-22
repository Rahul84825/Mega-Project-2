import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionContainer from "./home/SectionContainer";
import { useProducts } from "../context/ProductContext";
import { Sparkles, ArrowRight } from "lucide-react";

const SignatureSweets = () => {
  const { products: contextProducts, loading } = useProducts();
  const navigate = useNavigate();
  
  const products = Array.isArray(contextProducts) ? contextProducts : [];

  const sweets = useMemo(() => {
    return products.filter(p => p.isSignature && p.isActive !== false).slice(0, 4);
  }, [products]);

  if (!loading && sweets.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#fffaf3] relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-[500px] w-[500px] bg-[var(--burgundy)]/5 rounded-full blur-3xl pointer-events-none" />
      
      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
          <div className="section-title mb-0 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-bold tracking-widest uppercase">
              <Sparkles size={12} /> Masterpiece Collection
            </div>
            <h2 className="serif text-4xl">Signature Sweets</h2>
            <p className="max-w-xl">Our most beloved traditional mithais, crafted with perfection and passed down through generations.</p>
          </div>
          
          <button 
            onClick={() => navigate("/sweets")}
            className="flex items-center gap-2 text-sm font-bold text-[var(--burgundy)] hover:text-[var(--charcoal)] transition-colors group uppercase tracking-widest"
          >
            Explore All Sweets <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] bg-white rounded-3xl border border-[var(--surface-border)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {sweets.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </SectionContainer>
    </section>
  );
};

export default SignatureSweets;
