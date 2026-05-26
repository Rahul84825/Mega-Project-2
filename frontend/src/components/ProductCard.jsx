import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";
import { ShoppingBag, Check } from "lucide-react";
import { optimizeCloudinaryUrl } from "../utils/imageUtils";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { cart, dispatch } = useCart();
  const [added, setAdded] = useState(false);
  
  // Filter variants to only those that are explicitly available
  const availableVariants = useMemo(() => {
    return (product?.variants || []).filter(v => v.isAvailable !== false);
  }, [product?.variants]);

  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (availableVariants.length > 0) {
      setSelectedVariant(availableVariants[0]);
    }
  }, [availableVariants]);

  const productId = product?._id || product?.id;
  
  const handleAdd = (e) => {
    e.stopPropagation();
    if (!product) return;

    const variant = selectedVariant || { _id: "", label: "Default", sellingPrice: product.price || product.basePrice, finalPrice: product.price || product.basePrice, stock: product.stock };

    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId,
        variantId: variant._id,
        variantLabel: variant.label,
        name: product.name,
        price: variant.sellingPrice,
        image: product.images?.[0] || product.image,
        stock: variant.stock,
        gstRate: product.gstPercent || 0
      }
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const displayPrice = selectedVariant?.sellingPrice || product?.basePrice || 0;
  const isOutOfStock = selectedVariant ? (selectedVariant.stock <= 0) : (product?.stock <= 0 || product?.isActive === false);
  const isLowStock = selectedVariant ? (selectedVariant.stock > 0 && selectedVariant.stock <= 5) : false;

  // Safe category name resolution
  const categoryName = useMemo(() => {
    if (!product?.category) return "";
    if (typeof product.category === "string") return product.category;
    return product.category.name || "";
  }, [product?.category]);

  return (
    <div 
      onClick={() => navigate(`/product/${productId}`)}
      className="group bg-white rounded-3xl border border-[var(--surface-border)] overflow-hidden cursor-pointer flex flex-col h-full relative transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-20px_rgba(139,30,63,0.15)] active:scale-[0.98]"
    >
      {/* ── IMAGE SECTION ── */}
      <div className="relative aspect-square overflow-hidden bg-[var(--surface-strong)]/30">
        <img 
          src={optimizeCloudinaryUrl(product?.images?.[0] || product?.image, 600)} 
          alt={product?.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${isOutOfStock ? 'opacity-50' : 'group-hover:scale-110'}`}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 items-start">
          {categoryName && (
            <span className="bg-white/90 backdrop-blur-md px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-[var(--burgundy)] shadow-sm border border-[var(--surface-border)]/50">
              {categoryName}
            </span>
          )}
          {!isOutOfStock && isLowStock && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest shadow-sm animate-pulse">
              Low Stock
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-[var(--charcoal)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-gray-100 transform -rotate-3">Sold Out</span>
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* ── CONTENT SECTION ── */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1 gap-3 sm:gap-4 bg-white relative z-10">
        <div className="flex-1">
          <h3 className={`text-xs sm:text-base font-bold line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-tight sm:leading-snug transition-colors duration-300 ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)] group-hover:text-[var(--burgundy)]'}`}>
            {product?.name}
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-1.5 opacity-60 font-medium uppercase tracking-widest">{TAX_MESSAGE}</p>
        </div>

        {/* Dynamic Variant Selector (Mobile Optimized) */}
        {availableVariants.length > 1 && (
          <div className="flex flex-wrap gap-1.5 min-h-[28px] sm:min-h-[32px]">
            {availableVariants.slice(0, 3).map((v, i) => {
              const vOutOfStock = v.stock <= 0;
              const isActive = selectedVariant?._id === v._id;
              return (
                <button
                  key={i}
                  disabled={vOutOfStock}
                  onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black transition-all duration-300 border flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-[var(--burgundy)] border-[var(--burgundy)] text-white shadow-lg scale-105' 
                      : vOutOfStock
                        ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-40'
                        : 'bg-white border-gray-100 text-[var(--muted)] hover:border-[var(--gold)] active:scale-95'}`}
                >
                  <span>{v.label}</span>
                </button>
              )
            })}
            {availableVariants.length > 3 && (
              <span className="text-[8px] font-bold text-[var(--muted)] flex items-center opacity-40">+{availableVariants.length - 3}</span>
            )}
          </div>
        )}

        {/* Pricing & Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex flex-col">
            <div className={`flex items-baseline gap-1 ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)]'}`}>
              <span className="text-sm sm:text-lg font-black leading-none">{formatCurrency(displayPrice)}</span>
              {selectedVariant && (
                <span className="text-[8px] sm:text-[9px] font-bold text-[var(--muted)] opacity-60 uppercase tracking-tighter">/ {selectedVariant.label}</span>
              )}
            </div>
            {!isOutOfStock && product.gstPercent > 0 && (
              <span className="text-[7px] sm:text-[8px] text-emerald-600 font-black tracking-widest mt-0.5 animate-pulse">+ {product.gstPercent}% GST EXTRA</span>
            )}
          </div>
          
          <button 
            disabled={isOutOfStock || added}
            onClick={handleAdd}
            className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg active:scale-75 relative overflow-hidden group/btn
              ${added 
                ? 'bg-green-500 text-white ring-4 ring-green-100' 
                : isOutOfStock 
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-[var(--burgundy)] text-white hover:bg-[var(--charcoal)] hover:shadow-xl hover:-translate-y-1'}`}
          >
            {added ? (
              <Check size={18} strokeWidth={4} className="animate-in zoom-in duration-300" />
            ) : (
              <>
                <ShoppingBag size={18} className="relative z-10 transition-transform duration-500 group-hover/btn:scale-110" />
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
