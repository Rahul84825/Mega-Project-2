import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, Tag, AlertTriangle, TrendingUp, 
  PlusCircle, ShoppingBag, LayoutDashboard, 
  IndianRupee, ChevronRight, Users, Sparkles, Clock, CheckCircle2
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "../utils/priceCalculator";
import api from "../services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { products, orders, fetchOrders } = useProducts();
  const [adminStats, setAdminStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    recentOrders: []
  });

  useEffect(() => {
    fetchOrders();
    api.get("/api/admin/stats")
      .then(res => setAdminStats(res.data || res))
      .catch(() => {});
  }, [fetchOrders]);

  const statsCards = [
    { 
      label: "Total Revenue", 
      value: formatCurrency(orders.filter(o => !['REJECTED'].includes(o.status)).reduce((sum, o) => sum + Number(o.totals?.grandTotal || o.total || 0), 0)), 
      icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" 
    },
    { 
      label: "Active Orders", 
      value: orders.filter(o => !['DELIVERED', 'REJECTED'].includes(o.status)).length, 
      icon: ShoppingBag, color: "text-[var(--burgundy)]", bg: "bg-red-50" 
    },
    { 
      label: "Store Items", 
      value: products.length, 
      icon: Package, color: "text-[var(--gold)]", bg: "bg-amber-50" 
    },
    { 
      label: "Customers", 
      value: adminStats.totalUsers || adminStats.stats?.totalUsers || 0, 
      icon: Users, color: "text-blue-600", bg: "bg-blue-50" 
    },
  ];

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock < 10).slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-10 page-enter">
      <div className="section-title">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
          <Sparkles size={12} /> Live Dashboard
        </div>
        <h2 className="serif font-medium">Welcome back, Admin</h2>
        <p className="font-medium">Here's what's happening at Mithai World today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-[var(--surface-border)] shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={`h-12 w-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 shadow-inner`}>
              <s.icon size={24} />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">{s.label}</div>
            <div className="text-2xl font-medium text-[var(--charcoal)]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="serif text-xl font-medium text-[var(--charcoal)] flex items-center gap-2">
              <Clock size={20} className="text-[var(--gold)]" /> Recent Activity
            </h3>
            <button onClick={() => navigate("/admin/orders")} className="text-[10px] font-medium uppercase tracking-widest text-[var(--burgundy)] hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--surface-border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--cream)]/50 border-b border-[var(--surface-border)]">
                    <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Order</th>
                    <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o._id} className="hover:bg-[var(--cream)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-[var(--charcoal)]">#{o.orderNumber || o._id?.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-[var(--muted)] mt-0.5 font-medium">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-[var(--charcoal)]">{o.customer?.name}</div>
                        <div className="text-[10px] text-[var(--muted)] font-medium">{o.customer?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium uppercase bg-[var(--surface-strong)] text-[var(--muted)]">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-medium text-[var(--charcoal)]">{formatCurrency(o.total)}</div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-10 text-center text-xs text-[var(--muted)] font-medium">No recent orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="serif text-xl font-medium text-[var(--charcoal)] flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Inventory Alerts
          </h3>
          <div className="bg-white rounded-3xl border border-[var(--surface-border)] p-6 space-y-4 shadow-sm">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-white shrink-0">
                    <img src={p.images?.[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-[var(--charcoal)] truncate">{p.name}</div>
                    <div className="text-[10px] text-amber-700 font-medium font-medium">Only {p.stock} units left</div>
                  </div>
                  <button onClick={() => navigate(`/admin/edit-product/${p._id}`)} className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm">
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">All items stocked</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--charcoal)] p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
            <h4 className="serif text-xl mb-2 font-medium">Need Help?</h4>
            <p className="text-white/60 text-xs mb-6 font-medium">Access the Mithai World knowledge base or contact tech support.</p>
            <button className="w-full h-10 rounded-xl bg-white text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest shadow-lg">Documentation</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
