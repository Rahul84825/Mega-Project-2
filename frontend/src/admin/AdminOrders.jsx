import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { io } from "socket.io-client";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../services/utils/priceCalculator";
import { verifyDeliveryOTP, resendDeliveryOTP } from "../services/api";
import OrderCard from "./orders/OrderCard";
import OrderDetailsPanel from "./orders/OrderDetailsPanel";
import OrderTabs from "./orders/OrderTabs";
import RejectReasonModal from "./orders/RejectReasonModal";
import { ORDER_TABS, resolveStatus } from "./orders/orderUtils";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

const AdminOrders = () => {
  const {
    orders,
    fetchOrders,
    addIncomingOrder,
    acceptOrder,
    rejectOrder,
    markOrderReady,
    markOrderDelivered
  } = useProducts();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("NEW");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, order: null });
  const [highlightedOrderIds, setHighlightedOrderIds] = useState({});
  const addIncomingOrderRef = useRef(addIncomingOrder);
  const highlightTimeoutsRef = useRef({});

  useEffect(() => {
    fetchOrders();
  }, []);

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
      reconnection: true
    });

    const handleIncoming = (incomingOrder) => {
      if (!incomingOrder) return;
      const { order, isNew } = addIncomingOrderRef.current(incomingOrder);
      const orderKey = order?._id || order?.id || order?.orderId;

      if (!orderKey) {
        return;
      }

      if (isNew) {
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
      }
    };

    [
      "newOrder",
      "orderPlaced",
      "orderAccepted",
      "orderRejected",
      "orderPreparing",
      "orderReady",
      "orderPickedUp",
      "orderDelivered",
      "orderUpdated"
    ].forEach((event) => socket.on(event, handleIncoming));

    socket.on("connect_error", (err) => {
      console.error("Realtime order socket connection error:", err.message);
    });

    return () => {
      Object.values(highlightTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      highlightTimeoutsRef.current = {};
      socket.disconnect();
    };
  }, [user?.role]);

  const orderMap = useMemo(() => {
    return new Map((Array.isArray(orders) ? orders : []).map((order) => [order._id || order.id || order.orderId, order]));
  }, [orders]);

  const selectedOrder = selectedId ? orderMap.get(selectedId) : null;

  const tabCounts = useMemo(() => {
    const counts = Object.fromEntries(ORDER_TABS.map((tab) => [tab.id, 0]));
    (Array.isArray(orders) ? orders : []).forEach((order) => {
      const status = resolveStatus(order);
      ORDER_TABS.forEach((tab) => {
        if (tab.statuses.includes(status)) {
          counts[tab.id] += 1;
        }
      });
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    const tab = ORDER_TABS.find((item) => item.id === activeTab) || ORDER_TABS[0];
    return (Array.isArray(orders) ? orders : [])
      .filter((order) => tab.statuses.includes(resolveStatus(order)))
      .filter((order) => {
        const id = String(order.orderNumber || order.orderId || order._id || "").toLowerCase();
        const name = String(order.customer?.name || "").toLowerCase();
        const phone = String(order.customer?.phone || "");
        const email = String(order.customer?.email || "").toLowerCase();
        return id.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
      });
  }, [orders, activeTab, search]);

  const totalRevenue = useMemo(
    () => (Array.isArray(orders) ? orders : []).reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const handleAsync = async (orderId, action) => {
    if (busyOrderId) {
      return;
    }
    setBusyOrderId(orderId);
    try {
      await action();
    } catch (error) {
      console.error("Order action failed:", error.message);
      alert(error.message || "Action failed. Please try again.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAccept = (order) => {
    const eta = Number(order?.preparation?.etaMinutes || 45);
    handleAsync(order._id || order.id, () => acceptOrder(order._id || order.id, eta));
  };

  const handleReject = (order) => {
    setRejectModal({ open: true, order });
  };

  const handleRejectSubmit = (reason) => {
    if (!rejectModal.order) {
      return;
    }
    const orderId = rejectModal.order._id || rejectModal.order.id;
    handleAsync(orderId, () => rejectOrder(orderId, reason));
    setRejectModal({ open: false, order: null });
  };

  const handleVerifyOtp = async (order) => {
    const otp = window.prompt("Enter delivery OTP") || "";
    if (!otp.trim()) {
      return;
    }

    await handleAsync(order._id || order.id, async () => {
      await verifyDeliveryOTP({ orderId: order._id || order.id, otp });
    });
  };

  const handleResendOtp = async (order) => {
    await handleAsync(order._id || order.id, async () => {
      await resendDeliveryOTP({ orderId: order._id || order.id });
    });
  };

  return (
    <div className="relative space-y-6 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[90%] -translate-x-1/2 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(212,163,115,0.35),_rgba(255,250,243,0.05))]" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f0e0c4] bg-[#fff8ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.3em] text-[#b67b3a]">
            <Sparkles className="h-3.5 w-3.5" /> Mithai Ops
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-[#2d1b0e] sm:text-3xl font-['Playfair_Display',serif]">
            Orders Command Center
          </h2>
          <p className="mt-1 text-sm text-[#7a5c3a]">
            {orders.length} orders · {formatPrice(totalRevenue)} revenue
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a5c3a]" />
            <input
              type="text"
              placeholder="Search by order, customer, or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-full border border-[#e6d3b3] bg-white px-9 py-2 text-sm text-[#2d1b0e] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
          </div>
          <div className="rounded-full border border-[#e6d3b3] bg-[#fffaf3] px-4 py-2 text-xs font-semibold text-[#7a5c3a]">
            Live updates enabled
          </div>
        </div>
      </div>

      <OrderTabs activeTab={activeTab} counts={tabCounts} onSelect={setActiveTab} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e6d3b3] bg-[#fffaf3] p-10 text-center text-sm text-[#7a5c3a]">
              No orders in this stage yet.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const orderId = order._id || order.id || order.orderId;
              const isHighlighted = Boolean(highlightedOrderIds[orderId]);
              return (
                <div key={orderId} className={isHighlighted ? "animate-pulse" : ""}>
                  <OrderCard
                    order={order}
                    isActive={selectedId === orderId}
                    onSelect={() => setSelectedId(orderId)}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onMarkReady={(target) =>
                      handleAsync(target._id || target.id, () => markOrderReady(target._id || target.id))
                    }
                    onMarkDelivered={(target) =>
                      handleAsync(target._id || target.id, () => markOrderDelivered(target._id || target.id))
                    }
                    isBusy={busyOrderId === orderId}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="hidden lg:block">
          <OrderDetailsPanel
            order={selectedOrder}
            onVerifyOtp={handleVerifyOtp}
            onResendOtp={handleResendOtp}
          />
        </div>
      </div>

      {selectedOrder && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-[#2d1b0e]/30" onClick={() => setSelectedId(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-[#e6d3b3] bg-[#fffaf3] p-4">
            <OrderDetailsPanel order={selectedOrder} onClose={() => setSelectedId(null)} onVerifyOtp={handleVerifyOtp} onResendOtp={handleResendOtp} />
          </div>
        </div>
      )}

      <RejectReasonModal
        open={rejectModal.open}
        order={rejectModal.order}
        onClose={() => setRejectModal({ open: false, order: null })}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
};

export default AdminOrders;


