import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

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

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    const reason = customReason.trim() || selectedReason;
    if (!reason) {
      return;
    }
    onSubmit(reason);
    setSelectedReason("");
    setCustomReason("");
  };

  const hasReason = customReason.trim() || selectedReason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e6d3b3] bg-[#fffaf3] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e6d3b3] px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#b67b3a]">Reject Order</div>
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
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-rose-600 flex-shrink-0" />
            <p className="text-xs text-rose-700">
              Customer will be notified with the rejection reason. This action cannot be undone.
            </p>
          </div>

          <label className="text-xs font-medium text-[#6d4c41]">Select reason</label>
          <div className="mt-2 space-y-2">
            {REJECT_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                onClick={() => {
                  setSelectedReason(selectedReason === reason.value ? "" : reason.value);
                  setCustomReason("");
                }}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-xs font-medium transition-all ${
                  selectedReason === reason.value
                    ? "border-[#8b4513] bg-[#fff0e0] text-[#2d1b0e]"
                    : "border-[#e6d3b3] bg-white text-[#6d4c41] hover:border-[#d4a373]"
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-xs font-medium text-[#6d4c41]">or add custom reason</label>
          <textarea
            rows={3}
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value);
              if (e.target.value.trim()) {
                setSelectedReason("");
              }
            }}
            className="mt-2 w-full rounded-lg border border-[#e6d3b3] bg-white px-3 py-2 text-xs text-[#2d1b0e] placeholder-[#b67b3a] focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            placeholder="Enter custom rejection reason (optional)..."
          />

          <div className="mt-4 flex items-center justify-end gap-2">
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
              disabled={!hasReason}
              className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
