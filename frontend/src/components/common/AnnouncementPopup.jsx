import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { X, Clock, MapPin, Sparkles } from "lucide-react";

const POPUP_STORAGE_KEY = "mithaiworld_login_popup_shown";

const AnnouncementPopup = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only for authenticated customers (not admin) 
    // and if the popup hasn't been shown in this login session
    if (isAuthenticated && !isAdmin) {
      const isShown = localStorage.getItem(POPUP_STORAGE_KEY);
      if (isShown === "true") {
        setIsOpen(true);
      }
    }
  }, [isAuthenticated, isAdmin]);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as shown so it doesn't appear on every refresh
    // The key is set to 'false' or removed to indicate it shouldn't show again
    // until the next login clears/resets it.
    localStorage.setItem(POPUP_STORAGE_KEY, "done");
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-[#2d1b0e]/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Popup Content */}
      <div className="relative w-full max-w-[500px] md:max-w-[550px] bg-white rounded-[32px] border border-[rgba(212,160,23,0.18)] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Design Element: Top Gold Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[var(--gold)] via-[var(--saffron)] to-[var(--gold)]" />

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--cream)] text-[var(--muted)] transition-colors group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="p-8 sm:p-10">
          {/* Icon & Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[var(--cream)] rounded-2xl flex items-center justify-center mb-6 text-[var(--gold)] shadow-inner">
              <Clock size={32} />
            </div>
            <h2 className="serif text-2xl sm:text-3xl font-medium text-[var(--charcoal)] mb-2">
              🕒 Welcome to Mithai World
            </h2>
            <div className="w-12 h-1 bg-[var(--saffron)] rounded-full opacity-30" />
          </div>

          {/* Message Body */}
          <div className="space-y-6">
            <div className="bg-[var(--cream)]/50 border border-[rgba(212,160,23,0.1)] p-6 rounded-2xl">
              <p className="text-[15px] sm:text-base leading-relaxed text-[var(--charcoal)] font-medium text-center">
                We are currently accepting orders between <span className="text-[var(--burgundy)] font-bold">8:30 AM</span> and <span className="text-[var(--burgundy)] font-bold">10:30 PM</span>.
              </p>
              <p className="text-[13px] sm:text-sm text-[var(--muted)] mt-3 text-center italic">
                Orders placed after closing hours may be processed the next business day.
              </p>
            </div>

            <div className="flex gap-4 items-start bg-white p-4 rounded-xl border border-[var(--surface-border)]">
              <div className="mt-1 bg-[var(--gold)]/10 p-2 rounded-lg text-[var(--gold)] shrink-0">
                <Sparkles size={18} />
              </div>
              <p className="text-[13px] sm:text-sm text-[var(--muted)] leading-relaxed">
                <span className="font-bold text-[var(--charcoal)]">📍 Freshness Guaranteed:</span> Our sweets are prepared daily using premium ingredients and traditional desi ghee for that authentic home-style taste.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-10">
            <button
              onClick={handleClose}
              className="w-full h-14 bg-[var(--burgundy)] hover:bg-[#721835] text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Design Element: Decorative Corner Pattern */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--gold)]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-[var(--burgundy)]/5 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>,
    document.body
  );
};

export default AnnouncementPopup;
