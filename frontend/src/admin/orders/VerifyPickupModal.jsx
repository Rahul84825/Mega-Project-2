import { useState, useRef } from "react";
import { X, CheckCircle2, ShieldCheck, Truck, Phone } from "lucide-react";

const VerifyPickupModal = ({ open, onClose, onSubmit, order }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  if (!open) return null;

  const handleChange = (index, value) => {
    // Only allow numbers
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue && value !== "") return;
    
    const newOtp = [...otp];
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (cleanValue && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = () => {
    const otpValue = otp.join("");
    if (otpValue.length === 4) {
      onSubmit(otpValue);
      setOtp(["", "", "", ""]);
    }
  };

  const isComplete = otp.join("").length === 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-4 transition-all duration-300">
      <div className="w-full max-w-md rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6d3b3]/50 px-8 py-6 bg-[var(--cream)]/30">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#b67b3a] font-bold mb-1">Logistics Verification</div>
            <div className="text-xl serif font-medium text-[#2d1b0e]">#{order?.orderNumber || order?.orderId}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#7a5c3a] hover:bg-[#f5e6d3] hover:text-[#2d1b0e] transition-all border border-transparent hover:border-[#e6d3b3]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 py-8">
          {/* Info Card */}
          <div className="mb-8 flex items-start gap-4 rounded-[24px] border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Verify the delivery partner's identity by entering the <span className="font-bold underline">4-digit pickup OTP</span> before handing over the package.
            </p>
          </div>

          {/* Rider Info */}
          {order?.rider?.name && (
            <div className="mb-8 p-6 rounded-[24px] border border-[#e6d3b3] bg-white shadow-sm flex items-center justify-between group hover:border-[#d4a373] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#f5e6d3] flex items-center justify-center text-[#8b4513] group-hover:scale-110 transition-transform">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a] mb-0.5">Assigned Rider</p>
                  <p className="text-sm font-bold text-[#2d1b0e]">{order.rider.name}</p>
                  <p className="text-[11px] font-medium text-[#7a5c3a] flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="text-[#d4a373]" /> {order.rider.phone}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-[#e6d3b3]/50 mx-2" />
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">Expected OTP</p>
                <p className="text-lg font-black text-[#2d1b0e] tracking-[0.2em]">{order.delivery?.pickupOtp || "----"}</p>
              </div>
            </div>
          )}

          {/* OTP Inputs */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#6d4c41] ml-1">Enter Pickup OTP</label>
            <div className="flex justify-between gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-16 h-20 rounded-2xl border-2 border-[#e6d3b3] bg-white text-center text-2xl font-black text-[#2d1b0e] shadow-sm transition-all focus:border-[#8b4513] focus:ring-4 focus:ring-[#8b4513]/5 outline-none placeholder-[#e6d3b3]"
                  placeholder="•"
                />
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex items-center gap-4">
            <button onClick={onClose} className="flex-1 h-14 rounded-2xl border border-[#e6d3b3] text-sm font-bold text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isComplete}
              className={`flex-[2] h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isComplete 
                  ? "bg-[#8b4513] text-white hover:bg-[#2d1b0e] shadow-[#8b4513]/20" 
                  : "bg-[#e6d3b3] text-[#7a5c3a] cursor-not-allowed"
              }`}
            >
              <CheckCircle2 size={20} />
              Verify & Handover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPickupModal;
