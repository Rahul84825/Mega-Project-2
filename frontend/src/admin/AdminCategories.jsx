import { useMemo, useState } from "react";
import { PlusCircle, Pencil, Trash2, X, Save, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { useProducts } from "../context/ProductContext";

const EMPTY_FORM = { name: "", is_active: true, isFeatured: false };

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const CategoryModal = ({ category, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(category || {}),
    name: category?.name || category?.label || "",
    is_active: category?.is_active ?? category?.isActive ?? category?.active ?? true,
    isFeatured: category?.isFeatured ?? category?.showInNavbar ?? false,
  }));
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const submit = async () => {
    if (!(form.name || "").trim()) {
      setErrors({ name: "Category name is required" });
      return;
    }
    console.log("Adding category:", {
      name: (form.name || "").trim(),
      slug: toSlug(form.name),
      is_active: !!form.is_active,
      isFeatured: !!form.isFeatured,
    });
    await onSave({
      name: (form.name || "").trim(),
      slug: toSlug(form.name),
      is_active: !!form.is_active,
      isFeatured: !!form.isFeatured,
    });
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 text-sm font-medium border rounded-xl focus:outline-none focus:ring-4 transition-all ${
      hasError
        ? "border-rose-400/70 bg-rose-950/20 text-rose-100 focus:ring-rose-500/20"
        : "border-[#e0c3a3] bg-[#fff8ec] text-[#3b2f2f] focus:border-[#e8883a] focus:ring-[#e8883a]/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2f2f]/25 backdrop-blur-sm px-4">
      <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-2xl shadow-[#c7a07a]/30 w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-[#2d1b14] tracking-tight">{category ? "Edit Category" : "Add Category"}</h3>
          <button onClick={onClose} className="p-2 text-[#6d4c41] hover:text-[#3b2f2f] rounded-full hover:bg-[#f5e1c8] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">Category Name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Cookware"
              className={inputClass(errors.name)}
            />
            {errors.name && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.name}</p>}
          </div>

          <div className="pt-2 border-t border-[#e0c3a3] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2d1b14]">Category Active</p>
              <p className="text-[11px] font-medium text-[#6d4c41]">Only active categories appear on storefront</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.is_active}
                onChange={() => set("is_active", !form.is_active)}
              />
              <div className="w-11 h-6 bg-[#e0c3a3] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-[#e0c3a3] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8883a]" />
            </label>
          </div>

          <div className="pt-2 border-t border-[#e0c3a3] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2d1b14]">Show in Navbar</p>
              <p className="text-[11px] font-medium text-[#6d4c41]">Only featured categories appear in navbar (max 4).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.isFeatured}
                onChange={() => set("isFeatured", !form.isFeatured)}
              />
              <div className="w-11 h-6 bg-[#e0c3a3] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-[#e0c3a3] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8883a]" />
            </label>
          </div>
        </div>

        <button
          onClick={submit}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-[#e8883a] hover:bg-[#d97706] text-white py-3.5 rounded-xl text-sm font-bold transition-all"
        >
          <Save className="w-4 h-4" /> {category ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, toggleCategory, toggleCategoryFeatured } = useProducts();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  const linkedProductCount = (categorySlug) => {
    return (products || []).filter((p) => {
      const pCat = typeof p.category === "object" ? p.category?.slug || p.category?.name : p.category;
      return String(pCat || "").toLowerCase() === String(categorySlug || "").toLowerCase();
    }).length;
  };

  const sortedCategories = useMemo(
    () => [...(categories || [])].sort((a, b) => Number(b.is_active ?? b.isActive ?? b.active) - Number(a.is_active ?? a.isActive ?? a.active)),
    [categories]
  );

  const handleSave = async (payload) => {
    try {
      setError(null);
      console.log("🔐 handleSave called with modal state:", modal === "add" ? "ADD" : "EDIT", "payload:", payload);
      if (modal === "add") {
        await addCategory(payload);
        console.log("✅ Category added successfully");
      } else {
        await updateCategory(modal._id || modal.id, payload);
        console.log("✅ Category updated successfully");
      }
      setModal(null);
    } catch (err) {
      const message = err?.message || "Failed to save category. Please try again.";
      console.error("❌ Error saving category:", message);
      setError(message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2d1b14] tracking-tight">Categories</h2>
          <p className="text-sm font-medium text-[#6d4c41] mt-1">Manage category catalog and active status.</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center justify-center gap-2 bg-[#e8883a] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#d97706] transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">Error</p>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!sortedCategories || sortedCategories.length === 0 ? (
        <div className="rounded-2xl border border-[#e0c3a3] bg-[#fff8ec] p-12 text-center">
          <AlertCircle className="w-12 h-12 text-[#6d4c41] mx-auto mb-3 opacity-50" />
          <p className="text-[#6d4c41] font-medium">No categories yet</p>
          <p className="text-[#6d4c41] text-sm mt-1 opacity-70">Create your first category to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedCategories.map((cat) => {
          const id = cat._id || cat.id;
          const active = cat.is_active ?? cat.isActive ?? cat.active;
          const linked = linkedProductCount(cat.slug);
          const featured = !!(cat.isFeatured ?? cat.showInNavbar);

          return (
            <div key={id} className="bg-[#fff8ec] rounded-2xl border border-[#e0c3a3] hover:border-[#e8883a] shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col group">
              <div className="mb-4">
                <button
                  onClick={() => toggleCategory(id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    active ? "bg-[#e8883a]/20 text-white border-[#e8883a]/40" : "bg-[#fff8ec] text-[#6d4c41] border-[#e0c3a3]"
                  }`}
                >
                  {active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {active ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-extrabold text-[#2d1b14] leading-tight">{cat.name || cat.label}</h3>
                <div className="flex gap-1 bg-[#fff8ec] rounded-lg p-1 border border-[#e0c3a3] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => setModal(cat)} className="p-1.5 text-[#6d4c41] hover:text-[#e8883a] hover:bg-[#e8883a]/15 rounded-md transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 text-[#6d4c41] hover:text-rose-600 hover:bg-rose-500/15 rounded-md transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toggleCategoryFeatured(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border w-fit mb-3 ${
                  featured ? "bg-[#e8883a]/20 text-white border-[#e8883a]/40" : "bg-[#fff8ec] text-[#6d4c41] border-[#e0c3a3]"
                }`}
              >
                {featured ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                {featured ? "Show in Navbar" : "Hidden from Navbar"}
              </button>

              <div className="pt-3 border-t border-[#e0c3a3] mt-auto text-[11px] text-[#6d4c41] font-medium uppercase tracking-widest">
                <span className="font-bold text-[#2d1b14]">{linked}</span> linked products
              </div>
            </div>
          );
        })}
        </div>
      )}

      {modal && (
        <CategoryModal
          category={modal === "add" ? null : modal}
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

            <h3 className="text-lg font-extrabold text-[#2d1b14] mb-2">Delete Category?</h3>
            <p className="text-sm text-[#6d4c41] mb-6 leading-relaxed">
              This will remove <span className="font-bold text-[#2d1b14]">{deleteConfirm.name || deleteConfirm.label}</span> if it is not linked to products.
            </p>

            {linkedProductCount(deleteConfirm._id || deleteConfirm.id) > 0 && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-snug">
                  This category is linked to products. Reassign products before deleting.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-[#fff8ec] hover:bg-[#efd8b5] border border-[#e0c3a3] text-[#3b2f2f] rounded-xl text-sm font-bold transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteCategory(deleteConfirm._id || deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;



