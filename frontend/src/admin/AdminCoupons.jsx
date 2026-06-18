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

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    expiresAt: "",
    usageLimit: "",
    description: "",
    showOnCheckout: false
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

  useEffect(() => { fetchCoupons(); }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post("/api/coupons", form);
      if (data.success) {
        setCoupons(prev => [data.coupon, ...prev]);
        setShowAddModal(false);
        setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxDiscount: "", expiresAt: "", usageLimit: "", description: "", showOnCheckout: false });
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
      if (data.success) setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to delete coupon"));
    }
  };

  if (loading) return <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-[#7a5c3a]">Loading coupons...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-[#e6d3b3] shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl serif font-medium text-[#2d1b0e]">Promo Codes</h2>
          <p className="text-[11px] font-bold text-[#7a5c3a] uppercase tracking-wider mt-1 opacity-70">Manage discounts & offer codes</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-[var(--burgundy)] text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.1em] text-[10px] hover:bg-[#2d1b0e] transition-all shadow-md active:scale-95"
        >
          <Plus size={14} /> New Coupon
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-widest">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon._id} className="bg-white rounded-2xl border border-[#e6d3b3] p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute -top-2 -right-2 p-4 opacity-5 text-[#8b4513] group-hover:scale-110 transition-transform">
              <Ticket size={60} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <span className="bg-[#f5e6d3] text-[#8b4513] px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase border border-[#e6d3b3] w-fit">
                    {coupon.code}
                  </span>
                  {coupon.showOnCheckout && (
                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                      <Clock size={8} /> Visible on Checkout
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteCoupon(coupon._id)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <h4 className="text-lg font-black text-[#2d1b0e] mb-0.5">
                {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
              </h4>
              <p className="text-[10px] text-[#7a5c3a] mb-5 font-bold uppercase tracking-tight opacity-80">{coupon.description || "Special promotional offer."}</p>

              <div className="mt-auto pt-4 border-t border-[#e6d3b3]/40 grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#b67b3a] uppercase tracking-tighter">
                  <Calendar size={12} className="opacity-70" /> {new Date(coupon.expiresAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#b67b3a] uppercase tracking-tighter">
                  <CheckCircle2 size={12} className="opacity-70" /> Min: ₹{coupon.minOrderAmount}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#b67b3a] uppercase tracking-tighter">
                  <Search size={12} className="opacity-70" /> Used: {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                </div>
                {coupon.maxDiscount && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-[#b67b3a] uppercase tracking-tighter">
                    <DollarSign size={12} className="opacity-70" /> Cap: ₹{coupon.maxDiscount}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && !loading && (
        <div className="py-16 text-center bg-white rounded-[32px] border-2 border-dashed border-[#e6d3b3]">
          <Ticket size={32} className="text-[var(--gold)] mx-auto mb-4 opacity-40" />
          <h3 className="serif text-xl text-[#2d1b0e]">No Coupons</h3>
          <p className="text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest mt-1 opacity-60">Create your first promo code to get started.</p>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#2d1b0e]/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-[#fffaf3] rounded-[32px] border border-[#e6d3b3] shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-[#e6d3b3]/50 flex items-center justify-between bg-[var(--cream)]/30">
              <div>
                <h3 className="text-xl serif text-[#2d1b0e]">New Promo Code</h3>
                <p className="text-[9px] uppercase tracking-widest text-[#b67b3a] font-black mt-0.5">Configure discount parameters</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-[#f5e6d3] transition-colors text-[#7a5c3a]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Coupon Code</label>
                  <input required name="code" value={form.code} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-black text-[#2d1b0e] uppercase focus:border-[var(--burgundy)] outline-none transition-all" placeholder="WELCOME10" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Type</label>
                  <select name="discountType" value={form.discountType} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Value</label>
                  <input required type="number" name="discountValue" value={form.discountValue} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none" placeholder="10" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Min Order (₹)</label>
                  <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none" placeholder="500" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Max Discount (₹)</label>
                  <input type="number" name="maxDiscount" value={form.maxDiscount} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none" placeholder="200" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Expiry Date</label>
                  <input required type="date" name="expiresAt" value={form.expiresAt} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Usage Limit</label>
                  <input type="number" name="usageLimit" value={form.usageLimit} onChange={handleInputChange} className="w-full h-12 rounded-xl border-2 border-[#e6d3b3] bg-white px-4 text-xs font-bold text-[#2d1b0e] focus:border-[var(--burgundy)] outline-none" placeholder="100" />
                </div>

                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#b67b3a] block mb-1.5 ml-1">Description</label>
                  <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full rounded-xl border-2 border-[#e6d3b3] bg-white p-4 text-xs font-medium text-[#2d1b0e] h-20 outline-none focus:border-[var(--burgundy)]" placeholder="Short description..."></textarea>
                </div>

                <div className="col-span-2 flex items-center gap-3 bg-white p-4 rounded-xl border-2 border-[#e6d3b3]">
                  <input 
                    type="checkbox" 
                    id="showOnCheckout" 
                    name="showOnCheckout" 
                    checked={form.showOnCheckout} 
                    onChange={handleInputChange}
                    className="h-5 w-5 accent-emerald-600 rounded border-[#e6d3b3]"
                  />
                  <label htmlFor="showOnCheckout" className="text-[10px] font-black uppercase tracking-widest text-[#2d1b0e] cursor-pointer select-none">
                    Show On Checkout
                    <span className="block text-[8px] font-bold text-[#b67b3a] lowercase opacity-70">Customers can see and apply this from the checkout page.</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-xl border border-[#e6d3b3] text-[10px] font-black uppercase tracking-widest text-[#7a5c3a] hover:bg-[#f5e6d3] transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50">
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
