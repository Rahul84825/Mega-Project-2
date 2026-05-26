import React, { useState, useEffect } from "react";
import { 
  Ticket, Plus, Trash2, Search, Calendar, 
  Percent, DollarSign, Clock, CheckCircle2, X 
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    expiresAt: "",
    usageLimit: "",
    description: ""
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/coupons");
      if (data.success) setCoupons(data.coupons);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load coupons"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post("/api/coupons", form);
      if (data.success) {
        setCoupons(prev => [data.coupon, ...prev]);
        setShowAddModal(false);
        setForm({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          minOrderAmount: "",
          maxDiscount: "",
          expiresAt: "",
          usageLimit: "",
          description: ""
        });
      }
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to create coupon"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const { data } = await api.delete(`/api/coupons/${id}`);
      if (data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to delete coupon"));
    }
  };

  if (loading) return <div className="p-10 text-center">Loading coupons...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl serif font-medium text-[#2d1b0e]">Coupon Management</h2>
          <p className="text-sm text-[#7a5c3a] mt-1 text-bold">Create and manage promotional offer codes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--burgundy)] text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs hover:bg-[#2d1b0e] transition-all shadow-lg"
        >
          <Plus size={18} /> Create New Coupon
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon._id} className="bg-white rounded-3xl border border-[#e6d3b3] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[#8b4513] group-hover:scale-110 transition-transform">
              <Ticket size={80} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-[#f5e6d3] text-[#8b4513] px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-[#e6d3b3]">
                  {coupon.code}
                </span>
                <button 
                  onClick={() => handleDeleteCoupon(coupon._id)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h4 className="text-xl font-bold text-[#2d1b0e] mb-1">
                {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
              </h4>
              <p className="text-xs text-[#7a5c3a] mb-6 font-medium leading-relaxed">{coupon.description || "No description provided."}</p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#b67b3a] uppercase tracking-wider">
                  <Clock size={14} /> Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#b67b3a] uppercase tracking-wider">
                  <CheckCircle2 size={14} /> Min Order: ₹{coupon.minOrderAmount}
                </div>
                {coupon.maxDiscount && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#b67b3a] uppercase tracking-wider">
                    <DollarSign size={14} /> Max Discount: ₹{coupon.maxDiscount}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#b67b3a] uppercase tracking-wider">
                  <Search size={14} /> Used: {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && !loading && (
        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-[#e6d3b3]">
          <div className="h-20 w-20 bg-[var(--cream)] rounded-full flex items-center justify-center text-[var(--gold)] mx-auto mb-6">
            <Ticket size={40} />
          </div>
          <h3 className="serif text-2xl text-[#2d1b0e]">No active coupons</h3>
          <p className="text-[#7a5c3a] mt-2">Start by creating your first promotional code.</p>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-md px-4 py-6">
          <div className="w-full max-w-xl bg-[#fffaf3] rounded-[40px] border border-[#e6d3b3] shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-[#e6d3b3]/50 flex items-center justify-between bg-[var(--cream)]/30">
              <div>
                <h3 className="text-2xl serif text-[#2d1b0e]">New Coupon</h3>
                <p className="text-[10px] uppercase tracking-widest text-[#b67b3a] font-bold mt-1">Configure your discount code</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-[#f5e6d3] transition-colors text-[#7a5c3a]">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-10 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Coupon Code</label>
                  <input required name="code" value={form.code} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e] uppercase" placeholder="e.g. WELCOME10" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Discount Type</label>
                  <select name="discountType" value={form.discountType} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Value</label>
                  <input required type="number" name="discountValue" value={form.discountValue} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]" placeholder="10" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Min Order (₹)</label>
                  <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]" placeholder="500" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Max Discount (₹)</label>
                  <input type="number" name="maxDiscount" value={form.maxDiscount} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]" placeholder="200" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Expiry Date</label>
                  <input required type="date" name="expiresAt" value={form.expiresAt} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]" />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Usage Limit</label>
                  <input type="number" name="usageLimit" value={form.usageLimit} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-2 border-[#e6d3b3] bg-white px-5 text-sm font-bold text-[#2d1b0e]" placeholder="100" />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b67b3a] block mb-2">Description</label>
                  <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full rounded-2xl border-2 border-[#e6d3b3] bg-white p-5 text-sm font-medium text-[#2d1b0e] h-24" placeholder="Briefly describe the offer..."></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-14 rounded-2xl border border-[#e6d3b3] text-xs font-bold uppercase tracking-widest text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-14 rounded-2xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50">
                  {isSubmitting ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
