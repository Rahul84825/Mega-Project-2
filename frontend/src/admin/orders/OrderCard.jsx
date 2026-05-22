import { useMemo, useState } from "react";
import { 
  MapPin, Phone, Mail, Clock, 
  ChevronDown, ChevronUp, Package, 
  CreditCard, Truck, Receipt, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { formatCurrency } from "shared/utils/pricing";
import { 
  resolveStatus, 
  resolvePaymentMethod, 
  resolvePaymentStatus,
  STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META
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
  const payStatusMeta = PAYMENT_STATUS_META[payStatus] || { label: payStatus, cls: "bg-gray-100 text-gray-500" };

  const formattedTime = order.createdAt 
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : "--:--";

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const totals = order.totals || {};
  const subtotal = totals.itemsSubtotal || order.subtotal || 0;
  const shippingFee = totals.shippingFee ?? order.deliveryFee ?? 0;
  const grandTotal = totals.grandTotal || order.total || 0;

  return (
    <div 
      onClick={() => onSelect?.(order)}
      className={`relative overflow-hidden rounded-[24px] border transition-all duration-300 bg-white cursor-pointer
        ${isActive ? 'border-[#8b4513] shadow-lg ring-1 ring-[#8b4513]/20' : 'border-[#e6d3b3] shadow-sm hover:border-[#b67b3a]'}`}
    >
      {/* ── HEADER ── */}
      <div className="p-4 sm:p-5 border-b border-[#e6d3b3]/50 bg-[#fffaf3]/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white border border-[#f0e0c4] flex items-center justify-center text-[#8b4513] shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Order ID</div>
              <div className="text-sm font-bold text-[#2d1b0e]">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Time</div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#2d1b0e]">
                <Clock size={14} className="text-[#a67f52]" />
                {formattedTime}
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUSTOMER & PAYMENT ROW ── */}
      <div className="px-4 py-5 sm:px-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#f5e6d3] flex items-center justify-center border border-[#e6d3b3]">
              <span className="text-xs font-bold text-[#8b4513]">{order.customer?.name?.[0]?.toUpperCase() || 'G'}</span>
            </div>
            <span className="text-sm font-bold text-[#2d1b0e]">{order.customer?.name || "Guest Customer"}</span>
          </div>
          <div className="flex flex-col gap-2 pl-11">
            <a href={`tel:${order.customer?.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-xs font-medium text-[#7a5c3a] hover:text-[#8b4513]">
              <Phone size={14} /> {order.customer?.phone || "No Phone"}
            </a>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7a5c3a] truncate">
              <Mail size={14} className="shrink-0" /> {order.customer?.email || "No Email"}
            </div>
          </div>
        </div>

        <div className="space-y-3 md:text-right md:flex md:flex-col md:items-end">
          <div className="flex items-center gap-2 bg-[#fffaf3] border border-[#e6d3b3] px-3 py-1.5 rounded-xl shadow-sm w-fit md:ml-auto">
            <methodMeta.icon size={14} className="text-[#8b4513]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2d1b0e]">{payMethod}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${payStatusMeta.cls}`}>
              {payStatusMeta.label}
            </span>
          </div>
          <div className="flex items-start gap-2 pl-2 md:pl-0 max-w-[250px]">
            <MapPin size={14} className="text-[#a67f52] shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-[#7a5c3a] line-clamp-2 text-left md:text-right leading-relaxed">
              {[order.shippingAddress?.line1, order.shippingAddress?.city, order.shippingAddress?.postalCode].filter(Boolean).join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIDER INFO (IF ASSIGNED) ── */}
      {order.rider?.name && (
        <div className="px-4 py-3 mx-4 mb-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-wrap items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Truck size={18} />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">Assigned Rider</div>
              <div className="text-xs font-bold text-blue-900">{order.rider.name} • {order.rider.phone}</div>
            </div>
          </div>
          {order.delivery?.pickupOtp && status === "READY" && (
            <div className="text-right bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Pickup OTP</div>
              <div className="text-sm font-black text-blue-900 tracking-widest">{order.delivery.pickupOtp}</div>
            </div>
          )}
        </div>
      )}

      {/* ── ITEMS ACCORDION ── */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <button 
          onClick={toggleExpand}
          className="w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#fffaf3] border border-[#e6d3b3] hover:bg-[#f5e6d3] transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#2d1b0e] uppercase tracking-widest">
            <Receipt size={16} className="text-[#a67f52]" />
            Order Summary ({itemCount} Items)
          </div>
          <div className="text-[#8b4513] bg-white rounded-full p-1 border border-[#e6d3b3]">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-[#e6d3b3] bg-white">
                  <div className="h-12 w-12 rounded-lg bg-[#fffaf3] border border-[#f0e0c4] overflow-hidden shrink-0">
                    {item.imageSnapshot || item.image ? (
                      <img src={item.imageSnapshot || item.image} alt="" className="h-full w-full object-cover mix-blend-multiply" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#e6d3b3]"><Package size={16} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#2d1b0e] truncate">{item.titleSnapshot || item.name}</div>
                    <div className="text-[10px] font-medium text-[#7a5c3a] uppercase tracking-wider mt-0.5">
                      {item.selectedVariant?.label || item.variantLabel || 'Regular'} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-xs font-black text-[#2d1b0e] bg-[#f5e6d3] px-2 py-1 rounded-md">
                    {formatCurrency(item.finalAmount || item.subtotal || (item.sellingPriceAtPurchase ? item.sellingPriceAtPurchase * item.quantity : (item.price || 0) * item.quantity))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* ── BILL SUMMARY ── */}
            <div className="p-4 rounded-xl bg-[#fffaf3] border border-[#e6d3b3] space-y-3 shadow-inner">
              <div className="flex justify-between text-xs font-medium text-[#7a5c3a]">
                <span>Items Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-[#7a5c3a]">
                <span>Delivery Charge</span>
                <span className={shippingFee === 0 ? "text-emerald-600 font-bold" : ""}>
                  {shippingFee > 0 ? formatCurrency(shippingFee) : "FREE"}
                </span>
              </div>
              {Number(totals.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discountTotal)}</span>
                </div>
              )}
              <div className="h-px bg-[#e6d3b3] my-2" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold uppercase tracking-widest text-[#2d1b0e]">Grand Total</span>
                <span className="text-xl font-black text-[#8b4513]">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="text-[9px] text-right font-bold uppercase tracking-widest text-[#b67b3a] opacity-80">
                Inclusive of all taxes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div className="p-4 sm:p-5 border-t border-[#e6d3b3]/50 bg-[#fffaf3]/50">
        <div className="flex flex-wrap items-center gap-3">
          {status === "PLACED" && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onAccept(order); }}
                disabled={isBusy}
                className="flex-1 min-w-[100px] h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Accept
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onReject(order); }}
                disabled={isBusy}
                className="flex-1 min-w-[100px] h-12 rounded-xl bg-white border-2 border-rose-200 text-rose-600 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Reject
              </button>
            </>
          )}

          {status === "PREPARING" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkReady(order); }}
              disabled={isBusy}
              className="w-full h-12 rounded-xl bg-[#b67b3a] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#a67f52] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Mark Ready
            </button>
          )}

          {status === "READY" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onVerifyPickup(order); }}
              disabled={isBusy}
              className="w-full h-12 rounded-xl bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Verify Pickup OTP
            </button>
          )}

          {status === "PICKED_UP" && (
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkDelivered(order); }}
              disabled={isBusy}
              className="w-full h-12 rounded-xl bg-[#8b4513] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6b3410] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Mark Delivered
            </button>
          )}

          {(status === "DELIVERED" || status === "REJECTED" || status === "CANCELLED") && (
            <div className="w-full text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a67f52]">
              Order {status === "DELIVERED" ? "Completed" : "Closed"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;