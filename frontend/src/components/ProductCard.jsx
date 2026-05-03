import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getDisplayPrice, sortVariantsByLabel } from "@/utils/price";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [added, setAdded] = useState(false);

  const variants = useMemo(() => {
    const incoming = Array.isArray(product?.variants) ? product.variants : [];
    const normalized = sortVariantsByLabel(incoming).map((variant, index) => ({
      id: variant?.id || variant?._id || `v_${index}`,
      label: variant?.label,
      price: Number(variant?.price ?? variant?.sellingPrice ?? variant?.finalPrice ?? 0),
      finalPrice: Number(variant?.finalPrice ?? variant?.price ?? variant?.sellingPrice ?? 0),
      stock: Number.isFinite(Number(variant?.stock)) ? Math.max(0, Number(variant.stock)) : (variant?.inStock === false ? 0 : 1),
      variantIndex: index,
    }));
    return normalized.length
      ? normalized
      : [{ id: "default", label: "Default", price: 0, finalPrice: 0, stock: 0, variantIndex: 0 }];
  }, [product]);

  useEffect(() => {
    setSelectedVariantId(variants.find((variant) => variant.stock > 0)?.id || variants[0]?.id || "");
  }, [variants]);

  const selected = variants.find(v => v.id === selectedVariantId);
  const visible = variants.slice(0, 2);
  const remaining = variants.length - 2;
  const displayPrice = getDisplayPrice({ variants });
  const productId = product?._id || product?.id;
  const isOutOfStock = !variants.some((variant) => variant.stock > 0) || !selected || selected.stock <= 0;

  const handleAdd = () => {
    dispatch({
      type: "ADD",
      product: {
        productId: productId,
        name: product?.name,
        image: product?.image || product?.images?.[0],
        variant: selected || variants[0],
        variantLabel: (selected || variants[0])?.label || "Default",
        variantIndex: (selected || variants[0])?.variantIndex ?? 0,
        price: (selected || variants[0])?.finalPrice ?? displayPrice,
        quantity: 1,
        stock: (selected || variants[0])?.stock ?? 0,
        cartItemId: `${productId || product?.name || "product"}::${(selected || variants[0])?.id || "default"}`,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onClick={() => productId && navigate(`/product/${productId}`)}
      className="w-full flex flex-col bg-white rounded-[16px] border border-gray-200 overflow-hidden
                    transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
    >

      {/* IMAGE — taller */}
      <div className="relative h-[240px] overflow-hidden">
        <img
          src={product?.images?.[0]}
          alt={product?.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {product?.category && (
          <span className="absolute top-[10px] left-[10px] bg-yellow-300/90 text-yellow-900
                           text-[11px] font-medium px-[10px] py-[4px] rounded-full tracking-wide">
            {product.category}
          </span>
        )}
      </div>

      {/* BODY — more padding, larger text */}
      <div className="flex flex-col gap-3 p-4">

        {/* NAME */}
        <h3 className="text-[15px] font-medium text-black leading-snug">
          {product?.name}
        </h3>

        {/* VARIANTS */}
        <div className="flex items-center gap-2 flex-wrap">
          {visible.map(v => (
            <button
              key={v.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariantId(v.id);
              }}
              className={`px-3 py-1 text-[12px] rounded-full border transition-all duration-150
                ${selectedVariantId === v.id
                  ? "bg-yellow-100 border-yellow-400 text-yellow-900"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
            >
              {v.label}
            </button>
          ))}
          {remaining > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (productId) {
                  navigate(`/product/${productId}`);
                }
              }}
              className="px-3 py-1 text-[12px] rounded-full bg-gray-50
                         border border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
            >
              +{remaining}
            </button>
          )}
        </div>

        {/* PRICE */}
        {isOutOfStock ? (
          <p className="text-red-500 text-[20px] font-medium">Unavailable</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-medium text-black">₹{displayPrice}</span>
            <span className="text-[12px] text-gray-400">incl. GST</span>
          </div>
        )}

        {/* BUTTON — bigger, no border */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          disabled={isOutOfStock}
          className={`w-full py-[13px] rounded-lg text-[14px] font-medium text-white border-none
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