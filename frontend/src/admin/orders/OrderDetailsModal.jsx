import { createPortal } from "react-dom";
import { 
  X, User, MapPin, Phone, Mail, Package, 
  CreditCard, Truck, ShieldCheck, Timer, 
  ChevronRight, Receipt, Calendar, Clock, CheckCircle2
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

const OrderDetailsModal = ({ order, open, onClose, onVerifyPickup, onMarkReady, onMarkDelivered }) => {
  if (!open || !order) return null;

  const status = resolveStatus(order);
  const payMethod = resolvePaymentMethod(order);
  const payStatus = resolvePaymentStatus(order);
  
  const statusMeta = STATUS_META[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  const methodMeta = PAYMENT_METHOD_META[payMethod] || { label: payMethod, icon: CreditCard };
  const payStatusMeta = PAYMENT_STATUS_META[payStatus] || { label: payStatus, cls: "bg-gray-100 text-gray-500" };

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress || {};
  const rider = order.rider || {};
  const delivery = order.delivery || {};

  const formattedDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : "N/A";
  
  const formattedTime = order.createdAt 
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : "N/A";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-4 py-6 transition-all duration-300">
      <div className="w-full max-w-4xl max-h-full rounded-[32px] border border-[#e6d3b3] bg-[#fffaf3] shadow-[0_32px_64px_-12px_rgba(45,27,14,0.3)] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6d3b3]/50 px-8 py-6 bg-[var(--cream)]/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--surface-strong)] flex items-center justify-center text-[var(--burgundy)]">
              <Package size={28} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[#b67b3a] font-bold mb-1">Order Details</div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl serif font-medium text-[#2d1b0e]">#{order.orderNumber || order.orderId}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#7a5c3a] hover:bg-[#f5e6d3] hover:text-[#2d1b0e] transition-all border border-transparent hover:border-[#e6d3b3]">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Info Cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Meta Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#e6d3b3] shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--gold)]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Placement Date</p>
                    <p className="text-xs font-bold text-[#2d1b0e]">{formattedDate}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#e6d3b3] shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[var(--cream)] flex items-center justify-center text-[var(--gold)]">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Placement Time</p>
                    <p className="text-xs font-bold text-[#2d1b0e]">{formattedTime}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-[24px] border border-[#e6d3b3] bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#e6d3b3]/50 bg-[var(--cream)]/10 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e] flex items-center gap-2">
                    <Receipt size={14} className="text-[#b67b3a]" /> Order Summary
                  </h4>
                  <span className="text-[10px] font-bold text-[#b67b3a]">{items.length} Unique Items</span>
                </div>
                <div className="divide-y divide-[#e6d3b3]/30">
                  {items.map((item, idx) => (
                    <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--cream)]/5 transition-colors">
                      <div className="h-16 w-16 rounded-xl bg-[var(--surface-strong)]/30 border border-[#e6d3b3]/50 overflow-hidden shrink-0">
                        {item.imageSnapshot || item.image ? (
                          <img src={item.imageSnapshot || item.image} className="h-full w-full object-cover mix-blend-multiply" alt="" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#e6d3b3]"><Package size={24} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d1b0e] truncate">{item.titleSnapshot || item.name}</p>
                        <p className="text-[10px] font-medium text-[#7a5c3a] uppercase tracking-wider">
                          {item.selectedVariant?.label || item.variantLabel || 'Regular'} · Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#2d1b0e]">
                          {formatCurrency(item.finalAmount || item.subtotal || (item.sellingPriceAtPurchase ? item.sellingPriceAtPurchase * item.quantity : (item.price || 0) * item.quantity))}
                        </p>
                        <p className="text-[9px] font-medium text-[#b67b3a]">
                          {formatCurrency(item.sellingPriceAtPurchase || item.price || 0)} / unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Billing Summary */}
                <div className="p-6 bg-[var(--cream)]/20 border-t border-[#e6d3b3]">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-[#7a5c3a]">
                      <span>Items Subtotal</span>
                      <span>{formatCurrency(order?.totals?.itemsSubtotal || order.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-[#7a5c3a]">
                      <span>GST (Included)</span>
                      <span>{formatCurrency(order?.totals?.gstTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-[#7a5c3a]">
                      <span>Delivery Fee</span>
                      <span className={(order?.totals?.shippingFee || order.deliveryFee) === 0 ? "text-emerald-600 font-bold" : ""}>
                        {(order?.totals?.shippingFee || order.deliveryFee) > 0 ? formatCurrency(order?.totals?.shippingFee || order.deliveryFee) : "FREE"}
                      </span>
                    </div>
                    {Number(order?.totals?.discountTotal || 0) > 0 && (
                      <div className="flex justify-between text-xs font-medium text-emerald-600">
                        <span>Discount Applied</span>
                        <span>-{formatCurrency(order?.totals?.discountTotal || 0)}</span>
                      </div>
                    )}
                    <div className="h-px bg-[#e6d3b3] my-2" />
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#b67b3a]">Total Payable</p>
                        <p className="text-2xl font-black text-[var(--burgundy)] leading-none">{formatCurrency(order?.totals?.grandTotal || order.total || 0)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${payStatusMeta.cls}`}>
                          {payStatusMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer & Delivery Details */}
            <div className="space-y-6">
              
              {/* Customer Card */}
              <div className="p-6 rounded-[24px] border border-[#e6d3b3] bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-[#e6d3b3]/50 pb-4">
                  <div className="h-10 w-10 rounded-full bg-[#f5e6d3] flex items-center justify-center text-[#8b4513]">
                    <User size={20} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e]">Customer</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#b67b3a] mb-0.5">Name</p>
                    <p className="text-sm font-bold text-[#2d1b0e]">{order.customer?.name || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#b67b3a] mb-0.5">Phone</p>
                    <a href={`tel:${order.customer?.phone}`} className="text-sm font-bold text-[#8b4513] hover:underline flex items-center gap-1">
                      <Phone size={12} /> {order.customer?.phone || "N/A"}
                    </a>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#b67b3a] mb-0.5">Email</p>
                    <p className="text-sm font-medium text-[#7a5c3a] break-all">{order.customer?.email || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="p-6 rounded-[24px] border border-[#e6d3b3] bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-[#e6d3b3]/50 pb-4">
                  <div className="h-10 w-10 rounded-full bg-[#f5e6d3] flex items-center justify-center text-[#8b4513]">
                    <MapPin size={20} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#2d1b0e]">Shipping</h4>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#b67b3a] mb-1.5">Delivery Address</p>
                  <p className="text-xs font-medium text-[#6d4c41] leading-relaxed">
                    {[address.line1, address.line2, address.landmark, address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#e6d3b3]/50">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#b67b3a] mb-1.5">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-[#8b4513]" />
                    <span className="text-xs font-bold text-[#2d1b0e]">{payMethod}</span>
                  </div>
                </div>
              </div>

              {/* Rider / Logistics Card */}
              {status !== "PLACED" && status !== "REJECTED" && (
                <div className="p-6 rounded-[24px] border border-blue-100 bg-blue-50/30 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Truck size={20} />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800">Logistics</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Rider Information</p>
                      {rider.name ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-blue-900">{rider.name}</p>
                          <p className="text-xs font-medium text-blue-700">{rider.phone}</p>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-blue-400 italic">Assigning partner...</p>
                      )}
                    </div>
                    
                    {delivery.pickupOtp && status === "READY" && (
                      <div className="p-3 rounded-xl bg-white border border-blue-100 flex items-center justify-between shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Pickup OTP</span>
                        <span className="text-lg font-black text-blue-900 tracking-widest">{delivery.pickupOtp}</span>
                      </div>
                    )}

                    {status === "PREPARING" && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400 mb-1">Kitchen Status</p>
                        <OrderTimer order={order} />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer: Quick Actions */}
        <div className="p-8 border-t border-[#e6d3b3]/50 bg-[var(--cream)]/30 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-[10px] font-medium text-[#7a5c3a] flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              This order is protected by Mithai World Secure Logistics
            </div>
            <div className="flex items-center gap-3">
              {status === "READY" && (
                <button 
                  onClick={() => { onClose(); onVerifyPickup(order); }}
                  className="h-12 px-6 rounded-2xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  <ShieldCheck size={16} /> Verify Pickup
                </button>
              )}
              {status === "PREPARING" && (
                <button 
                  onClick={() => onMarkReady(order)}
                  className="h-12 px-6 rounded-2xl bg-[var(--gold)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[var(--gold)]/90 transition-all shadow-lg shadow-yellow-600/20 flex items-center gap-2"
                >
                  <Truck size={16} /> Mark Ready
                </button>
              )}
              {status === "PICKED_UP" && (
                <button 
                  onClick={() => onMarkDelivered(order)}
                  className="h-12 px-6 rounded-2xl bg-[var(--burgundy)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2d1b0e] transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Mark Delivered
                </button>
              )}
              <button 
                onClick={onClose}
                className="h-12 px-6 rounded-2xl border border-[#e6d3b3] text-xs font-bold uppercase tracking-widest text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailsModal;
