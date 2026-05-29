import { createPortal } from "react-dom";
import { 
  X, User, MapPin, Phone, Mail, Package, 
  CreditCard, Truck, ShieldCheck, Timer, 
  ChevronRight, Receipt, Calendar, Clock, CheckCircle2,
  ExternalLink
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
import OrderTimer from "./OrderTimer";

const OrderDetailsModal = ({ order, open, onClose, onHandover, onMarkReady, onMarkDelivered, onSync }) => {
  if (!open || !order) return null;

  const status = resolveStatus(order);
  console.log(`🖥️ FRONTEND_RENDERED_STATUS: ${status}`);
  
  const payMethod = resolvePaymentMethod(order);
  const payStatus = resolvePaymentStatus(order);
  
  const statusMeta = STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  const payStatusMeta = PAYMENT_STATUS_META[payStatus] || { label: payStatus, cls: "bg-gray-100 text-gray-500" };

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress || {};
  const rider = order.rider || {};
  const delivery = order.delivery || {};

  const formattedDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : "N/A";
  
  const formattedTime = order.createdAt 
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : "N/A";

  const isDeliveryActive = ["PLACED", "PREPARING", "READY", "PICKED_UP"].includes(status);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d1b0e]/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* ── HEADER ── */}
        <div className="px-8 py-6 bg-white border-b border-[#e6d3b3]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-[#8b4513] flex items-center justify-center text-white shadow-lg">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h3 className="text-xl serif font-bold text-[#2d1b0e]">#{order.orderNumber || order.orderId}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusMeta.cls} border border-black/5`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Placement: {formattedDate} at {formattedTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDeliveryActive && (
              <button 
                onClick={() => onSync?.()}
                className="h-10 px-4 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8b4513] bg-[#fffaf3] border border-[#e6d3b3] hover:bg-[#f5e6d3] transition-colors"
              >
                <Clock size={14} /> Sync Status
              </button>
            )}
            <button 
              onClick={onClose} 
              className="h-10 w-10 rounded-full flex items-center justify-center text-[#7a5c3a] hover:bg-[#f5e6d3] transition-colors border border-[#e6d3b3]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Top Row: Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div className="bg-white border border-[#e6d3b3] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e6d3b3]/30">
                <div className="h-9 w-9 rounded-xl bg-[#f5e6d3] flex items-center justify-center text-[#8b4513]">
                  <User size={18} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e]">Customer</h4>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#2d1b0e]">{order.customer?.name || "Guest Patron"}</p>
                <div className="space-y-1">
                  <a href={`tel:${order.customer?.phone}`} className="text-xs font-bold text-[#8b4513] hover:underline flex items-center gap-2">
                    <Phone size={12} /> {order.customer?.phone}
                  </a>
                  <div className="text-xs font-medium text-[#7a5c3a] flex items-center gap-2 truncate">
                    <Mail size={12} /> {order.customer?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white border border-[#e6d3b3] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e6d3b3]/30">
                <div className="h-9 w-9 rounded-xl bg-[#f5e6d3] flex items-center justify-center text-[#8b4513]">
                  <MapPin size={18} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e]">Shipping</h4>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#2d1b0e] leading-relaxed">
                  {[address.line1, address.line2, address.landmark, address.city, address.postalCode].filter(Boolean).join(", ")}
                </p>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#fffaf3] border border-[#e6d3b3] rounded-lg">
                  <CreditCard size={12} className="text-[#8b4513]" />
                  <span className="text-[10px] font-bold text-[#2d1b0e] uppercase">{payMethod}</span>
                </div>
              </div>
            </div>

            {/* Logistics Info (Balanced Placement) */}
            <div className="bg-white border border-[#e6d3b3] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e6d3b3]/30">
                <div className="h-9 w-9 rounded-xl bg-[#f5e6d3] flex items-center justify-center text-[#8b4513]">
                  <Truck size={18} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e]">Logistics</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">{delivery.provider || "Borzo"}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    delivery.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                    delivery.status === 'PICKED_UP' ? 'bg-blue-50 text-blue-700' :
                    delivery.status === 'RIDER_ASSIGNED' ? 'bg-indigo-50 text-indigo-700' :
                    delivery.status === 'SEARCHING_FOR_RIDER' ? 'bg-amber-50 text-amber-700' :
                    'bg-[#f5e6d3] text-[#8b4513]'
                  }`}>
                    {(delivery.status || "Pending").replace(/_/g, ' ')}
                  </span>
                </div>
                {rider.name ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#2d1b0e]">{rider.name} • {rider.phone}</p>
                    {rider.vehicleNumber && <p className="text-[10px] font-medium text-[#7a5c3a]">{rider.vehicleNumber}</p>}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-[#b67b3a] italic">
                    {delivery.status === "SEARCHING_FOR_RIDER" ? "Searching for rider..." : "Assigning rider..."}
                  </p>
                )}
                {delivery.trackingUrl && (
                  <a 
                    href={delivery.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-bold text-[#8b4513] hover:underline"
                  >
                    <ExternalLink size={12} /> TRACK LIVE DELIVERY
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Main Content: Items & Billing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items Summary (8/12) */}
            <div className="lg:col-span-8 bg-white border border-[#e6d3b3] rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-[#fffaf3] border-b border-[#e6d3b3]/50">
                <h4 className="serif text-lg font-bold text-[#2d1b0e]">Order Items</h4>
              </div>
              <div className="divide-y divide-[#e6d3b3]/20">
                {items.map((item, idx) => (
                  <div key={idx} className="p-6 flex items-center gap-6">
                    <div className="h-16 w-16 rounded-xl bg-[#fffaf3] border border-[#e6d3b3]/30 overflow-hidden shrink-0">
                      {item.imageSnapshot || item.image ? (
                        <img src={item.imageSnapshot || item.image} className="h-full w-full object-cover mix-blend-multiply" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[#e6d3b3]"><Package size={24} /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2d1b0e]">{item.titleSnapshot || item.name}</p>
                      <p className="text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest mt-0.5">
                        {item.selectedVariant?.label || item.variantLabel || 'Regular'} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#2d1b0e]">{formatCurrency(item.finalAmount || item.subtotal || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Details (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-[#e6d3b3] rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="serif text-lg font-bold text-[#2d1b0e] border-b border-[#e6d3b3]/30 pb-3">Bill Details</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-[#7a5c3a]">
                    <span className="uppercase tracking-widest opacity-60">Subtotal</span>
                    <span>{formatCurrency(order?.totals?.itemsSubtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#7a5c3a]">
                    <span className="uppercase tracking-widest opacity-60">Tax (GST)</span>
                    <span>{formatCurrency(order?.totals?.gstTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#7a5c3a]">
                    <span className="uppercase tracking-widest opacity-60">Delivery</span>
                    <span className={(order?.totals?.shippingFee || 0) === 0 ? "text-emerald-600" : ""}>
                      {(order?.totals?.shippingFee || 0) > 0 ? formatCurrency(order?.totals?.shippingFee) : "FREE"}
                    </span>
                  </div>
                  {order.coupon?.code && (
                    <div className="flex justify-between text-xs font-bold text-blue-600 bg-blue-50/50 p-2 rounded-lg">
                      <span className="uppercase tracking-widest">Discount</span>
                      <span>-{formatCurrency(order?.totals?.couponDiscount || 0)}</span>
                    </div>
                  )}
                  <div className="h-px bg-[#e6d3b3] my-4" />
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#b67b3a] mb-1">Total</p>
                      <p className="text-3xl font-black text-[#8b4513] tracking-tighter">{formatCurrency(order?.totals?.grandTotal || 0)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${payStatusMeta.cls}`}>
                      {payStatusMeta.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Specific Contextual Cards */}
              {delivery.pickupOtp && status === "READY" && (
                <div className="bg-[#fffaf3] border-2 border-dashed border-[#e6d3b3] p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#b67b3a] mb-2">Handover OTP</p>
                  <p className="text-4xl font-black text-[#2d1b0e] tracking-[0.3em] ml-[0.3em]">{delivery.pickupOtp}</p>
                </div>
              )}

              {status === "PREPARING" && (
                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-3xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-3 flex items-center gap-2">
                    <Timer size={14} /> Expected Ready
                  </p>
                  <OrderTimer order={order} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="px-8 py-6 bg-white border-t border-[#e6d3b3]/50 flex flex-wrap items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 bg-[#fffaf3] border border-[#e6d3b3] rounded-full">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7a5c3a]">Mithai World Secure Fulfillment</span>
          </div>

          <div className="flex items-center gap-4">
            {status === "READY" && (
              <button 
                onClick={() => { onClose(); onHandover(order); }}
                className="h-12 px-8 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <Truck size={16} /> Confirm Handover
              </button>
            )}
            {status === "PREPARING" && (
              <button 
                onClick={() => onMarkReady(order)}
                className="h-12 px-8 rounded-2xl bg-[#b67b3a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#a67f52] transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Mark Ready
              </button>
            )}
            {status === "PICKED_UP" && (
              <button 
                onClick={() => onMarkDelivered(order)}
                className="h-12 px-8 rounded-2xl bg-[#8b4513] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#6b3410] transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Mark Delivered
              </button>
            )}
            <button 
              onClick={onClose}
              className="h-12 px-8 rounded-2xl border-2 border-[#e6d3b3] text-[11px] font-black uppercase tracking-widest text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailsModal;
