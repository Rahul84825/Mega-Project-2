import { useState, useEffect } from "react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "shared/utils/pricing";
import api from "../services/api";
import { 
  Package, Clock, CheckCircle2, XCircle, 
  ChevronRight, MapPin, Search, ShoppingBag,
  CreditCard, Truck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_META = {
  PLACED: { label: "Order Placed", cls: "bg-blue-100 text-blue-700", icon: Clock },
  PREPARING: { label: "Preparing", cls: "bg-amber-100 text-amber-700", icon: Clock },
  READY: { label: "Ready", cls: "bg-indigo-100 text-indigo-700", icon: Package },
  PICKED_UP: { label: "Picked Up", cls: "bg-purple-100 text-purple-700", icon: Package },
  DELIVERED: { label: "Delivered", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-700", icon: XCircle },
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await api.get("/api/orders/my-orders");
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--burgundy)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
      <div className="mb-10">
        <h1 className="serif text-3xl md:text-4xl text-[var(--charcoal)] mb-2">My Orders</h1>
        <p className="text-[var(--muted)]">Track and manage your sweet deliveries.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[var(--surface-border)] shadow-sm">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)]">
            <ShoppingBag size={40} />
          </div>
          <h2 className="serif text-2xl mb-4">No orders found</h2>
          <p className="text-[var(--muted)] mb-8">Looks like you haven't ordered any sweets yet.</p>
          <button 
            onClick={() => navigate("/sweets")}
            className="btn-primary px-8 py-3 rounded-xl"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = STATUS_META[order.status] || { label: order.status, cls: "bg-gray-100 text-gray-700", icon: Clock };
            const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div 
                key={order._id}
                className="bg-white rounded-2xl border border-[var(--surface-border)] shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {/* ── REJECTION NOTICE ── */}
                {order.status === "REJECTED" && order.rejectionReason && (
                  <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <XCircle size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Cancellation Reason</h4>
                      <p className="text-xs font-bold text-rose-900 italic leading-relaxed">
                        "{order.rejectionReason}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 md:p-6 border-b border-[var(--surface-border)] bg-[var(--cream)]/30">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[var(--burgundy)] shadow-sm">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Order ID</div>
                        <div className="text-sm font-medium text-[var(--charcoal)]">#{order.orderNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Date</div>
                        <div className="text-sm font-medium text-[var(--charcoal)]">{date}</div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${status.cls}`}>
                          <status.icon size={12} />
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Items</div>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img src={item.imageSnapshot || item.image} alt="" className="h-12 w-12 rounded-lg object-cover bg-[var(--surface-strong)]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[var(--charcoal)] truncate">{item.titleSnapshot || item.name}</div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {item.selectedVariant?.label || "Regular"} × {item.quantity}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-[var(--charcoal)]">
                            {formatCurrency(item.finalAmount || item.subtotal || (item.sellingPriceAtPurchase ? item.sellingPriceAtPurchase * item.quantity : (item.price || 0) * item.quantity))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── DELIVERY PARTNER INFO ── */}
                    {order.rider?.name && (
                      <div className="pt-4 border-t border-blue-50 mt-4 flex flex-wrap items-center justify-between gap-4 bg-blue-50/50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                            <Truck size={18} />
                          </div>
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">Assigned Rider</div>
                            <div className="text-xs font-bold text-blue-900">{order.rider.name} • {order.rider.phone}</div>
                          </div>
                        </div>
                        {order.delivery?.trackingUrl && (
                          <a 
                            href={order.delivery.trackingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                          >
                            Track Live <ChevronRight size={12} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-start gap-2 text-xs text-[var(--muted)] leading-relaxed">
                        <MapPin size={14} className="text-[var(--gold)] shrink-0 mt-0.5" />
                        <span>
                          {order.shippingAddress.fullAddress || (
                            <>
                              {order.shippingAddress.line1}{order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ""}{order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ""}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--surface-border)] space-y-2">
                      <div className="flex justify-between text-[10px] font-medium text-[var(--muted)]">
                        <span>Items Subtotal</span>
                        <span>{formatCurrency(order.totals?.itemsSubtotal || order.subtotal || 0)}</span>
                      </div>
                      
                      {order.totals?.gstTotal > 0 && (
                        <div className="flex justify-between text-[10px] font-medium text-emerald-600/80">
                          <span>GST Amount</span>
                          <span>{formatCurrency(order.totals.gstTotal)}</span>
                        </div>
                      )}

                      {order.totals?.packingTotal > 0 && (
                        <div className="flex justify-between text-[10px] font-medium text-emerald-600/80">
                          <span>Packing Charges</span>
                          <span>{formatCurrency(order.totals.packingTotal)}</span>
                        </div>
                      )}

                      {(order.coupon?.code || (order.totals?.couponDiscount || 0) > 0) && (
                        <div className="flex justify-between text-[10px] font-medium text-blue-600">
                          <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                          <span>-{formatCurrency(order.totals?.couponDiscount || order.discountTotal || 0)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-[10px] font-medium text-[var(--muted)]">
                        <span>Delivery</span>
                        <span>{(order.totals?.shippingFee || order.deliveryFee || 0) > 0 ? formatCurrency(order.totals?.shippingFee || order.deliveryFee) : 'FREE'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-[var(--surface-border)]">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-[var(--muted)]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)]">
                            {order.payment?.method || "Online"}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700">
                          {order.payment?.status === "PAID" ? "Paid" : order.payment?.status || "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-medium text-[var(--charcoal)]">Total Amount</span>
                        <span className="text-lg font-bold text-[var(--burgundy)]">
                          {formatCurrency(order.totals?.grandTotal || order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
