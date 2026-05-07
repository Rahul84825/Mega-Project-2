import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { sortVariantsByLabel } from "@/utils/price";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);

  const variants = useMemo(() => {
    const incoming = Array.isArray(product?.variants) ? product.variants : [];
    return sortVariantsByLabel(incoming).map((variant, index) => ({
      _id: variant?._id || variant?.id || `v_${index}`,
      label: variant?.label || `Variant ${index + 1}`,
      mrp: Number(variant?.mrp ?? 0),
      discountPercent: Number(variant?.discountPercent ?? 0),
      sellingPrice: Number(variant?.sellingPrice ?? 0),
      finalPrice: Number(variant?.finalPrice ?? 0),
      stock: Math.max(0, Number(variant?.stock ?? 0))
    }));
  }, [product]);

  useEffect(() => {
    setSelectedVariant(variants[0] || null);
  }, [variants]);

  const visible = variants.slice(0, 2);
  const remaining = variants.length - 2;
  const productId = product?._id || product?.id;
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
  const displayPrice = selectedVariant?.finalPrice || 0;

  const handleAdd = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      return;
    }

    dispatch({
      type: "ADD",
      product: {
        productId: productId,
        variantId: String(selectedVariant._id || "default"),
        quantity: 1,
        price: Number(selectedVariant?.finalPrice || 0),
        name: product?.name,
        image: product?.image || product?.images?.[0],
        category: product?.category,
        variantLabel: selectedVariant?.label || "Default",
        stock: selectedVariant?.stock ?? 0
      }
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onClick={() => productId && navigate(`/product/${productId}`)}
      className="w-full max-w-[320px] flex flex-col bg-white rounded-[16px] border border-gray-200 overflow-hidden
                    transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
    >

      {/* IMAGE — responsive aspect ratio */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product?.images?.[0]}
          alt={product?.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {product?.category && (
          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-yellow-300/90 text-yellow-900
                           text-[10px] sm:text-[11px] font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full tracking-wide pointer-events-none">
            {product.category}
          </span>
        )}
      </div>

      {/* BODY — responsive padding and gaps */}
      <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4">

        {/* NAME */}
        <h3 className="text-sm sm:text-[15px] font-medium text-black leading-snug">
          {product?.name}
        </h3>

        {/* VARIANTS */}
        <div className="flex items-center gap-2 flex-wrap">
          {visible.map(v => (
            <button
              key={v._id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedVariant(v);
              }}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-[12px] rounded-full border transition-all duration-150
                ${selectedVariant?._id === v._id
                  ? "bg-[#d4a017] border-[#d4a017] text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
            >
              {v.label}
            </button>
          ))}
          {remaining > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (productId) {
                  navigate(`/product/${productId}`);
                }
              }}
              className="px-2 sm:px-3 py-1 text-[11px] sm:text-[12px] rounded-full bg-gray-50
                         border border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
            >
              +{remaining}
            </button>
          )}
        </div>

        {/* PRICE */}
        {isOutOfStock ? (
          <p className="text-red-500 text-lg sm:text-[20px] font-medium">Out of Stock</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-[20px] font-medium text-black">₹{displayPrice}</span>
            <span className="text-[11px] sm:text-[12px] text-gray-400">incl. GST</span>
          </div>
        )}

        {/* BUTTON — full width, responsive height */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }}
          disabled={isOutOfStock}
          className={`w-full h-12 rounded-lg text-[13px] sm:text-[14px] font-medium text-white border-none
                      transition-all duration-150 active:scale-[0.98]
                      ${isOutOfStock
                        ? "bg-gray-300 cursor-not-allowed opacity-60"
                        : added
                          ? "bg-green-700"
                          : "bg-[#b91c1c] hover:bg-[#991b1b]"}`}
        >
          {isOutOfStock ? "Out of Stock" : added ? "Added!" : "Add to cart"}
        </button>

      </div>
    </div>
  );
}

export default ProductCard;