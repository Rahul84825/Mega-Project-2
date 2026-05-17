import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud, AlertCircle, CheckCircle2, X, Plus, Trash2 } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import api from "../services/api";
import { calculateFinalPriceWithGST, calculateSellingPriceFromDiscount, formatPrice } from "../services/utils/priceCalculator";

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
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.max(min, Math.floor(numeric)));
};

const toSafePercentString = (value, { min = 0, max = 100 } = {}) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const clamped = Math.min(max, Math.max(min, numeric));
  return String(Math.round((clamped + Number.EPSILON) * 100) / 100);
};

const toDiscountPercent = (mrp, sellingPrice) => {
  const safeMrp = Number(mrp) || 0;
  const safeSelling = Number(sellingPrice) || 0;
  if (safeMrp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((safeMrp - safeSelling) / safeMrp) * 100 * 100) / 100));
};

const AdminProductForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct } = useProducts();
  const productFromState = location.state?.product || null;
  const isEditMode = Boolean(productFromState?._id || productFromState?.id);

  const variantCounterRef = useRef(0);

  const createVariantId = () => {
    variantCounterRef.current += 1;
    return `var_${Date.now().toString(36)}_${variantCounterRef.current.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  };

  const createEmptyVariant = () => ({
    id: createVariantId(),
    label: "",
    mrp: "",
    discountPercent: "0",
    stock: "0",
  });

  const buildEmptyForm = () => ({
    ...EMPTY_FORM_BASE,
    variants: [createEmptyVariant()]
  });

  const [form, setForm]           = useState(buildEmptyForm);
  const [errors, setErrors]       = useState({});
  const [saved, setSaved]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]       = useState("");
  const [variantErrors, setVariantErrors] = useState({});

  const normalizeIncomingVariantsLocal = (variants, fallbackPrice = "") => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return [{
        id: createVariantId(),
        mrp: fallbackPrice !== "" ? String(fallbackPrice) : "",
        discountPercent: "0",
        stock: "0",
      }];
    }
    return variants.map((variant) => ({
      id: String(variant?.id || variant?._id || createVariantId()),
      label: variant?.label || "",
      mrp: toSafeIntegerString(variant?.mrp ?? "", { min: 0 }),
      discountPercent: toSafePercentString(
        variant?.discountPercent ?? toDiscountPercent(variant?.mrp, variant?.sellingPrice ?? variant?.price ?? 0),
        { min: 0, max: 100 }
      ),
      stock: toSafeIntegerString(variant?.stock ?? 0, { min: 0 }),
    }));
  };

  const validateVariantsLocal = (variants) => {
    const fieldErrors = {};
    if (!Array.isArray(variants) || variants.length === 0) {
      return { general: "At least one variant is required", fieldErrors };
    }
    const ids = new Set();
    for (const variant of variants) {
      if (ids.has(variant.id)) {
        return { general: "Variant IDs must be unique", fieldErrors };
      }
      ids.add(variant.id);
      if (!(variant.label || "").trim()) {
        fieldErrors[`${variant.id}.label`] = "Label is required";
      }
      const mrp = Number(variant.mrp);
      if (!Number.isFinite(mrp) || mrp <= 0) {
        fieldErrors[`${variant.id}.mrp`] = "MRP must be > 0";
      } else if (!Number.isInteger(mrp)) {
        fieldErrors[`${variant.id}.mrp`] = "MRP must be a whole number";
      } else if (mrp > MAX_VARIANT_PRICE) {
        fieldErrors[`${variant.id}.mrp`] = `MRP cannot exceed ${MAX_VARIANT_PRICE.toLocaleString("en-IN")}`;
      }
      const discountPercent = Number(variant.discountPercent);
      if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        fieldErrors[`${variant.id}.discountPercent`] = "Discount must be between 0 and 100%";
      }
      const stock = Number(variant.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        fieldErrors[`${variant.id}.stock`] = "Stock must be a non-negative whole number";
      } else if (!Number.isInteger(stock)) {
        fieldErrors[`${variant.id}.stock`] = "Stock must be a whole number";
      }
    }
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    return {
      general: hasFieldErrors ? "Please fix variant validation errors" : "",
      fieldErrors,
    };
  };

  useEffect(() => {
    if (isEditMode) {
      const product = productFromState || products.find((p) => (p._id || p.id) === (productFromState?._id || productFromState?.id));
      if (product) {
        setForm({
          name: product.name || "",
          category: product.category || "",
          description: product.description || "",
          image: product.images?.[0] || product.image || "",
          images: product.images?.length ? product.images : (product.image ? [product.image] : []),
          brand: product.brand || "",
          tags: (product.tags || []).join(", "),
          gstPercent: String(product.gstPercent ?? "0"),
          variants: normalizeIncomingVariantsLocal(
            product.variants,
            product.basePrice ?? product.price ?? ""
          )
        });
      }
    } else {
      setForm(buildEmptyForm());
    }
    setErrors({});
    setVariantErrors({});
    setSaved(false);
    setSubmitting(false);
  }, [isEditMode, productFromState, products]);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!(form.name || "").trim())         e.name = "Product name is required";
    if (!form.category)                   e.category = "Category is required";
    const gst = Number(form.gstPercent);
    if (!Number.isFinite(gst) || gst < 0 || gst > 100) e.gstPercent = "GST must be between 0 and 100";

    const variantValidation = validateVariantsLocal(form.variants || []);
    setVariantErrors(variantValidation.fieldErrors);
    if (variantValidation.general) e.variants = variantValidation.general;

    return e;
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), createEmptyVariant()],
    }));
  };

  const removeVariant = (variantId) => {
    setForm((prev) => {
      const next = (prev.variants || []).filter((variant) => variant.id !== variantId);
      return {
        ...prev,
        variants: next.length > 0 ? next : [createEmptyVariant()],
      };
    });
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[`${variantId}.label`];
      delete next[`${variantId}.mrp`];
      delete next[`${variantId}.discountPercent`];
      delete next[`${variantId}.stock`];
      return next;
    });
  };

  const updateVariant = (variantId, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }));
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[`${variantId}.${field}`];
      return next;
    });
    setErrors((prev) => ({ ...prev, variants: "" }));
  };

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const invalid = files.find((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setUploadError("Only image files under 5MB are allowed.");
      return;
    }

    setUploadError("");
    setUploading(true);
    setUploadProgress(0);

    const step = Math.max(5, Math.floor(90 / files.length));
    const interval = setInterval(() => setUploadProgress((p) => (p < 90 ? p + step : p)), 220);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const { data } = await api.post("/api/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const uploadedUrls = (data.images || []).map((img) => img.url).filter(Boolean);

      if (!uploadedUrls.length) throw new Error("Upload failed");

      setForm((prev) => {
        const merged = [...(prev.images || []), ...uploadedUrls].filter(Boolean);
        return {
          ...prev,
          images: merged,
          image: merged[0] || "",
        };
      });
      setUploadProgress(100);
    } catch (err) {
      setUploadError("Upload failed: " + err.message);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  }

  async function handleImageUpload(e) {
    await uploadFiles(e.target.files);
    e.target.value = "";
  }

  const removeImageAt = (index) => {
    setForm((prev) => {
      const nextImages = (prev.images || []).filter((_, i) => i !== index);
      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || "",
      };
    });
  };

  const setPrimaryImage = (index) => {
    setForm((prev) => {
      const imgs = [...(prev.images || [])];
      if (!imgs[index]) return prev;
      const [primary] = imgs.splice(index, 1);
      const nextImages = [primary, ...imgs];
      return {
        ...prev,
        images: nextImages,
        image: primary,
      };
    });
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const normalizedVariants = (form.variants || []).map((variant) => {
      const mrp = Math.max(0, Math.floor(Number.isFinite(Number(variant.mrp)) ? Number(variant.mrp) : 0));
      const discountPercent = Math.max(0, Math.min(100, Number(variant.discountPercent) || 0));
      const sellingPrice = calculateSellingPriceFromDiscount(mrp, discountPercent);
      const finalPrice = calculateFinalPriceWithGST(sellingPrice, Number(form.gstPercent || 0));
      const stock = Math.max(0, Math.floor(Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0));

      return {
        label: String(variant.label || "").trim(),
        mrp,
        discountPercent: Math.round((discountPercent + Number.EPSILON) * 100) / 100,
        sellingPrice,
        finalPrice,
        stock,
      };
    }).filter((v) => v.mrp > 0 && v.sellingPrice > 0);

    const payload = {
      name: form.name,
      category: form.category,
      image: (form.images || [])[0] || "",
      images: form.images || [],
      brand: form.brand,
      tags: (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      gstPercent: Math.round((Number(form.gstPercent || 0) + Number.EPSILON) * 100) / 100,
      description: form.description,
      variants: normalizedVariants,
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await updateProduct(productFromState?._id || productFromState?.id, payload);
      } else {
        await addProduct(payload);
        setForm(buildEmptyForm());
        setErrors({});
        setVariantErrors({});
      }

      setSaved(true);
      setTimeout(() => navigate("/admin/products"), 1000);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 text-[13px] font-medium border rounded-lg focus:outline-none transition-all shadow-sm
     ${hasError 
       ? "border-red-400 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500/20 placeholder:text-red-300" 
       : "border-gray-200 bg-white text-black focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 placeholder:text-gray-400 hover:border-gray-300"
     }`;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-[13px] font-medium text-gray-400 mt-0.5">
            {isEditMode ? "Update product information" : "Fill in the details to list a new item"}
          </p>
        </div>
      </div>

      {/* ── Main Form Card ── */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8 relative overflow-hidden">

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-[13px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.submit}
          </div>
        )}

        {/* ── Image Upload ── */}
        <div>
          <label className="block text-[13px] font-medium text-gray-600 mb-2">Product Images</label>
          
          {!!(form.images || []).length ? (
            <div className="space-y-3">
              <div className="relative w-full h-56 sm:h-64 rounded-[16px] overflow-hidden border border-gray-200 bg-gray-50">
                <img src={form.images[0]} alt="Primary preview" className="w-full h-full object-contain mix-blend-multiply" />
                <div className="absolute top-3 left-3 bg-[#d4a017] text-white text-[11px] px-3 py-1.5 rounded-full font-bold tracking-wide shadow-md">PRIMARY</div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(form.images || []).map((img, index) => (
                  <div key={`${img}-${index}`} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 px-1">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#d4a017] text-white transition-transform active:scale-95"
                        >
                          Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        className="text-[10px] font-bold p-1 rounded-md bg-red-500 text-white transition-transform active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 border border-dashed border-gray-300 hover:border-gray-400 rounded-full px-4 py-2 bg-gray-50 text-gray-600 text-[13px] font-medium transition-all active:scale-[0.98]">
                <UploadCloud className="w-4 h-4" /> Add More Images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer block group">
              <div className={`border-2 border-dashed rounded-[16px] p-10 text-center transition-all duration-300 ${
                uploading ? "border-[#d4a017] bg-yellow-50" : "border-gray-300 hover:border-[#d4a017] hover:bg-yellow-50/30 bg-gray-50"
              }`}>
                {uploading ? (
                  <div className="space-y-4 max-w-xs mx-auto">
                    <div className="text-[#b91c1c] text-sm font-medium flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#b91c1c] border-t-transparent rounded-full animate-spin" /> Uploading...
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#b91c1c] h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-[#d4a017] transition-colors" />
                    </div>
                    <div className="text-sm font-medium text-black">Click to upload product images</div>
                    <div className="text-xs text-gray-400 mt-1">Upload multiple JPG, PNG, WEBP files (max 5MB each)</div>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
          {uploadError && <p className="text-[11px] font-medium text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {uploadError}</p>}
        </div>

        {/* ── Basic Info ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Product Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Stainless Steel Kadai 3L" className={inputClass(errors.name)} />
            {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass(errors.category)}>
              <option value="" disabled>Select category</option>
              {(categories || []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] font-medium text-red-500 mt-1.5">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Brand</label>
            <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Prestige" className={inputClass(false)} />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">GST Percentage <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.gstPercent}
              onChange={(e) => set("gstPercent", e.target.value)}
              placeholder="5"
              className={inputClass(errors.gstPercent)}
            />
            {errors.gstPercent && <p className="text-[11px] font-medium text-red-500 mt-1.5">{errors.gstPercent}</p>}
          </div>
        </div>

        {/* ── Variants ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-gray-600">Product Variants <span className="text-red-500">*</span></p>
              <p className="text-[11px] text-gray-400 mt-0.5">Add sizes/weights with MRP and discount percent.</p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          {errors.variants && <p className="text-[11px] font-medium text-red-500">{errors.variants}</p>}

          <div className="rounded-[16px] border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr_auto] gap-2 bg-gray-50 border-b border-gray-200 px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              <span>Label</span>
              <span>MRP</span>
              <span>Discount %</span>
              <span>Selling Price</span>
              <span>Final (incl. GST)</span>
              <span>Stock</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-gray-200">
              {(form.variants || []).map((variant) => {
                const mrp = Number(variant.mrp) || 0;
                const discountPercent = Number(variant.discountPercent) || 0;
                const sellingPrice = calculateSellingPriceFromDiscount(mrp, discountPercent);
                const finalPrice = calculateFinalPriceWithGST(sellingPrice, Number(form.gstPercent || 0));
                
                return (
                  <div key={variant.id} className="md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1.2fr_1fr_auto] gap-3 px-4 py-3 items-start grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">Label</label>
                      <input
                        type="text"
                        value={variant.label}
                        onChange={(e) => updateVariant(variant.id, "label", e.target.value)}
                        placeholder="e.g. 250g"
                        className={inputClass(!!variantErrors[`${variant.id}.label`])}
                      />
                      {variantErrors[`${variant.id}.label`] && (
                        <p className="text-[10px] font-medium text-red-500 mt-1">{variantErrors[`${variant.id}.label`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">MRP</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.mrp}
                        onChange={(e) => updateVariant(variant.id, "mrp", toSafeIntegerString(e.target.value, { min: 0 }))}
                        placeholder="999"
                        className={inputClass(!!variantErrors[`${variant.id}.mrp`])}
                      />
                      {variantErrors[`${variant.id}.mrp`] && (
                        <p className="text-[10px] font-medium text-red-500 mt-1">{variantErrors[`${variant.id}.mrp`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={variant.discountPercent}
                        onChange={(e) => updateVariant(variant.id, "discountPercent", toSafePercentString(e.target.value, { min: 0, max: 100 }))}
                        placeholder="10"
                        className={inputClass(!!variantErrors[`${variant.id}.discountPercent`])}
                      />
                      {variantErrors[`${variant.id}.discountPercent`] && (
                        <p className="text-[10px] font-medium text-red-500 mt-1">{variantErrors[`${variant.id}.discountPercent`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">Selling Price</label>
                      <div className="pt-2 md:pt-0 text-[13px] font-medium text-gray-500">
                        {sellingPrice > 0 ? formatPrice(sellingPrice) : "-"}
                      </div>
                    </div>

                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">Final (incl. GST)</label>
                      <div className="pt-2 md:pt-0 text-[14px] font-bold text-black">
                        {finalPrice > 0 ? formatPrice(finalPrice) : "-"}
                      </div>
                    </div>

                    <div>
                      <label className="md:hidden text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-2">Stock</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, "stock", toSafeIntegerString(e.target.value, { min: 0 }))}
                        placeholder="Qty"
                        className={inputClass(!!variantErrors[`${variant.id}.stock`])}
                      />
                      {variantErrors[`${variant.id}.stock`] && (
                        <p className="text-[10px] font-medium text-red-500 mt-1">{variantErrors[`${variant.id}.stock`]}</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-1 md:pt-0 sm:col-span-2 md:col-span-auto">
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="p-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Remove variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
            Search Tags <span className="text-gray-400 font-normal text-[10px] uppercase tracking-wider ml-1">(Comma Separated)</span>
          </label>
          <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="kadai, steel, cooking" className={inputClass(false)} />
        </div>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={saved || submitting}
          className={`mt-8 w-full flex items-center justify-center gap-2 py-[13px] rounded-lg text-[14px] font-medium transition-all duration-150 active:scale-[0.98]
            ${saved 
              ? "bg-green-700 text-white"
              : submitting 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#b91c1c] text-white hover:bg-[#991b1b]"
          }`}
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved Successfully!</>
          ) : (
            <><Save className="w-4 h-4" /> {isEditMode ? "Save Changes" : "Publish Product"}</>
          )}
        </button>

      </div>
    </div>
  );
};

export default AdminProductForm;