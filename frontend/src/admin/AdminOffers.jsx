import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Image as ImageIcon, Pencil, PlusCircle, Save, Trash2, UploadCloud, X, Sparkles, Percent } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import api from "../services/api";
import toast from "../services/utils/toast";

const OFFER_TYPES = [
  { id: "banner", label: "Banner Promotion" },
  { id: "category", label: "Category Offer" },
  { id: "product", label: "Product Offer" }
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
  isActive: true
};

const normalizeOffer = (offer = {}) => ({
  ...EMPTY_OFFER,
  ...offer,
  id: offer?._id || offer?.id,
  offerType: offer?.offerType || offer?.offer_type || EMPTY_OFFER.offerType,
  targetProduct: offer?.targetProduct?._id || offer?.targetProduct || offer?.linked_product_id?._id || offer?.linked_product_id || "",
  targetCategory: offer?.targetCategory || offer?.linked_category_id || offer?.category || "",
  discountPercent: Number(offer?.discountPercent || offer?.discount_percentage || 0),
  priority: Number(offer?.priority || 0),
  isActive: offer?.isActive !== undefined ? !!offer.isActive : offer?.active !== false
});

const OfferModal = ({ offer, products, categories, onSave, onClose }) => {
  const [form, setForm] = useState(() => normalizeOffer(offer));
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/api/upload", formData);
      set("image", data.url || "");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return setErrors({ title: "Required" });

    const payload = {
      ...form,
      discount_percentage: Number(form.discountPercent),
      offer_type: form.offerType,
      linked_product_id: form.offerType === "product" ? form.targetProduct : null,
      linked_category_id: form.offerType === "category" ? form.targetCategory : null,
      is_active: !!form.isActive
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[var(--surface-border)] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="serif text-xl font-medium text-[var(--charcoal)]">{offer ? "Edit Offer" : "Create Offer"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[var(--cream)] transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Offer Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className="input-field" placeholder="e.g. Diwali Sweets Extravaganza" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input-field min-h-[80px]" placeholder="Short, sweet message for the customers..." />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Offer Type</label>
              <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className="input-field">
                {OFFER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Priority</label>
                <input type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Discount %</label>
                <input type="number" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className="input-field" />
              </div>
            </div>

            {form.offerType === "product" && (
              <div className="sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Linked Product</label>
                <select value={form.targetProduct} onChange={(e) => set("targetProduct", e.target.value)} className="input-field">
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {form.offerType === "category" && (
              <div className="sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Linked Category</label>
                <select value={form.targetCategory} onChange={(e) => set("targetCategory", e.target.value)} className="input-field">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Banner Image</label>
            <div 
              onClick={() => !uploading && document.getElementById('offer-img').click()}
              className="aspect-[21/9] rounded-2xl border-2 border-dashed border-[var(--surface-border)] bg-[var(--cream)]/30 overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group"
            >
              {form.image ? (
                <img src={form.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center p-4">
                  <UploadCloud size={32} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Upload Banner</p>
                </div>
              )}
              <input id="offer-img" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--burgundy)] border-t-transparent rounded-full animate-spin" /></div>}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--cream)]/30 border border-[var(--surface-border)]">
            <div>
              <p className="text-sm font-medium text-[var(--charcoal)]">Offer Active</p>
              <p className="text-[10px] text-[var(--muted)] font-medium">Toggle visibility on storefront</p>
            </div>
            <button 
              onClick={() => set("isActive", !form.isActive)}
              className={`h-6 w-10 rounded-full transition-colors relative ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.isActive ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-10 w-full btn-primary h-14 shadow-2xl"
        >
          {saving ? "Saving..." : offer ? "Save Changes" : "Publish Offer"}
        </button>
      </div>
    </div>,
    document.body
  );
};

const AdminOffers = () => {
  const { offers, products, categories, addOffer, updateOffer, deleteOffer, toggleOffer, refreshAll } = useProducts();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busyId, setBusyId] = useState("");

  const sortedOffers = useMemo(
    () => [...(Array.isArray(offers) ? offers : [])].sort((a, b) => (b.priority || 0) - (a.priority || 0)),
    [offers]
  );

  const handleSave = async (form) => {
    if (modal === "add") await addOffer(form);
    else await updateOffer(modal._id || modal.id, form);
    await refreshAll();
  };

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      await toggleOffer(id);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500 page-enter space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="section-title mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Promotions
          </div>
          <h2 className="serif font-medium">Offers & Deals</h2>
          <p className="font-medium">Create high-impact marketing banners and discount offers.</p>
        </div>
        <button onClick={() => setModal("add")} className="btn-primary">
          <PlusCircle size={16} /> New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedOffers.map((offer) => (
          <div key={offer._id} className="bg-white rounded-3xl border border-[var(--surface-border)] overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full shadow-sm">
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--cream)]">
              {offer.image ? (
                <img src={offer.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)]/10 to-[var(--burgundy)]/10">
                  <Percent size={40} className="text-[var(--muted)] opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="bg-[var(--saffron)] text-white text-[10px] font-medium px-3 py-1 rounded-lg shadow-xl uppercase tracking-widest">{offer.discountPercent}% OFF</span>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--charcoal)] leading-tight mb-2">{offer.title}</h3>
                  <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">{offer.offerType}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(offer)} className="p-2 hover:bg-[var(--cream)] rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => setDeleteConfirm(offer._id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)] line-clamp-2 mb-6 font-medium leading-relaxed">{offer.description}</p>

              <div className="mt-auto pt-6 border-t border-[var(--surface-border)] flex justify-between items-center">
                <button 
                  disabled={busyId === offer._id}
                  onClick={() => handleToggle(offer._id)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest transition-all
                    ${offer.isActive ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {busyId === offer._id ? "..." : offer.isActive ? "Active" : "Inactive"}
                </button>
                <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Priority: {offer.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && <OfferModal offer={modal === "add" ? null : modal} products={products} categories={categories} onSave={handleSave} onClose={() => setModal(null)} />}

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[var(--surface-border)] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
              <Trash2 size={32} />
            </div>
            <h3 className="serif text-xl font-medium text-[var(--charcoal)] mb-2 text-center">Remove Offer?</h3>
            <p className="text-xs text-[var(--muted)] mb-8 leading-relaxed font-medium">This promotion will be permanently removed from the storefront slider.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-outline font-medium h-12">Cancel</button>
              <button 
                onClick={async () => {
                  await deleteOffer(deleteConfirm);
                  setDeleteConfirm(null);
                  toast.success("Offer removed");
                  await refreshAll();
                }}
                className="flex-1 bg-red-600 text-white rounded-xl text-[11px] font-medium uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg active:scale-95 h-12"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminOffers;
