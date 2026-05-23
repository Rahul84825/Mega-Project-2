import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, Tag, AlertTriangle, TrendingUp, 
  PlusCircle, ShoppingBag, LayoutDashboard, 
  IndianRupee, ChevronRight, Users, Sparkles, Clock, CheckCircle2,
  Download, FileText, BarChart3, Volume2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "shared/utils/pricing";
import api from "../services/api";
import toast from "../services/utils/toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { products, orders, fetchOrders, playNotification } = useProducts();
  const [loading, setLoading] = useState(true);
  const [reportStats, setReportStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    dailyStats: []
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchOrders();
        const { data } = await api.get("/api/reports/stats");
        setReportStats(data.stats || data);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchOrders]);

  const statsCards = [
    { 
      label: "Total Revenue", 
      value: formatCurrency(reportStats.totalRevenue || 0), 
      icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" 
    },
    { 
      label: "Total Orders", 
      value: reportStats.totalOrders || 0, 
      icon: ShoppingBag, color: "text-[var(--burgundy)]", bg: "bg-red-50" 
    },
    { 
      label: "Store Items", 
      value: products.length, 
      icon: Package, color: "text-[var(--gold)]", bg: "bg-amber-50" 
    },
    { 
      label: "Customers", 
      value: reportStats.totalUsers || 0, 
      icon: Users, color: "text-blue-600", bg: "bg-blue-50" 
    },
  ];

  const chartData = useMemo(() => {
    return (reportStats.dailyStats || []).map(d => ({
      date: new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: d.revenue,
      orders: d.count
    }));
  }, [reportStats.dailyStats]);

  const downloadReport = async (type) => {
    try {
      toast.info(`Preparing ${type} report...`);
      const response = await api.get(`/api/reports/${type}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type} report downloaded!`);
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  const handleSoundTest = () => {
    playNotification();
    toast.success("Notification sound enabled!");
  };

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock < 10).slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-10 page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="section-title mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Live Dashboard
          </div>
          <h2 className="serif font-medium">Welcome back, Admin</h2>
          <p className="font-medium">Here's what's happening at Mithai World today.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSoundTest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm"
            title="Ensure order sounds are enabled"
          >
            <Volume2 size={14} /> Sound Test
          </button>
          <button 
            onClick={() => downloadReport('sales')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[var(--surface-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)] hover:bg-[var(--cream)] transition-all shadow-sm"
          >
            <FileText size={14} className="text-emerald-600" /> Sales CSV
          </button>
          <button 
            onClick={() => downloadReport('customers')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[var(--surface-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)] hover:bg-[var(--cream)] transition-all shadow-sm"
          >
            <Users size={14} className="text-blue-600" /> Customers CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-[var(--surface-border)] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="serif text-xl font-medium text-[var(--charcoal)]">Revenue Trend</h3>
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest mt-1">Last 7 Days Earnings</p>
            </div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b4513" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b4513" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#999'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b4513" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-[var(--surface-border)] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="serif text-xl font-medium text-[var(--charcoal)]">Order Volume</h3>
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest mt-1">Daily Order Count</p>
            </div>
            <BarChart3 size={20} className="text-[var(--burgundy)]" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#999'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  cursor={{fill: '#f5e6d3', opacity: 0.4}}
                />
                <Bar dataKey="orders" fill="#b67b3a" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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

