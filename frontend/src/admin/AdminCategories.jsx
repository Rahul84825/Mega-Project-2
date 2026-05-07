import { useMemo, useRef, useState } from "react";
import { PlusCircle, Pencil, Trash2, X, Save, AlertCircle, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import toast from "../utils/toast";

const EMPTY_FORM = { name: "", is_active: true, showInNavbar: false, showInHomepage: false, type: "other", image: null, order: 0 };

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

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be less than 5MB" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select a valid image file" }));
      return;
    }

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

      if (form.image) {
        payload.append("image", form.image);
      }

      await onSave(payload);
      toast.success(category ? "Category updated successfully!" : "Category created successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 text-[13px] font-medium border rounded-lg focus:outline-none transition-all shadow-sm ${
      hasError
        ? "border-red-400 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500/20 placeholder:text-red-300"
        : "border-gray-200 bg-white text-black focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 placeholder:text-gray-400 hover:border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black tracking-tight">{category ? "Edit Category" : "Add Category"}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Sweets, Savories, Desserts"
              className={inputClass(errors.name)}
              disabled={loading}
            />
            {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1.5">{errors.name}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category Image</label>
            <div className="space-y-3">
              {form.imagePreview && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      set("image", null);
                      set("imagePreview", null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#d4a017] hover:bg-yellow-50/30 text-gray-500 transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span className="text-[13px] font-medium">{form.image ? "Change Image" : "Upload Image"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={loading}
              />
              {errors.image && <p className="text-[11px] font-medium text-red-500">{errors.image}</p>}
              <p className="text-[11px] text-gray-400">Max 5MB • PNG, JPG, JPEG, WEBP</p>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-black">Category Active</p>
              <p className="text-[12px] font-medium text-gray-400">Show in store</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.is_active}
                onChange={() => set("is_active", !form.is_active)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4a017] peer-checked:after:border-white" />
            </label>
          </div>

          {/* Show in Navbar Toggle */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-black">Show in Navbar</p>
              <p className="text-[12px] font-medium text-gray-400">Display in top menu</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.showInNavbar}
                onChange={() => set("showInNavbar", !form.showInNavbar)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4a017] peer-checked:after:border-white" />
            </label>
          </div>

          {/* Show in Homepage Toggle */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-black">Show in Homepage</p>
              <p className="text-[12px] font-medium text-gray-400">Display as featured category</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.showInHomepage}
                onChange={() => set("showInHomepage", !form.showInHomepage)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4a017] peer-checked:after:border-white" />
            </label>
          </div>

          {/* Category Type */}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputClass(errors.type)}
              disabled={loading}
            >
              <option value="sweets">Sweets</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Display Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
              min="0"
              className={inputClass(errors.order)}
              disabled={loading}
            />
            <p className="text-[11px] text-gray-400 mt-1">Lower number = appears first</p>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-[#b91c1c] hover:bg-[#991b1b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-[13px] rounded-lg text-[14px] font-medium transition-all active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : category ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </div>
  );
};

function AdminCategories() {
  const { categories, products, addCategory, updateCategory, deleteCategory, toggleCategory, toggleCategoryFeatured } = useProducts();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  const linkedProductCount = (categoryId) => {
    const cat = categories.find((c) => (c._id || c.id) === categoryId);
    if (!cat) return 0;
    return (products || []).filter((p) => {
      const pCat = typeof p.category === "object" ? p.category?.slug || p.category?.name : p.category;
      return String(pCat || "").toLowerCase() === String(cat.slug || "").toLowerCase();
    }).length;
  };

  const sortedCategories = useMemo(
    () =>
      [...(categories || [])].sort(
        (a, b) => Number(a.order || 0) - Number(b.order || 0) || a.name.localeCompare(b.name)
      ),
    [categories]
  );

  const handleSave = async (payload) => {
    try {
      setError(null);
      if (modal === "add") {
        await addCategory(payload);
      } else {
        await updateCategory(modal._id || modal.id, payload);
      }
      setModal(null);
    } catch (err) {
      const message = err?.message || "Failed to save category. Please try again.";
      console.error("❌ Error saving category:", message);
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black tracking-tight">Categories</h2>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">Manage category catalog with images and homepage controls.</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center justify-center gap-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 bg-red-50 text-red-700 border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Grid ── */}
      {!sortedCategories || sortedCategories.length === 0 ? (
        <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-black font-medium">No categories yet</p>
          <p className="text-gray-500 text-[13px] mt-1">Create your first category to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedCategories.map((cat) => {
            const id = cat._id || cat.id;
            const active = cat.is_active ?? true;
            const linked = linkedProductCount(id);
            const showInNavbar = !!cat.showInNavbar;
            const showInHomepage = !!cat.showInHomepage;

            return (
              <div key={id} className="bg-white rounded-[16px] border border-gray-200 hover:shadow-md transition-all duration-300 p-5 flex flex-col group">
                
                {/* Image */}
                {cat.image && (
                  <div className="mb-4 w-full h-32 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                )}

                {/* Active Status */}
                <div className="mb-3 flex">
                  <button
                    onClick={() => toggleCategory(id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      active 
                        ? "bg-[#d4a017] text-white border-[#d4a017]" 
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {active ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Name and Actions */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-black leading-tight">{cat.name}</h3>
                  <div className="flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => setModal(cat)} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(cat)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Toggles Container */}
                <div className="space-y-2.5 mb-4">
                  {/* Homepage Toggle */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <span className="text-[12px] font-medium text-gray-500">Show in Homepage</span>
                    <button
                      onClick={() => updateCategory(id, { showInHomepage: !showInHomepage })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        showInHomepage ? "bg-[#d4a017] text-white border-[#d4a017]" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {showInHomepage ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Navbar Toggle */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <span className="text-[12px] font-medium text-gray-500">Show in Navbar</span>
                    <button
                      onClick={() => toggleCategoryFeatured(id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        showInNavbar ? "bg-[#d4a017] text-white border-[#d4a017]" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {showInNavbar ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Linked Products */}
                <div className="mt-auto text-[11px] text-gray-400 font-medium uppercase tracking-widest">
                  <span className="font-bold text-black">{linked}</span> linked products
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {modal && (
        <CategoryModal
          category={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-xl p-6 sm:p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-black mb-2">Delete Category?</h3>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
              This will remove <span className="font-bold text-black">{deleteConfirm.name}</span> if it is not linked to products.
            </p>

            {linkedProductCount(deleteConfirm._id || deleteConfirm.id) > 0 && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 font-medium leading-snug">
                  This category is linked to products. Reassign products before deleting.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-[13px] font-semibold transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteCategory(deleteConfirm._id || deleteConfirm.id);
                    setDeleteConfirm(null);
                    toast.success("Category deleted successfully!");
                  } catch (err) {
                    toast.error(err?.message || "Failed to delete category");
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg text-[13px] font-semibold transition-colors active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCategoriesExport() {
  return <AdminCategories />;
}

export default AdminCategoriesExport;