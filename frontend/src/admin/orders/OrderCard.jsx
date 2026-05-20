import { useMemo, useState } from "react";
import { 
  MapPin, Phone, Mail, Clock, 
  ChevronDown, ChevronUp, Package, 
  CreditCard, Wallet, Banknote, 
  CheckCircle2, XCircle, Loader2, Truck
} from "lucide-react";
import { formatCurrency } from "../../utils/priceCalculator";
import { 
  resolveStatus, 
  resolvePaymentMethod, 
  resolvePaymentStatus,
  STATUS_META,
  PAYMENT_METHOD_META
} from "./orderUtils";

const OrderCard = ({ 
  order, 
  isActive, 
  onSelect, 
  onAccept, 
  onReject,
  onVerifyPickup,
  onMarkReady, 
  onMarkDelivered, 
  isBusy 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = resolveStatus(order);
  const payMethod = resolvePaymentMethod(order);
  const payStatus = resolvePaymentStatus(order);
  
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  
  const statusMeta = STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  const methodMeta = PAYMENT_METHOD_META[payMethod] || { label: payMethod, icon: CreditCard };

  const formattedTime = order.createdAt 
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : "--:--";

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      onClick={() => onSelect?.(order)}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 bg-white
        ${isActive ? 'border-[var(--burgundy)] shadow-lg' : 'border-[var(--surface-border)] shadow-sm hover:border-[var(--gold)]'}`}
    >
      {/* ── HEADER ── */}
      <div className="p-4 sm:p-5 border-b border-[var(--surface-border)] bg-[var(--cream)]/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--surface-strong)] flex items-center justify-center text-[var(--burgundy)]">
              <Package size={20} />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Order ID</div>
              <div className="text-sm font-medium text-[var(--charcoal)]">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Time</div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--charcoal)]">
                <Clock size={14} className="text-[var(--gold)]" />
                {formattedTime}
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUSTOMER & PAYMENT ROW ── */}
      <div className="px-4 py-4 sm:px-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[var(--surface-strong)] flex items-center justify-center">
              <span className="text-[10px] font-medium text-[var(--burgundy)]">{order.customer?.name?.[0]?.toUpperCase() || 'G'}</span>
            </div>
            <span className="text-sm font-medium text-[var(--charcoal)]">{order.customer?.name || "Guest Customer"}</span>
          </div>
          <div className="flex flex-col gap-1 pl-8">
            <a href={`tel:${order.customer?.phone}`} className="flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--burgundy)]">
              <Phone size={12} /> {order.customer?.phone || "No Phone"}
            </a>
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
              <Mail size={12} /> {order.customer?.email || "No Email"}
            </div>
          </div>
        </div>

        <div className="space-y-2 md:text-right md:flex md:flex-col md:items-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Payment:</span>
            <span className="text-xs font-medium text-[var(--charcoal)]">{payMethod}</span>
            <span className={`h-2 w-2 rounded-full ${payStatus === 'PAID' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} title={payStatus} />
          </div>
          <div className="flex items-start gap-2 pl-2 md:pl-0">
            <MapPin size={12} className="text-[var(--gold)] shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-[var(--muted)] line-clamp-2">{order.shippingAddress?.line1}, {order.shippingAddress?.city}</span>
          </div>
        </div>
      </div>

      {/* ── RIDER INFO (IF ASSIGNED) ── */}
      {order.rider?.name && (
        <div className="px-4 py-3 mx-4 mb-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Truck size={16} />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-blue-600/70">Assigned Rider</div>
              <div className="text-xs font-medium text-blue-900">{order.rider.name} • {order.rider.phone}</div>
            </div>
          </div>
          {order.delivery?.pickupOtp && status === "READY" && (
            <div className="text-right">
              <div className="text-[10px] font-medium uppercase tracking-widest text-blue-600/70">Pickup OTP</div>
              <div className="text-sm font-bold text-blue-900 tracking-widest">{order.delivery.pickupOtp}</div>
            </div>
          )}
        </div>
      )}

      {/* ── ITEMS ACCORDION ── */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <button 
          onClick={toggleExpand}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface-strong)]/50 border border-[var(--surface-border)] hover:bg-[var(--surface-strong)] transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--charcoal)]">
            <Package size={14} className="text-[var(--gold)]" />
            View Items ({itemCount})
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-[var(--surface-border)]">
                {item.image && (
                  <img src={item.image} alt="" className="h-10 w-10 rounded-md object-cover border border-[var(--surface-border)]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--charcoal)] truncate">{item.name || item.titleSnapshot}</div>
                  <div className="text-[10px] font-medium text-[var(--muted)]">
                    {item.variantLabel || item.selectedVariant?.label || 'Regular'} × {item.quantity}
                  </div>
                </div>
                <div className="text-xs font-medium text-[var(--charcoal)]">
                  {formatCurrency(item.subtotal || item.finalAmount || (item.sellingPriceAtPurchase ? item.sellingPriceAtPurchase * item.quantity : (item.price || 0) * item.quantity))}
                </div>
              </div>
            ))}
            
            {/* ── BILL SUMMARY ── */}
            <div className="mt-4 p-3 rounded-xl bg-white border border-[var(--surface-border)] space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-[var(--muted)]">
                <span>Items Total</span>
                <span>{formatCurrency(order.totals?.itemsSubtotal || order.subtotal || ((order.totals?.grandTotal || order.total) - (order.totals?.shippingFee || order.deliveryFee || 0)))}</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium text-[var(--muted)]">
                <span>Delivery Charge</span>
                <span>{(order.totals?.shippingFee || order.deliveryFee) > 0 ? formatCurrency(order.totals?.shippingFee || order.deliveryFee) : "FREE"}</span>
              </div>
              <div className="h-px bg-[var(--surface-border)] my-1" />
              <div className="flex justify-between text-sm font-medium text-[var(--charcoal)]">
                <span>Grand Total</span>
                <span className="text-[var(--burgundy)]">{formatCurrency(order.totals?.grandTotal || order.total || 0)}</span>
              </div>
              <div className="text-[9px] text-center text-[var(--muted)] italic">
                Inclusive of all taxes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div className="p-4 sm:p-5 border-t border-[var(--surface-border)] bg-[var(--cream)]/10">
        <div className="flex flex-wrap items-center gap-2">
          {status === "PLACED" && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onAccept(order); }}
                disabled={isBusy}
                className="flex-1 min-w-[100px] h-10 rounded-xl bg-green-600 text-white text-[11px] font-medium uppercase tracking-widest hover:bg-green-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Accept
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onReject(order); }}
                disabled={isBusy}
                className="flex-1 min-w-[100px] h-10 rounded-xl bg-rose-600 text-white text-[11px] font-medium uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
            </>
          )}

          {status === "PREPARING" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkReady(order); }}
              disabled={isBusy}
              className="w-full h-10 rounded-xl bg-[var(--gold)] text-white text-[11px] font-medium uppercase tracking-widest hover:bg-[var(--gold)]/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
              Mark Ready
            </button>
          )}

          {status === "READY" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onVerifyPickup(order); }}
              disabled={isBusy}
              className="w-full h-10 rounded-xl bg-blue-600 text-white text-[11px] font-medium uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Verify Pickup
            </button>
          )}

          {status === "PICKED_UP" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkDelivered(order); }}
              disabled={isBusy}
              className="w-full h-10 rounded-xl bg-[var(--burgundy)] text-white text-[11px] font-medium uppercase tracking-widest hover:bg-[var(--charcoal)] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Mark Delivered
            </button>
          )}

          {(status === "DELIVERED" || status === "REJECTED") && (
            <div className="w-full text-center py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
              Order {status === "DELIVERED" ? "Completed" : "Closed"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
