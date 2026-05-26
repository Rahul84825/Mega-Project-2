import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud, AlertCircle, CheckCircle2, X, Plus, Trash2, Sparkles, Package, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { useProducts } from "../context/ProductContext";
import api from "../services/api";
import { formatCurrency, TAX_MESSAGE } from "shared/utils/pricing";

const EMPTY_FORM_BASE = {
  name: "",
  category: "",
  description: "",
  image: "",
  images: [],
  tags: "",
  gstPercent: "0",
  packingCharges: "0",
  isSignature: false,
  isSnack: false,
  isMalaiBarfi: false,
  isActive: true,
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
        tags: (productFromState.tags || []).join(", "),
        gstPercent: String(productFromState.gstPercent || "0"),
        packingCharges: String(productFromState.packingCharges || "0"),
        isSignature: Boolean(productFromState.isSignature),
        isSnack: Boolean(productFromState.isSnack),
        isMalaiBarfi: Boolean(productFromState.isMalaiBarfi),
        isActive: productFromState.isActive !== undefined ? Boolean(productFromState.isActive) : true,
        variants: (productFromState.variants || []).map(v => ({
          id: v._id || v.id,
          label: v.label || "",
          mrp: String(v.mrp || ""),
          discountPercent: String(v.discountPercent || "0"),
          stock: String(v.stock || "0"),
          isAvailable: v.isAvailable !== undefined ? Boolean(v.isAvailable) : true
        }))
      });
    } else {
      setForm({ ...EMPTY_FORM_BASE, variants: [{ id: 'v1', label: '', mrp: '', discountPercent: '0', stock: '0', isAvailable: true }] });
    }
  }, [isEditMode, productFromState]);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const setCollection = (type) => {
    setForm(prev => ({
      ...prev,
      isSignature: type === "signature",
      isSnack: type === "snack",
      isMalaiBarfi: type === "malai-barfi"
    }));
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
      variants: [...prev.variants, { id: `v${Date.now()}`, label: '', mrp: '', discountPercent: '0', stock: '0', isAvailable: true }]
    }));
  };

  const removeVariant = (id) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.length > 1 ? prev.variants.filter(v => v.id !== id) : prev.variants
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    // Filter for images only
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please select image files only.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      imageFiles.forEach(f => formData.append("images", f));
      
      const { data } = await api.post("/api/upload/multiple", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const urls = (data.images || []).map(img => img.url).filter(Boolean);
      if (urls.length > 0) {
        setForm(prev => ({ 
          ...prev, 
          images: [...prev.images, ...urls], 
          image: prev.image || urls[0] 
        }));
        toast.success(`Successfully uploaded ${urls.length} images`);
      } else {
        throw new Error("No image URLs returned from server");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      const msg = err.response?.data?.message || err.message || "Upload failed";
      toast.error(msg);
      setErrors(prev => ({ ...prev, image: msg }));
    } finally {
      setTimeout(() => { 
        setUploading(false); 
        setUploadProgress(0); 
      }, 500);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageUpload(e);
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
    if (Object.keys(e).length || Object.keys(ve).length) {
       toast.error("Please fix errors in the form before saving.");
    }
    return Object.keys(e).length || Object.keys(ve).length ? e : null;
  };

  const handleSubmit = async () => {
    if (validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        gstPercent: Number(form.gstPercent || 0),
        packingCharges: Number(form.packingCharges || 0),
        isSignature: Boolean(form.isSignature),
        isSnack: Boolean(form.isSnack),
        isMalaiBarfi: Boolean(form.isMalaiBarfi),
        isActive: Boolean(form.isActive),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        images: form.images,
        image: form.image || form.images[0] || "",
        variants: form.variants.map(v => ({
          _id: (v.id && !v.id.toString().startsWith('v')) ? v.id : undefined,
          label: v.label.trim(),
          mrp: Math.round(Number(v.mrp)),
          discountPercent: Number(v.discountPercent || 0),
          sellingPrice: calculateSellingPrice(v.mrp, v.discountPercent),
          finalPrice: calculateSellingPrice(v.mrp, v.discountPercent),
          stock: 999, // Numeric stock deprecated: default to high value
          isAvailable: Boolean(v.isAvailable)
        }))
      };

      // Set a high default total stock
      payload.stock = 999 * payload.variants.length;

      if (isEditMode) await updateProduct(productFromState._id, payload);
      else await addProduct(payload);

      setSaved(true);
      toast.success(isEditMode ? "Mithai updated successfully!" : "Mithai published successfully!");
      await fetchProducts();
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      console.error("Save error:", err);
      
      // Handle validation errors from express-validator
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        const errorMap = {};
        serverErrors.forEach(e => {
          errorMap[e.field || 'submit'] = e.message;
        });
        setErrors(prev => ({ ...prev, ...errorMap }));
        toast.error(`Validation failed: ${serverErrors[0].message}`);
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to save mithai";
        toast.error(msg);
        setErrors({ submit: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getCollectionValue = () => {
    if (form.isSignature) return "signature";
    if (form.isSnack) return "snack";
    if (form.isMalaiBarfi) return "malai-barfi";
    return "regular";
  };

  return (
    <div className="max-w-4xl mx-auto page-enter pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/admin/products")} className="p-2 hover:bg-[var(--surface-strong)] rounded-full transition-colors"><ArrowLeft size={20} /></button>
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
              {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field cursor-pointer">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.category}</p>}
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Collection Type</label>
                <select 
                  value={getCollectionValue()} 
                  onChange={e => setCollection(e.target.value)} 
                  className="input-field cursor-pointer"
                >
                  <option value="regular">Regular Collection</option>
                  <option value="signature">Signature Collection</option>
                  <option value="snack">Snacks Collection</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">GST % (Info only)</label>
                <input type="number" value={form.gstPercent} onChange={e => set("gstPercent", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Packing Charges (₹)</label>
                <input type="number" value={form.packingCharges} onChange={e => set("packingCharges", e.target.value)} className="input-field" placeholder="e.g. 10" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-1.5 block">Tags (Optional)</label>
              <input value={form.tags} onChange={e => set("tags", e.target.value)} className="input-field" placeholder="e.g. sugarfree, healthy" />
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
                  <div key={v.id} className={`p-4 rounded-2xl border relative group transition-colors ${v.isAvailable ? 'bg-[var(--cream)]/30 border-[var(--surface-border)]' : 'bg-gray-50 border-gray-200'}`}>
                    <button onClick={() => removeVariant(v.id)} className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={12} /></button>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">Label (e.g. 500g)</label>
                        <input value={v.label} onChange={e => updateVariant(v.id, "label", e.target.value)} className={`input-field h-9 text-xs ${variantErrors[`${v.id}.label`] ? 'border-red-500' : ''}`} disabled={!v.isAvailable} />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">MRP (₹)</label>
                        <input type="number" value={v.mrp} onChange={e => updateVariant(v.id, "mrp", e.target.value)} className={`input-field h-9 text-xs ${variantErrors[`${v.id}.mrp`] ? 'border-red-500' : ''}`} disabled={!v.isAvailable} />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--muted)] mb-1 block">Discount (%)</label>
                        <input type="number" value={v.discountPercent} onChange={e => updateVariant(v.id, "discountPercent", e.target.value)} className="input-field h-9 text-xs" disabled={!v.isAvailable} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--surface-border)]/50">
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${v.isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>{v.isAvailable ? 'Available' : 'Unavailable'}</span>
                       <button 
                          type="button"
                          onClick={() => updateVariant(v.id, "isAvailable", !v.isAvailable)}
                          className={`h-5 w-9 rounded-full transition-all relative shrink-0 ${v.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                       >
                          <div className={`absolute h-3 w-3 rounded-full bg-white transition-all shadow-sm top-1 ${v.isAvailable ? 'left-[20px]' : 'left-1'}`} />
                       </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 border-t border-[var(--surface-border)] pt-3">
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-[var(--muted)] font-medium uppercase tracking-tighter">Price Breakdown</span>
                         <span className="text-[var(--muted)] italic">{TAX_MESSAGE}</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                         <div className="bg-white/50 p-2 rounded-lg border border-[var(--surface-border)]/50">
                            <p className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-tighter mb-0.5">Net Selling</p>
                            <p className="text-xs font-bold text-[var(--charcoal)]">
                               {formatCurrency(sp)}
                            </p>
                         </div>
                         <div className="bg-white/50 p-2 rounded-lg border border-[var(--surface-border)]/50">
                            <p className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-tighter mb-0.5">GST ({form.gstPercent}%)</p>
                            <p className="text-xs font-bold text-emerald-600">
                               + {formatCurrency(Math.round((sp * Number(form.gstPercent || 0)) / 100))}
                            </p>
                         </div>
                         <div className="bg-white/50 p-2 rounded-lg border border-[var(--surface-border)]/50">
                            <p className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-tighter mb-0.5">Packing</p>
                            <p className="text-xs font-bold text-emerald-600">
                               + {formatCurrency(Number(form.packingCharges || 0))}
                            </p>
                         </div>
                         <div className="bg-[var(--burgundy)]/5 p-2 rounded-lg border border-[var(--burgundy)]/20">
                            <p className="text-[8px] font-bold text-[var(--burgundy)] uppercase tracking-tighter mb-0.5">Total Price</p>
                            <p className="text-xs font-bold text-[var(--burgundy)]">
                               {formatCurrency(sp + Math.round((sp * Number(form.gstPercent || 0)) / 100) + Number(form.packingCharges || 0))}
                            </p>
                         </div>
                      </div>
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
              <div 
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`aspect-square rounded-2xl bg-[var(--cream)] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center relative group transition-colors ${errors.image ? 'border-red-300' : 'border-[var(--surface-border)] hover:border-[var(--gold)]'}`}
              >
                {form.images[0] ? (
                  <img src={form.images[0]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-center p-4">
                    <UploadCloud size={32} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                    <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">Drop files here</p>
                    <p className="text-[9px] text-[var(--muted)] mt-1 font-medium">or click to browse</p>
                  </div>
                )}
                <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" multiple accept="image/*" />
                
                {(uploading || uploadProgress > 0) && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                       <div className="bg-[var(--burgundy)] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-[var(--burgundy)] uppercase tracking-widest">Uploading {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {errors.image && <p className="text-red-500 text-[10px] font-medium text-center">{errors.image}</p>}

              <div className="grid grid-cols-4 gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-[var(--surface-border)] relative group cursor-pointer hover:border-[var(--gold)] transition-all">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        images: prev.images.filter((_, idx) => idx !== i),
                        image: prev.images[i] === prev.image ? prev.images.filter((_, idx) => idx !== i)[0] || "" : prev.image
                      }))} 
                      className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                    {img === form.image && <div className="absolute top-1 right-1 h-2 w-2 bg-[var(--gold)] rounded-full shadow-sm" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--charcoal)] p-6 rounded-3xl text-white shadow-2xl space-y-6">
            <h3 className="serif text-xl text-[var(--saffron)]">Publish</h3>
            <p className="text-xs text-white/60">Ensure all details are correct. Products are visible to customers immediately after publishing.</p>
            
            {/* Storefront Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-[var(--gold)] transition-colors cursor-pointer" onClick={() => set("isActive", !form.isActive)}>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${form.isActive ? 'bg-[var(--gold)] text-[var(--charcoal)]' : 'bg-white/10 text-white/40'}`}>
                  <Package size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Storefront Visibility</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-tighter">{form.isActive ? "Visible to customers" : "Hidden from customers"}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.isActive ? 'left-6' : 'left-1'}`} />
              </div>
            </div>

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
