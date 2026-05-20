import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency, TAX_MESSAGE } from "../utils/priceCalculator";
import { ShoppingBag, Check } from "lucide-react";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { cart, dispatch } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);

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
        stock: variant.stock
      }
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const displayPrice = selectedVariant?.sellingPrice || product?.basePrice || 0;
  const isOutOfStock = (selectedVariant?.stock || product?.stock || 0) <= 0;

  // Safe category name resolution
  const categoryName = useMemo(() => {
    if (!product?.category) return "";
    if (typeof product.category === "string") return product.category;
    return product.category.name || "";
  }, [product?.category]);

  return (
    <div 
      onClick={() => navigate(`/product/${productId}`)}
      className="group bg-white rounded-2xl border border-[var(--surface-border)] overflow-hidden cursor-pointer card-hover flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--surface-strong)]/30">
        <img 
          src={product?.images?.[0] || product?.image} 
          alt={product?.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {categoryName && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest text-[var(--burgundy)] shadow-sm">
            {categoryName}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-[var(--charcoal)] px-4 py-2 rounded-full text-xs font-medium uppercase tracking-widest shadow-xl">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-medium text-[var(--charcoal)] line-clamp-2 min-h-[2.5rem] leading-snug">
            {product?.name}
          </h3>
          <p className="text-[10px] text-[var(--muted)] mt-1 italic leading-tight line-clamp-1">{TAX_MESSAGE}</p>
        </div>

        {product?.variants?.length > 1 && (
          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            {product.variants.map((v, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
                className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition-all border
                  ${selectedVariant?._id === v._id 
                    ? 'bg-[var(--burgundy)] border-[var(--burgundy)] text-white shadow-md' 
                    : 'bg-white border-[var(--surface-border)] text-[var(--muted)] hover:border-[var(--gold)]'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-medium text-[var(--charcoal)]">{formatCurrency(displayPrice)}</span>
          </div>
          
          <button 
            disabled={isOutOfStock || added}
            onClick={handleAdd}
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90
              ${added 
                ? 'bg-green-500 text-white' 
                : isOutOfStock 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
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
