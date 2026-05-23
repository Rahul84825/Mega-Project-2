import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";
import { ShoppingBag, Check } from "lucide-react";

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
      className="group bg-white rounded-2xl border border-[var(--surface-border)] overflow-hidden cursor-pointer card-hover flex flex-col h-full relative"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--surface-strong)]/30">
        <img 
          src={product?.images?.[0] || product?.image} 
          alt={product?.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'opacity-50' : 'group-hover:scale-110'}`}
        />
        {categoryName && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest text-[var(--burgundy)] shadow-sm">
            {categoryName}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-[var(--charcoal)] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">Sold Out</span>
          </div>
        )}
        {!isOutOfStock && isLowStock && (
           <div className="absolute bottom-3 left-3 bg-rose-500 text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
              Low Stock
           </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className={`text-sm sm:text-base font-medium line-clamp-2 min-h-[2.5rem] leading-snug ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)]'}`}>
            {product?.name}
          </h3>
          <p className="text-[10px] text-[var(--muted)] mt-1 italic leading-tight line-clamp-1">{TAX_MESSAGE}</p>
        </div>

        {availableVariants.length > 1 && (
          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            {availableVariants.map((v, i) => {
              const vOutOfStock = v.stock <= 0;
              return (
                <button
                  key={i}
                  disabled={vOutOfStock}
                  onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all border flex items-center gap-1.5
                    ${selectedVariant?._id === v._id 
                      ? 'bg-[var(--burgundy)] border-[var(--burgundy)] text-white shadow-md' 
                      : vOutOfStock
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-white border-[var(--surface-border)] text-[var(--muted)] hover:border-[var(--gold)]'}`}
                >
                  <span>{v.label}</span>
                  <span className="opacity-60 font-medium">|</span>
                  <span>{vOutOfStock ? "Sold Out" : formatCurrency(v.sellingPrice)}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className={`text-lg sm:text-xl font-bold ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)]'}`}>
              {formatCurrency(displayPrice)}
              {selectedVariant && (
                <span className="text-[10px] font-medium text-[var(--muted)] ml-1.5 align-middle uppercase tracking-wider">
                  / {selectedVariant.label}
                </span>
              )}
            </span>
          </div>
          
          <button 
            disabled={isOutOfStock || added}
            onClick={handleAdd}
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90
              ${added 
                ? 'bg-green-500 text-white' 
                : isOutOfStock 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-[var(--burgundy)] text-white hover:bg-[var(--charcoal)]'}`}
          >
            {added ? <Check size={20} strokeWidth={3} /> : <ShoppingBag size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
