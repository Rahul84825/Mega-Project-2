import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud, AlertCircle, CheckCircle2, X, Plus, Trash2 } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import api from "../services/api";
import { formatCurrency, TAX_MESSAGE } from "../utils/priceCalculator";

const EMPTY_FORM_BASE = {
  name: "",
  category: "",
  description: "",
  image: "",
  images: [],
  brand: "",
  tags: "",
  gstPercent: "0",
  variants: []
};
const MAX_VARIANT_PRICE = 10000000;

const toSafeIntegerString = (value, { min = 0 } = {}) => {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.max(min, Math.floor(numeric)));
};

const toSafePercentString = (value, { min = 0, max = 100 } = {}) => {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const clamped = Math.min(max, Math.max(min, numeric));
  return String(Math.round((clamped + Number.EPSILON) * 100) / 100);
};

const calculateSellingPrice = (mrp, discountPercent) => {
  const p = Number(mrp) || 0;
  const d = Number(discountPercent) || 0;
  return Math.round(p - (p * (d / 100)));
};

const AdminProductForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categories, addProduct, updateProduct, fetchProducts } = useProducts();
  const productFromState = location.state?.product || null;
  const isEditMode = Boolean(productFromState?._id || productFromState?.id);

  const [form, setForm] = useState(EMPTY_FORM_BASE);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [variantErrors, setVariantErrors] = useState({});

  useEffect(() => {
    if (isEditMode && productFromState) {
      setForm({
        name: productFromState.name || "",
        category: typeof productFromState.category === 'object' ? productFromState.category.slug : productFromState.category || "",
        description: productFromState.description || "",
        image: productFromState.images?.[0] || productFromState.image || "",
        images: productFromState.images || (productFromState.image ? [productFromState.image] : []),
        brand: productFromState.brand || "",
        tags: (productFromState.tags || []).join(", "),
        gstPercent: String(productFromState.gstPercent || "0"),
        variants: (productFromState.variants || []).map(v => ({
          id: v._id || v.id,
          label: v.label || "",
          mrp: String(v.mrp || ""),
          discountPercent: String(v.discountPercent || "0"),
          stock: String(v.stock || "0")
        }))
      });
    } else {
      setForm({ ...EMPTY_FORM_BASE, variants: [{ id: 'v1', label: '', mrp: '', discountPercent: '0', stock: '0' }] });
    }
  }, [isEditMode, productFromState]);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const updateVariant = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
    setVariantErrors(prev => ({ ...prev, [`${id}.${field}`]: "" }));
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: `v${Date.now()}`, label: '', mrp: '', discountPercent: '0', stock: '0' }]
    }));
  };

  const removeVariant = (id) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.length > 1 ? prev.variants.filter(v => v.id !== id) : prev.variants
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      const { data } = await api.post("/api/upload/multiple", formData);
      const urls = (data.images || []).map(img => img.url).filter(Boolean);
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls], image: prev.image || urls[0] }));
      setUploadProgress(100);
    } catch (err) {
      setErrors(prev => ({ ...prev, image: "Upload failed" }));
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.category) e.category = "Required";
    
    const ve = {};
    form.variants.forEach(v => {
      if (!v.label.trim()) ve[`${v.id}.label`] = "Required";
      if (!Number(v.mrp)) ve[`${v.id}.mrp`] = "Invalid";
    });

    setVariantErrors(ve);
    return Object.keys(e).length || Object.keys(ve).length ? e : null;
  };

  const handleSubmit = async () => {
    if (validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        variants: form.variants.map(v => ({
          ...v,
          mrp: Number(v.mrp),
          discountPercent: Number(v.discountPercent),
          sellingPrice: calculateSellingPrice(v.mrp, v.discountPercent),
          finalPrice: calculateSellingPrice(v.mrp, v.discountPercent), // Inclusive of GST
          stock: Number(v.stock)
        }))
      };

      if (isEditMode) await updateProduct(productFromState._id, payload);
      else await addProduct(payload);

      setSaved(true);
      await fetchProducts();
      setTimeout(() => navigate("/admin/sweets"), 1500);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto page-enter pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/admin/sweets")} className="p-2 hover:bg-[var(--surface-strong)] rounded-full transition-colors"><ArrowLeft size={20} /></button>
        <div className="section-title mb-0">
          <h2 className="serif">{isEditMode ? "Edit Mithai" : "Add New Mithai"}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* BASIC INFO */}
          <div className="bg-white p-6 rounded-3xl border border-[var(--surface-border)] space-y-4 shadow-sm">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Product Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} className="input-field" placeholder="e.g. Kesar Katli" />
              {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-[10px] mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">GST % (Info only)</label>
                <input type="number" value={form.gstPercent} onChange={e => set("gstPercent", e.target.value)} className="input-field" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} className="input-field min-h-[100px]" placeholder="Describe the taste and ingredients..." />
            </div>
          </div>

          {/* VARIANTS */}
          <div className="bg-white p-6 rounded-3xl border border-[var(--surface-border)] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Pricing & Variants</label>
              <button onClick={addVariant} className="text-[10px] font-medium uppercase tracking-widest text-[var(--burgundy)] hover:underline flex items-center gap-1"><Plus size={12} /> Add Size</button>
            </div>

            <div className="space-y-4">
              {form.variants.map((v, i) => {
                const sp = calculateSellingPrice(v.mrp, v.discountPercent);
                return (
                  <div key={v.id} className="p-4 rounded-2xl bg-[var(--cream)]/30 border border-[var(--surface-border)] relative group">
                    <button onClick={() => removeVariant(v.id)} className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={12} /></button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">Label (e.g. 500g)</label>
                        <input value={v.label} onChange={e => updateVariant(v.id, "label", e.target.value)} className="input-field h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">MRP (₹)</label>
                        <input type="number" value={v.mrp} onChange={e => updateVariant(v.id, "mrp", e.target.value)} className="input-field h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">Discount (%)</label>
                        <input type="number" value={v.discountPercent} onChange={e => updateVariant(v.id, "discountPercent", e.target.value)} className="input-field h-9 text-xs" />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">Stock (Qty)</label>
                        <input type="number" value={v.stock} onChange={e => updateVariant(v.id, "stock", e.target.value)} className="input-field h-9 text-xs" />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-[10px]">
                      <span className="text-[var(--muted)] italic">{TAX_MESSAGE}</span>
                      <span className="font-medium text-[var(--charcoal)]">Selling Price: {formatCurrency(sp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR: MEDIA */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-[var(--surface-border)] shadow-sm">
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-4 block">Product Images</label>
            
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-[var(--cream)] border-2 border-dashed border-[var(--surface-border)] overflow-hidden flex flex-col items-center justify-center relative group">
                {form.images[0] ? (
                  <img src={form.images[0]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-center p-4">
                    <UploadCloud size={32} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                    <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">No primary image</p>
                  </div>
                )}
                <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" multiple />
                {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--burgundy)] border-t-transparent rounded-full animate-spin" /></div>}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-[var(--surface-border)] relative group">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--charcoal)] p-6 rounded-3xl text-white shadow-2xl space-y-6">
            <h3 className="serif text-xl text-[var(--saffron)]">Publish</h3>
            <p className="text-xs text-white/60">Ensure all details are correct. Products are visible to customers immediately after publishing.</p>
            
            <button 
              disabled={submitting || saved}
              onClick={handleSubmit}
              className={`w-full h-14 rounded-2xl font-medium uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2
                ${saved ? 'bg-green-500' : 'bg-[var(--burgundy)] hover:bg-[var(--saffron)] hover:text-[var(--charcoal)]'}`}
            >
              {submitting ? 'Processing...' : saved ? <><CheckCircle2 size={18} /> Success</> : <><Save size={18} /> Save Mithai</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductForm;
