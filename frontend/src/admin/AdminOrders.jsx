import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, Filter } from "lucide-react";
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

  useEffect(() => {
    fetchOrders();
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

  const handleAcceptSubmit = (etaMinutes) => {
    if (!acceptModal.order) return;
    const orderId = acceptModal.order._id;
    handleAction(orderId, () => acceptOrder(orderId, etaMinutes));
    setAcceptModal({ open: false, order: null });
  };

  const handleRejectSubmit = (reason) => {
    if (!rejectModal.order) return;
    const orderId = rejectModal.order._id;
    handleAction(orderId, () => rejectOrder(orderId, reason));
    setRejectModal({ open: false, order: null });
  };

  return (
    <div className="space-y-6 page-enter">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="section-title">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Realtime Control
          </div>
          <h2 className="serif">Orders Management</h2>
          <p>{orders.length} total orders · {formatCurrency(totalRevenue)} revenue</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input
              type="text"
              placeholder="Search ID, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full sm:w-64 h-10"
            />
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <OrderTabs activeTab={activeTab} counts={tabCounts} onSelect={setActiveTab} />

      {/* ── ORDERS LIST ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-[var(--surface-border)] bg-white">
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
              onVerifyPickup={(o) => handleAction(o._id, () => markOrderPickedUp(o._id))}
              onMarkReady={(o) => handleAction(o._id, () => markOrderReady(o._id))}
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
        onVerifyPickup={(o) => handleAction(o._id, () => markOrderPickedUp(o._id))}
        onMarkReady={(o) => handleAction(o._id, () => markOrderReady(o._id))}
        onMarkDelivered={(o) => handleAction(o._id, () => markOrderDelivered(o._id))}
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
