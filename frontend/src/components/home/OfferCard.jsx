import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/priceCalculator";
import { ArrowRight } from "lucide-react";

const OfferCard = ({ offer }) => {
  const navigate = useNavigate();

  if (!offer) return null;

  const handleClick = () => {
    if (offer.linked_product_id) navigate(`/product/${offer.linked_product_id}`);
    else if (offer.linked_category_id) navigate(`/sweets?category=${offer.linked_category_id}`);
    else navigate("/sweets");
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 border border-[var(--surface-border)]"
    >
      <div className="absolute inset-0 bg-[var(--charcoal)] transition-transform duration-700 group-hover:scale-110">
        {offer.image ? (
          <img src={offer.image} alt={offer.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/20 to-[var(--burgundy)]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="inline-block self-start px-2 py-0.5 bg-[var(--saffron)] text-white text-[10px] font-medium rounded-lg mb-3 shadow-lg">
          {offer.discountPercent}% OFF
        </div>
        <h3 className="text-white serif text-xl md:text-2xl font-medium mb-2 drop-shadow-md leading-tight">{offer.title}</h3>
        <p className="text-white/70 text-xs line-clamp-2 mb-4 font-medium">{offer.description}</p>
        
        <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--saffron)] opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          Explore Offer <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
