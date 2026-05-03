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
import { toast } from "react-toastify";
import { calculateFinalPriceWithGST, calculateDiscount, formatPrice } from "../utils/priceCalculator";

const AdminProducts = () => {
  const { products, categories, deleteProduct, refresh } = useProducts();
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
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2d1b0e] tracking-tight">Products</h2>
          <p className="text-sm font-medium text-[#7a5c3a] mt-1">Manage inventory, product tags, and storefront visibility.</p>
        </div>
        <button
          onClick={() => navigate("/admin/products/add")}
          className="flex items-center justify-center gap-2 bg-[#8b4513] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#a0522d] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 min-w-60 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a5c3a]" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-[#fffaf3] border border-[#e6d3b3] text-[#2d1b0e] rounded-xl focus:outline-none focus:border-[#8b4513] focus:ring-4 focus:ring-[#8b4513]/20"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-3 text-sm font-medium bg-[#fffaf3] border border-[#e6d3b3] rounded-xl focus:outline-none focus:border-[#8b4513] focus:ring-4 focus:ring-[#8b4513]/20 text-[#2d1b0e] min-w-50"
        >
          <option value="all">All Categories</option>
          {(categories || []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#fffaf3] rounded-3xl border border-[#e6d3b3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#f5e6d3] border-b border-[#e6d3b3]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7a5c3a] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a373]/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Package className="w-10 h-10 text-[#6d4c41] mb-3" />
                      <p className="text-sm font-bold text-[#2d1b14] mb-1">No products found</p>
                      <p className="text-xs text-[#6d4c41]">Try changing the category filter or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const id = getId(product);
                  const preview = product.images?.[0] || product.image || "";
                  const pricing = getDisplayPricing(product);

                  return (
                    <tr key={id} className="hover:bg-[#fff8ec]/70 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#fff8ec] border border-[#e0c3a3] flex items-center justify-center shrink-0 overflow-hidden">
                            {preview && preview.startsWith("http") ? (
                              <img src={preview} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl opacity-70">{preview || "📦"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#2d1b14] max-w-55 truncate" title={product.name}>{product.name}</p>
                            <p className="text-xs text-[#6d4c41]">{(product.images || []).length} image(s)</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3">
                        <span className="px-2.5 py-1 bg-[#fff8ec] text-[#6d4c41] text-[10px] font-bold rounded-md uppercase tracking-wider border border-[#e0c3a3]">
                          {getCategoryName(product.category)}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        <p className="font-black text-[#3b2f2f]">{formatPrice(pricing.finalPrice)}</p>
                        {pricing.originalPrice > pricing.finalPrice && (
                          <p className="text-xs text-[#6d4c41] line-through">{formatPrice(pricing.originalPrice)}</p>
                        )}
                      </td>

                      <td className="px-6 py-3">
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide border ${
                          getVariantStock(product) > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {getVariantStock(product) > 0 ? `${getVariantStock(product)} units` : "Out of Stock"}
                        </div>
                      </td>

                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => navigate(`/admin/products/edit/${id}`)}
                            className="p-2 text-[#7a5c3a] hover:text-[#8b4513] hover:bg-[#f5e6d3] border border-transparent hover:border-[#e6d3b3] rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(id)}
                            className="p-2 text-[#7a5c3a] hover:text-rose-600 hover:bg-[#f5e6d3] border border-transparent hover:border-[#e6d3b3] rounded-lg transition-all"
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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2f2f]/25 backdrop-blur-sm px-4">
          <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-2xl shadow-[#c7a07a]/30 p-6 sm:p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-extrabold text-[#2d1b14] mb-2">Delete Product?</h3>
            <p className="text-sm text-[#6d4c41] mb-6 leading-relaxed">This action permanently removes the product from the catalog.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-[#fff8ec] hover:bg-[#efd8b5] border border-[#e0c3a3] text-[#3b2f2f] rounded-xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

export default AdminProducts;



