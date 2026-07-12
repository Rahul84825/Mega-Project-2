import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Trash2, Edit3 } from "lucide-react";

const REJECT_REASONS = [
  { label: "Out of Stock", value: "Out of Stock" },
  { label: "Shop Busy / Overflow", value: "Shop Busy" },
  { label: "Delivery Zone Unavailable", value: "Delivery Unavailable" },
  { label: "Quality Standards Control", value: "Quality Issue" },
  { label: "Kitchen Time Constraint", value: "Cannot Prepare in Time" }
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[#2d1b0e]/65 backdrop-blur-sm px-0 sm:px-4 transition-all duration-300">
      
      {/* Modal Container: Slide up drawer on mobile, centered modal on desktop */}
      <div className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] border-t sm:border border-[#e6d3b3]/80 bg-[#fffaf3] shadow-[0_24px_50px_-12px_rgba(45,27,14,0.4)] overflow-hidden transform transition-all animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6d3b3]/40 px-6 sm:px-8 py-5 bg-[var(--cream)]/40 shrink-0">
          <div className="space-y-0.5">
            <div className="text-[9px] uppercase tracking-[0.3em] text-[#b67b3a] font-bold">Cancellation protocol</div>
            <h3 className="text-base sm:text-lg serif font-extrabold text-[#2d1b0e]">Order #{order?.orderNumber || order?.orderId}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2.5 text-[#7a5c3a] hover:bg-[#f5e6d3]/60 hover:text-[#2d1b0e] transition-all border border-[#e6d3b3]/30 bg-white/50 cursor-pointer"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Warning Section: Elegant soft red, important but premium */}
          <div className="flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50/60 p-4 sm:p-5 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-red-100/80 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle className="h-5 w-5 stroke-[2.5px]" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-[10px] font-black text-red-900 uppercase tracking-wider">Order Cancellation</h4>
              <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                Cancelling this order will immediately notify the customer and trigger an automatic refund. This action is <span className="font-bold underline">permanent</span> and cannot be undone.
              </p>
            </div>
          </div>

          {/* Radio Selection: Spacious luxury styled cards */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a5c3a] ml-1 block">Select Reason</label>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.value;
                return (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => {
                      setSelectedReason(isSelected ? "" : reason.value);
                      setCustomReason("");
                    }}
                    className={`w-full h-14 px-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 text-left cursor-pointer ${
                      isSelected
                        ? "border-red-500 bg-red-50/40 text-red-950 shadow-sm"
                        : "border-[#e6d3b3]/50 bg-white text-[#6d4c41] hover:border-red-300/60 hover:bg-red-50/10"
                    }`}
                  >
                    {/* Custom Radio Circle */}
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isSelected ? "border-red-500 bg-red-500" : "border-[#e6d3b3] bg-white"
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-xs uppercase tracking-wider ${isSelected ? "font-extrabold text-red-950" : "font-bold text-[#6d4c41]"}`}>
                      {reason.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a5c3a] ml-1 block">Or specify custom reason</label>
            <div className="relative group">
              <div className="absolute left-4 top-4 text-[#d4a373] group-focus-within:text-red-500 transition-colors">
                <Edit3 size={16} className="stroke-[2.5px]" />
              </div>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value.trim()) setSelectedReason("");
                }}
                className="w-full rounded-2xl border-2 border-[#e6d3b3]/80 bg-white pl-11 pr-4 py-4 text-xs font-bold text-[#2d1b0e] placeholder-[#d4a373]/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none transition-all resize-none shadow-inner leading-relaxed"
                placeholder="Type a specific or custom cancellation reason here..."
              />
            </div>
          </div>

        </div>

        {/* Footer Actions with micro-animations */}
        <div className="p-5 sm:p-6 border-t border-[#e6d3b3]/40 bg-[var(--cream)]/30 shrink-0 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onClose} 
            className="w-full sm:flex-1 h-13 rounded-2xl border border-[#e6d3b3] text-xs font-bold uppercase tracking-widest text-[#7a5c3a] bg-white hover:bg-[#f5e6d3]/40 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasReason}
            className={`w-full sm:flex-[1.5] h-13 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest transition-all duration-200 shadow-lg active:scale-[0.97] cursor-pointer ${
              hasReason 
                ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:shadow-[0_12px_20px_-4px_rgba(239,68,68,0.35)] shadow-red-500/20" 
                : "bg-[#e6d3b3]/50 text-[#7a5c3a]/70 cursor-not-allowed border border-transparent shadow-none"
            }`}
          >
            <Trash2 size={16} className="stroke-[2.5px]" />
            <span>Confirm Cancel</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default RejectReasonModal;
