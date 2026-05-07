import { Link } from "react-router-dom";

const OfferCard = ({ offer }) => {
  if (!offer) return null;

  // Determine navigation target
  const getNavigationPath = () => {
    if (offer.linked_category_id || offer.targetCategory) {
      const categorySlug = offer.linked_category_id || offer.targetCategory;
      return `/products?category=${encodeURIComponent(categorySlug)}`;
    }
    if (offer.linked_product_id || offer.targetProduct) {
      const productId = typeof offer.linked_product_id === "object" 
        ? offer.linked_product_id._id || offer.linked_product_id.id
        : offer.linked_product_id;
      return `/product/${encodeURIComponent(productId)}`;
    }
    return null;
  };

  const navigationPath = getNavigationPath();
  const isClickable = !!navigationPath;

  const discountValue = Math.round(offer.discount_percentage || offer.discountPercent || 0);

  // Content JSX shared between Link and div
  const cardContent = (
    <>
      {/* Background Image Container */}
      {offer.image ? (
        <div className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden bg-[#f5e1c8]">
          <img
            src={offer.image}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Premium Overlay */}
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-all duration-300 pointer-events-none" />
        </div>
      ) : (
        <div className="relative w-full h-40 sm:h-48 md:h-56 bg-gradient-to-br from-[#f5e6d3] via-[#ede0ce] to-[#e5d8c4] group-hover:from-[#ede0ce] group-hover:to-[#dccfb9] transition-all duration-300 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-all pointer-events-none" />
          <div className="relative text-center">
            <div className="text-6xl opacity-30">◆</div>
          </div>
        </div>
      )}

      {/* Premium Discount Badge */}
      {discountValue > 0 && (
        <div className="absolute top-4 right-4 flex items-center justify-center px-3 py-1.5 rounded-full bg-orange-500/95 backdrop-blur-sm shadow-md z-10 pointer-events-none">
          <div className="text-center">
            <span className="text-sm font-bold text-white">
              {discountValue}% OFF
            </span>
          </div>
        </div>
      )}

      {/* Content Overlay - Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="text-center px-4">
          <h3 className="text-white font-bold text-lg md:text-xl lg:text-2xl drop-shadow-lg line-clamp-2 mb-2">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-white/85 text-xs md:text-sm drop-shadow font-medium line-clamp-1 mb-3">
              {offer.description}
            </p>
          )}
          {isClickable && (
            <p className="text-white/90 text-xs md:text-sm mt-2 drop-shadow font-medium tracking-wide group-hover:text-white transition-colors">
              Explore →
            </p>
          )}
        </div>
      </div>
    </>
  );

  // If clickable, render as Link
  if (isClickable) {
    return (
      <Link
        to={navigationPath}
        className="group relative block overflow-hidden rounded-3xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#e8a852] focus:ring-offset-2 w-full max-w-[340px] cursor-pointer hover:shadow-2xl hover:-translate-y-1"
      >
        {cardContent}
      </Link>
    );
  }

  // If not clickable, render as div
  return (
    <div
      className="group relative overflow-hidden rounded-3xl transition-all duration-300 w-full max-w-[340px] opacity-60"
    >
      {cardContent}
    </div>
  );
};

export default OfferCard;