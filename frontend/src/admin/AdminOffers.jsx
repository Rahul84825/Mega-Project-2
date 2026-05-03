import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { api } from "../utils/api";
import { DEFAULT_OFFER_THEME_COLOR, OFFER_THEME_OPTIONS } from "../constants/offerThemes";

const OFFER_TYPES = [
  { id: "banner", label: "Banner Promotion" },
  { id: "category", label: "Category Offer" },
  { id: "product", label: "Product Offer" },
];

const EMPTY_OFFER = {
  title: "",
  description: "",
  discountPercent: 0,
  image: "",
  offerType: "banner",
  targetProduct: "",
  targetCategory: "",
  priority: 0,
  isActive: true,
  themeColor: DEFAULT_OFFER_THEME_COLOR,
};

const OfferModal = ({ offer, products, categories, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_OFFER,
    ...(offer || {}),
    id: offer?._id || offer?.id,
    offerType: offer?.offerType || offer?.offer_type || EMPTY_OFFER.offerType,
    targetProduct:
      offer?.targetProduct?._id ||
      offer?.targetProduct ||
      offer?.linked_product_id?._id ||
      offer?.linked_product_id ||
      "",
    targetCategory:
      offer?.targetCategory ||
      offer?.linked_category_id ||
      offer?.category ||
      "",
    discountPercent: Number(offer?.discountPercent || 0),
    priority: Number(offer?.priority || 0),
    isActive: offer?.isActive !== undefined ? !!offer.isActive : offer?.active !== false,
    themeColor: offer?.themeColor || offer?.theme_color || offer?.bg || DEFAULT_OFFER_THEME_COLOR,
  }));
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  useEffect(() => {
    setForm((prev) => {
      if (prev.offerType === "product" && prev.targetCategory) {
        return { ...prev, targetCategory: "" };
      }
      if (prev.offerType === "category" && prev.targetProduct) {
        return { ...prev, targetProduct: "" };
      }
      if (prev.offerType === "banner" && (prev.targetProduct || prev.targetCategory)) {
        return { ...prev, targetProduct: "", targetCategory: "" };
      }
      return prev;
    });
  }, [form.offerType]);

  const validate = () => {
    const e = {};
    if (!(form.title || "").trim()) e.title = "Title is required";
    if ((form.title || "").trim().length > 0 && (form.title || "").trim().length < 4) {
      e.title = "Title must be at least 4 characters";
    }
    if (form.discountPercent < 0 || form.discountPercent > 100) e.discountPercent = "Discount must be between 0 and 100";
    if (form.offerType === "product" && !form.targetProduct) e.targetProduct = "Select a product";
    if (form.offerType === "category" && !form.targetCategory) e.targetCategory = "Select a category";
    return e;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select a valid image." }));
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const data = await api.upload("/api/upload", fd, token);
      set("image", data.url || "");
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message || "Image upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const payload = {
      title: (form.title || "").trim(),
      description: form.description || "",
      image: form.image || "",
      discount_percentage: Number(form.discountPercent || 0),
      offer_type: form.offerType,
      linked_product_id: form.offerType === "product" ? form.targetProduct : null,
      linked_category_id: form.offerType === "category" ? form.targetCategory : null,
      theme_color: form.themeColor || DEFAULT_OFFER_THEME_COLOR,
      priority: Number(form.priority || 0),
      is_active: !!form.isActive,
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to save offer" }));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 text-sm font-medium border rounded-xl focus:outline-none focus:ring-4 transition-all shadow-inner ${
      hasError
        ? "border-rose-400/70 bg-rose-950/20 text-rose-100 focus:ring-rose-500/20"
        : "border-[#e6d3b3] bg-[#fffaf3] text-[#2d1b0e] focus:border-[#8b4513] focus:ring-[#8b4513]/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1b0e]/25 backdrop-blur-sm px-4">
      <div className="bg-[#fffaf3] rounded-3xl border border-[#e6d3b3] shadow-2xl shadow-[#c7a07a]/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-[#2d1b0e] tracking-tight">
            {offer ? "Edit Offer" : "Create New Offer"}
          </h3>
          <button onClick={onClose} className="p-2 text-[#7a5c3a] hover:text-[#2d1b0e] rounded-full hover:bg-[#f5e6d3] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass(errors.title)} placeholder="Weekend Kitchen Mega Sale" />
              {errors.title && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.title}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputClass(errors.description)} resize-none`} rows={3} placeholder="Short, high-impact offer copy for homepage banner" />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Offer Type</label>
              <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className={inputClass(errors.offerType)}>
                {OFFER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Priority</label>
              <input type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputClass(errors.priority)} placeholder="0" />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Discount %</label>
              <input type="number" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className={inputClass(errors.discountPercent)} placeholder="30" />
              {errors.discountPercent && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.discountPercent}</p>}
            </div>

            {form.offerType === "product" && (
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Linked Product</label>
                <select value={form.targetProduct} onChange={(e) => set("targetProduct", e.target.value)} className={inputClass(errors.targetProduct)}>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.targetProduct && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.targetProduct}</p>}
              </div>
            )}

            {form.offerType === "category" && (
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#7a5c3a] mb-1.5">Linked Category</label>
                <select value={form.targetCategory} onChange={(e) => set("targetCategory", e.target.value)} className={inputClass(errors.targetCategory)}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                {errors.targetCategory && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.targetCategory}</p>}
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="block text-[13px] font-bold text-[#7a5c3a] mb-2">Banner Image</label>
            {form.image ? (
              <div className="relative rounded-xl border border-[#e6d3b3] overflow-hidden bg-[#fffaf3]">
                <img src={form.image} alt="Offer banner" className="w-full h-40 object-cover" />
                <button onClick={() => set("image", "")} className="absolute top-2 right-2 bg-[#fffaf3]/90 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-[#e6d3b3] hover:border-[#8b4513] rounded-xl p-6 bg-[#fffaf3] text-[#7a5c3a] text-sm font-semibold">
                {uploading ? <><ImageIcon className="w-4 h-4 animate-pulse" /> Uploading...</> : <><UploadCloud className="w-4 h-4" /> Upload Banner</>}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            {errors.image && (
              <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.image}
              </p>
            )}
          </div>

          <div className="pt-2">
            <label className="block text-[13px] font-bold text-[#7a5c3a] mb-2">Card Theme</label>
            <div className="flex flex-wrap gap-2">
              {OFFER_THEME_OPTIONS.map((theme) => {
                const selected = form.themeColor === theme.value;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      set("themeColor", theme.value);
                    }}
                    className={`w-9 h-9 rounded-full transition-all ${selected ? "ring-2 ring-offset-2 ring-[#e8883a] ring-offset-[#1a1611]" : "opacity-80 hover:opacity-100"}`}
                    style={{ background: theme.value }}
                    title={theme.label}
                  >
                    {selected ? <span className="block w-2.5 h-2.5 rounded-full bg-white mx-auto" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e0c3a3] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2d1b14]">Offer Active</p>
              <p className="text-[11px] font-medium text-[#6d4c41]">Frontend reflects this immediately</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
              <div className="w-11 h-6 bg-[#e0c3a3] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-[#e0c3a3] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8883a]" />
            </label>
          </div>
        </div>

        {errors.submit ? <p className="mt-4 text-xs font-bold text-rose-600">{errors.submit}</p> : null}

        <button onClick={handleSave} disabled={saving} className="mt-8 w-full flex items-center justify-center gap-2 bg-[#e8883a] hover:bg-[#d97706] disabled:opacity-60 text-white py-3.5 rounded-xl text-sm font-bold transition-all">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : offer ? "Save Changes" : "Publish Offer"}
        </button>
      </div>
    </div>
  );
};

const AdminOffers = () => {
  const { offers, products, categories, addOffer, updateOffer, deleteOffer, toggleOffer, refresh } = useProducts();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  const sortedOffers = useMemo(
    () => [...offers].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)),
    [offers]
  );

  const getId = (o) => o._id || o.id;

  const handleSave = async (form) => {
    try {
      if (modal === "add") {
        await addOffer(form);
        setStatus({ type: "success", message: "Offer created successfully." });
      } else {
        await updateOffer(getId(modal), form);
        setStatus({ type: "success", message: "Offer updated successfully." });
      }
      await refresh();
      return true;
    } catch (err) {
      console.error("Offer save failed", err);
      setStatus({ type: "error", message: err.message || "Failed to save offer." });
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteOffer(deleteConfirm);
      await refresh();
      setStatus({ type: "success", message: "Offer deleted successfully." });
    } catch (err) {
      console.error("Offer delete failed", err);
      setStatus({ type: "error", message: err.message || "Failed to delete offer." });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      await toggleOffer(id);
      await refresh();
    } catch (err) {
      console.error("Offer toggle failed", err);
      setStatus({ type: "error", message: err.message || "Failed to toggle offer status." });
    } finally {
      setTogglingId("");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2d1b14] tracking-tight">Offers Management</h2>
          <p className="text-sm font-medium text-[#6d4c41] mt-1">Create, prioritize, and target promotions across banner/product/category offers</p>
        </div>
        <button onClick={() => setModal("add")} className="flex items-center justify-center gap-2 bg-[#e8883a] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#d97706] transition-all">
          <PlusCircle className="w-4 h-4" /> New Offer
        </button>
      </div>

      {status.message ? (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-semibold ${
            status.type === "error"
              ? "bg-rose-50 text-rose-700 border border-rose-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedOffers.map((offer) => {
          const id = getId(offer);
          const offerType = offer.offer_type || offer.offerType || "banner";
          const themeColor = offer.theme_color || offer.themeColor || DEFAULT_OFFER_THEME_COLOR;
          const active = offer.isActive !== undefined ? offer.isActive : offer.active;
          const discountLabel = offer.discount || (offer.discountPercent ? `${offer.discountPercent}% OFF` : "Special Offer");
          return (
            <div
              key={id}
              className="rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl"
              style={{ background: themeColor }}
            >
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/25 rounded-full opacity-40 blur-2xl group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="bg-white/20 text-[#3b2f2f] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {offerType}
                </span>
                <span className="text-[#6d4c41] text-xs font-bold">Priority: {offer.priority || 0}</span>
              </div>

              {offer.image ? (
                <img src={offer.image} alt={offer.title} className="relative z-10 w-full h-28 object-cover rounded-xl mb-4 border border-white/20" />
              ) : null}

              <div className="relative z-10 mb-5">
                <h3 className="text-[#3b2f2f] font-extrabold text-xl leading-tight mb-1">{offer.title}</h3>
                <p className="text-[#6d4c41] text-[13px] font-medium line-clamp-2 min-h-9">{offer.description || offer.subtitle}</p>
                <p className="text-[#3b2f2f] font-black text-3xl mt-3 tracking-tight">{discountLabel}</p>
              </div>

              <div className="relative z-10 flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleToggle(id)}
                  disabled={togglingId === id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? "bg-[#e8883a] text-white" : "bg-white/15 text-[#3b2f2f] border border-white/20"}`}
                >
                  {togglingId === id ? "Updating..." : active ? "Active" : "Inactive"}
                </button>

                <button onClick={() => setModal(offer)} className="ml-auto p-2 bg-white/10 hover:bg-white/20 text-[#3b2f2f] rounded-xl transition-colors border border-white/10" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirm(id)} className="p-2 bg-white/10 hover:bg-rose-500 text-[#3b2f2f] rounded-xl transition-colors border border-white/10" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <OfferModal
          offer={modal === "add" ? null : modal}
          products={products}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2f2f]/25 backdrop-blur-sm px-4">
          <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-2xl shadow-[#c7a07a]/30 p-6 sm:p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-extrabold text-[#2d1b14] mb-2">Delete Offer?</h3>
            <p className="text-sm text-[#6d4c41] mb-6 leading-relaxed">This offer will be removed from the storefront immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-[#fff8ec] hover:bg-[#efd8b5] border border-[#e0c3a3] text-[#3b2f2f] rounded-xl text-sm font-bold transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;



