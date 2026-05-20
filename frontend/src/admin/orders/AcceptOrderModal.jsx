import { useState } from "react";
import { X, Clock, CheckCircle2 } from "lucide-react";

const PREP_TIME_OPTIONS = [
  { label: "15 Mins", value: 15 },
  { label: "30 Mins", value: 30 },
  { label: "45 Mins", value: 45 },
  { label: "1 Hour", value: 60 },
  { label: "1.5 Hours", value: 90 }
];

const AcceptOrderModal = ({ open, onClose, onSubmit, order }) => {
  const [selectedTime, setSelectedTime] = useState(45);
  const [customTime, setCustomTime] = useState("");

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    const eta = customTime ? parseInt(customTime, 10) : selectedTime;
    if (isNaN(eta) || eta <= 0) {
      return;
    }
    onSubmit(eta);
    setCustomTime("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e6d3b3] bg-[#fffaf3] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e6d3b3] px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#b67b3a]">Accept Order</div>
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
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <Clock className="mt-0.5 h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700">
              Select estimated preparation time. The customer will be notified of this ETA.
            </p>
          </div>

          <label className="text-xs font-medium text-[#6d4c41]">Select preparation time</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PREP_TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedTime(option.value);
                  setCustomTime("");
                }}
                className={`rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition-all ${
                  selectedTime === option.value && !customTime
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-[#e6d3b3] bg-white text-[#6d4c41] hover:border-[#d4a373]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-xs font-medium text-[#6d4c41]">or enter custom minutes</label>
          <div className="mt-2 relative">
            <input
              type="number"
              value={customTime}
              onChange={(e) => {
                setCustomTime(e.target.value);
                if (e.target.value) setSelectedTime(null);
              }}
              className="w-full rounded-lg border border-[#e6d3b3] bg-white px-3 py-2 text-xs text-[#2d1b0e] placeholder-[#b67b3a] focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
              placeholder="Minutes (e.g. 25)"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#b67b3a] font-medium uppercase">Mins</span>
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
              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md active:scale-95"
            >
              <CheckCircle2 size={14} />
              Confirm & Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptOrderModal;
