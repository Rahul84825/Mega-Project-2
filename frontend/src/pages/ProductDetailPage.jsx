import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SimilarProducts from "../components/SimilarProducts";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { getDefaultVariant, getDisplayPrice, sortVariantsByLabel } from "@/services/utils/price";

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const { products } = useProducts();
  const [product, setProduct]                   = useState(null);
  const [selectedImage, setSelectedImage]       = useState("");
  const [imgSwitching, setImgSwitching]         = useState(false);
  const [qty, setQty]                           = useState(1);
  const [added, setAdded]                       = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (_error) { setProduct(null); }
      finally { setLoading(false); }
    };
    if (id) fetchProduct(); else setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!product?._id) return;
    try {
      const stored = localStorage.getItem("recentlyViewed");
      let viewed = [];
      if (stored) { const parsed = JSON.parse(stored); viewed = Array.isArray(parsed) ? parsed : []; }
      viewed = viewed.filter((p) => (p?._id || p?.id) !== product._id);
      viewed.unshift(product);
      viewed = viewed.slice(0, 8);
      localStorage.setItem("recentlyViewed", JSON.stringify(viewed));
    } catch (_error) {}
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    const slug = toSlug(product.categorySlug || product.category);
    return products
      .filter((p) => toSlug(p.categorySlug || p.category) === slug && p._id !== product._id)
      .slice(0, 3);
  }, [product, products]);

  const productImages = useMemo(() => {
    const raw = Array.isArray(product?.images) ? product.images
      : product?.images ? [product.images]
      : product?.image  ? [product.image]
      : [];
    return raw.filter(Boolean);
  }, [product]);

  useEffect(() => { setSelectedImage(productImages[0] || ""); }, [productImages]);

  const variants = useMemo(() => {
    const incoming = Array.isArray(product?.variants) ? product.variants : [];
    const normalized = sortVariantsByLabel(incoming)
      .map((v, i) => ({
        _id:             String(v?._id || v?.id || `variant_${i + 1}`),
        label:           String(v?.label || `Variant ${i + 1}`).trim(),
        mrp:             Number(v?.mrp ?? 0),
        discountPercent: Number(v?.discountPercent ?? 0),
        sellingPrice:    Number(v?.sellingPrice ?? 0),
        finalPrice:      Number(v?.finalPrice ?? 0),
        stock:           Math.max(0, Math.floor(Number(v?.stock ?? 0))),
      }))
      .filter((v) => v.mrp > 0 || v.finalPrice > 0);
    return normalized.length
      ? normalized
      : [{ _id: "default", label: "Default", mrp: 0, discountPercent: 0, sellingPrice: 0, finalPrice: 0, stock: 0 }];
  }, [product]);

  useEffect(() => {
    const def = getDefaultVariant({ variants });
    setSelectedVariantId(def?._id || variants[0]?._id || "");
  }, [variants, product?._id, product?.id]);

  useEffect(() => {
    const stock = Math.max(0, Number((variants.find((v) => v._id === selectedVariantId) || variants[0])?.stock || 0));
    if (stock > 0) setQty((q) => Math.max(1, Math.min(q, stock)));
  }, [selectedVariantId, variants]);

  const switchImage = (img) => {
    setImgSwitching(true);
    setTimeout(() => { setSelectedImage(img); setImgSwitching(false); }, 180);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-[20px] font-medium text-gray-500 tracking-wide">Loading product…</p>
        <div className="mt-4 h-0.5 w-12 bg-gradient-to-r from-[#d4a017] to-[#b91c1c] rounded-full mx-auto animate-pulse" />
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!product) return (
    <div className="min-h-screen py-20 px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <p className="text-[28px] font-semibold text-gray-500 mb-6">Product not found.</p>
        <button 
          className="px-6 py-3 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg font-medium transition-colors"
          onClick={() => navigate("/")}
        >
          ← Back to Shop
        </button>
      </div>
    </div>
  );

  /* ── Derived ── */
  const selectedVariant           = variants.find((v) => v._id === selectedVariantId) || variants[0];
  const displayPrice              = selectedVariant?.finalPrice || getDisplayPrice({ variants });
  const isOutOfStock              = !variants.length || !variants.some((v) => v.stock > 0);
  const selectedVariantOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
  const disabled                  = isOutOfStock || selectedVariantOutOfStock;

  const handleAdd = () => {
    if (disabled) return;
    const requestedQty = Math.max(1, Math.min(qty, selectedVariant?.stock ?? qty));
    dispatch({
      type: "ADD",
      product: {
        productId:    product?._id || product?.id || product?.name || "product",
        variantId:    String(selectedVariant?._id || "default"),
        quantity:     requestedQty,
        price:        selectedVariant?.finalPrice || displayPrice,
        name:         product?.name,
        image:        product?.image || product?.images?.[0],
        category:     product?.category,
        variantLabel: selectedVariant?.label || "Default",
        stock:        selectedVariant?.stock ?? 0,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const BADGES = [
    ["🥛", "Made with Pure Milk"],
    ["🌿", "No Preservatives"],
    ["📦", "Gift Packaging Available"],
    ["⭐", "Premium Quality"],
  ];

  return (
    <div className="min-h-screen bg-white pb-12 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 mb-6 md:mb-10 text-gray-400 animate-in fade-in slide-in-from-bottom-4 duration-500 text-xs md:text-sm">
          <span className="font-semibold hover:text-[#b91c1c] cursor-pointer transition-colors" onClick={() => navigate("/")}>
            Shop
          </span>
          <span className="opacity-40">/</span>
          <span className="text-gray-600 capitalize">{product.category}</span>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-black">{product.name}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 items-start mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">

          {/* Image column */}
          <div>
            <div className="relative">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className={`w-full aspect-[4/3] object-cover rounded-[16px] shadow-sm border border-gray-100 transition-opacity duration-200 ${imgSwitching ? "opacity-50" : "opacity-100"}`}
              />

              {/* Discount badge */}
              {selectedVariant?.discountPercent > 0 && (
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-[#b91c1c] text-white text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-full tracking-wide shadow-md">
                  {selectedVariant.discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails - responsive sizes */}
            {productImages.length > 1 && (
              <div className="flex gap-2 md:gap-3 mt-3 md:mt-4 flex-wrap">
                {productImages.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => switchImage(img)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-150 p-0.5 bg-white
                      ${img === selectedImage 
                        ? "border-[#d4a017] shadow-sm" 
                        : "border-transparent hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover rounded-md block"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="pt-0 md:pt-1">

            {/* Category chip */}
            <span className="inline-block mb-4 bg-yellow-300/90 text-yellow-900 text-[10px] md:text-[11px] font-medium px-3 py-1 rounded-full tracking-wide uppercase">
              {product.category}
            </span>

            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black leading-tight mb-4 md:mb-6 tracking-tight">
              {product.name}
            </h1>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="flex gap-2 mb-5 md:mb-6 flex-wrap">
                {variants.map((variant) => (
                  <button
                    key={variant._id}
                    type="button"
                    className={`px-3 md:px-4 py-2 text-[11px] md:text-[12px] font-medium rounded-full border transition-all duration-150 active:scale-95
                      ${selectedVariant?._id === variant._id
                        ? "bg-[#d4a017] border-[#d4a017] text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedVariantId(variant._id)}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-black leading-none">
                {displayPrice > 0 ? `₹${displayPrice}` : "Unavailable"}
              </span>
              {selectedVariant?.mrp > 0 && selectedVariant.mrp !== displayPrice && (
                <span className="text-sm md:text-base font-medium text-gray-400 line-through">
                  ₹{selectedVariant.mrp}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-[11px] font-medium text-gray-400 mb-6 md:mb-7 tracking-wide">
              Incl. of all taxes · Free delivery above ₹999
            </p>

            {/* Divider */}
            <div className="h-px bg-gray-200 w-full mb-5 md:mb-6" />

            {/* Stock */}
            <p className="text-[12px] md:text-[13px] text-gray-500 mb-4 md:mb-6">
              {disabled
                ? <span className="text-red-600 font-medium">Currently out of stock</span>
                : <><span className="font-semibold text-black">{selectedVariant?.stock ?? 0}</span> units available</>
              }
            </p>

            {/* Qty + ATC - Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6 md:mb-8">
              {/* Stepper - larger on mobile */}
              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shrink-0 order-2 sm:order-1">
                <button 
                  type="button" 
                  className="w-12 h-12 md:w-[42px] md:h-[46px] flex items-center justify-center text-xl font-light hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed text-black transition-colors"
                  disabled={disabled}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-12 md:w-11 text-center text-sm md:text-[15px] font-semibold text-black">
                  {qty}
                </span>
                <button 
                  type="button" 
                  className="w-12 h-12 md:w-[42px] md:h-[46px] flex items-center justify-center text-xl font-light hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed text-black transition-colors"
                  disabled={disabled || qty >= (selectedVariant?.stock ?? 0)}
                  onClick={() => setQty((q) => Math.min(selectedVariant?.stock ?? 1, q + 1))}
                >
                  +
                </button>
              </div>

              {/* Add to cart - full width on mobile */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled}
                className={`flex-1 sm:flex-none py-3 md:py-[13px] px-4 md:px-6 rounded-lg text-[13px] md:text-[14px] font-medium text-white transition-all duration-150 active:scale-[0.98] order-1 sm:order-2
                  ${disabled 
                    ? "bg-gray-300 cursor-not-allowed opacity-80" 
                    : added 
                      ? "bg-green-700" 
                      : "bg-[#b91c1c] hover:bg-[#991b1b]"
                  }`}
              >
                {disabled ? "Out of Stock"
                  : added ? "✓ Added to Cart"
                  : `Add ${qty} to Cart · ₹${displayPrice > 0 ? displayPrice * qty : 0}`}
              </button>
            </div>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {BADGES.map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 p-2.5 md:p-3 rounded-lg bg-gray-50 border border-gray-100 text-[11px] md:text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  <span className="text-base md:text-lg leading-none flex-shrink-0">{icon}</span>
                  <span className="line-clamp-1">{text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <SimilarProducts titleCategory={product.category} products={related} />
        )}

      </div>
    </div>
  );
}

export default ProductDetailPage;