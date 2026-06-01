import React, { useState, useEffect } from 'react';
import { Sparkles, Bell, MapPin, X } from 'lucide-react';

const PromoItem = ({ icon, text }) => (
  <div className="flex items-center gap-2 whitespace-nowrap">
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
      {text}
    </span>
  </div>
);

const PromotionBar = () => {
  const [showPromo, setShowPromo] = useState(() => {
    const saved = localStorage.getItem("promo_dismissed_at");
    if (!saved) return true;
    
    const dismissedAt = parseInt(saved, 10);
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (now - dismissedAt > sevenDaysInMs) {
      localStorage.removeItem("promo_dismissed_at");
      return true;
    }
    return false;
  });

  const dismissPromo = () => {
    setShowPromo(false);
    localStorage.setItem("promo_dismissed_at", Date.now().toString());
  };

  if (!showPromo) return null;

  return (
    <div className="relative z-[110] flex min-h-[38px] items-center overflow-hidden
                    bg-[var(--burgundy)] px-4 py-2 group/promo">

      <div className="flex w-full overflow-hidden">
        <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
          <PromoItem icon={<Sparkles size={11} className="text-[var(--gold)] animate-pulse" />}
                     text="10% Off on First Order! Use Code: WELCOME10" />
          <PromoItem icon={<Bell size={11} className="text-[var(--gold)] animate-bounce" />}
                     text="Eat Less, Eat Best — Premium Sweets for Health-Conscious Foodies!" />
          <PromoItem icon={<MapPin size={11} className="text-[var(--gold)]" />}
                     text="Prepared in Premium Desi Ghee" />
        </div>

        <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10"
             aria-hidden="true">
          <PromoItem icon={<Sparkles size={11} className="text-[var(--gold)] animate-pulse" />}
                     text="10% Off on First Order! Use Code: WELCOME10" />
          <PromoItem icon={<Bell size={11} className="text-[var(--gold)] animate-bounce" />}
                     text="Eat Less, Eat Best — Premium Sweets for Health-Conscious Foodies!" />
          <PromoItem icon={<MapPin size={11} className="text-[var(--gold)]" />}
                     text="Prepared in Premium Desi Ghee" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-20
                      bg-gradient-to-l from-[var(--burgundy)] to-transparent" />

      <button
        onClick={dismissPromo}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-lg p-1.5
                   text-white/70 transition-all duration-200
                   hover:bg-white/15 hover:text-white active:scale-90"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default PromotionBar;
