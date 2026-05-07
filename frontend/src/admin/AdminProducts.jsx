import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Package,
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { calculateFinalPriceWithGST, formatPrice } from "../utils/priceCalculator";

const AdminProducts = () => {
  const { products, categories, deleteProduct } = useProducts();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getId = (p) => p._id || p.id;

  const getDisplayPricing = (product) => {
    const gstPercent = Math.max(0, Math.min(100, Number(product?.gstPercent || 0)));
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) {
      return { finalPrice: "-", discount: "-", originalPrice: "-" };
    }

    const computed = variants
      .map((variant) => {
        const mrp = Number(variant?.mrp ?? 0);
        const sellingPrice = Number(variant?.sellingPrice ?? variant?.price ?? 0);
        if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(sellingPrice) || sellingPrice <= 0) return null;
        return {
          mrp,
          sellingPrice,
          discount: Math.max(0, mrp - sellingPrice),
          final: calculateFinalPriceWithGST(sellingPrice, gstPercent)
        };
      })
      .filter(Boolean);

    if (!computed.length) {
      return { finalPrice: "-", discount: "-", originalPrice: "-" };
    }

    const finalPrice = Math.min(...computed.map((item) => item.final));
    const minMrp = Math.min(...computed.map((item) => item.mrp));
    const maxDiscount = Math.max(...computed.map((item) => item.discount));
    return { finalPrice, discount: maxDiscount, originalPrice: minMrp };
  };

  const getVariantStock = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) {
      return Number.isFinite(Number(product?.stock)) ? Math.max(0, Number(product.stock)) : 0;
    }

    return variants.reduce((total, variant) => total + Math.max(0, Number(variant?.stock || 0)), 0);
  };

  const getCategoryName = (cat) => {
    if (!cat) return "-";
    const slug = String(cat).toLowerCase();
    const found = categories?.find((c) => c.slug === slug);
    return found ? found.name : slug;
  };

  const filtered = useMemo(() => {
    return (products || [])
      .filter((p) => {
        if (filterCat === "all") return true;
        return String(p.category || "").toLowerCase() === filterCat;
      })
      .filter((p) => (p.name || "").toLowerCase().includes(search.toLowerCase()));
  }, [products, filterCat, search]);

  const handleDelete = async (id) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black tracking-tight">Products</h2>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">Manage inventory, product tags, and storefront visibility.</p>
        </div>
        <button
          onClick={() => navigate("/admin/add-product", { state: null })}
          className="flex items-center justify-center gap-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* ── Filters & Search ── */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-60 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#d4a017] transition-colors" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium bg-white border border-gray-200 text-black rounded-lg focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 placeholder:text-gray-400 transition-all shadow-sm"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2.5 text-[13px] font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 text-black min-w-[200px] shadow-sm transition-all cursor-pointer"
        >
          <option value="all">All Categories</option>
          {(categories || []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Products Table ── */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Product</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Price</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="px-6 py-3.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-[14px] font-bold text-black mb-1">No products found</p>
                      <p className="text-[13px] text-gray-500">Try changing the category filter or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const id = getId(product);
                  const preview = product.images?.[0] || product.image || "";
                  const pricing = getDisplayPricing(product);
                  const stock = getVariantStock(product);

                  return (
                    <tr key={id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {preview && preview.startsWith("http") ? (
                              <img src={preview} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-black max-w-[220px] truncate" title={product.name}>{product.name}</p>
                            <p className="text-[12px] text-gray-400 font-medium">{(product.images || []).length} image(s)</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-block bg-yellow-300/90 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">
                          {getCategoryName(product.category)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-[14px] font-bold text-black">{formatPrice(pricing.finalPrice)}</p>
                        {pricing.originalPrice > pricing.finalPrice && (
                          <p className="text-[12px] font-medium text-gray-400 line-through mt-0.5">{formatPrice(pricing.originalPrice)}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                          stock > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {stock > 0 ? `${stock} units` : "Out of Stock"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => navigate("/admin/add-product", { state: { product } })}
                            className="p-2 text-gray-400 hover:text-black hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all shadow-none hover:shadow-sm"
                            title="Edit Product"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all shadow-none hover:shadow-sm"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-xl p-6 sm:p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Delete Product?</h3>
            <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">This action permanently removes the product from the catalog and cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-[13px] font-semibold transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
};

export default AdminProducts;