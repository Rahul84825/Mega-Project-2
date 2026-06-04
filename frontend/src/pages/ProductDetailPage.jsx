import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RefreshCw, Star, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";
import SimilarProducts from "../components/SimilarProducts";
import SectionContainer from "../components/home/SectionContainer";
import { SEO } from "../components/common";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const { dispatch, openCart } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = useMemo(() => products.find(p => p._id === id), [products, id]);

  const categoryName = useMemo(() => product?.category?.name || "Premium Sweets", [product]);
  
  const availableVariants = useMemo(() => 
    (product?.variants || []).filter(v => v.isActive !== false),
  [product]);

  useEffect(() => {
    if (product && !selectedVariant) {
      if (availableVariants.length > 0) {
        setSelectedVariant(availableVariants[0]);
      }
    }
  }, [product, availableVariants, selectedVariant]);

  const currentPrice = selectedVariant?.sellingPrice || product?.basePrice || 0;
  const currentMrp = selectedVariant?.mrp || product?.mrp || 0;
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const isOutOfStock = currentStock <= 0 || product?.isActive === false;
  const isLowStock = !isOutOfStock && currentStock < 10;

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category?._id === product.category?._id && p._id !== product._id)
      .slice(0, 4);
  }, [product, products]);

  const handleAddToCart = () => {
    if (!product) return;

    const variant = selectedVariant || {
      _id: "default",
      label: "Default",
      sellingPrice: product.price || product.basePrice,
      stock: product.stock
    };

    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product._id,
        variantId: variant._id,
        variantLabel: variant.label,
        name: product.name,
        price: variant.sellingPrice,
        image: product.images?.[0] || product.image,
        quantity: quantity,
        stock: variant.stock,
        gstRate: product.gstPercent || 0,
        packingCharges: product.packingCharges || 0
      }
    });

    openCart();
  };

  const schemaData = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.images || [product.image],
      "description": product.description || `Premium ${product.name} from Mithai World.`,
      "sku": product._id,
      "brand": {
        "@type": "Brand",
        "name": "Mithai World"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://mithaipune.com/product/${product._id}`,
        "priceCurrency": "INR",
        "price": selectedVariant?.sellingPrice || product.basePrice,
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
  }, [product, selectedVariant]);

  // ... (rest of the effects and logic)

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center bg-[var(--cream)] animate-pulse serif text-2xl font-medium">Loading Mithai...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center bg-[var(--cream)] serif text-2xl font-medium">Sweet not found.</div>;

  return (
    <div className="page-enter bg-[var(--cream)] min-h-[60vh] pb-20">
      <SEO 
        title={product.name}
        description={product.description?.substring(0, 160) || `Buy premium ${product.name} online at Mithai World. Traditional Indian sweets delivered fresh in Pune.`}
        canonical={`/product/${product._id}`}
        ogImage={product.images?.[0] || product.image}
        ogType="product"
        schemaData={schemaData}
      />
      <SectionContainer>
        {/* ── BREADCRUMB ── */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted)] mb-8 hover:text-[var(--burgundy)] transition-colors">
          <ChevronLeft size={16} /> Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* ── IMAGES ── */}
          <div className="lg:col-span-6 space-y-6">
            <div className="aspect-[4/5] md:aspect-video lg:aspect-square rounded-3xl overflow-hidden bg-white border border-[var(--surface-border)] shadow-xl group">
              <img src={product.images[activeImage]} alt="" className={`w-full h-full object-cover transition-transform duration-700 ${isOutOfStock ? 'opacity-60' : 'group-hover:scale-105'}`} />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0
                      ${activeImage === i ? 'border-[var(--burgundy)] shadow-lg scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── CONTENT ── */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="section-title mb-6">
              <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--gold)] uppercase tracking-[0.2em] mb-4">
                <Star size={12} fill="currentColor" /> {categoryName}
              </div>
              <h1 className={`serif text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight font-medium ${isOutOfStock ? 'text-[var(--muted)]' : ''}`}>{product.name}</h1>
              <div className="flex items-baseline gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-3xl font-bold ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)]'}`}>
                    {formatCurrency(currentPrice)}
                  </span>
                  {!isOutOfStock && currentMrp > currentPrice && (
                    <span className="text-lg font-medium text-[var(--muted)] line-through opacity-60 decoration-[var(--muted)]">
                      {formatCurrency(currentMrp)}
                    </span>
                  )}
                  {!isOutOfStock && selectedVariant?.discountPercent > 0 && (
                    <span className="bg-[#f2994a] text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                      {selectedVariant.discountPercent}% OFF
                    </span>
                  )}
                  {selectedVariant && (
                    <span className="text-sm font-medium text-[var(--muted)] align-middle uppercase tracking-widest ml-1">
                      / {selectedVariant.label}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--muted)] italic font-medium">{TAX_MESSAGE}</span>
                </div>
              </div>
            </div>

            <p className="text-[var(--muted)] leading-relaxed mb-10 text-sm md:text-base font-medium">
              {product.description || "A masterfully crafted Indian sweet made with traditional techniques and the highest quality ingredients. Perfect for celebrations or daily cravings."}
            </p>

            {/* VARIANTS */}
            {availableVariants.length > 1 && (
              <div className="mb-10">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-4">Select Quantity / Size</h4>
                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((v, i) => {
                    const vOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={i}
                        disabled={vOutOfStock}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-5 py-3 rounded-xl text-xs font-medium transition-all border
                          ${selectedVariant?._id === v._id 
                            ? 'bg-[var(--burgundy)] border-[var(--burgundy)] text-white shadow-xl scale-105' 
                            : vOutOfStock
                              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                              : 'bg-white border-[var(--surface-border)] text-[var(--charcoal)] hover:border-[var(--gold)]'}`}
                      >
                        {v.label} — {formatCurrency(v.sellingPrice)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY & ADD */}
            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-[var(--surface-border)] rounded-2xl bg-white overflow-hidden h-14 px-2 shadow-inner">
                  <button disabled={isOutOfStock} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[var(--cream)] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Minus size={18} /></button>
                  <span className={`w-12 text-center text-lg font-medium ${isOutOfStock ? 'text-[var(--muted)]' : 'text-[var(--charcoal)]'}`}>{quantity}</span>
                  <button disabled={isOutOfStock} onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-[var(--cream)] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={18} /></button>
                </div>
                
                <button 
                  disabled={isOutOfStock || quantity > currentStock}
                  onClick={handleAddToCart}
                  className="flex-1 btn-primary h-14 rounded-2xl shadow-2xl disabled:grayscale disabled:opacity-50"
                >
                  <span className="font-medium">{isOutOfStock ? "Sold Out" : "Add to Shopping Bag"}</span> <ShoppingBag size={20} className="ml-2" />
                </button>
              </div>

              {/* STOCK STATUS */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-600' : 'text-[var(--muted)]'}`}>
                  {isOutOfStock ? 'Currently Sold Out' : isLowStock ? `Only ${currentStock} left in stock` : `${currentStock} packs left in stock`}
                </span>
              </div>
            </div>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-[var(--surface-border)]">
              {[
                { icon: ShieldCheck, label: "Pure & Fresh" },
                { icon: Truck, label: "Express Delivery" },
                { icon: RefreshCw, label: "Easy Returns" }
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-[var(--surface-strong)] flex items-center justify-center text-[var(--burgundy)] shadow-sm">
                    <b.icon size={18} />
                  </div>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted)]">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIMILAR PRODUCTS */}
        <div className="mt-16 pt-8 border-t border-[var(--surface-border)]">
          <SimilarProducts titleCategory={categoryName} products={similarProducts} />
        </div>
      </SectionContainer>
    </div>
  );
}

export default ProductDetailPage;
