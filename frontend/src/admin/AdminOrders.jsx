import { useState, useEffect, useRef } from "react";
import { Search, Eye, X, Package, User, MapPin, CreditCard, ShoppingBag, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { io } from "socket.io-client";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/priceCalculator";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

const PAYMENT_LABEL = {
  cod: "Cash on Delivery", upi: "UPI", card: "Card",
};

const PAYMENT_STATUS_STYLES = {
  pending: { label: "Pending", cls: "bg-orange-50 text-orange-600" },
  paid:    { label: "Paid",    cls: "bg-green-50 text-green-600"  },
};

const PAYMENT_METHOD_STYLES = {
  cod:  { cls: "bg-yellow-50 text-yellow-700" },
  upi:  { cls: "bg-green-50 text-green-700"  },
  card: { cls: "bg-blue-50 text-blue-700"    },
};

const STATUS_STYLES = {
  pending:    { label: "Pending",    cls: "bg-yellow-50 text-yellow-600"  },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-600"      },
  delivered:  { label: "Delivered",  cls: "bg-green-50 text-green-600"    },
  cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-red-500"        },
};

// ── Order Detail Modal ────────────────────────────────────────────────────────
const OrderModal = ({ order, onClose, onMarkDelivered, onMarkPaid, delivering, markingPaid }) => {
  const isDelivered = order.status === "delivered";
  const isDelivering = delivering === (order._id || order.id);
  const isMarkingPaid = markingPaid === (order._id || order.id);
  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/25 px-4">
      <div className="bg-[#fffaf3] rounded-2xl border border-[#e6d3b3] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6d3b3] sticky top-0 bg-[#fffaf3] rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-[#2d1b0e]">Order #{order.orderId || order._id || order.id}</h3>
            <p className="text-xs text-[#7a5c3a] mt-0.5">
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status]?.cls || "bg-gray-100 text-gray-600"}`}>
              {STATUS_STYLES[order.status]?.label || order.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7a5c3a] hover:text-[#2d1b0e] hover:bg-[#f5e6d3] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Customer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[#8b4513]" />
              <h4 className="text-sm font-bold text-[#2d1b0e]">Customer Details</h4>
            </div>
            <div className="bg-[#fffaf3] border border-[#e6d3b3] rounded-xl p-4 space-y-2 text-sm">
              {[["Name", order.customer?.name], ["Phone", order.customer?.phone], ["Email", order.customer?.email]].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[#7a5c3a]">{label}</span>
                  <span className="font-semibold text-[#2d1b0e]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#8b4513]" />
              <h4 className="text-sm font-bold text-[#2d1b0e]">Delivery Address</h4>
            </div>
            <div className="bg-[#fffaf3] border border-[#e6d3b3] rounded-xl p-4 text-sm text-[#7a5c3a] leading-relaxed">
              {order.address?.line1}
              {order.address?.line2 && `, ${order.address.line2}`}<br />
              {order.address?.city} — {order.address?.pincode}<br />
              {order.address?.state}, {order.address?.country}
            </div>
          </div>

          {/* Ordered Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-[#e8883a]" />
              <h4 className="text-sm font-bold text-[#2d1b14]">Ordered Items ({order.itemCount})</h4>
            </div>
            <div className="space-y-3">
              {order.items?.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={item._id || item.productId || idx} className="flex items-center gap-4 rounded-lg border border-[#e0c3a3] bg-[#fff8ec] p-3">
                    <img
                      src={item.image || "https://via.placeholder.com/56x56?text=No+Image"}
                      alt={item.name || "Product"}
                      className="w-14 h-14 rounded-lg object-cover border"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/56x56?text=No+Image"; }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#3b2f2f]">{item.name}</p>
                      <p className="text-sm text-[#6d4c41]">Qty: {item.qty || item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#3b2f2f]">
                      {formatPrice(Number(item.price || 0))}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#6d4c41] text-sm">No items found</div>
              )}
            </div>
          </div>

          {/* Payment & Total */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-[#e8883a]" />
              <h4 className="text-sm font-bold text-[#2d1b14]">Payment Summary</h4>
            </div>
            <div className="bg-[#fff8ec] border border-[#e0c3a3] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#6d4c41]">
                <span>Subtotal</span><span>{formatPrice(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-[#6d4c41]">
                <span>Delivery</span>
                {order.delivery === 0
                  ? <span className="text-green-600 font-medium">FREE</span>
                  : <span>{formatPrice(order.delivery || 0)}</span>}
              </div>
              <div className="flex justify-between font-bold text-[#2d1b14] border-t border-[#e0c3a3] pt-2">
                <span>Total</span><span>{formatPrice(order.total || 0)}</span>
              </div>
              <div className="flex justify-between text-[#6d4c41] text-xs pt-1">
                <span>Payment Method</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${PAYMENT_METHOD_STYLES[order.paymentMethod]?.cls || "bg-gray-100 text-gray-600"}`}>
                  {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-[#6d4c41] text-xs pt-1">
                <span>Payment Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLES[order.paymentStatus]?.cls || "bg-gray-100 text-gray-500"}`}>
                  {PAYMENT_STATUS_STYLES[order.paymentStatus]?.label || order.paymentStatus || "Pending"}
                </span>
              </div>
              {order.upiTransactionId && (
                <div className="flex justify-between text-gray-500 text-xs pt-1">
                  <span>UPI Txn ID</span>
                  <span className="font-semibold text-[#6d4c41]">{order.upiTransactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery info if already delivered */}
          {isDelivered && order.deliveredAt && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Order Delivered</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {new Date(order.deliveredAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Mark as Paid button */}
          {!isPaid && (
            <button
              onClick={() => onMarkPaid(order._id || order.id)}
              disabled={isMarkingPaid}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-[#3b2f2f] font-bold py-3 rounded-xl transition-colors disabled:cursor-not-allowed mb-2"
            >
              {isMarkingPaid ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Marking as Paid...</>
              ) : (
                <><DollarSign className="w-4 h-4" /> Mark as Paid</>
              )}
            </button>
          )}

          {/* Mark as Delivered button */}
          {!isDelivered && (
            <button
              onClick={() => onMarkDelivered(order._id || order.id)}
              disabled={isDelivering}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-[#3b2f2f] font-bold py-3 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {isDelivering ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Marking as Delivered...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Mark as Delivered</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminOrders ──────────────────────────────────────────────────────────
const AdminOrders = () => {
  const { orders, fetchOrders, markOrderDelivered, markOrderPaid, addIncomingOrder } = useProducts();
  const { user } = useAuth();
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);
  const [delivering, setDelivering] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState({});
  const addIncomingOrderRef = useRef(addIncomingOrder);
  const highlightTimeoutsRef = useRef({});

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    addIncomingOrderRef.current = addIncomingOrder;
  }, [addIncomingOrder]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
    });


    socket.on("newOrder", (incomingOrder) => {
      if (!incomingOrder) return;

      const { order, isNew } = addIncomingOrderRef.current(incomingOrder);
      const orderKey = order?._id || order?.id || order?.orderId;

      if (!orderKey || !isNew) {
        return;
      }

      setHighlightedOrderIds((prev) => ({ ...prev, [orderKey]: true }));

      if (highlightTimeoutsRef.current[orderKey]) {
        clearTimeout(highlightTimeoutsRef.current[orderKey]);
      }

      highlightTimeoutsRef.current[orderKey] = setTimeout(() => {
        setHighlightedOrderIds((prev) => {
          const next = { ...prev };
          delete next[orderKey];
          return next;
        });
        delete highlightTimeoutsRef.current[orderKey];
      }, 5000);
    });

    socket.on("connect_error", (err) => {
      console.error("Realtime order socket connection error:", err.message);
    });

    return () => {
      Object.values(highlightTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      highlightTimeoutsRef.current = {};
      socket.disconnect();
    };
  }, [user?.role]);

  const handleMarkDelivered = async (orderId) => {
    if (delivering) return;
    setDelivering(orderId);
    try {
      const updated = await markOrderDelivered(orderId);
      if (selected && (selected._id === orderId || selected.id === orderId)) {
        setSelected((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error("Failed to mark delivered:", err.message);
      alert(err.message || "Failed to mark order as delivered.");
    } finally {
      setDelivering(null);
    }
  };

  const handleMarkPaid = async (orderId) => {
    if (markingPaid) return;
    setMarkingPaid(orderId);
    try {
      const updated = await markOrderPaid(orderId);
      if (selected && (selected._id === orderId || selected.id === orderId)) {
        setSelected((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error("Failed to mark paid:", err.message);
      alert(err.message || "Failed to mark order as paid.");
    } finally {
      setMarkingPaid(null);
    }
  };

  const q = search.toLowerCase();
  const filtered = (Array.isArray(orders) ? orders : []).filter((o) => {
    const id    = (o.orderId || o.id || o._id || "").toLowerCase();
    const name  = (o.customer?.name  || "").toLowerCase();
    const phone =  o.customer?.phone || "";
    const email = (o.customer?.email || "").toLowerCase();
    return id.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
  });

  const totalRevenue = (Array.isArray(orders) ? orders : []).reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#2d1b14]">Orders</h2>
          <p className="text-sm text-[#6d4c41] mt-0.5">
            {orders.length} total orders · {formatPrice(totalRevenue)} revenue
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#fff8ec] rounded-xl border border-[#e0c3a3] shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d4c41]" />
          <input
            type="text"
            placeholder="Search by order ID, name, phone or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#e0c3a3] bg-[#fff8ec] text-[#3b2f2f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e8883a]/30"
          />
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="bg-[#fff8ec] rounded-xl border border-[#e0c3a3] shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#fff8ec] border border-[#e0c3a3] rounded-full flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-[#6d4c41]" />
          </div>
          <h3 className="text-base font-semibold text-[#3b2f2f] mb-1">No orders yet</h3>
          <p className="text-sm text-[#6d4c41]">Orders will appear here as customers place them</p>
        </div>
      ) : (
        <div className="bg-[#fff8ec] rounded-xl border border-[#e0c3a3] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fff8ec] border-b border-[#e0c3a3]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Pay Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#6d4c41] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a84c]/10">
                {filtered.map((order) => {
                  const isDelivered  = order.status === "delivered";
                  const isDelivering = delivering === (order._id || order.id);
                  const orderKey = order._id || order.id || order.orderId;
                  const isHighlighted = Boolean(highlightedOrderIds[orderKey]);
                  return (
                    <tr
                      key={order._id || order.id}
                      className={`${isHighlighted ? "bg-[#e8883a]/10 animate-pulse" : "hover:bg-[#fff8ec]/70"} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-600">#{order.orderId || order._id || order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#3b2f2f]">{order.customer?.name}</p>
                        <p className="text-xs text-[#6d4c41]">{order.customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#6d4c41]">
                          {order.itemCount} item{order.itemCount > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#2d1b14]">
                        {formatPrice(order.total || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full
                          ${PAYMENT_METHOD_STYLES[order.paymentMethod]?.cls || "bg-gray-100 text-gray-600"}`}>
                          {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PAYMENT_STATUS_STYLES[order.paymentStatus]?.cls || "bg-orange-50 text-orange-600"}`}>
                            {PAYMENT_STATUS_STYLES[order.paymentStatus]?.label || order.paymentStatus || "Pending"}
                          </span>
                          {order.paymentStatus !== "paid" && (
                            <button
                              onClick={() => handleMarkPaid(order._id || order.id)}
                              disabled={!!markingPaid}
                              title="Mark as Paid"
                              className="text-xs font-semibold px-2 py-1 bg-[#e8883a]/15 text-white hover:bg-[#e8883a]/25 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {markingPaid === (order._id || order.id)
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : "Pay ✓"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[order.status]?.cls || "bg-gray-100 text-gray-500"}`}>
                          {STATUS_STYLES[order.status]?.label || order.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6d4c41]">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Mark as Delivered inline button */}
                          {!isDelivered && (
                            <button
                              onClick={() => handleMarkDelivered(order._id || order.id)}
                              disabled={!!delivering}
                              title="Mark as Delivered"
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDelivering
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <CheckCircle2 className="w-3.5 h-3.5" />}
                              {isDelivering ? "..." : "Deliver"}
                            </button>
                          )}
                          {isDelivered && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 px-2.5 py-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Done
                            </span>
                          )}
                          {/* View Details button */}
                          <button
                            onClick={() => setSelected(order)}
                            className="p-1.5 text-[#6d4c41] hover:text-[#e8883a] hover:bg-[#e8883a]/15 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onMarkDelivered={handleMarkDelivered}
          onMarkPaid={handleMarkPaid}
          delivering={delivering}
          markingPaid={markingPaid}
        />
      )}
    </div>
  );
};

export default AdminOrders;


