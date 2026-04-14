import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UploadCloud, AlertCircle, CheckCircle2, X, Plus, Trash2 } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { api } from "../utils/api";
import { calculatePriceWithGST, formatPrice } from "../utils/priceCalculator";

const EMPTY_FORM = {
  name: "", category: "",
  image: "", images: [], inStock: true,
  brand: "", tags: "", isHero: false, gstPercent: "0", variants: [],
};

const ADD_PRODUCT_DRAFT_KEY = "admin.addProductForm.draft.v1";
const MAX_VARIANT_PRICE = 10000000;

const toSafeIntegerString = (value, { min = 0 } = {}) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return String(Math.max(min, Math.floor(numeric)));
};

const readAddProductDraft = () => {
  try {
    const raw = localStorage.getItem(ADD_PRODUCT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const AdminProductForm = ({ mode = "add" }) => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { products, categories, addProduct, updateProduct } = useProducts();

  const token = localStorage.getItem("token");

  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [saved, setSaved]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]       = useState("");
  const [variantErrors, setVariantErrors] = useState({});

  const formPopulated = useRef(false);
  const variantCounterRef = useRef(0);
  const lastDraftRef = useRef("");

  const createVariantId = () => {
    variantCounterRef.current += 1;
    return `var_${Date.now().toString(36)}_${variantCounterRef.current.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  };

  const createEmptyVariant = () => ({
    id: createVariantId(),
    label: "",
    price: "",
  });

  const normalizeIncomingVariantsLocal = (variants, fallbackPrice = "") => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return [{
        id: createVariantId(),
        label: "Default",
        price: fallbackPrice !== "" ? String(fallbackPrice) : "",
      }];
    }

    return variants.map((variant) => ({
      id: String(variant?.id || variant?._id || createVariantId()),
      label: variant?.label || "",
      price: toSafeIntegerString(variant?.price ?? variant?.originalPrice ?? "", { min: 0 }),
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

      const variantPrice = Number(variant.price);
      if (!Number.isFinite(variantPrice) || variantPrice <= 0) {
        fieldErrors[`${variant.id}.price`] = "Price must be > 0";
      } else if (!Number.isInteger(variantPrice)) {
        fieldErrors[`${variant.id}.price`] = "Price must be a whole number";
      } else if (variantPrice > MAX_VARIANT_PRICE) {
        fieldErrors[`${variant.id}.price`] = `Price cannot exceed ${MAX_VARIANT_PRICE.toLocaleString("en-IN")}`;
      }
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    return {
      general: hasFieldErrors ? "Please fix variant validation errors" : "",
      fieldErrors,
    };
  };

  useEffect(() => {
    if (mode === "edit" && id && !formPopulated.current) {
      const product = products.find((p) => (p._id || p.id) === id);
      if (product) {
        setForm({
          name:        product.name        || "",
          category:    product.category || "",
          image:       product.images?.[0] || product.image || "",
          images:      product.images?.length ? product.images : (product.image ? [product.image] : []),
          inStock:     product.inStock     ?? true,
          brand:       product.brand       || "",
          tags:        (product.tags || []).join(", "),
          isHero:      !!product.isHero,
          gstPercent:  String(product.gstPercent ?? "0"),
          variants:    normalizeIncomingVariantsLocal(
            product.variants,
            product.basePrice ?? product.price ?? ""
          ),
        });
        formPopulated.current = true;  
      }
    }
  }, [mode, id, products]);

  useEffect(() => {
    if (mode === "add" && !formPopulated.current) {
      // Restore saved draft for Add Product flow (excluding files/images), if present.
      const draft = readAddProductDraft();

      setForm((prev) => {
        const merged = draft
          ? {
              ...prev,
              name: typeof draft.name === "string" ? draft.name : "",
              category: typeof draft.category === "string" ? draft.category : "",
              inStock: !!draft.inStock,
              brand: typeof draft.brand === "string" ? draft.brand : "",
              tags: typeof draft.tags === "string" ? draft.tags : "",
              gstPercent: String(draft.gstPercent ?? "0"),
              isHero: !!draft.isHero,
              // Never restore images/files from localStorage.
              image: "",
              images: [],
              variants: normalizeIncomingVariantsLocal(draft.variants, ""),
            }
          : prev;

        if (Array.isArray(merged.variants) && merged.variants.length > 0) return merged;
        return { ...merged, variants: [createEmptyVariant()] };
      });

      if (draft) {
        try {
          lastDraftRef.current = JSON.stringify(draft);
        } catch {
          lastDraftRef.current = "";
        }
      }

      formPopulated.current = true;
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "add" || !formPopulated.current) return;

    // Persist only lightweight text/number/boolean fields; never store images/files.
    const draft = {
      name: form.name,
      category: form.category,
      inStock: !!form.inStock,
      brand: form.brand,
      tags: form.tags,
      gstPercent: String(form.gstPercent ?? "0"),
      isHero: !!form.isHero,
      variants: (form.variants || []).map((variant) => ({
        id: String(variant.id || ""),
        label: String(variant.label || ""),
        price: String(variant.price ?? ""),
      })),
    };

    let serialized = "";
    try {
      serialized = JSON.stringify(draft);
    } catch {
      return;
    }

    if (serialized === lastDraftRef.current) return;

    // Tiny debounce avoids excessive sync localStorage writes while typing.
    const timer = setTimeout(() => {
      localStorage.setItem(ADD_PRODUCT_DRAFT_KEY, serialized);
      lastDraftRef.current = serialized;
    }, 120);

    return () => clearTimeout(timer);
  }, [mode, form]);

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
      delete next[`${variantId}.price`];
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

      const data = await api.upload("/api/upload/multiple", formData, token);
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

    // Final payload normalization ensures integer-only pricing fields.
    const normalizedVariants = (form.variants || []).map((variant) => {
      const variantPriceNumber = Number(variant.price);

      return {
        label: String(variant.label || "").trim(),
        price: Math.max(0, Math.floor(Number.isFinite(variantPriceNumber) ? variantPriceNumber : 0)),
      };
    });

    const sortedVariantPrices = normalizedVariants
      .map((variant) => variant.price)
      .filter((price) => price > 0)
      .sort((a, b) => a - b);
    const basePrice = sortedVariantPrices[0] || 0;

    const payload = {
      name: form.name,
      category: form.category,
      image: (form.images || [])[0] || "",
      images: form.images || [],
      brand: form.brand,
      tags: (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      inStock: !!form.inStock,
      isHero: !!form.isHero,
      basePrice,
      gstPercent: Math.round((Number(form.gstPercent || 0) + Number.EPSILON) * 100) / 100,
      variants: normalizedVariants,
    };

    setSubmitting(true);
    try {
      if (mode === "add") {
        await addProduct(payload);
      } else {
        await updateProduct(id, payload);
      }
      // On successful Add Product, clear persisted draft and reset the form.
      if (mode === "add") {
        localStorage.removeItem(ADD_PRODUCT_DRAFT_KEY);
        lastDraftRef.current = "";
        setForm({ ...EMPTY_FORM, variants: [createEmptyVariant()] });
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
    `w-full px-4 py-3 text-sm font-medium border rounded-xl focus:outline-none focus:ring-4 transition-all shadow-inner
     ${hasError 
        ? "border-rose-400/70 bg-rose-950/20 text-rose-100 focus:ring-rose-500/20 placeholder:text-rose-300" 
        : "border-[#e0c3a3] bg-[#fff8ec] text-[#3b2f2f] focus:border-[#e8883a] focus:ring-[#e8883a]/20 placeholder:text-[#3b2f2f]/45 hover:border-[#e8883a]/60"
     }`;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2.5 text-[#6d4c41] hover:text-[#3b2f2f] hover:bg-[#fff8ec] rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-[#2d1b14] tracking-tight">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h2>
          <p className="text-sm font-medium text-[#6d4c41] mt-0.5">
            {mode === "add" ? "Fill in the details to list a new item" : "Update product information"}
          </p>
        </div>
      </div>

      {/* ── Main Form Card ── */}
      <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">

        {errors.submit && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.submit}
          </div>
        )}

        {/* ── Image Upload ── */}
        <div>
          <label className="block text-[13px] font-bold text-[#6d4c41] mb-2">Product Images</label>
          
          {!!(form.images || []).length ? (
            <div className="space-y-3">
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#e0c3a3] bg-[#fff8ec]">
                <img src={form.images[0]} alt="Primary preview" className="w-full h-full object-contain mix-blend-multiply" />
                <div className="absolute top-3 left-3 bg-[#e8883a] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Primary</div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(form.images || []).map((img, index) => (
                  <div key={`${img}-${index}`} className="relative rounded-xl overflow-hidden border border-[#e0c3a3] bg-[#fff8ec] group">
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover" />
                    <div className="absolute inset-0 bg-[#3b2f2f]/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 px-1">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#e8883a] text-white"
                        >
                          Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-rose-500 text-[#3b2f2f]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 border border-[#e0c3a3] hover:border-[#e8883a] rounded-xl px-4 py-2.5 bg-[#fff8ec] text-[#6d4c41] text-sm font-semibold">
                <UploadCloud className="w-4 h-4" /> Add More Images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer block group">
              <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                uploading ? "border-[#e8883a] bg-[#e8883a]/10" : "border-[#e0c3a3] hover:border-[#e8883a] hover:bg-[#e8883a]/10 bg-[#fff8ec]"
              }`}>
                {uploading ? (
                  <div className="space-y-4 max-w-xs mx-auto">
                    <div className="text-blue-600 text-sm font-bold flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Uploading...
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-[#fff8ec] rounded-full flex items-center justify-center shadow-sm border border-[#e0c3a3] mb-3 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-6 h-6 text-[#6d4c41] group-hover:text-[#e8883a] transition-colors" />
                    </div>
                    <div className="text-sm font-bold text-[#2d1b14]">Click to upload product images</div>
                    <div className="text-xs font-medium text-[#6d4c41] mt-1">Upload multiple JPG, PNG, WEBP files (max 5MB each)</div>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
          {uploadError && <p className="text-[11px] font-bold text-rose-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {uploadError}</p>}
        </div>

        {/* ── Basic Info ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">Product Name <span className="text-rose-400">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Stainless Steel Kadai 3L" className={inputClass(errors.name)} />
            {errors.name && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">Category <span className="text-rose-400">*</span></label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass(errors.category)}>
              <option value="" disabled>Select category</option>
              {(categories || []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">Brand</label>
            <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Prestige" className={inputClass(false)} />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">GST Percentage <span className="text-rose-400">*</span></label>
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
            {errors.gstPercent && <p className="text-[11px] font-bold text-rose-500 mt-1.5">{errors.gstPercent}</p>}
          </div>
        </div>

        {/* ── Variants ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-[#6d4c41]">Product Variants <span className="text-rose-400">*</span></p>
              <p className="text-[11px] text-[#6d4c41]">Add sizes/weights with base price before GST.</p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e8883a]/40 bg-[#e8883a]/15 text-white text-xs font-bold hover:bg-[#e8883a]/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          {errors.variants && <p className="text-[11px] font-bold text-rose-500">{errors.variants}</p>}

          <div className="rounded-xl border border-[#e0c3a3] overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-2 bg-[#fff8ec] px-3 py-2 text-[11px] font-bold text-[#6d4c41] uppercase tracking-wide">
              <span>Label</span>
              <span>Price (Before GST)</span>
              <span>Price incl. GST</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-[#c9a84c]/10">
              {(form.variants || []).map((variant) => {
                const finalPrice = calculatePriceWithGST(Number(variant.price) || 0, Number(form.gstPercent || 0));
                return (
                  <div key={variant.id} className="grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-2 px-3 py-3 items-start">
                    <div>
                      <input
                        type="text"
                        value={variant.label}
                        onChange={(e) => updateVariant(variant.id, "label", e.target.value)}
                        placeholder="e.g. 250g"
                        className={inputClass(!!variantErrors[`${variant.id}.label`])}
                      />
                      {variantErrors[`${variant.id}.label`] && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{variantErrors[`${variant.id}.label`]}</p>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, "price", toSafeIntegerString(e.target.value, { min: 0 }))}
                        placeholder="999"
                        className={inputClass(!!variantErrors[`${variant.id}.price`])}
                      />
                      {variantErrors[`${variant.id}.price`] && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{variantErrors[`${variant.id}.price`]}</p>
                      )}
                    </div>

                    <div className="pt-3 text-sm font-bold text-[#3b2f2f]">
                      {finalPrice > 0 ? formatPrice(finalPrice) : "-"}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
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
          <label className="block text-[13px] font-bold text-[#6d4c41] mb-1.5">Search Tags <span className="text-[#6d4c41] font-medium text-[10px] uppercase tracking-wider ml-1">(Comma Separated)</span></label>
          <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="kadai, steel, cooking" className={inputClass(false)} />
        </div>

        {/* ── Stock Toggle ── */}
        <div className="flex flex-col gap-6 pt-4 border-t border-[#e0c3a3]">
          <div className="flex items-center justify-between gap-4 w-full p-3 rounded-xl border border-[#e0c3a3] bg-[#fff8ec]">
            <div>
              <p className="text-sm font-bold text-[#2d1b14]">In Stock Status</p>
              <p className="text-[11px] font-medium text-[#6d4c41]">Available for purchase</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-auto">
              <input type="checkbox" className="sr-only peer" checked={form.inStock} onChange={() => set("inStock", !form.inStock)} />
              <div className="w-11 h-6 bg-[#e0c3a3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-[#e0c3a3] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8883a]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 w-full p-3 rounded-xl border border-[#e0c3a3] bg-[#fff8ec]">
            <div>
              <p className="text-sm font-bold text-[#2d1b14]">📌 Feature this product in the Hero section</p>
              <p className="text-[11px] font-medium text-[#6d4c41]">Only one hero product is active at a time</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-auto">
              <input type="checkbox" className="sr-only peer" checked={!!form.isHero} onChange={() => set("isHero", !form.isHero)} />
              <div className="w-11 h-6 bg-[#e0c3a3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-[#e0c3a3] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8883a]"></div>
            </label>
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={saved || submitting}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg 
            ${saved ? "bg-emerald-500 text-[#3b2f2f] shadow-emerald-500/20"
            : submitting ? "bg-[#5b4b34] text-[#3b2f2f] cursor-not-allowed shadow-none"
            : "bg-[#e8883a] text-white hover:bg-[#d97706] shadow-black/20 hover:shadow-[#d97706]/25 hover:-translate-y-0.5"
          }`}
        >
          {submitting ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving to Database...</>
          ) : saved ? (
            <><CheckCircle2 className="w-5 h-5" /> Saved Successfully!</>
          ) : (
            <><Save className="w-5 h-5" /> {mode === "add" ? "Publish Product" : "Save Changes"}</>
          )}
        </button>

      </div>
    </div>
  );
};

export default AdminProductForm;


