import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * StoreMap Component
 * Reusable Google Maps embed for Mithai World
 * Responsive, optimized, with loading states
 */
const StoreMap = ({
  size = "medium", // small | medium | large
  showTitle = false,
  loading = false,
  className = "",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("store-map-container");
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  // Responsive dimensions
  const sizeConfig = {
    small: {
      container: "h-64 sm:h-72",
      iframe: "width='100%' height='256'",
    },
    medium: {
      container: "h-80 sm:h-96",
      iframe: "width='100%' height='320'",
    },
    large: {
      container: "h-96 sm:h-[480px]",
      iframe: "width='100%' height='384'",
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      id="store-map-container"
      className={`${config.container} relative overflow-hidden rounded-2xl shadow-lg ${className}`}
    >
      {/* ── Loading skeleton ── */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#fffaf3] to-[#f5ebe0] animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#b76a1f] animate-spin" />
            <p className="text-sm font-medium text-[#6e5443]">Loading map...</p>
          </div>
        </div>
      )}

      {/* ── Title ── */}
      {showTitle && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
          <h3 className="text-white font-medium text-lg">Mithai World Location</h3>
        </div>
      )}

      {/* ── Google Maps Iframe ── */}
      {isVisible && (
        <iframe
          title="Mithai World Store Location on Google Maps"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d945.5354421541357!2d73.91303300857543!3d18.567646224382504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c19242795771%3A0xf9fafc63a239e3b!2sMithai%20World!5e0!3m2!1sen!2sin!4v1779456306986!5m2!1sen!2sin"
          {...Object.fromEntries(
            config.iframe.split(" ").map((attr) => {
              const [key, value] = attr.split("=");
              return [key, value.replace(/'/g, "")];
            })
          )}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full transition-opacity duration-300"
          onLoad={handleIframeLoad}
        />
      )}

      {/* ── Overlay gradient for premium feel ── */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-inner shadow-[rgba(0,0,0,0.1)]" />
    </div>
  );
};

export default StoreMap;
