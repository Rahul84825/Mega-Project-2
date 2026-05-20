import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Package,
  Sparkles
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { formatCurrency } from "../utils/priceCalculator";

const AdminProducts = () => {
  const { products, categories, deleteProduct } = useProducts();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getId = (p) => p._id || p.id;

  const getDisplayPricing = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) {
      return { finalPrice: Number(product?.price || 0), mrp: Number(product?.mrp || 0) };
    }
    const prices = variants.map(v => Number(v.sellingPrice || 0)).filter(p => p > 0);
    const mrps = variants.map(v => Number(v.mrp || 0)).filter(p => p > 0);
    return {
      finalPrice: prices.length ? Math.min(...prices) : 0,
      mrp: mrps.length ? Math.min(...mrps) : 0
    };
  };

  const getVariantStock = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) return Number(product?.stock || 0);
    return variants.reduce((total, v) => total + Number(v?.stock || 0), 0);
  };

  const getCategoryName = (cat) => {
    if (!cat) return "-";
    const slug = typeof cat === 'object' ? cat.slug : cat;
    const found = categories?.find((c) => c.slug === slug);
    return found ? found.name : slug;
  };

  const filtered = useMemo(() => {
    return (products || [])
      .filter((p) => {
        if (filterCat === "all") return true;
        const pCat = typeof p.category === "object" ? p.category?.slug : p.category;
        return String(pCat || "").toLowerCase() === filterCat;
      })
      .filter((p) => (p.name || "").toLowerCase().includes(search.toLowerCase()));
  }, [products, filterCat, search]);

  const handleDelete = async (id) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto page-enter space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="section-title mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
            <Sparkles size={12} /> Inventory
          </div>
          <h2 className="serif font-medium">Product Catalog</h2>
          <p className="font-medium">Manage sizes, pricing, and availability across your entire collection.</p>
        </div>
        <button onClick={() => navigate("/admin/add-product", { state: null })} className="btn-primary">
          <PlusCircle size={16} /> Add Mithai
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors" />
          <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input-field sm:w-60 cursor-pointer font-medium">
          <option value="all">All Categories</option>
          {(categories || []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[24px] border border-[var(--surface-border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--cream)]/50 border-b border-[var(--surface-border)]">
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Mithai</th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Category</th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Price</th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Stock</th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-border)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-xs text-[var(--muted)] font-medium italic">No matches found in your inventory.</td></tr>
              ) : (                filtered.map((product) => {
                  const id = getId(product);
                  const preview = product.images?.[0] || product.image || "";
                  const pricing = getDisplayPricing(product);
                  const stock = getVariantStock(product);
                  return (
                    <tr key={id} className="hover:bg-[var(--cream)]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--surface-strong)]/30 border border-[var(--surface-border)] overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                            {preview ? <img src={preview} className="w-full h-full object-cover mix-blend-multiply" alt="" /> : <Package size={20} className="text-[var(--muted)] opacity-20" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--charcoal)] truncate max-w-[200px]" title={product.name}>{product.name}</p>
                            <p className="text-[10px] text-[var(--muted)] font-medium">{(product.variants || []).length} variations</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-[var(--surface-strong)] text-[var(--muted)] text-[9px] font-medium px-2.5 py-0.5 rounded-full tracking-widest uppercase border border-[var(--surface-border)]">
                          {getCategoryName(product.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[var(--charcoal)]">{formatCurrency(pricing.finalPrice)}</p>
                        {pricing.mrp > pricing.finalPrice && <p className="text-[10px] font-medium text-[var(--muted)] line-through">{formatCurrency(pricing.mrp)}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-lg border ${stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {stock > 0 ? `${stock} units` : "Sold Out"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate("/admin/add-product", { state: { product } })} className="p-2 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-[var(--surface-border)]"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteConfirm(id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
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

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[var(--surface-border)] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner"><Trash2 size={32} /></div>
            <h3 className="serif text-xl font-medium text-[var(--charcoal)] mb-2 text-center">Delete Mithai?</h3>
            <p className="text-xs text-[var(--muted)] mb-8 leading-relaxed font-medium">This action is permanent and will remove the item from your storefront immediately.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-outline h-12">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white rounded-xl text-xs font-medium uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg active:scale-95 h-12">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminProducts;
