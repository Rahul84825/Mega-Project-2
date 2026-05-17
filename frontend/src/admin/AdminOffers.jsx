import { useMemo, useState } from "react";
import { AlertCircle, Image as ImageIcon, Pencil, PlusCircle, Save, Trash2, UploadCloud, X } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import api from "../services/api";

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
  targetProduct:
    offer?.targetProduct?._id ||
    offer?.targetProduct ||
    offer?.linked_product_id?._id ||
    offer?.linked_product_id ||
    "",
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

  const inputClass = (hasError) =>
    `w-full rounded-lg border px-4 py-2.5 text-[13px] font-medium shadow-sm transition-all focus:outline-none ${
      hasError
        ? "border-red-400 bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-2 focus:ring-red-500/20"
        : "border-gray-200 bg-white text-black hover:border-gray-300 focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 placeholder:text-gray-400"
    }`;

  const validate = () => {
    const nextErrors = {};
    if (!String(form.title || "").trim()) nextErrors.title = "Title is required";
    if (String(form.title || "").trim().length > 0 && String(form.title || "").trim().length < 4) {
      nextErrors.title = "Title must be at least 4 characters";
    }
    if (Number(form.discountPercent || 0) < 0 || Number(form.discountPercent || 0) > 100) {
      nextErrors.discountPercent = "Discount must be between 0 and 100";
    }
    if (form.offerType === "product" && !form.targetProduct) nextErrors.targetProduct = "Select a product";
    if (form.offerType === "category" && !form.targetCategory) nextErrors.targetCategory = "Select a category";
    return nextErrors;
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
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      set("image", data.url || "");
    } catch (error) {
      setErrors((prev) => ({ ...prev, image: error.message || "Image upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      title: String(form.title || "").trim(),
      description: form.description || "",
      image: form.image || "",
      discount_percentage: Number(form.discountPercent || 0),
      offer_type: form.offerType,
      linked_product_id: form.offerType === "product" ? form.targetProduct : null,
      linked_category_id: form.offerType === "category" ? form.targetCategory : null,
      priority: Number(form.priority || 0),
      is_active: !!form.isActive
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message || "Failed to save offer" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border border-gray-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-black">{offer ? "Edit Offer" : "Create New Offer"}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass(errors.title)} placeholder="Weekend Kitchen Mega Sale" />
              {errors.title && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.title}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={`${inputClass(errors.description)} resize-none`}
                rows={3}
                placeholder="Short, high-impact offer copy for the banner"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Offer Type</label>
              <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className={inputClass(errors.offerType)}>
                {OFFER_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Priority</label>
              <input type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputClass(errors.priority)} placeholder="0" />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Discount %</label>
              <input type="number" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className={inputClass(errors.discountPercent)} placeholder="30" />
              {errors.discountPercent && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.discountPercent}</p>}
            </div>

            {form.offerType === "product" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Linked Product</label>
                <select value={form.targetProduct} onChange={(e) => set("targetProduct", e.target.value)} className={inputClass(errors.targetProduct)}>
                  <option value="">Select product</option>
                  {(products || []).map((product) => (
                    <option key={product._id || product.id} value={product._id || product.id}>{product.name}</option>
                  ))}
                </select>
                {errors.targetProduct && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.targetProduct}</p>}
              </div>
            )}

            {form.offerType === "category" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Linked Category</label>
                <select value={form.targetCategory} onChange={(e) => set("targetCategory", e.target.value)} className={inputClass(errors.targetCategory)}>
                  <option value="">Select category</option>
                  {(categories || []).map((category) => (
                    <option key={category.slug} value={category.slug}>{category.name}</option>
                  ))}
                </select>
                {errors.targetCategory && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.targetCategory}</p>}
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="mb-2 block text-[13px] font-medium text-gray-600">Banner Image</label>
            {form.image ? (
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img src={form.image} alt="Offer banner" className="h-44 w-full object-cover" />
                <button onClick={() => set("image", "")} className="absolute right-2 top-2 rounded-md bg-white/90 px-3 py-1.5 text-[11px] font-bold text-red-600 shadow-sm transition-colors hover:bg-white hover:text-red-700">
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-[13px] font-medium text-gray-500 transition-colors hover:border-[#d4a017] hover:bg-yellow-50/30">
                {uploading ? <><ImageIcon className="h-4 w-4 animate-pulse" /> Uploading...</> : <><UploadCloud className="h-4 w-4" /> Upload Banner Image</>}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            {errors.image && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
                <AlertCircle className="h-3 w-3" /> {errors.image}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 pb-2">
            <div>
              <p className="text-[14px] font-bold text-black">Offer Active</p>
              <p className="text-[12px] font-medium text-gray-400">Frontend reflects this immediately</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#d4a017] peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
          </div>
        </div>

        {errors.submit ? <p className="mt-4 text-[12px] font-medium text-red-500">{errors.submit}</p> : null}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#b91c1c] py-[13px] text-[14px] font-medium text-white transition-all active:scale-[0.98] hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Save className="h-4 w-4" />
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
    () => [...(Array.isArray(offers) ? offers : [])].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)),
    [offers]
  );

  const getId = (offer) => offer?._id || offer?.id;

  const handleSave = async (form) => {
    try {
      console.log("[AdminOffers] save payload", form);
      if (modal === "add") {
        await addOffer(form);
        setStatus({ type: "success", message: "Offer created successfully." });
      } else {
        await updateOffer(getId(modal), form);
        setStatus({ type: "success", message: "Offer updated successfully." });
      }
      await refresh();
      return true;
    } catch (error) {
      console.error("Offer save failed", error);
      setStatus({ type: "error", message: error.message || "Failed to save offer." });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteOffer(deleteConfirm);
      await refresh();
      setStatus({ type: "success", message: "Offer deleted successfully." });
    } catch (error) {
      console.error("Offer delete failed", error);
      setStatus({ type: "error", message: error.message || "Failed to delete offer." });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      console.log("[AdminOffers] toggle click", id);
      await toggleOffer(id);
      await refresh();
    } catch (error) {
      console.error("Offer toggle failed", error);
      setStatus({ type: "error", message: error.message || "Failed to toggle offer status." });
    } finally {
      setTogglingId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Offers Management</h2>
          <p className="mt-0.5 text-[13px] font-medium text-gray-500">Create, prioritize, and target promotions across banner/product/category offers</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#b91c1c] px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-150 hover:bg-[#991b1b] active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" /> New Offer
        </button>
      </div>

      {status.message ? (
        <div className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-[13px] font-medium ${status.type === "error" ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-700"}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {status.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sortedOffers.map((offer) => {
          const id = getId(offer);
          const offerType = offer?.offer_type || offer?.offerType || "banner";
          const active = offer?.isActive !== undefined ? offer.isActive : offer?.active;
          const discountLabel = offer?.discount || (offer?.discountPercent ? `${offer.discountPercent}% OFF` : "Special Offer");

          return (
            <div key={id} className="group relative overflow-hidden rounded-[20px] border border-black/5 bg-[#fff8f0] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f5e1c8]">
                {offer?.image ? (
                  <img src={offer.image} alt={offer.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1d120d] px-6 text-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.35em] text-[#d4a017]">Mithai World</div>
                      <h3 className="mt-3 text-2xl font-bold text-white">{offer.title}</h3>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,8,6,0.08)_0%,rgba(11,8,6,0.40)_65%,rgba(11,8,6,0.82)_100%)] pointer-events-none" />

                <div className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-2">
                  <span className="rounded-full bg-white/16 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {offerType}
                  </span>
                  <span className="rounded-full bg-[#d4a017] px-3 py-1 text-[11px] font-bold text-[#1d120d] shadow-sm">
                    Priority {offer?.priority || 0}
                  </span>
                </div>

                {discountLabel && (
                  <div className="absolute right-4 top-14 z-10 rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                    {discountLabel}
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight drop-shadow-lg">{offer.title}</h3>
                  {offer.description && <p className="mt-2 line-clamp-2 text-sm text-white/86">{offer.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-black/8 bg-white/70 px-4 py-4 backdrop-blur-sm">
                <button
                  onClick={() => handleToggle(id)}
                  disabled={togglingId === id}
                  className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${active ? "bg-black/80 text-white shadow-sm" : "border border-black/10 bg-white/70 text-black hover:bg-white"}`}
                >
                  {togglingId === id ? "Updating..." : active ? "Active" : "Inactive"}
                </button>

                <div className="ml-auto flex gap-2">
                  <button onClick={() => setModal(offer)} className="rounded-lg bg-white/80 p-2 text-black shadow-sm transition-colors hover:bg-white" title="Edit Offer">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(id)} className="rounded-lg bg-white/80 p-2 text-black shadow-sm transition-colors hover:bg-red-500 hover:text-white" title="Delete Offer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[16px] border border-gray-200 bg-white p-6 text-center shadow-xl animate-in zoom-in-95 duration-200 sm:p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-black">Delete Offer?</h3>
            <p className="mb-8 text-[13px] leading-relaxed text-gray-500">This offer will be removed from the storefront immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-lg bg-[#b91c1c] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#991b1b] active:scale-[0.98] disabled:bg-gray-400">
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