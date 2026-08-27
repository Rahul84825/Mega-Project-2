import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Search, Sparkles, Filter, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "shared/utils/pricing";
import toast from "../services/utils/toast";
import OrderCard from "./orders/OrderCard";
import OrderTabs from "./orders/OrderTabs";
import RejectReasonModal from "./orders/RejectReasonModal";
import AcceptOrderModal from "./orders/AcceptOrderModal";
import OrderDetailsModal from "./orders/OrderDetailsModal";
import KitchenReceiptPrint from "./print/KitchenReceiptPrint";
import { ORDER_TABS, resolveStatus, isBusinessOrder, isRealizedRevenueOrder } from "./orders/orderUtils";

const AdminOrders = () => {
  const {
    orders,
    ordersPagination,
    ordersSummary,
    fetchOrders,
    acceptOrder,
    rejectOrder,
    markOrderReady,
    markOrderPickedUp,
    markOrderDelivered,
    alertingOrderIds,
    clearOrderAlert
  } = useProducts();

  const [activeTab, setActiveTab] = useState("NEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, order: null });
  const [acceptModal, setAcceptModal] = useState({ open: false, order: null });
  const [printingOrder, setPrintingOrder] = useState(null);

  const hasNewOrderAlert = alertingOrderIds && alertingOrderIds.length > 0;

  // Clear order alert when opened/viewed
  useEffect(() => {
    if (selectedId) {
      clearOrderAlert(selectedId);
    }
  }, [selectedId, clearOrderAlert]);

  // Load paginated & filtered orders from backend
  const loadOrders = useCallback((pageNum = page, limitNum = limit, tabId = activeTab, searchTerm = search) => {
    const tab = ORDER_TABS.find((item) => item.id === tabId) || ORDER_TABS[0];
    const statusParam = tab.statuses.join(",");
    fetchOrders({
      page: pageNum,
      limit: limitNum,
      status: statusParam,
      search: searchTerm.trim() || undefined
    });
  }, [fetchOrders, page, limit, activeTab, search]);

  useEffect(() => {
    loadOrders(page, limit, activeTab, search);
  }, [page, limit, activeTab, search, loadOrders]);

  // ── AUTO-REFRESH LOGIC FOR ACTIVE ORDERS ──
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    const refreshActiveOrders = () => {
      const activeStatuses = ["PLACED", "PREPARING", "READY", "PICKED_UP"];
      const hasActiveOrders = (ordersRef.current || []).some(o => activeStatuses.includes(resolveStatus(o)));

      if (hasActiveOrders) {
        console.log("🔄 ORDER_STATUS_REFRESHED: Polling for active orders...");
        loadOrders();
      }
    };

    // Polling interval: 30 seconds for active orders (safe fallback, sockets handle instant sync)
    const interval = setInterval(refreshActiveOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const selectedOrder = useMemo(() => 
    (orders || []).find(o => o._id === selectedId),
  [orders, selectedId]);

  // Database-wide tab counts from backend summary (with fallback to loaded orders)
  const tabCounts = useMemo(() => {
    if (ordersSummary?.tabCounts) {
      return {
        NEW: ordersSummary.tabCounts.NEW || 0,
        PREPARING: ordersSummary.tabCounts.PREPARING || 0,
        READY: ordersSummary.tabCounts.READY || 0,
        DELIVERED: ordersSummary.tabCounts.DELIVERED || 0,
        REJECTED: ordersSummary.tabCounts.REJECTED || 0
      };
    }
    const counts = Object.fromEntries(ORDER_TABS.map((tab) => [tab.id, 0]));
    (orders || []).forEach((order) => {
      const status = resolveStatus(order);
      ORDER_TABS.forEach((tab) => {
        if (tab.statuses.includes(status)) counts[tab.id] += 1;
      });
    });
    return counts;
  }, [ordersSummary, orders]);

  // Current view orders matching current search filter
  const displayedOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders || [];
    return (orders || []).filter((order) => {
      const id = String(order.orderNumber || order._id || "").toLowerCase();
      const name = String(order.customer?.name || "").toLowerCase();
      const phone = String(order.customer?.phone || "");
      return id.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, search]);

  const validBusinessOrders = useMemo(
    () => (orders || []).filter(isBusinessOrder),
    [orders]
  );

  const totalRevenue = useMemo(
    () => (orders || [])
      .filter(isRealizedRevenueOrder)
      .reduce((sum, order) => sum + Number(order.totals?.grandTotal || order.total || 0), 0),
    [orders]
  );

  const totalFilteredCount = ordersPagination?.total ?? displayedOrders.length;
  const totalPages = ordersPagination?.totalPages ?? Math.ceil(totalFilteredCount / limit) ?? 1;

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleAction = useCallback(async (orderId, action) => {
    if (busyOrderId) return;
    setBusyOrderId(orderId);
    try {
      await action();
      loadOrders();
    } catch (error) {
      console.error("Action failed:", error);
      const message = error.response?.data?.message || error.message || "Action failed";
      toast.error(message);
    } finally {
      setBusyOrderId(null);
    }
  }, [busyOrderId, loadOrders]);

  const handleCardSelect = useCallback((order) => {
    setSelectedId(order._id);
  }, []);

  const handleCardAccept = useCallback((order) => {
    setAcceptModal({ open: true, order });
  }, []);

  const handleCardReject = useCallback((order) => {
    setRejectModal({ open: true, order });
  }, []);

  const handleCardHandover = useCallback((order) => {
    handleAction(order._id, () => markOrderPickedUp(order._id));
  }, [handleAction, markOrderPickedUp]);

  const handleCardMarkReady = useCallback((order) => {
    handleAction(order._id, () => markOrderReady(order._id));
  }, [handleAction, markOrderReady]);

  const handleCardMarkDelivered = useCallback((order) => {
    handleAction(order._id, () => markOrderDelivered(order._id));
  }, [handleAction, markOrderDelivered]);

  const handleCardPrint = useCallback((order) => {
    setPrintingOrder(order);
  }, []);

  const handleManualSync = async () => {
    setBusyOrderId("sync");
    try {
      await loadOrders();
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
      {hasNewOrderAlert && (
        <div className="bg-red-600 text-white px-5 py-4 rounded-[24px] flex items-center justify-between gap-3 animate-pulse shadow-lg border border-red-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <span className="font-black text-sm tracking-wider uppercase block">🔴 NEW ORDER WAITING</span>
              <span className="text-[10px] opacity-90 font-medium">There are {alertingOrderIds.length} pending order(s) requiring acceptance! Click on an order to view and stop the alert.</span>
            </div>
          </div>
        </div>
      )}
      {/* ── HEADER ── */}
      <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-[#e6d3b3] shadow-sm">
        <div className="section-title mb-0 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-2.5">
            <Sparkles size={12} /> Realtime Control
          </div>
          <h2 className="serif text-xl sm:text-2xl md:text-3xl">Orders Management</h2>
          <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-1">
            <span className="font-bold text-[var(--charcoal)]">{ordersSummary?.totalOrders ?? orders.length}</span> total orders{" "}
            ({ordersSummary?.businessOrders ?? validBusinessOrders.length} successful) ·{" "}
            <span className="font-bold text-[var(--burgundy)]">{formatCurrency(ordersSummary?.realizedRevenue ?? totalRevenue)}</span> realized revenue
          </p>
        </div>
      </div>

      {/* ── STICKY CONTROL & TABS ROW ── */}
      <div className="sticky top-0 bg-[#fffaf3] z-20 -mx-3 px-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 py-3 space-y-3 border-b border-[#e6d3b3]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input
              type="text"
              placeholder="Search by Order #, Name, Phone..."
              value={search}
              onChange={handleSearchChange}
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
        <OrderTabs activeTab={activeTab} counts={tabCounts} onSelect={handleTabChange} />
      </div>

      {/* ── ORDERS LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {displayedOrders.length === 0 ? (
          <div className="col-span-full py-10 sm:py-20 text-center rounded-3xl border-2 border-dashed border-[var(--surface-border)] bg-white">
            <div className="h-12 w-12 rounded-full bg-[var(--cream)] flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
              <Filter size={24} />
            </div>
            <h3 className="text-sm font-medium text-[var(--charcoal)]">No orders found</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Try changing the filters or search query.</p>
          </div>
        ) : (
          displayedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isActive={selectedId === order._id}
              onSelect={handleCardSelect}
              onAccept={handleCardAccept}
              onReject={handleCardReject}
              onHandover={handleCardHandover}
              onMarkReady={handleCardMarkReady}
              onMarkDelivered={handleCardMarkDelivered}
              onPrint={handleCardPrint}
              isBusy={busyOrderId === order._id}
            />
          ))
        )}
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {totalFilteredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[24px] border border-[#e6d3b3] shadow-sm mt-4">
          <div className="text-xs text-[var(--muted)] font-medium">
            Showing <span className="font-bold text-[var(--charcoal)]">{totalFilteredCount > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="font-bold text-[var(--charcoal)]">{Math.min(page * limit, totalFilteredCount)}</span> of{" "}
            <span className="font-bold text-[var(--charcoal)]">{totalFilteredCount}</span> orders
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)]">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="text-xs font-bold border border-[#e6d3b3] rounded-lg px-2 py-1 bg-white text-[var(--charcoal)] focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-[#e6d3b3] text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--cream)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-[var(--muted)] text-xs">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      page === p
                        ? "bg-[var(--burgundy)] text-white shadow-sm"
                        : "border border-[#e6d3b3] text-[var(--charcoal)] hover:bg-[var(--cream)]"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-[#e6d3b3] text-xs font-bold text-[var(--charcoal)] hover:bg-[var(--cream)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <OrderDetailsModal
        open={!!selectedId}
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onHandover={(o) => handleAction(o._id, () => markOrderPickedUp(o._id))}
        onMarkReady={(o) => handleAction(o._id, () => markOrderReady(o._id))}
        onMarkDelivered={(o) => handleAction(o._id, () => markOrderDelivered(o._id))}
        onSync={handleManualSync}
        onPrint={(o) => setPrintingOrder(o)}
      />

      <KitchenReceiptPrint
        order={printingOrder}
        onAfterPrint={() => setPrintingOrder(null)}
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

