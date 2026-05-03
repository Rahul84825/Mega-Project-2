import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Tag, AlertTriangle, TrendingUp,
  PlusCircle, Eye, ShoppingBag, LayoutDashboard,
  IndianRupee, ChevronRight, Users
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatPrice } from "../utils/priceCalculator";
import api from "../services/api";

const StatCard = ({ label, value, sub, icon: Icon, color, bg, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-[#fffaf3] rounded-[1.25rem] border border-[#e6d3b3] shadow-sm p-6 flex flex-col justify-between group transition-all duration-300
                ${onClick ? "cursor-pointer hover:shadow-lg hover:shadow-black/30 hover:border-[#8b4513] hover:-translate-y-0.5" : ""}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 ${bg} rounded-[14px] flex items-center justify-center shrink-0 ring-1 ring-black/5 transition-transform duration-300 ${onClick ? 'group-hover:scale-110' : ''}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {onClick && (
        <div className="p-1 text-[#7a5c3a] opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
    
    <div>
      <p className="text-[11px] font-bold text-[#7a5c3a] uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-3xl font-extrabold text-[#2d1b0e] mb-1 tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs font-medium text-[#7a5c3a] mt-2">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { products, offers, orders, categories, fetchOrders } = useProducts();
  const navigate = useNavigate();

  const [adminStats, setAdminStats] = useState({ totalUsers: null });

  useEffect(() => {
    fetchOrders();
    api.get("/admin/stats")
      .then((response) => response.data || response)
      .then((data) => setAdminStats(data))
      .catch(() => {});
  }, []);

  const hasAvailableStock = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length) {
      return variants.some((variant) => Number(variant?.stock || 0) > 0);
    }

    return Number(product?.stock || 0) > 0;
  };

  const totalProducts = products.length;
  const inStock       = products.filter((p) => hasAvailableStock(p)).length;
  const outOfStock    = products.filter((p) => !hasAvailableStock(p)).length;
  const recentThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentlyAdded = products.filter((p) => {
    const created = new Date(p.createdAt || p.created_at || 0).getTime();
    return Number.isFinite(created) && created >= recentThreshold;
  }).length;
  const activeOffers  = offers.filter((o) => o.active).length;
  const totalOrders   = orders.length;
  const totalRevenue  = orders.reduce((s, o) => s + (o.total || 0), 0);

  // Resolve category name from _id using context categories
  const getCatName = (cat) => {
    if (!cat) return "Unknown";
    if (typeof cat === "object") return cat.name || cat.label || "Unknown";
    const found = categories.find((c) => c._id === cat || c.id === cat || c.slug === cat);
    if (found) return found.name || found.label || "Unknown";
    return String(cat);
  };

  // Group products by resolved category name
  const categoryCounts = products.reduce((acc, p) => {
    const name = getCatName(p.category);
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fffaf3] border border-[#e6d3b3] text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest mb-3">
            <LayoutDashboard className="w-3.5 h-3.5" /> Overview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2d1b0e] tracking-tight">Admin Dashboard</h2>
          <p className="text-sm font-medium text-[#7a5c3a] mt-1">Here's what's happening in your store today.</p>
        </div>
        
        {/* Quick Actions (Desktop Top-Right) */}
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={() => navigate("/admin/products/add")}
            className="flex items-center gap-2 bg-[#8b4513] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#a0522d] transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <PlusCircle className="w-4 h-4" /> Add Product
          </button>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-[#fffaf3] border border-[#e6d3b3] text-[#7a5c3a] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#f5e6d3] hover:text-[#2d1b0e] transition-colors shadow-sm">
            <Eye className="w-4 h-4" /> View Store
          </button>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} sub="From all confirmed orders"
          icon={IndianRupee} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Total Orders" value={totalOrders} sub="Awaiting processing or completed"
          icon={ShoppingBag} color="text-blue-600" bg="bg-blue-50"
          onClick={() => navigate("/admin/orders")} />
        <StatCard label="Total Products" value={totalProducts} sub={`${recentlyAdded} added in last 30 days`}
          icon={Package} color="text-indigo-600" bg="bg-indigo-50"
          onClick={() => navigate("/admin/products")} />
          
        <StatCard label="In Stock" value={inStock} sub="Items ready to sell"
          icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Out of Stock" value={outOfStock}
          sub={outOfStock > 0 ? "Needs immediate restocking" : "Inventory is fully stocked"}
          icon={AlertTriangle} color={outOfStock > 0 ? "text-rose-400" : "text-[#6d4c41]"} bg={outOfStock > 0 ? "bg-rose-950/30" : "bg-[#fff8ec]"}
          onClick={() => navigate("/admin/products")} />
        <StatCard label="Active Offers" value={activeOffers} sub={`${offers.length} total campaigns running`}
          icon={Tag} color="text-amber-600" bg="bg-amber-50"
          onClick={() => navigate("/admin/offers")} />
        <StatCard label="Registered Users" value={adminStats.totalUsers ?? "—"} sub="Total customer accounts"
          icon={Users} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="Recently Added" value={recentlyAdded} sub="Products added in last 30 days"
          icon={Package} color="text-amber-600" bg="bg-amber-50"
          onClick={() => navigate("/admin/products")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* ── Category Breakdown ── */}
        <div className="bg-[#fffaf3] rounded-3xl border border-[#e6d3b3] shadow-sm p-6 sm:p-8">
          <h3 className="text-base font-extrabold text-[#2d1b0e] mb-6 flex items-center gap-2">
            Products by Category
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryCounts).map(([name, count]) => (
              <div key={name} className="flex items-center gap-4 group">
                <span className="text-xs font-bold text-[#7a5c3a] w-36 truncate group-hover:text-[#2d1b0e] transition-colors">{name}</span>
                <div className="flex-1 bg-[#f5e6d3] rounded-full h-2.5 overflow-hidden border border-[#e6d3b3]">
                  <div className="bg-linear-to-r from-[#d4a373] to-[#8b4513] h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max((count / totalProducts) * 100, 2)}%` }} />
                </div>
                <span className="text-xs font-black text-[#2d1b0e] w-8 text-right bg-[#f5e6d3] py-1 rounded-md border border-[#e6d3b3]">{count}</span>
              </div>
            ))}
            {Object.keys(categoryCounts).length === 0 && (
              <p className="text-sm text-[#7a5c3a] italic py-4">No products found in the catalog.</p>
            )}
          </div>
        </div>

        {/* ── Mobile Quick Actions (Hidden on Desktop) ── */}
        <div className="sm:hidden bg-[#fffaf3] rounded-3xl border border-[#e6d3b3] shadow-sm p-6">
          <h3 className="text-base font-extrabold text-[#2d1b0e] mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/admin/products/add")}
              className="w-full flex items-center justify-center gap-2 bg-[#8b4513] text-white px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-[#a0522d] transition-colors shadow-md">
              <PlusCircle className="w-4 h-4" /> Add New Product
            </button>
            <button onClick={() => navigate("/admin/offers")}
              className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-yellow-100 transition-colors">
              <Tag className="w-4 h-4" /> Manage Offers
            </button>
            <button onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 bg-[#fffaf3] border border-[#e6d3b3] text-[#7a5c3a] px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-[#f5e6d3] transition-colors">
              <Eye className="w-4 h-4" /> View Store Live
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;


