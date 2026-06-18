import { useEffect, useMemo, useState, useRef } from "react";
import { Search, Sparkles, Filter, Clock, Loader2 } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "shared/utils/pricing";
import toast from "../services/utils/toast";
import OrderCard from "./orders/OrderCard";
import OrderTabs from "./orders/OrderTabs";
import RejectReasonModal from "./orders/RejectReasonModal";
import AcceptOrderModal from "./orders/AcceptOrderModal";
import OrderDetailsModal from "./orders/OrderDetailsModal";
import { ORDER_TABS, resolveStatus } from "./orders/orderUtils";

const AdminOrders = () => {
  const {
    orders,
    fetchOrders,
    acceptOrder,
    rejectOrder,
    markOrderReady,
    markOrderPickedUp,
    markOrderDelivered,
  } = useProducts();

  const [activeTab, setActiveTab] = useState("NEW");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, order: null });
  const [acceptModal, setAcceptModal] = useState({ open: false, order: null });

  // ── AUTO-REFRESH LOGIC FOR ACTIVE ORDERS (FIXED) ──
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    fetchOrders();

    const refreshActiveOrders = () => {
      const activeStatuses = ["PLACED", "PREPARING", "READY", "PICKED_UP"];
      const hasActiveOrders = (ordersRef.current || []).some(o => activeStatuses.includes(resolveStatus(o)));

      if (hasActiveOrders) {
        console.log("🔄 ORDER_STATUS_REFRESHED: Polling for active orders...");
        fetchOrders();
      }
    };

    // Polling interval: 30 seconds for active orders (safe fallback, sockets handle instant sync)
    const interval = setInterval(refreshActiveOrders, 30000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const selectedOrder = useMemo(() => 
    (orders || []).find(o => o._id === selectedId),
  [orders, selectedId]);

  const tabCounts = useMemo(() => {
    const counts = Object.fromEntries(ORDER_TABS.map((tab) => [tab.id, 0]));
    (orders || []).forEach((order) => {
      const status = resolveStatus(order);
      ORDER_TABS.forEach((tab) => {
        if (tab.statuses.includes(status)) counts[tab.id] += 1;
      });
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    const tab = ORDER_TABS.find((item) => item.id === activeTab) || ORDER_TABS[0];
    return (orders || [])
      .filter((order) => tab.statuses.includes(resolveStatus(order)))
      .filter((order) => {
        const id = String(order.orderNumber || order._id || "").toLowerCase();
        const name = String(order.customer?.name || "").toLowerCase();
        const phone = String(order.customer?.phone || "");
        return id.includes(q) || name.includes(q) || phone.includes(q);
      });
  }, [orders, activeTab, search]);

  const totalRevenue = useMemo(
    () => (orders || []).reduce((sum, order) => sum + Number(order.totals?.grandTotal || order.total || 0), 0),
    [orders]
  );

  const handleAction = async (orderId, action) => {
    if (busyOrderId) return;
    setBusyOrderId(orderId);
    try {
      await action();
    } catch (error) {
      console.error("Action failed:", error);
      const message = error.response?.data?.message || error.message || "Action failed";
      toast.error(message);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleManualSync = async () => {
    setBusyOrderId("sync");
    try {
      await fetchOrders();
      toast.success("Orders synchronized");
      console.log("🔄 ORDER_STATUS_REFRESHED: Manual sync complete");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAcceptSubmit = async (etaMinutes) => {
    if (!acceptModal.order) return;
    const orderId = acceptModal.order._id;
    await handleAction(orderId, () => acceptOrder(orderId, etaMinutes));
    setAcceptModal({ open: false, order: null });
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectModal.order) return;
    const orderId = rejectModal.order._id;
    await handleAction(orderId, () => rejectOrder(orderId, reason));
    setRejectModal({ open: false, order: null });
  };

  return (
    <div className="space-y-6 page-enter max-w-full overflow-x-hidden">
      {/* ── HEADER ── */}
      <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-[#e6d3b3] shadow-sm">
        <div className="section-title mb-0 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-2.5">
            <Sparkles size={12} /> Realtime Control
          </div>
          <h2 className="serif text-xl sm:text-2xl md:text-3xl">Orders Management</h2>
          <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-1">{orders.length} total orders · {formatCurrency(totalRevenue)} revenue</p>
        </div>
      </div>

      {/* ── STICKY CONTROL & TABS ROW ── */}
      <div className="sticky top-0 bg-[#fffaf3] z-20 -mx-3 px-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 py-3 space-y-3 border-b border-[#e6d3b3]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full h-9 text-xs"
            />
          </div>
          <button 
            onClick={handleManualSync}
            disabled={busyOrderId === "sync"}
            className="w-full sm:w-auto h-9 px-4 rounded-xl border border-[#e6d3b3] bg-white text-[10px] font-bold uppercase tracking-widest text-[#8b4513] hover:bg-[#f5e6d3] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shrink-0"
          >
            {busyOrderId === "sync" ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
            <span className="truncate">Sync Delivery</span>
          </button>
        </div>
        <OrderTabs activeTab={activeTab} counts={tabCounts} onSelect={setActiveTab} />
      </div>

      {/* ── ORDERS LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-10 sm:py-20 text-center rounded-3xl border-2 border-dashed border-[var(--surface-border)] bg-white">
            <div className="h-12 w-12 rounded-full bg-[var(--cream)] flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
              <Filter size={24} />
            </div>
            <h3 className="text-sm font-medium text-[var(--charcoal)]">No orders found</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Try changing the filters or search query.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isActive={selectedId === order._id}
              onSelect={() => setSelectedId(order._id)}
              onAccept={(o) => setAcceptModal({ open: true, order: o })}
              onReject={(o) => setRejectModal({ open: true, order: o })}
              onHandover={(o) => { console.log("STEP_REACHED: Admin button click (Handover)"); handleAction(o._id, () => markOrderPickedUp(o._id)); }}
              onMarkReady={(o) => { console.log("STEP_REACHED: Admin button click (Mark Ready)"); handleAction(o._id, () => markOrderReady(o._id)); }}
              onMarkDelivered={(o) => handleAction(o._id, () => markOrderDelivered(o._id))}
              isBusy={busyOrderId === order._id}
            />
          ))
        )}
      </div>

      <OrderDetailsModal
        open={!!selectedId}
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onHandover={(o) => handleAction(o._id, () => markOrderPickedUp(o._id))}
        onMarkReady={(o) => handleAction(o._id, () => markOrderReady(o._id))}
        onMarkDelivered={(o) => handleAction(o._id, () => markOrderDelivered(o._id))}
        onSync={handleManualSync}
      />

      <AcceptOrderModal
        open={acceptModal.open}
        order={acceptModal.order}
        onClose={() => setAcceptModal({ open: false, order: null })}
        onSubmit={handleAcceptSubmit}
      />

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
