import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { calculateFinalPriceWithGST, calculateDiscount } from "../utils/priceCalculator";

function ProductCard({ product, onClick }) {
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [showAllVariants, setShowAllVariants] = useState(false);

  const variants = useMemo(() => {
    const incoming = Array.isArray(product?.variants) ? product.variants : [];
    const normalized = incoming
      .map((variant, index) => {
        const mrp = Number(variant?.mrp ?? variant?.price ?? 0);
        const sellingPrice = Number(variant?.sellingPrice ?? variant?.price ?? 0);
        return {
          id: String(variant?.id || variant?._id || `variant_${index + 1}`),
          label: String(variant?.label || `Variant ${index + 1}`).trim(),
          mrp: Number.isFinite(mrp) ? Math.max(0, Math.round(mrp)) : 0,
          sellingPrice: Number.isFinite(sellingPrice) ? Math.max(0, Math.round(sellingPrice)) : 0
        };
      })
      .filter((variant) => variant.mrp > 0 && variant.sellingPrice > 0);

    if (normalized.length) {
      return normalized;
    }

    // Fallback for old structure
    const fallbackPrice = Math.max(0, Number(product?.basePrice ?? product?.price ?? 0));
    return [{ id: "default", label: "Default", mrp: Math.round(fallbackPrice), sellingPrice: Math.round(fallbackPrice) }];
  }, [product]);

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id || "");
    setShowAllVariants(false);
  }, [variants, product?._id, product?.id]);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const gstPercent = Math.max(0, Math.min(100, Number(product?.gstPercent ?? 0) || 0));
  const discount = calculateDiscount(selectedVariant?.mrp || 0, selectedVariant?.sellingPrice || 0);
  const finalPrice = calculateFinalPriceWithGST(selectedVariant?.sellingPrice || 0, gstPercent);
  const isOutOfStock = product?.inStock === false || Number(product?.stock || 1) <= 0;
  const visibleVariants = showAllVariants ? variants : variants.slice(0, 2);
  const extraCount = Math.max(0, variants.length - 2);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      const productId = product?._id || product?.id || product?.name || "product";
      const cartItemId = `${productId}::${selectedVariant?.id || "default"}`;
      dispatch({
        type: "ADD",
        product: {
          ...product,
          cartItemId,
          selectedVariantId: selectedVariant?.id,
          variantLabel: selectedVariant?.label || "Default",
          basePrice: selectedVariant?.sellingPrice || 0,
          price: finalPrice,
          stock: Number(product?.stock || 99)
        }
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
      onClick={onClick}
      style={{ cursor: "pointer", opacity: isOutOfStock ? 0.6 : 1 }}
    >
      <div className="rounded-xl overflow-hidden h-[200px] relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full rounded-xl object-cover"
        />
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
            ₹{discount} OFF
          </div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="text-lg font-semibold text-[#3b2f2f] leading-tight">{product.name}</h3>

        <div className="flex gap-2 mt-2 flex-wrap">
          {visibleVariants.map((variant) => {
            const isActive = selectedVariant?.id === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariantId(variant.id);
                }}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  isActive ? "bg-[#e8883a] text-white" : "bg-[#f5e1c8] text-[#3b2f2f]"
                }`}
              >
                {variant.label}
              </button>
            );
          })}
          {extraCount > 0 && !showAllVariants && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllVariants(true);
              }}
              className="bg-[#f5e1c8] text-[#3b2f2f] px-3 py-1 rounded-full text-sm"
            >
              +{extraCount}
            </button>
          )}
          {extraCount > 0 && showAllVariants && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllVariants(false);
              }}
              className="bg-[#f5e1c8] text-[#3b2f2f] px-3 py-1 rounded-full text-sm"
            >
              Show less
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold text-[#3b2f2f]">₹ {finalPrice}</div>
          {selectedVariant?.mrp > 0 && (
            <div className="text-xs text-gray-400 line-through">
              MRP ₹{selectedVariant.mrp}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="w-full bg-[#a61b1b] text-white rounded-lg py-2 mt-3 hover:bg-[#8e1616] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? "Out of Stock" : added ? "Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
