import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, CheckCircle2, Timer } from "lucide-react";

const PREP_TIME_OPTIONS = [
  { label: "15 Mins", value: 15 },
  { label: "30 Mins", value: 30 },
  { label: "45 Mins", value: 45 },
  { label: "1 Hour", value: 60 },
  { label: "1.5 Hours", value: 90 },
  { label: "2 Hours", value: 120 }
];

const AcceptOrderModal = ({ open, onClose, onSubmit, order }) => {
  const [selectedTime, setSelectedTime] = useState(45);
  const [customTime, setCustomTime] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    const eta = customTime ? parseInt(customTime, 10) : selectedTime;
    if (isNaN(eta) || eta <= 0) return;
    // provider selection removed, backend now hardcoded to borzo
    onSubmit(eta);
    setCustomTime("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-2 sm:px-4 transition-all duration-300">
      <div className="w-full max-w-[95vw] sm:max-w-md rounded-[24px] sm:rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6d3b3]/50 px-5 sm:px-8 py-4 sm:py-6 bg-[var(--cream)]/30">
          <div>
            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.4em] text-[#b67b3a] font-bold mb-1">Kitchen Preparation</div>
            <div className="text-base sm:text-xl serif font-medium text-[#2d1b0e]">#{order?.orderNumber || order?.orderId}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#7a5c3a] hover:bg-[#f5e6d3] hover:text-[#2d1b0e] transition-all border border-transparent hover:border-[#e6d3b3]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 sm:px-8 py-4 sm:py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Info Card */}
          <div className="mb-6 flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-800 leading-relaxed font-medium">
              Select estimated preparation time. Order will be assigned to <span className="font-bold underline text-blue-700">Borzo</span>.
            </p>
          </div>

          {/* Prep Options */}
          <div className="space-y-4">
            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6d4c41] ml-1">Preparation Time</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {PREP_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedTime(option.value);
                    setCustomTime("");
                  }}
                  className={`h-14 sm:h-16 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedTime === option.value && !customTime
                      ? "border-[#8b4513] bg-[#fff0e0] text-[#2d1b0e] shadow-md ring-4 ring-[#8b4513]/5"
                      : "border-[#e6d3b3] bg-white text-[#6d4c41] hover:border-[#d4a373]"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black">{option.value}</span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter opacity-60">Mins</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="mt-6 sm:mt-8 space-y-4">
            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6d4c41] ml-1">Custom minutes</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4a373] group-focus-within:text-[#8b4513] transition-colors">
                <Timer size={18} />
              </div>
              <input
                type="number"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  if (e.target.value) setSelectedTime(null);
                }}
                className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-[#e6d3b3] bg-white pl-10 sm:pl-12 pr-12 sm:pr-16 text-sm font-bold text-[#2d1b0e] placeholder-[#e6d3b3] focus:border-[#8b4513] focus:ring-4 focus:ring-[#8b4513]/5 outline-none transition-all"
                placeholder="Minutes..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">
                Mins
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-8 border-t border-[#e6d3b3]/50 bg-[var(--cream)]/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button onClick={onClose} className="order-2 sm:order-1 flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl border border-[#e6d3b3] text-sm font-bold text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="order-1 sm:order-2 flex-[2] h-12 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <CheckCircle2 size={18} />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AcceptOrderModal;
