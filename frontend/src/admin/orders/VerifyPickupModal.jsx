import { useState } from "react";
import { X, CheckCircle2, ShieldCheck } from "lucide-react";

const VerifyPickupModal = ({ open, onClose, onSubmit, order }) => {
  const [otp, setOtp] = useState("");

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    if (otp.length === 4) {
      onSubmit(otp);
      setOtp("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e6d3b3] bg-[#fffaf3] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e6d3b3] px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#b67b3a]">Verify Pickup</div>
            <div className="text-base font-medium text-[#2d1b0e]">#{order?.orderNumber || order?.orderId}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#7a5c3a] hover:bg-[#f5e6d3] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Ask the delivery partner for the 4-digit pickup OTP to verify their identity before handing over the package.
            </p>
          </div>

          {order?.rider?.name && (
            <div className="mb-4 p-3 rounded-lg border border-[#e6d3b3] bg-white text-xs space-y-1">
              <p className="font-medium text-[#2d1b0e]">Assigned Rider:</p>
              <p className="text-[#6d4c41]">{order.rider.name}</p>
              <p className="text-[#6d4c41]">{order.rider.phone}</p>
            </div>
          )}

          <label className="text-xs font-medium text-[#6d4c41]">Enter 4-Digit OTP</label>
          <div className="mt-2">
            <input
              type="text"
              maxLength="4"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setOtp(val);
              }}
              className="w-full rounded-lg border border-[#e6d3b3] bg-white px-3 py-3 text-center text-lg tracking-widest font-bold text-[#2d1b0e] placeholder-[#e6d3b3] focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
              placeholder="••••"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e6d3b3] px-4 py-2 text-xs font-medium text-[#7a5c3a] hover:bg-[#f5e6d3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={otp.length !== 4}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={14} />
              Verify & Handover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPickupModal;
