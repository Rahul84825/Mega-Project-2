import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { calculateFinalPriceWithGST, calculateSellingPriceFromDiscount } from "../utils/priceCalculator";

const openProductDetail = (productId) => {
  window.location.href = `/product/${productId}`;
};

function ProductCard({ product }) {
  const { dispatch } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [added, setAdded] = useState(false);

  const variants = useMemo(() => {
    const incoming = product?.variants || [];
    const normalized = incoming.map((v, i) => {
      const mrp = Number(v?.mrp || 0);
      const discount = Number(v?.discountPercent || 0);
      const price = calculateSellingPriceFromDiscount(mrp, discount);
      return {
        id: v?.id || v?._id || `v_${i}`,
        label: v?.label,
        price: Math.round(price),
      };
    });
    return normalized.length
      ? normalized
      : [{ id: "default", label: "250gm", price: product?.price || 0 }];
  }, [product]);

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id);
  }, [variants]);

  const selected = variants.find(v => v.id === selectedVariantId);
  const visible = variants.slice(0, 2);
  const remaining = variants.length - 2;

  const finalPrice = calculateFinalPriceWithGST(selected?.price || 0, product?.gstPercent || 0);

  const handleAdd = () => {
    dispatch({
      type: "ADD",
      product: { ...product, price: finalPrice, variantLabel: selected?.label },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="w-full flex flex-col bg-white rounded-[16px] border border-gray-200 overflow-hidden
                    transition-transform duration-200 hover:-translate-y-1 cursor-pointer">

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
              onClick={() => setSelectedVariantId(v.id)}
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
              onClick={() => openProductDetail(product._id)}
              className="px-3 py-1 text-[12px] rounded-full bg-gray-50
                         border border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
            >
              +{remaining}
            </button>
          )}
        </div>

        {/* PRICE */}
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-medium text-black">₹{finalPrice}</span>
          <span className="text-[12px] text-gray-400">incl. GST</span>
        </div>

        {/* BUTTON — bigger, no border */}
        <button
          onClick={handleAdd}
          className={`w-full py-[13px] rounded-lg text-[14px] font-medium text-white border-none
                      transition-all duration-150 active:scale-[0.98]
                      ${added ? "bg-green-700" : "bg-[#b91c1c] hover:bg-[#991b1b]"}`}
        >
          {added ? "Added!" : "Add to cart"}
        </button>

      </div>
    </div>
  );
}

export default ProductCard;