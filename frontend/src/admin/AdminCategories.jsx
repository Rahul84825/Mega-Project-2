import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlusCircle, Pencil, Trash2, X, Save, AlertCircle, ToggleLeft, ToggleRight, Upload, Sparkles, Package } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import toast from "../services/utils/toast";

const EMPTY_FORM = { name: "", is_active: true, showInNavbar: false, showInHomepage: false, type: "other", image: null, order: 0 };

const CategoryModal = ({ category, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(category || {}),
    name: category?.name || "",
    is_active: category?.is_active ?? true,
    showInNavbar: category?.showInNavbar ?? false,
    showInHomepage: category?.showInHomepage ?? false,
    type: category?.type === "sweets" ? "sweets" : "other",
    image: null,
    imagePreview: category?.image || null,
    order: category?.order || 0
  }));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      set("image", file);
      set("imagePreview", event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!(form.name || "").trim()) {
      setErrors({ name: "Category name is required" });
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", (form.name || "").trim());
      payload.append("is_active", !!form.is_active);
      payload.append("showInNavbar", !!form.showInNavbar);
      payload.append("showInHomepage", !!form.showInHomepage);
      payload.append("type", form.type === "sweets" ? "sweets" : "other");
      payload.append("order", Number(form.order || 0));
      if (form.image) payload.append("image", form.image);

      await onSave(payload);
      toast.success(category ? "Category updated!" : "Category created!");
    } catch (error) {
      toast.error("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] border border-[var(--surface-border)] shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="serif text-xl font-medium text-[var(--charcoal)]">{category ? "Edit Category" : "Add Category"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--cream)] rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Category Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input-field" placeholder="e.g. Traditional Sweets" />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Cover Image</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video rounded-2xl border-2 border-dashed border-[var(--surface-border)] bg-[var(--cream)]/30 overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group"
            >
              {form.imagePreview ? (
                <img src={form.imagePreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center p-4">
                  <Upload size={24} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Upload Image</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--burgundy)] border-t-transparent rounded-full animate-spin" /></div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="input-field">
                <option value="sweets">Sweets</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] mb-2 block">Order</label>
              <input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--surface-border)]">
            {[
              { id: 'is_active', label: 'Category Active', desc: 'Visible in storefront' },
              { id: 'showInNavbar', label: 'Show in Navbar', desc: 'Display in top menu' },
              { id: 'showInHomepage', label: 'Show in Homepage', desc: 'Feature on home' }
            ].map(toggle => (
              <div key={toggle.id} className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[var(--charcoal)]">{toggle.label}</p>
                  <p className="text-[10px] text-[var(--muted)] font-medium">{toggle.desc}</p>
                </div>
                <button 
                  onClick={() => set(toggle.id, !form[toggle.id])}
                  className={`h-6 w-10 rounded-full transition-colors relative ${form[toggle.id] ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form[toggle.id] ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-10 w-full btn-primary h-12 shadow-xl"
        >
          {loading ? "Processing..." : category ? "Update Category" : "Create Category"}
        </button>
      </div>
    </div>,
    document.body
  );
};

function AdminCategories() {
  const { categories, products, addCategory, updateCategory, deleteCategory, toggleCategory, toggleCategoryFeatured } = useProducts();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const linkedProductCount = (catSlug) => {
    return (products || []).filter((p) => {
      const pCat = typeof p.category === "object" ? p.category?.slug || p.category?.name : p.category;
      return String(pCat || "").toLowerCase() === String(catSlug || "").toLowerCase();
    }).length;
  };

  const sortedCategories = useMemo(
    () => [...(categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

  const handleSave = async (payload) => {
    if (modal === "add") await addCategory(payload);
    else await updateCategory(modal._id || modal.id, payload);
    setModal(null);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto page-enter space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="section-title mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Structure
          </div>
          <h2 className="serif">Categories</h2>
          <p>Organize your মিঠাই catalog and control navigation visibility.</p>
        </div>
        <button onClick={() => setModal("add")} className="btn-primary">
          <PlusCircle size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedCategories.map((cat) => (
          <div key={cat._id} className="bg-white rounded-3xl border border-[var(--surface-border)] overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col h-full shadow-sm">
            <div className="relative aspect-video overflow-hidden bg-[var(--cream)]">
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--surface-strong)]/30"><Package size={32} className="text-[var(--muted)] opacity-20" /></div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                {cat.is_active === false && <span className="bg-rose-500 text-white text-[8px] font-medium px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">Inactive</span>}
                {cat.showInNavbar && <span className="bg-[var(--gold)] text-white text-[8px] font-medium px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">Navbar</span>}
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-medium text-[var(--charcoal)] mb-1">{cat.name}</h3>
                  <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">{cat.type}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(cat)} className="p-2 hover:bg-[var(--cream)] rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteConfirm(cat)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[var(--surface-border)] flex justify-between items-center text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">
                <span>{linkedProductCount(cat.slug)} Products</span>
                <span>Order: {cat.order}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && <CategoryModal category={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[var(--surface-border)] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
              <Trash2 size={32} />
            </div>
            <h3 className="serif text-xl font-medium text-[var(--charcoal)] mb-2 text-center">Delete Category?</h3>
            <p className="text-xs text-[var(--muted)] mb-8 font-medium">This will remove <span className="font-medium text-[var(--charcoal)]">{deleteConfirm.name}</span>. Products in this category will need re-assignment.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-outline h-12">Cancel</button>
              <button 
                onClick={async () => {
                  await deleteCategory(deleteConfirm._id || deleteConfirm.id);
                  setDeleteConfirm(null);
                  toast.success("Category removed");
                }}
                className="flex-1 bg-red-600 text-white rounded-xl text-xs font-medium uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg active:scale-95 h-12"
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
}

export default AdminCategories;
