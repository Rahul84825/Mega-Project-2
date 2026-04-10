import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage, getOrders, getProducts } from "../services/api";
import { socket } from "../services/socket";
import OrderManager from "./OrderManager";
import ProductManager from "./ProductManager";

const getAdminTabFromPath = (pathname) => {
  if (pathname === "/admin/orders") {
    return "orders";
  }

  return "products";
};

const getAdminPathFromTab = (tab) => (tab === "orders" ? "/admin/orders" : "/admin/products");

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => getAdminTabFromPath(window.location.pathname));
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const highlightTimerRef = useRef(null);

  const getOrderId = (order) => order?.id || order?._id || null;

  const triggerNewOrderAlert = (order) => {
    const orderId = getOrderId(order) || Date.now().toString();

    setOrders((prev) => {
      if (prev.some((existing) => getOrderId(existing) === orderId)) {
        return prev;
      }

      return [{ ...order, _id: orderId }, ...prev];
    });

    setHighlightedOrderId(orderId);

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedOrderId(null);
    }, 2000);

    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {
      // Ignore autoplay restrictions or missing audio playback support.
    });
  };

  const upsertOrder = (order, highlight = false) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    setOrders((prev) => {
      const existingIndex = prev.findIndex((existing) => getOrderId(existing) === orderId);

      if (existingIndex === -1) {
        return [{ ...order, _id: orderId }, ...prev];
      }

      return prev.map((existing) => (getOrderId(existing) === orderId ? { ...existing, ...order, _id: orderId } : existing));
    });

    if (highlight) {
      setHighlightedOrderId(orderId);

      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }

      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedOrderId(null);
      }, 2000);
    }
  };

  const showAdminNotice = (text) => {
    setAdminNotice(text);
    window.setTimeout(() => setAdminNotice(""), 2500);
  };

  const navigateToTab = (tab) => {
    setActiveTab(tab);
    const nextPath = getAdminPathFromTab(tab);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getAdminTabFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setInitialLoading(true);
        setDashboardError("");
        const [productsData, ordersData] = await Promise.all([
          getProducts(),
          getOrders()
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        setProducts([]);
        setOrders([]);
        setDashboardError(getApiErrorMessage(error, "Unable to load admin data right now."));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  useEffect(() => {
    const handleNewOrder = (order) => {
      if (!order || typeof order !== "object" || Array.isArray(order)) {
        return;
      }

      triggerNewOrderAlert(order);
      upsertOrder(order, true);
    };

    const handleOrderUpdated = (order) => {
      if (!order || typeof order !== "object" || Array.isArray(order)) {
        return;
      }

      upsertOrder(order, true);
    };

    socket.auth = { role: "admin" };

    if (!socket.connected) {
      socket.connect();
    }

    socket.off("newOrder", handleNewOrder);
    socket.off("orderUpdated", handleOrderUpdated);
    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.disconnect();

      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "#1A0F0A" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--saffron)", textTransform: "uppercase", marginBottom: 4 }}>Admin Panel</div>
            <h1 className="serif" style={{ fontSize: 36, color: "white" }}>Mithai World Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[["📦", products.length, "Products"], ["🛍️", orders.length, "Orders"], ["💰", "₹" + orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString(), "Revenue"]].map(([icon, val, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.06)", padding: "16px 24px", textAlign: "center", border: "1px solid rgba(244,160,36,0.15)" }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div className="serif" style={{ fontSize: 22, color: "var(--saffron)", fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {adminNotice && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(244,160,36,0.12)", color: "var(--saffron)", border: "1px solid rgba(244,160,36,0.25)", fontSize: 13 }}>
            {adminNotice}
          </div>
        )}

        {dashboardError && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(176,0,32,0.14)", color: "#FFB0C0", border: "1px solid rgba(255,120,140,0.35)", fontSize: 13 }}>
            {dashboardError}
          </div>
        )}

        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid rgba(244,160,36,0.15)" }}>
          {["products", "orders"].map((t) => (
            <button
              key={t}
              onClick={() => navigateToTab(t)}
              style={{
                padding: "12px 28px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "DM Sans, sans-serif",
                color: activeTab === t ? "var(--saffron)" : "rgba(255,255,255,0.4)",
                borderBottom: activeTab === t ? "2px solid var(--saffron)" : "2px solid transparent",
                marginBottom: -1
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <ProductManager
            products={products}
            setProducts={setProducts}
            initialLoading={initialLoading}
            setDashboardError={setDashboardError}
            showAdminNotice={showAdminNotice}
          />
        )}

        {activeTab === "orders" && (
          <OrderManager
            orders={orders}
            setOrders={setOrders}
            initialLoading={initialLoading}
            setDashboardError={setDashboardError}
            showAdminNotice={showAdminNotice}
            highlightedOrderId={highlightedOrderId}
            getOrderId={getOrderId}
            upsertOrder={upsertOrder}
          />
        )}
      </div>
    </div>
  );
}
