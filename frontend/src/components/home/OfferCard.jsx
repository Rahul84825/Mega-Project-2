import { useNavigate } from "react-router-dom";

const OfferCard = ({ offer }) => {
  const navigate = useNavigate();

  if (!offer) return null;

  const getNavigationPath = () => {
    if (offer?.linked_category_id || offer?.targetCategory) {
      return `/products?category=${encodeURIComponent(offer.linked_category_id || offer.targetCategory)}`;
    }
    if (offer?.linked_product_id || offer?.targetProduct) {
      return `/product/${encodeURIComponent(
        typeof (offer.linked_product_id || offer.targetProduct) === "object"
          ? (offer.linked_product_id || offer.targetProduct)?._id || (offer.linked_product_id || offer.targetProduct)?.id
          : (offer.linked_product_id || offer.targetProduct)
      )}`;
    }
    return null;
  };

  const navigationPath  = getNavigationPath();
  const isClickable     = Boolean(navigationPath);
  const discountValue   = Math.round(offer.discount_percentage || offer.discountPercent || 0);

  const handleClick = () => {
    if (!navigationPath) return;
    navigate(navigationPath);
  };

  return (
    <div className="w-full max-w-[340px]">
      <div
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === "Enter" || e.key === " ")) handleClick();
        }}
        className={`group relative w-[250px] overflow-hidden rounded-2xl
                    transition-all duration-300 ease-out
                    ${isClickable
                      ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(29,18,13,0.28)] focus:outline-none focus:ring-2 focus:ring-[#e8a852] focus:ring-offset-2"
                      : "cursor-default opacity-70"
                    }`}
      >
        {/* ── Image / fallback area ── */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#1d120d]">

          {offer.image ? (
            <img
              src={offer.image}
              alt={offer.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out
                         group-hover:scale-[1.07]"
            />
          ) : (
            /* Fallback — no image */
            <div className="flex h-full w-full items-center justify-center bg-[#1d120d] px-6 text-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#d4a017]">
                  Mithai World
                </p>
                <h3 className="mt-3 text-xl font-bold leading-tight text-white">
                  {offer.title}
                </h3>
                {offer.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                    {offer.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Gradient overlay ── */}
          <div className="pointer-events-none absolute inset-0
                          bg-gradient-to-t from-[rgba(11,8,6,0.82)] via-[rgba(11,8,6,0.30)] to-[rgba(11,8,6,0.08)]
                          transition-all duration-300
                          group-hover:from-[rgba(11,8,6,0.88)] group-hover:via-[rgba(11,8,6,0.25)]" />

          {/* ── Top badges ── */}
          <div className="absolute left-3.5 right-3.5 top-3.5 z-20 flex items-start justify-between gap-2">

            {/* Featured label */}
            <span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-semibold
                             uppercase tracking-[0.20em] text-white backdrop-blur-md
                             border border-white/10">
              Featured
            </span>

            {/* Discount badge */}
            {discountValue > 0 && (
              <span className="rounded-full bg-[#d4a017] px-3 py-1 text-[11px] font-bold
                               text-[#1d120d] shadow-[0_2px_10px_rgba(212,160,23,0.45)]
                               tracking-wide">
                {discountValue}% OFF
              </span>
            )}
          </div>

          {/* ── Bottom content ── */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-4">

            {/* Title */}
            <h3 className="line-clamp-2 text-[17px] font-bold leading-[1.3] text-white
                           drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              {offer.title}
            </h3>

            {/* Description */}
            {offer.description && (
              <p className="mt-1.5 line-clamp-2 text-[12px] font-normal leading-relaxed
                            text-white/75 drop-shadow-sm">
                {offer.description}
              </p>
            )}

            {/* CTA */}
            {isClickable && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em]
                                 text-[#e8a852] transition-all duration-200
                                 group-hover:text-white group-hover:tracking-[0.30em]">
                  Explore Offer
                </span>
                <span className="text-[#e8a852] transition-all duration-200
                                 group-hover:text-white group-hover:translate-x-0.5
                                 inline-block">
                  →
                </span>
              </div>
            )}
          </div>

          {/* ── Edge glow on hover ── */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0
                          ring-1 ring-inset ring-white/10
                          transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};

export default OfferCard;