import { Truck, MapPin, X } from "lucide-react";
import { useState } from "react";
import { MAX_DELIVERY_RADIUS_KM } from "../utils/delivery";

// ── Inline notice (Hero / Checkout) ──────────────────────────────────────────
export const DeliveryNotice = ({ className = "" }) => (
  <div className={`flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 ${className}`}>
    <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-blue-800">
        Delivery within {MAX_DELIVERY_RADIUS_KM} KM only
      </p>
      <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
        We currently deliver within a {MAX_DELIVERY_RADIUS_KM} KM radius of our store in Akurdi, Pune.
        Orders outside this range cannot be processed.
      </p>
    </div>
  </div>
);

// ── Top Banner (dismissible) — for all pages ─────────────────────────────────
export const DeliveryBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("delivery-banner-dismissed") === "1"; }
    catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("delivery-banner-dismissed", "1"); } catch {}
  };

  return (
    <div className="bg-blue-600 text-white relative z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          🚚 Delivery Available Only Within {MAX_DELIVERY_RADIUS_KM} KM Radius of Our Store (Akurdi, Pune)
        </span>
        <button
          onClick={dismiss}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-blue-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DeliveryNotice;
