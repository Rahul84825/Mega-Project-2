import { useEffect, useState } from "react";
import brandLogo from "../assets/logo.png";

/**
 * SplashScreen Component
 * Renders a premium, branded Mithai World entry screen.
 * Displays for 1.5 seconds before fading out and allowing the main app to show.
 * Fits perfectly on Android phones and tablets, and works in both light and dark modes.
 */
function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Phase 1: Fade In immediately on mount (0ms to 500ms)
    const fadeInTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Phase 2 & 3: Stay for 700ms, then start Fade Out (at 1200ms)
    const fadeOutTimeout = setTimeout(() => {
      setIsFadingOut(true);
    }, 1200);

    // Phase 4: Complete and unmount (at 1500ms)
    const completeTimeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(fadeOutTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        backgroundColor: "#FFF3E0",
        transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center ${
        isVisible && !isFadingOut ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Decorative background elements for premium feel */}
      <div className="absolute inset-0 pattern-bg opacity-40 pointer-events-none" />
      
      <div
        style={{
          transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease-out",
        }}
        className={`relative flex flex-col items-center text-center px-6 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Logo Container */}
        <div className="relative mb-6 transform hover:scale-105 transition-transform duration-500">
          {/* Subtle gold glow behind the logo */}
          <div className="absolute inset-0 bg-[#d4a017]/10 rounded-full blur-2xl transform scale-125" />
          <img
            src={brandLogo}
            alt="Mithai World Logo"
            className="relative h-28 w-28 sm:h-36 sm:w-36 object-contain"
          />
        </div>

        {/* Text */}
        <h1 className="serif text-3xl sm:text-4xl font-black tracking-tighter text-[#8B1E3F] leading-none mb-3">
          Mithai World
        </h1>

        {/* Subtext */}
        <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#d4a017]">
          Premium Sweets & Namkeen
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;
