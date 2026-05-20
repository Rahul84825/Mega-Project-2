import { Mail, MapPin, Phone, Truck, ShieldCheck, Timer, User } from "lucide-react";
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

const OrderDetailsPanel = ({ order, onClose, onVerifyOtp, onResendOtp }) => {
  if (!order) {
    return (
      <div className="rounded-3xl border border-dashed border-[#e6d3b3] bg-[#fffaf3] p-8 text-center text-sm text-[#7a5c3a]">
        Select an order to see details.
      </div>
    );
  }

  const status = resolveStatus(order);
  const paymentStatus = resolvePaymentStatus(order);
  const paymentMethod = resolvePaymentMethod(order);
  const statusMeta = STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-900" };
  const paymentStatusMeta =
    PAYMENT_STATUS_META[paymentStatus] || { label: paymentStatus, cls: "bg-gray-100 text-gray-900" };
  const paymentMethodMeta =
    PAYMENT_METHOD_META[paymentMethod] || { label: paymentMethod, cls: "bg-gray-100 text-gray-900" };

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress || {};
  const rider = order.rider || {};
  const delivery = order.delivery || {};

  return (
    <div className="rounded-3xl border border-[#e6d3b3] bg-[#fffaf3] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e6d3b3] px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[#b67b3a]">Order Details</div>
          <div className="text-lg font-medium text-[#2d1b0e]">#{order.orderNumber || order.orderId}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs font-medium text-[#8b4513]">
            Close
          </button>
        )}
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentStatusMeta.cls}`}>
            {paymentStatusMeta.label}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentMethodMeta.cls}`}>
            {paymentMethodMeta.label}
          </span>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
              <User className="h-4 w-4" /> Customer
            </div>
            <div className="mt-2 space-y-1 text-[#2d1b0e]">
              <div className="font-medium">{order.customer?.name || "Guest"}</div>
              {order.customer?.phone && (
                <div className="flex items-center gap-2 text-xs text-[#6d4c41]">
                  <Phone className="h-3.5 w-3.5" /> {order.customer.phone}
                </div>
              )}
              {order.customer?.email && (
                <div className="flex items-center gap-2 text-xs text-[#6d4c41]">
                  <Mail className="h-3.5 w-3.5" /> {order.customer.email}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
              <MapPin className="h-4 w-4" /> Delivery Address
            </div>
            <div className="mt-2 text-xs text-[#6d4c41] leading-relaxed">
              {[address.line1, address.line2, address.landmark, address.city, address.state, address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
            <Timer className="h-4 w-4" /> Preparation
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <OrderTimer order={order} />
            <div className="text-xs text-[#6d4c41]">
              ETA: {order.preparation?.etaMinutes ? `${order.preparation.etaMinutes} mins` : "To be confirmed"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
            <Truck className="h-4 w-4" /> Delivery Status
          </div>
          <div className="mt-2 text-sm text-[#2d1b0e]">
            {delivery.status || order.deliveryStatus || "pending"}
          </div>
          {delivery.trackingUrl && (
            <a
              href={delivery.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-[#8b4513]"
            >
              Track order
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
            <Truck className="h-4 w-4" /> Rider Details
          </div>
          <div className="mt-2 text-sm text-[#2d1b0e]">
            {rider.name || "Assigning soon"}
          </div>
          {rider.phone && <div className="text-xs text-[#6d4c41]">{rider.phone}</div>}
          {rider.vehicleNumber && <div className="text-xs text-[#6d4c41]">{rider.vehicleNumber}</div>}
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8b4513]">
            <ShieldCheck className="h-4 w-4" /> Delivery OTP
          </div>
          <div className="mt-2 text-sm text-[#2d1b0e]">
            {order.deliveryVerified ? "Verified" : "Pending"}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => onResendOtp?.(order)}
              className="rounded-full border border-[#d4a373] px-3 py-1 font-medium text-[#8b4513]"
            >
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => onVerifyOtp?.(order)}
              className="rounded-full bg-[#8b4513] px-3 py-1 font-medium text-white"
            >
              Verify OTP
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="text-xs font-medium text-[#8b4513]">Order Items</div>
          <div className="mt-3 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item._id || item.productId} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#2d1b0e]">{item.titleSnapshot || item.name}</div>
                  <div className="text-xs text-[#6d4c41]">
                    {item.selectedVariant?.label || "Standard"} · Qty {item.quantity}
                  </div>
                </div>
                <div className="font-medium text-[#2d1b0e]">{formatPrice(item.finalAmount || item.price || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#f0e0c4] bg-[#fff8ec] p-4">
          <div className="text-xs font-medium text-[#8b4513]">Pricing</div>
          <div className="mt-3 space-y-2 text-sm text-[#6d4c41]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span>{formatPrice(order?.totals?.itemsSubtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatPrice(order?.totals?.gstTotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(order?.totals?.shippingFee || 0)}</span>
            </div>
            {Number(order?.totals?.discountTotal || 0) > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatPrice(order?.totals?.discountTotal || 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-[#2d1b0e]">
              <span>Grand Total</span>
              <span>{formatPrice(order?.totals?.grandTotal || order.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPanel;
