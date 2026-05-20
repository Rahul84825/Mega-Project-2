import { useState } from "react";
import { X, AlertCircle, Trash2, Edit3 } from "lucide-react";

const REJECT_REASONS = [
  { label: "Out of Stock", value: "Out of Stock" },
  { label: "Shop Busy", value: "Shop Busy" },
  { label: "Delivery Unavailable", value: "Delivery Unavailable" },
  { label: "Quality Issue", value: "Quality Issue" },
  { label: "Cannot Prepare in Time", value: "Cannot Prepare in Time" }
];

const RejectReasonModal = ({ open, onClose, onSubmit, order }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    const reason = customReason.trim() || selectedReason;
    if (!reason) return;
    onSubmit(reason);
    setSelectedReason("");
    setCustomReason("");
  };

  const hasReason = customReason.trim() || selectedReason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-4 transition-all duration-300">
      <div className="w-full max-w-md rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6d3b3]/50 px-8 py-6 bg-[var(--cream)]/30">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#b67b3a] font-bold mb-1">Cancellation Protocol</div>
            <div className="text-xl serif font-medium text-[#2d1b0e]">#{order?.orderNumber || order?.orderId}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#7a5c3a] hover:bg-[#f5e6d3] hover:text-[#2d1b0e] transition-all border border-transparent hover:border-[#e6d3b3]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 py-8">
          {/* Info Card */}
          <div className="mb-8 flex items-start gap-4 rounded-[24px] border border-rose-100 bg-rose-50/50 p-5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              The customer will be notified of this <span className="font-bold underline">Cancellation</span> immediately. This action cannot be reversed.
            </p>
          </div>

          {/* Reasons */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#6d4c41] ml-1">Select Reason</label>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => {
                    setSelectedReason(selectedReason === reason.value ? "" : reason.value);
                    setCustomReason("");
                  }}
                  className={`w-full h-12 px-5 rounded-2xl border-2 transition-all flex items-center text-left text-xs font-bold ${
                    selectedReason === reason.value
                      ? "border-rose-600 bg-rose-50 text-rose-700 shadow-sm ring-4 ring-rose-600/5"
                      : "border-[#e6d3b3] bg-white text-[#6d4c41] hover:border-rose-300"
                  }`}
                >
                  {reason.label}
                  {selectedReason === reason.value && <div className="ml-auto w-2 h-2 rounded-full bg-rose-600 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div className="mt-8 space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#6d4c41] ml-1">Or add custom reason</label>
            <div className="relative group">
              <div className="absolute left-4 top-4 text-[#d4a373] group-focus-within:text-[#8b4513] transition-colors">
                <Edit3 size={20} />
              </div>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value.trim()) setSelectedReason("");
                }}
                className="w-full rounded-2xl border-2 border-[#e6d3b3] bg-white pl-12 pr-4 py-4 text-sm font-bold text-[#2d1b0e] placeholder-[#e6d3b3] focus:border-[#8b4513] focus:ring-4 focus:ring-[#8b4513]/5 outline-none transition-all resize-none"
                placeholder="Type specific reason here..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex items-center gap-4">
            <button onClick={onClose} className="flex-1 h-14 rounded-2xl border border-[#e6d3b3] text-sm font-bold text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasReason}
              className={`flex-[2] h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                hasReason 
                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20" 
                  : "bg-[#e6d3b3] text-[#7a5c3a] cursor-not-allowed"
              }`}
            >
              <Trash2 size={20} />
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
