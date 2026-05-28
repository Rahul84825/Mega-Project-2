import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X, Truck, Loader2 } from "lucide-react";

const VerifyPickupModal = ({ open, order, onClose, onSubmit }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 4) {
      setError("Please enter the 4-digit OTP provided by the rider.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(otp);
      setOtp("");
    } catch (err) {
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d1b0e]/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#e6d3b3]/50 bg-[#fffaf3] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="serif text-lg font-bold text-[#2d1b0e]">Verify Handover</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#b67b3a] font-bold">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#7a5c3a] hover:bg-[#e6d3b3] p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-[#2d1b0e]">
              Ask the delivery partner for the 4-digit pickup code.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-4xl tracking-[0.5em] font-black text-[#2d1b0e] py-4 rounded-2xl border-2 border-[#e6d3b3] bg-[#fffaf3] focus:border-[#8b4513] outline-none transition-colors"
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-xs font-bold text-rose-500 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 4}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg active:scale-95"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Truck size={20} />}
            Confirm Handover
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default VerifyPickupModal;
