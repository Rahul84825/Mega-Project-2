import { useMemo, useState } from "react";
import { MapPin, Phone, User, PackageCheck, Timer, Clock, ChevronDown } from "lucide-react";
import { formatPrice } from "../../services/utils/priceCalculator";
import {
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  STATUS_META,
  resolvePaymentMethod,
  resolvePaymentStatus,
  resolveStatus
} from "./orderUtils";
import OrderTimer from "./OrderTimer";
import OrderDetailsExpanded from "./OrderDetailsExpanded";

const getStatusMeta = (status) => STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-900" };
const getPaymentStatusMeta = (status) =>
  PAYMENT_STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-900" };
const getPaymentMethodMeta = (method) =>
  PAYMENT_METHOD_META[method] || { label: method, cls: "bg-gray-100 text-gray-900" };

const OrderCard = ({
  order,
  isActive,
  onSelect,
  onAccept,
  onReject,
  onMarkReady,
  onMarkDelivered,
  isBusy
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  const status = resolveStatus(order);
  const paymentStatus = resolvePaymentStatus(order);
  const paymentMethod = resolvePaymentMethod(order);
  const statusMeta = getStatusMeta(status);
  const paymentStatusMeta = getPaymentStatusMeta(paymentStatus);
  const paymentMethodMeta = getPaymentMethodMeta(paymentMethod);

  const items = Array.isArray(order.items) ? order.items : [];
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items]);
  const customerName = order.customer?.name || "Guest";
  const customerPhone = order.customer?.phone || "";
  const addressLine = order.shippingAddress
    ? `${order.shippingAddress.line1 || ""}, ${order.shippingAddress.city || ""}`
    : "";

  // Build compact item display string
  const itemsDisplay = items
    .map((item) => `${item.quantity}x ${item.titleSnapshot}`)
    .join(" • ");

  // Rejection reason if order is rejected
  const rejectionReason = order.rejectionReason || order.metadata?.rejectionReason || "";

  // Format order time
  const orderTime = order.statusTimestamps?.placedAt || order.createdAt;
  const formattedTime = orderTime ? new Date(orderTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  const actionButtons = [];
  if (status === "PLACED") {
    actionButtons.push(
      <button
        key="accept"
        onClick={(event) => {
          event.stopPropagation();
          onAccept(order);
        }}
        className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isBusy}
      >
        Accept
      </button>
    );
    actionButtons.push(
      <button
        key="reject"
        onClick={(event) => {
          event.stopPropagation();
          onReject(order);
        }}
        className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isBusy}
      >
        Reject
      </button>
    );
  }

  if (status === "PREPARING") {
    actionButtons.push(
      <button
        key="ready"
        onClick={(event) => {
          event.stopPropagation();
          onMarkReady(order);
        }}
        className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isBusy}
      >
        Mark Ready
      </button>
    );
  }

  if (status === "READY") {
    actionButtons.push(
      <button
        key="delivered"
        onClick={(event) => {
          event.stopPropagation();
          onMarkDelivered(order);
        }}
        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isBusy}
      >
        Delivered
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(order)}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 shadow-sm ${
        isActive
          ? "border-[#8b4513] bg-[#fff4e0] shadow-md"
          : "border-[#e6d3b3] bg-[#fffaf3] hover:border-[#d4a373]"
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#b67b3a]">Order #{order.orderNumber || order.orderId}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#7a5c3a]">
              <Clock className="h-3.5 w-3.5" />
              {formattedTime}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
            {status !== "REJECTED" && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${paymentStatusMeta.cls}`}>
                {paymentStatusMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-[#8b4513]" />
            <span className="font-semibold text-[#2d1b0e]">{customerName}</span>
            {customerPhone && <span className="text-xs text-[#7a5c3a]">{customerPhone}</span>}
          </div>
          {addressLine && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#8b4513]" />
              <span className="text-xs text-[#7a5c3a] line-clamp-2">{addressLine}</span>
            </div>
          )}
        </div>

        {/* Quick Summary - Compact */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#7a5c3a]">Total</div>
              <div className="text-base font-extrabold text-[#2d1b0e]">{formatPrice(order.total || 0)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${paymentMethodMeta.cls}`}>
                {paymentMethodMeta.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5c3a] bg-[#f5e6d3] rounded-full px-2.5 py-1">
                <PackageCheck className="h-3.5 w-3.5" />
                {totalItems}
              </div>
            </div>
          </div>

          {/* Show rejection reason */}
          {status === "REJECTED" && rejectionReason && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-xs font-semibold text-rose-900">Reason</div>
              <div className="mt-0.5 text-xs text-rose-700">{rejectionReason}</div>
            </div>
          )}

          {/* Show timer for PREPARING orders */}
          {status === "PREPARING" && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
              <Timer className="h-3.5 w-3.5 text-yellow-700" />
              <OrderTimer order={order} />
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDetailsExpanded(!isDetailsExpanded);
          }}
          className="flex items-center justify-between rounded-lg border border-[#e6d3b3] bg-[#f5e6d3] px-3 py-2 text-xs font-semibold text-[#8b4513] hover:bg-[#f0d8b8] transition-colors"
        >
          <span>{isDetailsExpanded ? "Hide Details" : "View Details"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isDetailsExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expanded Details Section */}
        <OrderDetailsExpanded
          order={order}
          isExpanded={isDetailsExpanded}
          onToggle={() => setIsDetailsExpanded(!isDetailsExpanded)}
        />

        {/* Action buttons */}
        {actionButtons.length > 0 && (
          <div className="flex gap-2 pt-1">
            {actionButtons}
          </div>
        )}
      </div>
    </button>
  );
};

export default OrderCard;
