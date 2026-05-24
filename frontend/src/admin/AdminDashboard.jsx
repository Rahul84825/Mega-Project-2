import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, Tag, AlertTriangle, TrendingUp, 
  PlusCircle, ShoppingBag, LayoutDashboard, 
  IndianRupee, ChevronRight, Users, Sparkles, Clock, CheckCircle2,
  Download, FileText, BarChart3
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
  const { products, orders, fetchOrders } = useProducts();
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

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock < 10).slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-8 md:space-y-12 page-enter pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-[#e6d3b3] shadow-sm">
        <div className="section-title mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Live Dashboard
          </div>
          <h2 className="serif text-3xl md:text-4xl font-medium text-[#2d1b0e]">Welcome back, Admin</h2>
          <p className="text-sm font-medium text-[#7a5c3a]">Here's what's happening at Mithai World today.</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => downloadReport('sales')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[var(--surface-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)] hover:bg-[var(--cream)] transition-all shadow-sm active:scale-95"
          >
            <FileText size={14} className="text-emerald-600" /> Sales
          </button>
          <button 
            onClick={() => downloadReport('customers')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[var(--surface-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)] hover:bg-[var(--cream)] transition-all shadow-sm active:scale-95"
          >
            <Users size={14} className="text-blue-600" /> Customers
          </button>
        </div>
      </div>

      {/* Stats Grid - Fluid Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-[var(--surface-border)] shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-3 md:mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
              <s.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-1">{s.label}</div>
            <div className="text-lg md:text-2xl font-bold text-[var(--charcoal)]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts - Stacked on Mobile/Tablet */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[var(--surface-border)] shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="serif text-xl md:text-2xl font-medium text-[var(--charcoal)]">Revenue Trend</h3>
              <p className="text-[9px] md:text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1">Last 7 Days Earnings</p>
            </div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b4513" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b4513" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#999'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b4513" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[var(--surface-border)] shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="serif text-xl md:text-2xl font-medium text-[var(--charcoal)]">Order Volume</h3>
              <p className="text-[9px] md:text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1">Daily Order Count</p>
            </div>
            <BarChart3 size={20} className="text-[var(--burgundy)]" />
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#999'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{fill: '#f5e6d3', opacity: 0.4}}
                />
                <Bar dataKey="orders" fill="#b67b3a" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="serif text-xl md:text-2xl font-medium text-[var(--charcoal)] flex items-center gap-2">
              <Clock size={20} className="text-[var(--gold)]" /> Recent Activity
            </h3>
            <button onClick={() => navigate("/admin/orders")} className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--burgundy)] hover:text-[var(--gold)] transition-colors flex items-center gap-1.5 active:scale-95">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-[var(--surface-border)] overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--cream)]/50 border-b border-[var(--surface-border)]">
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Order</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Customer</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Status</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o._id} className="hover:bg-[var(--cream)]/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-[var(--charcoal)]">#{o.orderNumber || o._id?.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-[var(--muted)] mt-1 font-bold">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-[var(--charcoal)]">{o.customer?.name}</div>
                        <div className="text-[10px] text-[var(--muted)] font-bold">{o.customer?.phone}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase bg-[var(--surface-strong)] text-[var(--muted)]">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-xs font-black text-[var(--burgundy)]">{formatCurrency(o.total)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-[var(--surface-border)]">
              {orders.slice(0, 5).map((o) => (
                <div key={o._id} className="p-5 flex items-center justify-between gap-4 active:bg-[var(--cream)]/30 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-[var(--charcoal)]">#{o.orderNumber || o._id?.slice(-6).toUpperCase()}</span>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[var(--surface-strong)] text-[var(--muted)]">{o.status}</span>
                    </div>
                    <div className="text-[11px] font-bold text-[var(--charcoal)] truncate">{o.customer?.name}</div>
                    <div className="text-[9px] text-[var(--muted)] font-bold">{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-[var(--burgundy)]">{formatCurrency(o.total)}</div>
                    <ChevronRight size={14} className="text-[var(--gold)] ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="py-20 text-center text-sm text-[var(--muted)] font-bold uppercase tracking-widest opacity-50">No recent orders yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-8 lg:space-y-10">
          <div>
            <h3 className="serif text-xl md:text-2xl font-medium text-[var(--charcoal)] flex items-center gap-2 mb-6">
              <AlertTriangle size={20} className="text-amber-500" /> Inventory Alerts
            </h3>
            <div className="bg-white rounded-[32px] border border-[var(--surface-border)] p-6 space-y-4 shadow-sm">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 group hover:bg-amber-100 transition-colors">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shrink-0 border border-amber-200">
                      <img src={p.images?.[0]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-[var(--charcoal)] truncate">{p.name}</div>
                      <div className="text-[10px] text-amber-700 font-black uppercase tracking-tighter">Only {p.stock} units left</div>
                    </div>
                    <button 
                      onClick={() => navigate("/admin/add-product", { state: { product: p } })}
                      className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm active:scale-90 transition-transform"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <CheckCircle2 size={32} className="text-green-500 opacity-60" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">All items stocked</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--charcoal)] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-150" />
            <div className="relative z-10">
              <h4 className="serif text-2xl mb-3 font-medium text-[var(--gold)]">Need Help?</h4>
              <p className="text-white/60 text-xs mb-8 font-medium leading-relaxed">Access the Mithai World knowledge base or contact tech support for priority assistance.</p>
              <button className="w-full h-12 rounded-2xl bg-white text-[var(--burgundy)] text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">Documentation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

